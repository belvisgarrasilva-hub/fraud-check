export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const input = body?.text;

    if (!input) {
      return res.status(400).json({ error: "No input provided" });
    }

    let content = input;

    // 🌐 Si es URL → extraer contenido
    if (input.startsWith("http://") || input.startsWith("https://")) {
      try {
        const response = await fetch(
          `https://api.allorigins.win/get?url=${encodeURIComponent(input)}`
        );
        const data = await response.json();

        content = data.contents
          .replace(/<[^>]*>?/gm, "")
          .slice(0, 3000);

      } catch (err) {
        content = input; // fallback
      }
    }

    // 🧠 FALLBACK LOCAL (SIEMPRE FUNCIONA)
    let score = 90;
    let verdict = "Seguro";
    let details = "Análisis básico";

    if (
      content.toLowerCase().includes("login") ||
      content.toLowerCase().includes("verify") ||
      content.toLowerCase().includes("bank") ||
      content.toLowerCase().includes("password")
    ) {
      score = 40;
      verdict = "Sospechoso";
      details = "Contiene palabras típicas de phishing";
    }

    // 🤖 Intentar IA (si hay API KEY)
    if (process.env.OPENAI_API_KEY) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content: "Classify as scam, suspicious or safe. Be brief."
              },
              {
                role: "user",
                content: content
              }
            ],
            temperature: 0
          })
        });

        const data = await aiResponse.json();

        if (data.choices) {
          const aiText = data.choices[0].message.content.toLowerCase();

          if (aiText.includes("scam")) {
            score = 10;
            verdict = "Peligroso";
            details = "Detectado como posible estafa por IA";
          } else if (aiText.includes("suspicious")) {
            score = 40;
            verdict = "Sospechoso";
            details = "Detectado como sospechoso por IA";
          } else {
            score = 90;
            verdict = "Seguro";
            details = "Evaluado como seguro por IA";
          }
        }

      } catch (err) {
        // fallback silencioso
      }
    }

    // ✅ RESPUESTA FINAL (compatible con frontend PRO)
    return res.status(200).json({
      score,
      verdict,
      details
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
