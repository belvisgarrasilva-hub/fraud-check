export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No se recibió texto para analizar." });
    }

    // ✅ Aquí calculamos un score básico de ejemplo:
    // - Solo para que siempre devuelva algo, reemplaza con tu lógica real luego
    let score = 50; // default neutral
    let details = "Análisis básico activo";

    // Pequeño algoritmo de ejemplo: palabras sospechosas
    const suspiciousWords = ["login", "paypal", "bank", "transfer", "urgent"];
    const found = suspiciousWords.filter(word => text.toLowerCase().includes(word));
    if (found.length > 0) {
      score = 20; // sospechoso
      details = "Palabras sospechosas detectadas: " + found.join(", ");
    } else if (text.length > 100) {
      score = 80; // seguro, mensaje largo
      details = "Mensaje largo sin palabras sospechosas.";
    }

    return res.status(200).json({ score, details });

  } catch (error) {
    return res.status(500).json({ error: "Ocurrió un error interno en la API." });
  }
}
