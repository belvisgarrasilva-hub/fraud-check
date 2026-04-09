// 🧠 normalizar
const safeText = (text || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ")
  .trim();

const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

let risk = 0;
let details = "Contenido parece seguro";

// 🧠 1. URGENCIA
const urgency = /(urgente|ahora|inmediato|ya|rapido)/.test(safeText);

// 🎯 2. ACCIÓN
const action = /(verifica|verificar|confirmar|accede|acceso|login)/.test(safeText);

// 🏦 3. ENTIDAD
const entity = /(banco|cuenta|paypal|soporte|admin|security)/.test(safeText);

// 🔥 COMBO PELIGROSO (PHISHING REAL)
if (urgency && action && entity) {
  risk += 40;
  details = "🚨 Mensaje con patrón de phishing (urgencia + acción + entidad)";
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

    // 🔥 combo link peligroso
    if (badDomain && keywords) linkRisk += 20;

    risk += Math.min(linkRisk, 50);
  });

  details = "⚠️ Enlaces sospechosos detectados";
}

// 🔥 muchos links
if (urls.length > 2) {
  risk += 10;
}

// 🔒 limitar riesgo
risk = Math.min(risk, 70);

// 🎯 score final
let score = 90 - risk;

// límites
score = Math.max(30, Math.min(100, score));

if (isNaN(score)) {
  score = 50;
  details = "Error en análisis";
}
