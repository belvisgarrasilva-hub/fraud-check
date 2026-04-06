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
        input: `Analyze this message and say if it's scam, suspicious or safe. Answer in one short sentence:\n\n${text}`
      })
    });

    const data = await response.json();

    // 🔥 MÉTODO DEFINITIVO UNIVERSAL
    let result = data.output_text 
      || JSON.stringify(data).match(/"text":"(.*?)"/)?.[1] 
      || "No result";

    res.status(200).json({ result });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}
