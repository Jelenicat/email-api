import mailjet from 'node-mailjet';
import applyCors from './utils/cors';
import { db } from './utils/firebaseAdmin';

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
    tip,
    profesorId
  } = req.body;

  if (!email || !tip) {
    return res.status(400).json({ message: 'Nedostaju osnovni podaci.' });
  }

  const mailjetClient = mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );

  // 🎉 Dobrodošlica za profesora
  if (tip === 'registracija-profesor') {
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fdfcfd; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h2 style="color: #d81b60;">Dobrodošli na Privatni časovi!</h2>
        </div>
        <p>Poštovani,</p>
        <p>Uspešno ste se registrovali kao profesor na platformi <strong>Privatni časovi</strong>.</p>
        <p>Da biste se prikazivali učenicima u rezultatima pretrage, molimo vas da uredite svoj profil:</p>
        <ul>
          <li>Unesite <strong>ime i prezime</strong></li>
          <li>Izaberite <strong>predmete</strong> koje predajete</li>
          <li>Označite <strong>nivoe obrazovanja</strong> koje pokrivate</li>
          <li>Unesite <strong>grad</strong> i po potrebi opštine</li>
          <li>Dodajte <strong>cenu časa</strong></li>
          <li>Postavite <strong>slobodne termine</strong> u kalendaru</li>
        </ul>
        <p>Učenici mogu zakazati čas bez registracije. Ako označite da je čas online, automatski se generiše link za video poziv.</p>
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
            To: [{ Email: email }],
            Subject: '🎉 Dobrodošli na platformu Privatni časovi',
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

  // ✅ Zakazivanje časa
  if (tip === 'zakazivanje') {
    if (!ime || !prezime || !datum || !vreme || !telefonUcenika || !profesorEmail || !profesorId) {
      return res.status(400).json({ message: 'Nedostaju podaci za potvrdu termina.' });
    }

    const rezId = `${profesorId}_${datum}_${vreme}`;
    const cancelLink = `https://www.pronadjiprofesora.com/cancel/${rezId}`;
    const tekst = `Poštovani/a ${ime} ${prezime},\n\nUspešno ste zakazali čas za ${datum} u ${vreme}.
${jitsiLink ? `\n🔗 Link za online čas: ${jitsiLink}` : ''}
\nBroj telefona učenika: ${telefonUcenika}\n\nHvala na poverenju!`;

    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fdfcfd; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h2 style="color: #d81b60;">Potvrda zakazanog časa</h2>
        </div>
        <p>Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
        <p>Uspešno ste zakazali čas za:</p>
        <p style="font-size: 18px; background-color: #ffe6ee; padding: 10px; border-radius: 8px;"><strong>🗓️ ${datum} u 🕒 ${vreme}</strong></p>

        ${jitsiLink ? `
          <p>🔗 Link za online čas:</p>
          <p><a href="${jitsiLink}" style="color: #d81b60; font-weight: bold;">${jitsiLink}</a></p>
        ` : ''}

        ${nacinCasa === 'uzivo' ? `
          <p style="margin-top: 10px;">Kontaktiraće Vas profesor za detalje oko održavanja časa.</p>
        ` : ''}

        <p style="font-size: 16px; background: #fff3f8; padding: 10px; border-left: 4px solid #f06292; border-radius: 5px;"><strong>📞 Broj učenika: ${telefonUcenika}</strong></p>

        <p style="margin-top: 30px;">
          <a href="${cancelLink}" style="padding: 10px 20px; background: #d81b60; color: white; border-radius: 5px; text-decoration: none; font-weight: bold;">
            Otkaži čas
          </a>
        </p>
        <p style="font-size: 13px; color: #555; margin-top: 10px;">
          Učenik može otkazati NAJKASNIJE 2 sata pre početka.
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

  // ⛔ Učenik otkazuje čas
  if (tip === 'otkazivanje') {
    if (!profesorEmail || !ime || !prezime || !datum || !vreme || !nacinCasa) {
      return res.status(400).json({ message: 'Nedostaju podaci za otkazivanje časa.' });
    }

    const subject = '⛔ Čas je otkazan od strane učenika';
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fff4f6; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h2 style="color: #d81b60;">Obaveštenje o otkazivanju časa</h2>
        </div>
        <p>Poštovani,</p>
        <p>Učenik <strong>${ime} ${prezime}</strong> je otkazao čas koji je bio zakazan za:</p>
        <p style="font-size: 18px; background-color: #ffe6ee; padding: 10px; border-radius: 8px;"><strong>🗓️ ${datum} u 🕒 ${vreme} (${nacinCasa})</strong></p>
        <p style="margin-top: 20px;">Ovaj termin je sada slobodan i može biti rezervisan od strane drugog učenika.</p>
        <p style="margin-top: 30px; font-size: 14px;">Hvala na razumevanju,<br/>Tim <strong>Privatni časovi</strong></p>
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
            To: [{ Email: profesorEmail }],
            Subject: subject,
            HTMLPart: html,
          },
        ],
      });

      return res.status(200).json({ message: 'Email profesoru o otkazivanju poslat.' });
    } catch (error) {
      console.error('Mailjet greška:', error);
      return res.status(500).json({ message: 'Greška pri slanju mejla o otkazivanju' });
    }
  }

  // ⛔ Profesor otkazuje čas
  if (tip === 'otkazivanje-profesor') {
    if (!email || !ime || !prezime || !datum || !vreme || !nacinCasa || !profesorEmail) {
      return res.status(400).json({ message: 'Nedostaju podaci za obaveštavanje učenika.' });
    }

    const subject = '⛔ Čas je otkazan od strane profesora';
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fff4f6; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <h2 style="color: #d81b60;">Obaveštenje o otkazivanju časa</h2>
        </div>
        <p>Poštovani/a <strong>${ime} ${prezime}</strong>,</p>
        <p>Profesor je otkazao čas koji je bio zakazan za:</p>
        <p style="font-size: 18px; background-color: #ffe6ee; padding: 10px; border-radius: 8px;"><strong>🗓️ ${datum} u 🕒 ${vreme} (${nacinCasa})</strong></p>
        <p>Molimo Vas da rezervišete novi termin ili pronađete drugog profesora.</p>
        <p style="margin-top: 30px; font-size: 14px;">Hvala na razumevanju,<br/>Tim <strong>Privatni časovi</strong></p>
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
            Subject: subject,
            HTMLPart: html,
          },
        ],
      });

      return res.status(200).json({ message: 'Email učeniku o otkazivanju poslat.' });
    } catch (error) {
      console.error('Mailjet greška:', error);
      return res.status(500).json({ message: 'Greška pri slanju mejla učeniku' });
    }
  }

    // 📩 Kontakt forma
  if (tip === 'kontakt-forma') {
    const { poruka } = req.body;

    if (!ime || !email || !poruka) {
      return res.status(400).json({ message: 'Nedostaju podaci iz kontakt forme.' });
    }

    const subject = '📩 Nova poruka sa kontakt forme';
    const html = `
      <div style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fdfcfd; color: #333; border-radius: 10px; max-width: 600px; margin: auto;">
        <h2 style="color: #d81b60;">Nova poruka preko sajta</h2>
        <p><strong>Ime:</strong> ${ime}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Poruka:</strong></p>
        <div style="background-color: #ffe6ee; padding: 10px; border-radius: 8px; margin-top: 5px;">
          ${poruka}
        </div>
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
            To: [{ Email: 'kontakt@pronadjiprofesora.com' }],
            Subject: subject,
            HTMLPart: html,
          },
        ],
      });

      return res.status(200).json({ message: 'Poruka sa kontakt forme poslata.' });
    } catch (error) {
      console.error('Mailjet greška (kontakt-forma):', error);
      return res.status(500).json({ message: 'Greška pri slanju mejla sa kontakt forme' });
    }
  }


  return res.status(400).json({ message: 'Nepoznat tip akcije.' });
}
