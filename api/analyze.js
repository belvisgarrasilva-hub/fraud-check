export default async function handler(req, res) {
  // ✅ CORS (permite Blogger / GitHub)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ❌ Solo POST
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

    // 🌐 Si es URL → intentar obtener contenido
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

    // 🧠 FALLBACK (SIEMPRE FUNCIONA)
    let score = 90;
    let verdict = "Seguro";
    let details = "No se detectaron amenazas";

    const text = content.toLowerCase();

    if (
      text.includes("verify") ||
      text.includes("login") ||
      text.includes("bank") ||
      text.includes("password") ||
      text.includes("urgente") ||
      text.includes("cuenta") ||
      text.includes("suspendida")
    ) {
      score = 40;
      verdict = "Sospechoso";
      details = "Contiene palabras típicas de phishing";
    }

    if (
      text.includes("http") &&
      (text.includes("secure") || text.includes("login"))
    ) {
      score = 10;
      verdict = "Peligroso";
      details = "URL potencialmente falsa o engañosa";
    }

    // 🤖 INTENTO DE IA (si hay API key)
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
            details = "Detectado como estafa por IA";
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

    // ✅ RESPUESTA FINAL (SIEMPRE COMPLETA)
    return res.status(200).json({
      score,
      verdict,
      details
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
