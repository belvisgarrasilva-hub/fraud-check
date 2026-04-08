export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text" });
    }

    // 🔍 Detectar links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    let linkRisk = 0;
    let linkDetails = "";

    // 🔥 GOOGLE SAFE BROWSING
    if (urls.length > 0) {
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
        linkRisk = 40;
        linkDetails = "⚠️ Link detectado como peligroso por Google Safe Browsing.";
      } else {
        linkDetails = "✔ Link no reportado como peligroso.";
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
            content: "Sos un detector de fraude y fake news. Respondé en JSON: {score: 0-100, details: texto corto}"
          },
          {
            role: "user",
            content: `Analizá este contenido: "${text}"`
          }
        ]
      })
    });

    const aiData = await aiRes.json();
    let score = 50;
    let details = "Análisis básico";

    try {
      const parsed = JSON.parse(aiData.choices[0].message.content);
      score = parsed.score;
      details = parsed.details;
    } catch {
      details = aiData.choices?.[0]?.message?.content || details;
    }

    // 🔥 COMBINAR RESULTADOS
    score = Math.max(0, Math.min(100, score - linkRisk));

    if (linkDetails) {
      details += " | " + linkDetails;
    }

    return res.status(200).json({ score, details });

  } catch (error) {
    return res.status(500).json({ error: "Error en análisis avanzado" });
  }
}
