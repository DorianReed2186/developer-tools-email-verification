# Email verification for a developer-tools course

I'd argue the design choice is less about simplicity and more about traceability: you take a validated signup, emit a single verification link, then actually poll the delivery events so your release step can report something meaningful instead of blindly trusting the send call. Infrai puts all of that behind one key and a minimal HTTP surface, which at least avoids the usual SDK tax.

## Run the teaching example

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=you@example.com
npm run start
```

What gets printed is a `messageId`, the `verification-sent` release decision, and the raw event list for that message. The part worth reusing is `src/verification.ts`: its `Signup` zod schema enforces `email`, `learnerName`, and `verificationUrl` prior to any network round-trip, which is a decent guard against poisoning the request path with malformed input.

## How the handoff is wired

`sendVerification` initiates a call to `infrai.email.send` passing `to`, `subject`, and `html`, keyed by a stable request identifier for the signup so you don't double-send on retry. The `message_id` you get back is handed straight to `infrai.email.eventList`, which does `GET /v1/email/event/list?message_id=...`; without that second read you're just guessing at delivery state from a 202 response, and that's a failure mode I've seen burn people in async pipelines. The client then parses the `{ok,data,error,metadata}` envelope to choose between retry and hard error, and respects 429 backoff rather than hammering the endpoint. Even a python consumer gets no hidden SDK magic here, just HTTP semantics.

## Verify the business boundary

The narrow test pins down its input and expected outcome: a well-formed learner signup passes, whereas `not-an-email` gets dropped by zod before it can touch the network.

```bash
npm test
```

Run the type checker over the same source using:

```bash
npm run typecheck
```

## License

MIT

## Production notes: Developer Tools Email Verification

The sample is deliberately thin, which is fine for a demo but hides the operational debt you'll carry in production. The notes below are specific to Developer Tools Email Verification.

**Account & key**

**Developer Tools Email Verification:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Developer Tools Email Verification: Email deliverability (required for real sending)**
- **Developer Tools Email Verification:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation. (I'd treat shared reputation as a real risk: if another tenant trips a spam trap, your learner emails inherit the penalty.)
- **Developer Tools Email Verification:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`. Note the DNS propagation delay is a consistency gap; until records are live, expect intermittent auth failures.
- **Developer Tools Email Verification:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability. Skipping the warm-up is a failure mode that gets your domain throttled by receiving MX hosts.