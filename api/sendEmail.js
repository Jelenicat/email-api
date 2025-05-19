import mailjet from 'node-mailjet';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  const { ime, prezime, email, profesorEmail, datum, vreme } = req.body;

  if (!ime || !prezime || !email || !profesorEmail || !datum || !vreme) {
    return res.status(400).json({ message: 'Nedostaju podaci za slanje' });
  }

  const mailjetClient = mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );

  try {
    await mailjetClient.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: 'jelenatanaskovicj@gmail.com',
            Name: 'Privatni časovi',
          },
          To: [
            {
              Email: profesorEmail,
              Name: 'Profesor',
            },
          ],
          Subject: 'Nova rezervacija časa',
          TextPart: `Učenik ${ime} ${prezime} je zakazao čas za ${datum} u ${vreme}. Kontakt email: ${email}.`,
        },
      ],
    });

    res.status(200).json({ message: 'Email uspešno poslat!' });
  } catch (error) {
    console.error('Mailjet greška:', error);
    res.status(500).json({ message: 'Greška pri slanju emaila' });
  }
}
