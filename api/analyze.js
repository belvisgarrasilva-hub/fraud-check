export default async function handler(req, res) {
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
        input: text
      })
    });

    const data = await response.json();

    // 🔥 DEVOLVEMOS TODO PARA VERLO
    res.status(200).json({ debug: data });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
