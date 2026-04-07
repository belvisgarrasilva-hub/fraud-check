export default function handler(req, res) {
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

    const input = body?.text || "";

    let score = 90;
    let verdict = "Seguro";
    let details = "Modo básico activo";

    const text = input.toLowerCase();

    if (text.includes("http") && text.includes("login")) {
      score = 10;
      verdict = "Peligroso";
      details = "Posible phishing detectado";
    } else if (
      text.includes("cuenta") ||
      text.includes("banco") ||
      text.includes("verify")
    ) {
      score = 40;
      verdict = "Sospechoso";
      details = "Contenido sospechoso";
    }

    return res.status(200).json({
      score,
      verdict,
      details
    });

  } catch (e) {
    return res.status(200).json({
      score: 50,
      verdict: "Error",
      details: "Error interno controlado"
    });
  }
}
