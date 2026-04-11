export default async function handler(req, res) {
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

    // 🔗 LINKS + GOOGLE SAFE BROWSING
    if (urls.length > 0) {
      for (const url of urls) {
        let linkRisk = 0;

        const badDomain = /(\.xyz|\.ru|bit\.ly|tinyurl)/.test(url);
        const keywords = /(login|verify|bank)/.test(url);

        if (badDomain) linkRisk += 30;
        if (keywords) linkRisk += 20;
        if (badDomain && keywords) linkRisk += 20;

        // 🛡️ Google Safe Browsing
        try {
          const googleRes = await fetch(
            `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                client: {
