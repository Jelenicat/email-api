export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    const subject =
      data.type === "coach"
        ? "New Coach Profile Request"
        : "New Academy Profile Request";

    const html = `
      <h2>${subject}</h2>

      <p><strong>Type:</strong> ${data.type}</p>
      <p><strong>UID:</strong> ${data.uid}</p>
      <p><strong>Email:</strong> ${data.email}</p>

      ${
        data.type === "coach"
          ? `
            <p><strong>Name:</strong> ${data.fullName || ""}</p>
            <p><strong>Age:</strong> ${data.age || ""}</p>
            <p><strong>Phone:</strong> ${data.phone || ""}</p>
            <p><strong>Nationality:</strong> ${data.nationality || ""}</p>
            <p><strong>Residence:</strong> ${data.residence || ""}</p>
            <p><strong>Region:</strong> ${data.region || ""}</p>
            <p><strong>Certifications:</strong> ${data.certifications || ""}</p>
          `
          : `
            <p><strong>Contact:</strong> ${data.contactName || ""}</p>
            <p><strong>Organisation:</strong> ${data.organisationName || ""}</p>
            <p><strong>Phone:</strong> ${data.phone || ""}</p>
            <p><strong>Address:</strong> ${data.address || ""}</p>
            <p><strong>City:</strong> ${data.city || ""}</p>
            <p><strong>Region:</strong> ${data.region || ""}</p>
            <p><strong>Membership:</strong> ${data.membership || ""}</p>
          `
      }

      <hr />

      <p>Approve manually in Firebase:</p>
      <ul>
        <li>approvalStatus: approved</li>
        <li>profileVisible: true</li>
        <li>membershipActive: true</li>
        <li>membershipStatus: active</li>
      </ul>
    `;

    // ✅ RESEND
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend error:", errorText);
      return res.status(500).json({
        error: "Resend failed",
        details: errorText,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}