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
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { uid, type } = req.query;

  if (!uid || !type) {
    return res.status(400).send("Missing uid or type");
  }

  if (!["coach", "academy"].includes(type)) {
    return res.status(400).send("Invalid type");
  }

  try {
    getAdminApp();
    const db = getFirestore();

 const approvedAt = new Date();

const expiresAt = new Date(approvedAt);
expiresAt.setFullYear(expiresAt.getFullYear() + 1);

const updateData = {
  approvalStatus: "approved",
  profileVisible: true,
  membershipActive: true,
  membershipStatus: "active",
  approvedAt,
  expiresAt,
};

    await db.collection("users").doc(uid).set(updateData, { merge: true });

    const collectionName = type === "coach" ? "coaches" : "academies";

    await db.collection(collectionName).doc(uid).set(updateData, {
      merge: true,
    });

    return res.status(200).send("Profile approved ✅");
  } catch (error) {
    console.error("Approve error:", error);
    return res.status(500).send("Approval failed");
  }
}