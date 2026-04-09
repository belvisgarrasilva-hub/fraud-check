export default function handler(req, res) {
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

    const safeText = (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

    let linkRisk = 0;

    // texto sospechoso
    if (/(verifica|verificar|urgente|banco|cuenta|acceso|suspendida|bloqueada)/.test(safeText)) {
      linkRisk += 20;
    }

    // links
    if (urls.length > 0) {
      urls.forEach(url => {
        let risk = 0;

        if (/(login|verify|bank)/.test(url)) {
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

    linkRisk = Math.min(linkRisk, 60);
    score = baseScore - linkRisk;
    score = Math.max(30, Math.min(100, score));

    return res.status(200).json({ score, details });

  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({ error: "Internal error" });
  }
}
