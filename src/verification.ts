import { z } from "zod";
import { infrai } from "./infrai.js";

export const Signup = z.object({ email: z.string().email(), learnerName: z.string().min(1), verificationUrl: z.string().url() });
export type Signup = z.infer<typeof Signup>;

export type VerificationResult = { messageId: string; release: "verification-sent"; diagnostics: { events: unknown[] } };

export async function sendVerification(input: unknown): Promise<VerificationResult> {
  const signup = Signup.parse(input);
  const sent = await infrai.email.send({
    to: signup.email,
    subject: "Verify your developer-tools account",
    html: `<p>Hello ${signup.learnerName},</p><p>Confirm your email to continue learning: <a href="${signup.verificationUrl}">Verify email</a>.</p>`
  }, `signup-verification:${signup.email}`);
  const events = await infrai.email.event.list(sent.message_id);
  return { messageId: sent.message_id, release: "verification-sent", diagnostics: { events } };
}
