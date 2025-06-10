import { db } from './utils/firebaseAdmin';
import mailjet from 'node-mailjet';

const mailjetClient = mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET allowed' });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 sata unazad

  try {
    const snapshot = await db.collection('rezervacije')
      .where('ratingSent', 'in', [false, null])
      .get();

    const promises = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const { datum, vreme, email, profesorId, ime, prezime } = data;

      const rezervacijaVreme = new Date(`${datum}T${vreme}`);

      // DEBUG LOG
      console.log(`📌 Rezervacija: ${doc.id}`);
      console.log(`🕓 Vreme rezervacije: ${rezervacijaVreme.toISOString()}`);
      console.log(`🕒 Cutoff: ${cutoff.toISOString()}`);
      console.log(`📬 Email: ${email}`);

      if (rezervacijaVreme < cutoff) {
        // Dohvati ime i prezime profesora
        const profesorSnapshot = await db.collection('profesori').doc(profesorId).get();
        const profesorData = profesorSnapshot.exists ? profesorSnapshot.data() : null;
        
        const imeProfesora = profesorData ? profesorData.ime : "Nepoznat";
        const prezimeProfesora = profesorData ? profesorData.prezime : "Nepoznat";

        const oceniLink = `https://www.pronadjiprofesora.com/rate/${doc.id}`;

        const html = `
          <div style="font-family: 'Segoe UI'; background: #fff3f8; padding: 20px; border-radius: 10px;">
            <h2 style="color: #d81b60;">Privatni časovi</h2>
            <p>Poštovani ${ime} ${prezime},</p>
            <p>Vaš čas sa profesorom <strong>${imeProfesora} ${prezimeProfesora}</strong> je završen. Bilo bi nam jako važno da ocenite profesora.</p>
            <a href="${oceniLink}" style="padding: 10px 20px; background: #d81b60; color: white; border-radius: 5px; text-decoration: none;">
              Ocenite profesora
            </a>
            <p style="margin-top: 30px;">Hvala što koristite <strong>Privatne časove</strong>!</p>
          </div>
        `;

        promises.push(
          mailjetClient.post('send', { version: 'v3.1' }).request({
            Messages: [
              {
                From: { Email: 'noreply@privatnicasovi.org', Name: 'Privatni časovi' },
                To: [{ Email: email }],
                Subject: '📝 Ocenite profesora',
                TextPart: `Vaš čas sa profesorom ${imeProfesora} ${prezimeProfesora} je završen, ocenite profesora.`,
                HTMLPart: html,
              },
            ],
          }).then(() => {
            console.log(`✅ Poslat email za rezervaciju ${doc.id}`);
            return doc.ref.update({ ratingSent: true });
          }).catch(err => {
            console.error(`❌ Greška pri slanju emaila za ${doc.id}:`, err);
          })
        );
      } else {
        console.log(`⏩ Preskačem – rezervacija nije starija od 3h`);
      }
    }

    await Promise.all(promises);
    res.status(200).json({ message: 'Emailovi za ocenu uspešno poslati' });
  } catch (err) {
    console.error('🔥 Globalna greška:', err);
    res.status(500).json({ error: 'Nešto je pošlo po zlu' });
  }
}
