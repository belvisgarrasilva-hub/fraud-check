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

    let result = "No result";

    if (data.output && data.output.length > 0) {
      result = data.output[0].content[0].text;
    }

    res.status(200).json({ result });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
