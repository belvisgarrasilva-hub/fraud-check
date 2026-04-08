export default async function handler(req, res) {

  // ✅ CORS (para Blogger)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No hay texto" });
    }

    // 🔍 Detectar URLs
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];

    let linkRisk = 0;
    let linkDetails = "";

    // 🔥 Heurística básica
    urls.forEach(url => {
      const lower = url.toLowerCase();

      if (["login", "verify", "bank"].some(w => lower.includes(w))) {
        linkRisk += 20;
        linkDetails += "⚠️ Posible phishing. ";
      }

      if ([".xyz", ".ru"].some(d => lower.includes(d))) {
        linkRisk += 20;
        linkDetails += "⚠️ Dominio sospechoso. ";
      }
    });

    // 🌍 DETECCIÓN AVANZADA (SIN API)
    urls.forEach(url => {
      try {
        const domain = new URL(url).hostname;

        if (domain.length > 25) {
          linkRisk += 15;
          linkDetails += "⚠️ Dominio demasiado largo. ";
        }

        if ((domain.match(/-/g) || []).length >= 2) {
          linkRisk += 20;
          linkDetails += "⚠️ Dominio con múltiples guiones. ";
        }

        if (domain.split(".").length > 3) {
          linkRisk += 20;
          linkDetails += "⚠️ Subdominios sospechosos. ";
        }

        const riskyTLDs = [".xyz", ".tk", ".ml", ".ga", ".cf"];
        if (riskyTLDs.some(tld => domain.endsWith(tld))) {
          linkRisk += 25;
          linkDetails += "⚠️ Dominio de alto riesgo. ";
        }

      } catch {}
    });

    // 🌐 Google Safe Browsing
    if (urls.length > 0 && process.env.GOOGLE_API_KEY) {
      try {
        const gRes = await fetch(
          `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client: { clientId: "app", clientVersion: "1.0" },
              threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: urls.map(u => ({ url: u }))
              }
            })
          }
        );

        const gData = await gRes.json();

        if (gData.matches) {
          linkRisk += 40;
          linkDetails += "🚨 Detectado por Google. ";
        }

      } catch {
        linkDetails += "Google no disponible. ";
      }
    }

    // 🧠 IA (OpenAI)
    let score = 80;
    let details = "Contenido parece seguro";

    if (process.env.OPENAI_API_KEY) {
      try {
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
                content: "Respondé SOLO JSON: {\"score\": number, \"details\": \"texto\"}"
              },
              {
                role: "user",
                content: text
              }
            ]
          })
        });

        const aiData = await aiRes.json();

        if (aiData.choices) {
          try {
            const parsed = JSON.parse(aiData.choices[0].message.content);
            score = parsed.score;
            details = parsed.details;
          } catch {
            details = "Análisis IA parcial";
          }
        }

      } catch {
        details = "IA no disponible";
      }
    }

    // 🔥 Ajuste final
    score = Math.max(0, Math.min(100, score - linkRisk));

    if (linkRisk > 0) {
      details = "🚨 Riesgo detectado. " + linkDetails;
    }

    return res.status(200).json({ score, details });

  } catch (error) {
    return res.status(200).json({
      score: 50,
      details: "Error interno controlado"
    });
  }
}
