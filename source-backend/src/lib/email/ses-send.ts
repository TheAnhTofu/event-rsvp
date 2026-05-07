import {
  SESv2Client,
  SendEmailCommand,
} from "@aws-sdk/client-sesv2";

function getRegion(): string | null {
  const r = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  return r?.trim() ? r.trim() : null;
}

function getFromAddress(): string | null {
  const v = process.env.AWS_SES_FROM_EMAIL?.trim();
  return v ? v : null;
}

export function isSesConfigured(): boolean {
  return Boolean(getRegion() && getFromAddress());
}

function getClient(): SESv2Client {
  const region = getRegion();
  if (!region) {
    throw new Error("AWS_REGION (or AWS_DEFAULT_REGION) is not set");
  }
  return new SESv2Client({ region });
}

export type SendSesEmailAttachment = {
  fileName: string;
  contentType: string;
  /** Raw bytes (e.g. PNG/PDF). */
  rawContent: Uint8Array;
  contentDisposition?: "ATTACHMENT" | "INLINE";
};

export type SendSesEmailInput = {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  attachments?: SendSesEmailAttachment[];
};

function buildRawMimeMessage(
  from: string,
  input: SendSesEmailInput,
): Uint8Array {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const lines: string[] = [];

  lines.push(`From: ${from}`);
  lines.push(`To: ${input.to}`);
  lines.push(`Subject: =?UTF-8?B?${Buffer.from(input.subject, "utf8").toString("base64")}?=`);
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push("");

  lines.push(`--${boundary}`);
  lines.push('Content-Type: multipart/alternative; boundary="alt_boundary"');
  lines.push("");

  lines.push("--alt_boundary");
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: base64");
  lines.push("");
  lines.push(Buffer.from(input.textBody, "utf8").toString("base64"));
  lines.push("");

  lines.push("--alt_boundary");
  lines.push("Content-Type: text/html; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: base64");
  lines.push("");
  lines.push(Buffer.from(input.htmlBody, "utf8").toString("base64"));
  lines.push("");

  lines.push("--alt_boundary--");
  lines.push("");

  if (input.attachments) {
    for (const att of input.attachments) {
      const disposition = att.contentDisposition === "INLINE" ? "inline" : "attachment";
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${att.contentType}; name="${att.fileName}"`);
      lines.push("Content-Transfer-Encoding: base64");
      lines.push(`Content-Disposition: ${disposition}; filename="${att.fileName}"`);
      lines.push("");
      const b64 = Buffer.from(
        att.rawContent.buffer,
        att.rawContent.byteOffset,
        att.rawContent.byteLength,
      ).toString("base64");
      const chunkSize = 76;
      for (let i = 0; i < b64.length; i += chunkSize) {
        lines.push(b64.slice(i, i + chunkSize));
      }
      lines.push("");
    }
  }

  lines.push(`--${boundary}--`);
  lines.push("");

  return Buffer.from(lines.join("\r\n"), "utf8");
}

/**
 * Sends via Amazon SES v2 API.
 * When attachments are present, uses Raw MIME format for maximum compatibility.
 * Otherwise uses the simpler Simple format.
 */
export async function sendSesEmail(
  input: SendSesEmailInput,
): Promise<{ messageId: string }> {
  const from = getFromAddress();
  if (!from) {
    throw new Error("AWS_SES_FROM_EMAIL is not set");
  }

  const client = getClient();
  const configurationSetName = process.env.AWS_SES_CONFIGURATION_SET?.trim();

  const hasAttachments = Boolean(input.attachments?.length);

  let res;
  if (hasAttachments) {
    const rawData = buildRawMimeMessage(from, input);
    res = await client.send(
      new SendEmailCommand({
        ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
        Content: {
          Raw: { Data: rawData },
        },
      }),
    );
  } else {
    res = await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [input.to] },
        ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
        Content: {
          Simple: {
            Subject: { Data: input.subject, Charset: "UTF-8" },
            Body: {
              Html: { Data: input.htmlBody, Charset: "UTF-8" },
              Text: { Data: input.textBody, Charset: "UTF-8" },
            },
          },
        },
      }),
    );
  }

  const messageId = res.MessageId ?? "";
  return { messageId };
}
