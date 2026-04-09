export default function handler(req, res) {
  // 🌐 CORS (Blogger + cualquier sitio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { text } = req.body || {};

    let baseScore = 90;
    let score = baseScore;
    let details = "Contenido parece seguro";

    // 🧠 normalizar texto
    const safeText = (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // 🔗 detectar URLs
    const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

    let linkRisk = 0;

    // 🚨 1. DETECCIÓN POR TEXTO
    if (/(verifica|verificar|urgente|inmediato|banco|cuenta|acceso|suspendida|bloqueada)/.test(safeText)) {
      linkRisk += 20;
    }

    if (/(soporte|admin|security|paypal)/.test(safeText)) {
      linkRisk += 10;
    }

    // 🔥 combinación peligrosa en texto
    if (/(verify|verifica)/.test(safeText) && /(bank|banco|cuenta)/.test(safeText)) {
      linkRisk += 15;
    }

    // 🔗 2. DETECCIÓN POR LINKS (MEJORADA)
    if (urls.length > 0) {
      urls.forEach(url => {
        let risk = 0;

        const hasKeywords = /(login|verify|bank)/.test(url);
        const hasBadDomain = /(\.xyz|\.ru)/.test(url);

        if (hasKeywords) risk += 20;
        if (hasBadDomain) risk += 30;

        // 🔥 COMBO PELIGROSO (CLAVE)
        if (hasKeywords && hasBadDomain) {
          risk += 20;
        }

        linkRisk += Math.min(risk, 50);
      });

      if (linkRisk > 0) {
        details = "⚠️ Posible fraude detectado";
      }
    }

    // 🔒 límite global
    linkRisk = Math.min(linkRisk, 60);

    // 🔥 score final
    score = baseScore - linkRisk;

    // 🛡️ evitar extremos
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
