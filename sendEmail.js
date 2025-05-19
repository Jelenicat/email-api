const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/send', async (req, res) => {
  const { ime, email, datum, vreme } = req.body;

  if (!ime || !email || !datum || !vreme) {
    return res.status(400).json({ error: 'Nedostaju podaci.' });
  }

  const msg = {
    to: email,
    from: {
      email: 'tvojemail@gmail.com', // Verifikovan mejl na SendGrid-u
      name: 'Privatni časovi',
    },
    subject: 'Potvrda o zakazanom času',
    text: `Zdravo ${ime},\n\nUspešno ste zakazali čas.\nDatum: ${datum}\nVreme: ${vreme}\n\nHvala što koristite našu aplikaciju!`,
  };

  try {
    await sgMail.send(msg);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Greška pri slanju mejla:', err);
    return res.status(500).json({ error: 'Greška pri slanju mejla.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server radi na portu ${PORT}`));
