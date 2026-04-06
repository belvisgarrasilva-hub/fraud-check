export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "You detect scams. Answer ONLY one word: scam, suspicious, or safe."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0
      })
    });

    const data = await response.json();

    console.log("OPENAI RESPONSE:", JSON.stringify(data, null, 2));

    let result = "No result";

    if (data.choices && data.choices.length > 0) {
      result = data.choices[0].message.content.trim();
    }

    res.status(200).json({ result });

  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Server error" });
  }
}
