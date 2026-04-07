export default async function handler(req, res) {
  // Permitir CORS desde cualquier origen
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Manejo de preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = body?.text;

    if (!input) {
      return res.status(400).json({ error: "No input provided" });
    }

    // 🔹 Resultado de prueba sin OpenAI
    return res.status(200).json({
      score: 50, // valor neutro para mostrar en Blogger
      details: "Análisis básico activo (sin crédito de OpenAI)"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
