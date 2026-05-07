/**
 * Loads rendered HTML for an email template (admin session; proxied to source-backend).
 */
export async function fetchAdminEmailTemplatePreview(
  reference: string,
  templateKey: string,
): Promise<string> {
  const encoded = encodeURIComponent(reference);
  const params = new URLSearchParams({ templateKey });
  const res = await fetch(
    `/api/admin/registrations/${encoded}/email-template-preview?${params.toString()}`,
    {
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    let message = `Preview failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* use default */
    }
    throw new Error(message);
  }
  const data = (await res.json()) as { html: string };
  return data.html;
}
