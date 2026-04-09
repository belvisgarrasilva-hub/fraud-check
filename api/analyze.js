export default function handler(req, res) {
  // 🔓 CORS (para Blogger y cualquier web)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 🛑 manejar preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { text } = req.body || {};

    let baseScore = 90;
    let score = baseScore;
    let details = "Contenido parece seguro";

    // 🧠 normalización (CLAVE)
    const safeText = (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // quita acentos
      .replace(/\s+/g, " ") // limpia espacios
      .trim();

    // 🔗 detectar URLs
    const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

    let linkRisk = 0;

    // 🚨 1. DETECCIÓN POR TEXTO (NUEVO)
    if (/(verifica|verificar|urgente|inmediato|banco|cuenta|acceso|suspendida|bloqueada)/.test(safeText)) {
      linkRisk += 20;
    }

    if (/(soporte|admin|security|paypal)/.test(safeText)) {
      linkRisk += 10;
    }

    // 🔗 2. DETECCIÓN POR LINKS
    if (urls.length > 0) {
      urls.forEach(url => {
        let risk = 0;

        if (/(login|verify|bank|verificar|banco|cuenta|acceso)/.test(url)) {
          risk += 20;
        }

        if (/(\.xyz|\.ru)/.test(url)) {
          risk += 30;
        }

        linkRisk += Math.min(risk, 40);
      });

      if (linkRisk > 0) {
        details = "⚠️ Posible fraude detectado";
      }
    }

    // 🔒 límite global
    linkRisk = Math.min(linkRisk, 60);

    // 🔥 score final
    score = baseScore - linkRisk;

    // 🛡️ límites
    score = Math.max(30, Math.min(100, score));

    // fallback
    if (isNaN(score)) {
      score = 50;
      details = "Error en análisis";
    }

    return res.status(200).json({
      score,
      details
    });

  } catch (error) {
    console.error("API ERROR:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
