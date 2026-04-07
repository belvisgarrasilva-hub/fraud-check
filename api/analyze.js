export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔥 ACEPTA GET TAMBIÉN (CLAVE)
  if (req.method === "GET") {
    return res.status(200).json({
      score: 80,
      verdict: "Seguro",
      details: "API funcionando (GET test)"
    });
  }

  if (req.method !== "POST") {
    return res.status(200).json({
      score: 50,
      verdict: "Error",
      details: "Método no válido pero controlado"
    });
  }

  try {
    let body = req.body;

    // 🔥 Soporta todos los formatos posibles
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = { text: body };
      }
    }

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
      text.includes("banco") ||
      text.includes("cuenta") ||
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
