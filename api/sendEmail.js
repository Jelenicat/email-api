import mailjet from 'node-mailjet';
import applyCors from './utils/cors';

export default async function handler(req, res) {
  const isPreflight = applyCors(req, res);
  if (isPreflight) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  const {
    ime = '',
    prezime = '',
    email,
    datum,
    vreme,
    telefonUcenika,
    profesorEmail,
    nacinCasa,
    jitsiLink,
    tip // 👈 ovo dodajemo
  } = req.body;

  if (!email || !tip) {
    return res.status(400).json({ message: 'Nedostaju osnovni podaci.' });
  }

  const mailjetClient = mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );

  // 📩 Dobrodošlica za profesora
  if (tip === 'registracija-profesor') {
    const text = `Poštovani,\n\nUspešno ste se registrovali kao profesor na platformi Privatni časovi.

Uskoro uvodimo ocenjivanje profesora – kvalitet donosi veću vidljivost!

Sada možete urediti svoj profil i dodati slobodne termine. Hvala vam što postajete deo naše zajednice.`;

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fdfcfd; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h2 style="color: #d81b60; margin: 0;">Privatni časovi</h2>
        </div>
        <p style="font-size: 16px;">Poštovani,</p>
        <p style="font-size: 16px;">Uspešno ste se registrovali kao profesor na platformi <strong>Privatni časovi</strong>.</p>

        <p style="margin-top: 20px; background-color: #fff3f8; padding: 15px; border-left: 4px solid #d81b60; border-radius: 8px;">
          🆕 <strong>Uskoro uvodimo ocenjivanje profesora – kvalitet donosi veću vidljivost!</strong>
        </p>

        <p style="font-size: 16px; margin-top: 20px;">
          Sada možete urediti svoj profil, uneti predmete, gradove i dodati slobodne termine.
        </p>

        <p style="margin-top: 30px; font-size: 14px;">Hvala vam što postajete deo naše zajednice!<br/>Tim <strong>Privatni časovi</strong></p>
      </div>
    `;

    try {
      await mailjetClient.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: 'noreply@privatnicasovi.org',
              Name: 'Privatni časovi',
            },
            To: [{ Email: email }],
            Subject: '🎉 Dobrodošli na platformu Privatni časovi',
            TextPart: text,
            HTMLPart: html,
          },
        ],
      });

      return res.status(200).json({ message: 'Email dobrodošlice poslat!' });
    } catch (err) {
      console.error('Mailjet greška:', err);
      return res.status(500).json({ message: 'Greška pri slanju emaila dobrodošlice' });
    }
  }

  // ✅ Potvrda o zakazanom času (postojeća logika)
  if (!ime || !prezime || !datum || !vreme || !telefonUcenika || !profesorEmail) {
    return res.status(400).json({ message: 'Nedostaju podaci za potvrdu termina.' });
  }

  const tekst = `Poštovani/a ${ime} ${prezime},\n\nUspešno ste zakazali čas za ${datum} u ${vreme}.
${jitsiLink ? `\n🔗 Link za online čas: ${jitsiLink}` : ''}
\nBroj telefona učenika: ${telefonUcenika}

🆕 Uskoro uvodimo ocenjivanje profesora – kvalitet donosi vidljivost!

Hvala na poverenju!`;

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fdfcfd; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
      <div style="text-align: center;">
        <h2 style="color: #d81b60; margin: 0;">Privatni časovi</h2>
      </div>
      <p style="font-size: 16px;">Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
      <p style="font-size: 16px;">Uspešno ste zakazali čas za:</p>
      <p style="font-size: 18px; background-color: #ffe6ee; padding: 10px; border-radius: 8px;"><strong>📅 ${datum} u 🕒 ${vreme}</strong></p>

      ${jitsiLink ? `
        <p style="font-size: 16px;">🔗 Link za online čas:</p>
        <p><a href="${jitsiLink}" style="color: #d81b60; font-weight: bold;">${jitsiLink}</a></p>
      ` : ''}

      ${nacinCasa === 'uzivo' ? `
        <p style="margin-top: 10px;">Kontaktiraće Vas profesor za detaljnije dogovore oko održavanja časa:</p>
      ` : ''}

      <p style="font-size: 16px; background: #fff3f8; padding: 10px; border-left: 4px solid #f06292; border-radius: 5px;"><strong>📞 Broj učenika: ${telefonUcenika}</strong></p>

      <p style="margin-top: 30px; font-size: 15px; background-color: #fce4ec; padding: 15px; border-radius: 8px; border-left: 4px solid #d81b60;">
        🆕 <strong>Uskoro uvodimo ocenjivanje profesora – kvalitet donosi vidljivost!</strong>
      </p>

      <p style="margin-top: 30px; font-size: 14px;">Hvala na poverenju!<br/>Tim <strong>Privatni časovi</strong></p>
    </div>
  `;

  try {
    await mailjetClient.post('send', { version: 'v3.1' }).request({
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

    return res.status(200).json({ message: 'Email uspešno poslat!', jitsiLink });
  } catch (error) {
    console.error('Mailjet greška:', error);
    return res.status(500).json({ message: 'Greška pri slanju emaila' });
  }
}
