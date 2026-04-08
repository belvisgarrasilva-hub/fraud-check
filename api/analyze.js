export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se recibió texto." });
    }

    let score = 50;
    let details = "Análisis básico activo";

    const suspiciousWords = ["login", "paypal", "bank", "transfer", "urgent"];
    const found = suspiciousWords.filter(word =>
      text.toLowerCase().includes(word)
    );

    if (found.length > 0) {
      score = 20;
      details = "Palabras sospechosas: " + found.join(", ");
    } else if (text.length > 100) {
      score = 80;
      details = "Texto largo sin señales sospechosas.";
    }

    return res.status(200).json({ score, details });

  } catch (error) {
    return res.status(500).json({ error: "Error interno." });
  }
}
