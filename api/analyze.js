export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔧 Soporte seguro para body
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const input = body?.text;

    if (!input) {
      return res.status(400).json({ error: "No input provided" });
    }

    let content = input;

    // 🌐 Detectar si es URL
    if (input.startsWith("http://") || input.startsWith("https://")) {
      try {
        const response = await fetch(
          `https://api.allorigins.win/get?url=${encodeURIComponent(input)}`
        );
        const data = await response.json();

        // Limpiar HTML
        content = data.contents
          .replace(/<[^>]*>?/gm, "")
          .slice(0, 3000);

      } catch (err) {
        return res.status(500).json({ error: "Error fetching URL content" });
      }
    }

    // 🤖 Llamada a OpenAI
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
            content: "Detect scams, phishing or fraud. Answer briefly: scam, suspicious or safe and why."
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

    if (!data.choices) {
      return res.status(500).json({ error: "AI response error", data });
    }

    const result = data.choices[0].message.content.trim();

    res.status(200).json({ result });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
