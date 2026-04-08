export default function handler(req, res) {
  try {
    const { text } = req.body || {};

    let baseScore = 90;
    let score = baseScore;
    let details = "Contenido parece seguro";

    const safeText = (text || "").toLowerCase();
    const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

    let linkRisk = 0;

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
        details = "⚠️ Posible fraude detectado en enlaces";
      }
    }

    linkRisk = Math.min(linkRisk, 60);
    score = baseScore - linkRisk;
    score = Math.max(30, Math.min(100, score));

    if (isNaN(score)) {
      score = 50;
      details = "Error en análisis";
    }

    // 🔥 ESTO ES LO QUE TE FALTA SI O SI
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
