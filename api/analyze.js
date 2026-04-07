// /api/analyze.js
export default async function handler(req, res) {
  // Permitir solo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido, use POST' });
  }

  // Habilitar CORS para cualquier dominio (puedes restringir a tu dominio de Blogger)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No se recibió texto para analizar' });
    }

    // Aquí podrías integrar la API real de IA si tuvieras crédito
    // Pero para modo gratuito devolvemos resultados simulados
    const score = Math.floor(Math.random() * 101); // 0 a 100
    let details = '';

    if (score > 70) details = 'Contenido seguro según análisis básico';
    else if (score > 40) details = 'Contenido sospechoso según análisis básico';
    else details = 'Contenido potencialmente peligroso según análisis básico';

    return res.status(200).json({ score, details });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}
