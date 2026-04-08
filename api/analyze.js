let baseScore = 90;
let score = baseScore;
let details = "Contenido parece seguro";

const safeText = (text || "").toLowerCase();
const urls = safeText.match(/https?:\/\/[^\s]+/g) || [];

let linkRisk = 0;

if (urls.length > 0) {
  urls.forEach(url => {
    let risk = 0;

    // palabras sensibles
    if (/(login|verify|bank|verificar|banco|cuenta|acceso)/.test(url)) {
      risk += 20;
    }

    // dominios sospechosos
    if (/(\.xyz|\.ru)/.test(url)) {
      risk += 30;
    }

    // limitar riesgo por URL
    linkRisk += Math.min(risk, 40);
  });

  if (linkRisk > 0) {
    details = "⚠️ Posible fraude detectado en enlaces";
  }
}

// límite global
linkRisk = Math.min(linkRisk, 60);

// cálculo final
score = baseScore - linkRisk;

// evitar extremos
score = Math.max(30, Math.min(100, score));

// fallback
if (isNaN(score)) {
  score = 50;
  details = "Error en análisis";
}
