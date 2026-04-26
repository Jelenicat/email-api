import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString(
      "utf8"
    )
  );

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, excerpt, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    getAdminApp();
    const db = getFirestore();

    await db.collection("blogPosts").add({
      title,
      excerpt: excerpt || "",
      content,
      status: "published",
      createdAt: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Create blog error:", error);
    return res.status(500).json({ error: "Failed to create blog post" });
  }
}