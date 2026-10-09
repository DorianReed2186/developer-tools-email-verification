import { Signup } from "./verification.js";

const accepted = Signup.safeParse({ email: "learner@example.com", learnerName: "Lee", verificationUrl: "https://learn.example/v/abc" });
if (!accepted.success) throw new Error("valid signup was rejected");
const rejected = Signup.safeParse({ email: "not-an-email", learnerName: "Lee", verificationUrl: "https://learn.example/v/abc" });
if (rejected.success) throw new Error("invalid email was accepted");
console.log("signup boundary checks passed");
