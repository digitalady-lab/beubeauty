export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Nincs kép' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Netlify.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API kulcs hiányzik' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const prompt = `Te egy profi személyi stílustanácsadó és színelemző vagy. Elemezd a képen látható személy bőrtónusát, hajszínét és szemszínét, és adj részletes személyre szabott színtanácsadást.

Válaszolj CSAK valid JSON-nel, semmi más szöveggel, backtick vagy markdown nélkül:

{
  "season": "Évszakos típus neve magyarul (pl. Meleg Ősz, Hűvös Tél, Lágy Tavasz, Hűvös Nyár)",
  "season_tag": "Rövid alcím (pl. Arany tónusok)",
  "description": "2-3 mondatos leírás a bőrtónus típusáról",
  "palette": [
    {"name": "Szín neve", "hex": "#HEXKÓD"},
    {"name": "Szín neve", "hex": "#HEXKÓD"},
    {"name": "Szín neve", "hex": "#HEXKÓD"},
    {"name": "Szín neve", "hex": "#HEXKÓD"},
    {"name": "Szín neve", "hex": "#HEXKÓD"},
    {"name": "Szín neve", "hex": "#HEXKÓD"},
    {"name": "Szín neve", "hex": "#HEXKÓD"},
    {"name": "Szín neve", "hex": "#HEXKÓD"}
  ],
  "clothes": {
    "description": "Ruhaszín ajánlás 2-3 mondatban",
    "colors": [
      {"name": "Szín neve", "hex": "#HEXKÓD"},
      {"name": "Szín neve", "hex": "#HEXKÓD"},
      {"name": "Szín neve", "hex": "#HEXKÓD"},
      {"name": "Szín neve", "hex": "#HEXKÓD"},
      {"name": "Szín neve", "hex": "#HEXKÓD"}
    ]
  },
  "avoid": {
    "description": "Miért nem illenek ezek a színek (1-2 mondat)",
    "colors": ["Szín neve 1", "Szín neve 2", "Szín neve 3", "Szín neve 4"]
  },
  "makeup": {
    "lip": {
      "description": "Rúzs árnyalat javaslat",
      "colors": [
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"},
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"},
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"}
      ]
    },
    "eye": {
      "description": "Szemhéjfesték javaslat",
      "colors": [
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"},
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"},
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"}
      ]
    },
    "base": {
      "description": "Alapozó undertone és arcpirosító",
      "colors": [
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"},
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"},
        {"name": "Árnyalat neve", "hex": "#HEXKÓD"}
      ]
    }
  },
  "glasses": [
    {
      "type": "Keret típus (pl. Acetát keret)",
      "colors": [{"name": "Szín neve", "hex": "#HEXKÓD"}, {"name": "Szín neve", "hex": "#HEXKÓD"}],
      "description": "Miért illik hozzád"
    },
    {
      "type": "Keret típus (pl. Fém keret)",
      "colors": [{"name": "Szín neve", "hex": "#HEXKÓD"}, {"name": "Szín neve", "hex": "#HEXKÓD"}],
      "description": "Miért illik hozzád"
    }
  ],
  "beu_cta": {
    "title": "Személyre szabott CTA cím a Be U Beauty szalonhoz",
    "text": "2 mondat arról, hogyan tud a Be U Beauty arckezelései segíteni a bőrtónus optimalizálásában"
  }
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'API hiba' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawText = data.content?.[0]?.text || '';
    const clean = rawText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Szerver hiba: ' + err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: '/api/analyze'
};
