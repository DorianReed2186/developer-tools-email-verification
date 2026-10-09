import { sendVerification } from "./verification.js";

const email = process.env.DEMO_EMAIL_TO;
if (!email) throw new Error("Set DEMO_EMAIL_TO before running the demo");
const result = await sendVerification({ email, learnerName: "Sam", verificationUrl: "https://learn.example/verify?token=sample" });
console.log(JSON.stringify(result, null, 2));
