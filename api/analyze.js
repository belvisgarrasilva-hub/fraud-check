export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {
    const apiKey = req.headers["x-api-key"];
    const { text } = req.body;

    if (!apiKey) {
      return res.status(403).json({ error: "API key requerida" });
    }

    // 🔗 CONSULTAR USUARIO EN SUPABASE
    const userRes = await fetch(
      `https://iwgvqgidsucupxsfxndg.supabase.co/rest/v1/users?api_key=eq.${apiKey}`,
      {
        headers: {
          "apikey": process.env.SUPABASE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_KEY}`
        }
      }
    );

    const users = await userRes.json();

    if (!users || users.length === 0) {
      return res.status(403).json({ error: "API key inválida" });
    }

    const user = users[0];

    // 🚫 LÍMITE DE USO
    if (user.used_count >= user.limit_count) {
      return res.status(403).json({ error: "Límite alcanzado — pasá a PRO" });
    }

    // 🔄 ACTUALIZAR USO
    await fetch(
      `https://iwgvqgidsucupxsfxndg.supabase.co/rest/v1/users?api_key=eq.${apiKey}`,
      {
        method: "PATCH",
        headers: {
          "apikey": process.env.SUPABASE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          used_count: user.used_count + 1
        })
      }
    );

    // 🧠 DETECCIÓN BÁSICA (puede convivir con IA)
    let score = 80;
    let details = "Contenido parece seguro";

    // 🔍 detectar URLs
    const urls = text.match(/https?:\/\/[^\s]+/g) || [];
    let linkRisk = 0;

    urls.forEach(url => {
      const lower = url.toLowerCase();

      if (["login", "verify", "bank"].some(w => lower.includes(w))) {
        linkRisk += 20;
      }

      if ([".xyz", ".ru"].some(d => lower.includes(d))) {
        linkRisk += 20;
      }
    });

    score = Math.max(0, Math.min(100, score - linkRisk));

    if (linkRisk > 0) {
      details = "⚠️ Posible fraude detectado en enlaces";
    }

    return res.status(200).json({ score, details });

  } catch (error) {
    return res.status(500).json({
      error: "Error interno",
      details: error.message
    });
  }
}
