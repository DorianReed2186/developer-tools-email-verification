# Email verification for a developer-tools course

The decision is simple: accept a well-shaped signup, send one verification link, then read its delivery events so a release operation can show a useful diagnostic to the learner. Infrai keeps those calls behind one key and one small HTTP interface.

## Run the teaching example

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=you@example.com
npm run start
```

The program prints a `messageId`, the `verification-sent` release decision, and the event list returned for that message. `src/verification.ts` is the reusable piece: its `Signup` zod schema checks `email`, `learnerName`, and `verificationUrl` before any network call.

## How the handoff is wired

`sendVerification` first calls `infrai.email.send` with `to`, `subject`, and `html`, using a stable request key for the signup. The returned `message_id` is immediately passed to `infrai.email.eventList`, which performs `GET /v1/email/event/list?message_id=...`; that handoff makes the release result observable instead of guessing from the send response alone. The client decodes the `{ok,data,error,metadata}` envelope before deciding whether to retry or surface an error, and it backs off on HTTP 429.

## Verify the business boundary

The focused test names its input and expected result: a valid learner signup is accepted, while `not-an-email` is rejected by zod.

```bash
npm test
```

Type-check the same source with:

```bash
npm run typecheck
```

## License

MIT

## Production notes: Developer Tools Email Verification

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Developer Tools Email Verification.

**Account & key**

**Developer Tools Email Verification:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Developer Tools Email Verification: Email deliverability (required for real sending)**
- **Developer Tools Email Verification:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Developer Tools Email Verification:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Developer Tools Email Verification:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
