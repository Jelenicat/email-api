import mailjet from 'node-mailjet';

export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  const {
    ime,
    prezime,
    email,
    datum,
    vreme,
    telefonUcenika,
    profesorEmail,
    googleMeetLink, // <- ispravno ime promenljive
  } = req.body;

  if (!ime || !prezime || !email || !datum || !vreme || !telefonUcenika || !profesorEmail) {
    return res.status(400).json({ message: 'Nedostaju podaci za slanje' });
  }

  const mailjetClient = mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );

  const tekst = `Poštovani/a ${ime} ${prezime},\n\nUspešno ste zakazali čas za ${datum} u ${vreme}.
${googleMeetLink ? `\n🔗 Link za online čas: ${googleMeetLink}` : ''}
\nBroj telefona učenika: ${telefonUcenika}\n\nHvala na poverenju!`;

  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fdfcfd; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
    <div style="text-align: center;">
      <h2 style="color: #d81b60; margin: 0;">Privatni časovi</h2>
    </div>
    <p style="font-size: 16px;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
    <p style="font-size: 16px;">Uspešno ste zakazali čas za:</p>
    <p style="font-size: 18px; background-color: #ffe6ee; padding: 10px; border-radius: 8px;"><strong>📅 ${datum} u 🕒 ${vreme}</strong></p>

    ${
      googleMeetLink
        ? `<p style="font-size: 16px;">🔗 Link za online čas:</p>
           <p><a href="${googleMeetLink}" style="color: #d81b60; font-weight: bold;">${googleMeetLink}</a></p>`
        : ''
    }

    <p style="margin-top: 10px;">Kontaktiraće Vas profesor za detaljnije dogovore oko održavanja časa:</p>
    <p style="font-size: 16px; background: #fff3f8; padding: 10px; border-left: 4px solid #f06292; border-radius: 5px;"><strong>📞 Broj učenika: ${telefonUcenika}</strong></p>
    <p style="margin-top: 30px; font-size: 14px;">Hvala na poverenju!<br/>Tim <strong>Privatni časovi</strong></p>
  </div>
  `;

  try {
    await mailjetClient
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: 'noreply@privatnicasovi.org',
              Name: 'Privatni časovi',
            },
            To: [
              { Email: email, Name: `${ime} ${prezime}` },
              { Email: profesorEmail, Name: 'Profesor' },
            ],
            Subject: '✅ Zakazan čas: potvrda',
            TextPart: tekst,
            HTMLPart: html,
          },
        ],
      });

    return res.status(200).json({ message: 'Email uspešno poslat!' });
  } catch (error) {
    console.error('Mailjet greška:', error);
    return res.status(500).json({ message: 'Greška pri slanju emaila' });
  }
}
