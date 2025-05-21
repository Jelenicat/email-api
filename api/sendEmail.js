// api/sendEmail.js
import mailjet from 'node-mailjet';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  const { ime, prezime, email, datum, vreme, telefonUcenika, profesorEmail } = req.body;

  if (!ime || !prezime || !email || !datum || !vreme || !telefonUcenika || !profesorEmail) {
    return res.status(400).json({ message: 'Nedostaju podaci za slanje' });
  }

  const mailjetClient = mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );

  const tekst = `Poštovani/a ${ime} ${prezime},

Uspešno ste zakazali čas za ${datum} u ${vreme}.

Za detaljnije dogovore oko mesta održavanja časa možete se čuti sa drugom stranom.
📞 Broj telefona učenika: ${telefonUcenika}

Hvala na poverenju!`;

  try {
    await mailjetClient
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: 'jelenatanaskovicj@gmail.com',
              Name: 'Privatni časovi',
            },
            To: [
              { Email: email, Name: `${ime} ${prezime}` },
              { Email: profesorEmail, Name: 'Profesor' },
            ],
            Subject: 'Potvrda o zakazanom času',
            TextPart: tekst,
          },
        ],
      });

    return res.status(200).json({ message: 'Email uspešno poslat!' });
  } catch (error) {
    console.error('Mailjet greška:', error);
    return res.status(500).json({ message: 'Greška pri slanju emaila' });
  }
}
