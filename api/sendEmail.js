// api/sendEmail.js
import mailjet from 'node-mailjet';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  const { ime, prezime, email, datum, vreme } = req.body;

  if (!ime || !prezime || !email || !datum || !vreme) {
    return res.status(400).json({ message: 'Nedostaju podaci za slanje' });
  }

  const mailjetClient = mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );

  try {
    const request = await mailjetClient
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: 'jelenatanaskovicj@gmail.com',
              Name: 'Privatni časovi',
            },
            To: [
              {
                Email: email,
                Name: `${ime} ${prezime}`,
              },
            ],
            Subject: 'Potvrda o zakazanom času',
            TextPart: `Postovani/a ${ime} ${prezime},\n\nUspesno ste zakazali čas za ${datum} u ${vreme}.\n\nHvala na poverenju!`,
          },
        ],
      });

    return res.status(200).json({ message: 'Email uspešno poslat!' });
  } catch (error) {
    console.error('Mailjet greška:', error);
    return res.status(500).json({ message: 'Greška pri slanju emaila' });
  }
}