export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Analyze this message and classify it as scam, suspicious or safe in one short sentence:\n\n${text}`
      })
    });

    const data = await response.json();

    let result = "No result";

    // ✅ Lectura correcta de la respuesta
    if (data.output_text) {
      result = data.output_text;
    } else if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.content && Array.isArray(item.content)) {
          for (const content of item.content) {
            if (content.text) {
              result = content.text;
              break;
            }
          }
        }
        if (result !== "No result") break;
      }
    }

    res.status(200).json({ result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
