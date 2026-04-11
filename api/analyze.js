export default async function handler(req, res) {
  // 🌐 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ Test desde navegador
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "API funcionando",
      usage: "Enviar POST con { text: '...' }"
    });
  }

  try {
    const body = req.body || {};
    const text = body.text || "";

    let details = "Contenido parece seguro";

    // 🧠 Normalizar texto
    const safeText = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

    let risk = 0;
    let reasons = [];

    // 🧠 Patrones base
    const urgency = /(urgente|ahora|inmediato|ya|rapido)/.test(safeText);
    const action = /(verifica|verificar|confirmar|accede|acceso|login)/.test(safeText);
    const entity = /(banco|cuenta|paypal|soporte|admin|security)/.test(safeText);

    if (urgency && action && entity) {
      risk += 40;
      reasons.push("patrón típico de phishing");
    }

    if (urgency && action) {
      risk += 15;
      reasons.push("mensaje urgente con acción");
    }

    if (action && entity) {
      risk += 15;
      reasons.push("solicita acceso a cuenta");
    }

    // 🔥 NUEVOS PATRONES

    const pressure = /(ultimo aviso|cuenta sera suspendida|bloqueada|accion requerida)/.test(safeText);
    if (pressure) {
      risk += 20;
      reasons.push("genera presión o amenaza");
    }

    const impersonation = /(soporte tecnico|equipo de seguridad|atencion al cliente)/.test(safeText);
    if (impersonation) {
      risk += 15;
      reasons.push("posible suplantación de identidad");
    }

    const reward = /(ganaste|premio|dinero gratis|felicitaciones)/.test(safeText);
    if (reward) {
      risk += 20;
      reasons.push("promesa de recompensa sospechosa");
    }

    // 🔗 LINKS + GOOGLE SAFE BROWSING
    if (urls.length > 0) {
      for (const url of urls) {
        let linkRisk = 0;

        const badDomain = /(\.xyz|\.ru|bit\.ly|tinyurl)/.test(url);
        const keywords = /(login|verify|bank)/.test(url);

        if (badDomain) {
          linkRisk += 30;
          reasons.push("dominio sospechoso");
        }

        if (keywords) {
          linkRisk += 20;
          reasons.push("link con palabras sensibles");
        }

        if (badDomain && keywords) {
          linkRisk += 20;
        }

        const weirdDomain = /[-]{2,}|\d{3,}/.test(url);
        if (weirdDomain) {
          linkRisk += 15;
          reasons.push("estructura de dominio extraña");
        }

        if (url.length > 60) {
          linkRisk += 10;
          reasons.push("URL demasiado larga");
        }

        // 🛡️ Google Safe Browsing
        try {
          const googleRes = await fetch(
            `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                client: {
                  clientId: "fv-app",
                  clientVersion: "1.0"
                },
                threatInfo: {
                  threatTypes: [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE"
                  ],
                  platformTypes: ["ANY_PLATFORM"],
                  threatEntryTypes: ["URL"],
                  threatEntries: [{ url }]
                }
              })
            }
          );

          let googleData = {};

          try {
            googleData = await googleRes.json();
          } catch (e) {
            console.error("Error parsing Google response");
          }

          if (googleData.matches) {
            linkRisk += 70;
            reasons.push("Google detectó enlace peligroso");
          }

        } catch (e) {
          console.error("Safe Browsing error:", e);
        }

        risk += Math.min(linkRisk, 70);
      }
    }

    if (urls.length > 2) {
      risk += 10;
      reasons.push("múltiples enlaces");
    }

    // 🔒 límite
    risk = Math.min(risk, 100);

    // 🎯 SCORE
    let score = 100 - risk;
    score = Math.max(10, Math.min(100, score));

    // 📊 MENSAJE FINAL
    if (score < 40) {
      details = "❌ Alto riesgo: " + (reasons.join(", ") || "posible fraude");
    } else if (score < 70) {
      details = "⚠️ Sospechoso: " + (reasons.join(", ") || "revisar contenido");
    } else {
      details = "✔️ Probablemente seguro";
    }

    return res.status(200).json({
      score,
      details,
      reasons
    });

  } catch (error) {
    console.error("API ERROR:", error);

    return res.status(500).json({
      error: error.message
    });
  }
}
