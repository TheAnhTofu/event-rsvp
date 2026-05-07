/**
 * One-off SES test: load env from .env.local via:
 *   node --env-file=.env.local scripts/ses-send-test.mjs <to@email>
 */
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const to = process.argv[2];
if (!to) {
  console.error("Usage: node --env-file=.env.local scripts/ses-send-test.mjs <to@email>");
  process.exit(1);
}

const region = (process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION)?.trim();
const from = process.env.AWS_SES_FROM_EMAIL?.trim();
const configurationSetName = process.env.AWS_SES_CONFIGURATION_SET?.trim();

if (!region || !from) {
  console.error("Set AWS_REGION (or AWS_DEFAULT_REGION) and AWS_SES_FROM_EMAIL.");
  process.exit(1);
}

const client = new SESv2Client({ region });
const when = new Date().toISOString();
const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:16px;">
<p>Đây là <strong>email thử</strong> từ project <code>event-rsvp</code> (Amazon SES).</p>
<p>Thời gian UTC: ${when}</p>
</body></html>`;
const text = `Email thu tu event-rsvp (Amazon SES). ${when}`;

const res = await client.send(
  new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: [to] },
    ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
    Content: {
      Simple: {
        Subject: { Data: "[event-rsvp] Email thử", Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    },
  }),
);

console.log("OK MessageId:", res.MessageId ?? "(none)");
