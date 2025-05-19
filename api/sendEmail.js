const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = async (req, res) => {
  // Dozvoljavamo samo POST zahtev
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST method is allowed" });
  }

  // Izvlačimo podatke iz tela zahteva
  const { to, subject, text } = req.body;

  // Provera da su svi podaci uneti
  if (!to || !subject || !text) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Slanje mejla putem SendGrid-a
    await sgMail.send({
      to,                          // Email učenika
      from: "jelenatanaskovicj@gmail.com", // 🔁 Zameni svojim verifikovanim mejlom na SendGrid-u
      subject,
      text,
    });

    res.status(200).json({ message: "Email uspešno poslat!" });
  } catch (error) {
    console.error("Greška pri slanju:", error);

    // Ako je moguće, pošalji i detaljnu poruku greške
    const message = error?.response?.body?.errors?.[0]?.message || "Unknown error";

    res.status(500).json({ message: "Greška pri slanju mejla", error: message });
  }
};
