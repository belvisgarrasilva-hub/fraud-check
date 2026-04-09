export default function handler(req, res) {
  // 🌐 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { text } = req.body || {};

    let details = "Contenido parece seguro";

    // 🧠 normalizar
    const safeText = (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

    let risk = 0;

    // 🧠 URGENCIA
    const urgency = /(urgente|ahora|inmediato|ya|rapido)/.test(safeText);

    // 🎯 ACCIÓN
    const action = /(verifica|verificar|confirmar|accede|acceso|login)/.test(safeText);

    // 🏦 ENTIDAD
    const entity = /(banco|cuenta|paypal|soporte|admin|security)/.test(safeText);

    // 🔥 COMBO FUERTE
    if (urgency && action && entity) {
      risk += 40;
      details = "🚨 Patrón de phishing detectado";
    }

    // combinaciones parciales
    if (urgency && action) risk += 15;
    if (action && entity) risk += 15;

    // 🔗 LINKS
    if (urls.length > 0) {
      urls.forEach(url => {
        let linkRisk = 0;

        const badDomain = /(\.xyz|\.ru|bit\.ly|tinyurl)/.test(url);
        const keywords = /(login|verify|bank)/.test(url);

        if (badDomain) linkRisk += 30;
        if (keywords) linkRisk += 20;

        // 🔥 combo link
        if (badDomain && keywords) linkRisk += 20;

        risk += Math.min(linkRisk, 50);
      });

      details = "⚠️ Enlaces sospechosos detectados";
    }

    // muchos links
    if (urls.length > 2) {
      risk += 10;
    }

    // 🔒 límite
    risk = Math.min(risk, 70);

    // 🎯 score
    let score = 90 - risk;

    score = Math.max(30, Math.min(100, score));

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
