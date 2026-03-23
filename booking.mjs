export default async (req) => {
  try {
    const body = await req.json();
    const { service, name, email, phone, note, colorSeason } = body;

    const notifyEmail = Netlify.env.get('NOTIFY_EMAIL') || 'info@beubeauty.hu';

    const emailBody = `
Új VIP foglalási kérelem érkezett!

Szolgáltatás: ${service}
Név: ${name}
Email: ${email}
Telefon: ${phone || 'Nem adta meg'}
Színtípus (AI elemzés): ${colorSeason || 'Nem elérhető'}
Megjegyzés: ${note || 'Nincs'}

---
Teendő:
1. Küldj díjbekérőt az 50% foglalóról: ${email}
2. Erősítsd meg az időpontot válasz emailben
3. Ha kérdésed van, hívd: ${phone || email}

Be U Beauty · beubeauty45.netlify.app
    `.trim();

    const sendgridKey = Netlify.env.get('SENDGRID_API_KEY');

    if (sendgridKey) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sendgridKey}`
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: notifyEmail }] }],
          from: { email: 'noreply@beubeauty.hu', name: 'Be U Beauty' },
          reply_to: { email: email, name: name },
          subject: `Új VIP foglalás: ${service} — ${name}`,
          content: [{ type: 'text/plain', value: emailBody }]
        })
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: '/api/booking'
};
