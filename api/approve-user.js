import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore(app);

export default async function handler(req, res) {
  const { uid, type } = req.query;

  if (!uid || !type) {
    return res.status(400).send("Missing params");
  }

  try {
    await db.collection("users").doc(uid).update({
      approvalStatus: "approved",
      profileVisible: true,
      membershipActive: true,
      membershipStatus: "active",
    });

    if (type === "coach") {
      await db.collection("coaches").doc(uid).update({
        approvalStatus: "approved",
        profileVisible: true,
        membershipActive: true,
        membershipStatus: "active",
      });
    }

    if (type === "academy") {
      await db.collection("academies").doc(uid).update({
        approvalStatus: "approved",
        profileVisible: true,
        membershipActive: true,
        membershipStatus: "active",
      });
    }

    return res.send("Approved successfully ✅");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error");
  }
}