export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No text" });
    }

    // 🔍 Detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    let linkRisk = 0;
    let linkDetails = "";

    // 🔥 DETECCIÓN HEURÍSTICA (phishing básico)
    if (urls.length > 0) {
      const suspiciousPatterns = ["login", "verify", "account", "bank", "secure", "update"];
      const suspiciousDomains = [".xyz", ".ru", ".tk", ".ml", ".ga"];

      urls.forEach(url => {
        const lowerUrl = url.toLowerCase();

        if (suspiciousPatterns.some(p => lowerUrl.includes(p))) {
          linkRisk += 20;
          linkDetails += "⚠️ URL contiene palabras típicas de phishing. ";
        }

        if (suspiciousDomains.some(d => lowerUrl.includes(d))) {
          linkRisk += 20;
          linkDetails += "⚠️ Dominio sospechoso. ";
        }
      });
    }

    // 🔐 DETECTOR DE CLONES (phishing avanzado)
    const knownBrands = ["paypal", "google", "facebook", "instagram", "bank", "apple"];

    function normalizeDomain(url) {
      return url
        .toLowerCase()
        .replace(/0/g, "o")
        .replace(/1/g, "l")
        .replace(/3/g, "e")
        .replace(/@/g, "a");
    }

    urls.forEach(url => {
      const normalized = normalizeDomain(url);

      knownBrands.forEach(brand => {
        if (normalized.includes(brand) && !url.toLowerCase().includes(brand)) {
          linkRisk += 30;
          linkDetails += `⚠️ Posible suplantación de ${brand}. `;
        }
      });
    });

    // 🌐 GOOGLE SAFE BROWSING
    if (urls.length > 0) {
      try {
        const response = await fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
          {
            method: "POST",
            body: JSON.stringify({
              client: {
                clientId: "fraud-check",
                clientVersion: "1.0"
              },
              threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: urls.map(url => ({ url }))
              }
            })
          }
        );

        const data = await response.json();

        if (data.matches) {
          linkRisk += 40;
          linkDetails += "⚠️ Link peligroso detectado por Google. ";
        } else {
          linkDetails += "✔ Link no reportado como peligroso. ";
        }
      } catch {
        linkDetails += "No se pudo verificar el link con Google. ";
      }
    }

    // 🧠 IA (OpenAI)
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Respondé SOLO en JSON válido con este formato exacto: {\"score\": number, \"details\": \"texto corto\"}"
          },
          {
            role: "user",
            content: `Analizá este contenido y determiná si es fraude, phishing o fake news: "${text}"`
          }
        ]
      })
    });

    const aiData = await aiRes.json();

    // 🔥 BASE INTELIGENTE
    let score = 70;
    let details = "Contenido aparentemente seguro";

    try {
      const parsed = JSON.parse(aiData.choices[0].message.content);
      score = parsed.score;
      details = parsed.details;
    } catch {
      const aiText = aiData.choices?.[0]?.message?.content || "";

      if (aiText.toLowerCase().includes("fraude") || aiText.toLowerCase().includes("phishing")) {
        score = 30;
        details = "La IA detecta posible fraude";
      } else if (aiText.toLowerCase().includes("falso") || aiText.toLowerCase().includes("engañoso")) {
        score = 40;
        details = "Contenido posiblemente engañoso";
      } else {
        score = 80;
        details = "Contenido parece seguro";
      }
    }

    // 🔥 AJUSTE FINAL
    score = Math.max(0, Math.min(100, score - linkRisk));

    // 🔥 MENSAJE FINAL COHERENTE
    if (linkRisk > 0) {
      details = "🚨 Riesgo detectado en el enlace. " + linkDetails;
    }

    return res.status(200).json({ score, details });

  } catch (error) {
    return res.status(500).json({ error: "Error en análisis avanzado" });
  }
}
