import type { Request, Response } from "express";

function getCrmBaseUrl(): string {
  return (process.env.CRM_API_BASE_URL ?? "http://127.0.0.1:4000").replace(
    /\/$/,
    "",
  );
}

export async function getCrmRegistrationsExport(
  req: Request,
  res: Response,
): Promise<void> {
  const baseUrl = getCrmBaseUrl();

  const incoming = req.query;
  const q = new URLSearchParams();
  for (const key of ["email", "payment_method", "from", "to"] as const) {
    const v = incoming[key];
    const s = Array.isArray(v) ? v[0] : v;
    if (typeof s === "string" && s) q.set(key, s);
  }

  const url = `${baseUrl}/api/v1/registrations/export.csv${q.toString() ? `?${q.toString()}` : ""}`;
  const upstream = await fetch(url, {
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    res
      .status(upstream.status >= 500 ? 502 : upstream.status)
      .json({ error: "Upstream CRM export failed", detail: text });
    return;
  }

  const body = await upstream.text();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="registrations-export.csv"',
  );
  res.send(body);
}

export async function getCrmRegistrationsList(
  req: Request,
  res: Response,
): Promise<void> {
  const baseUrl = getCrmBaseUrl();

  const incoming = req.query;
  const q = new URLSearchParams();
  for (const key of [
    "limit",
    "offset",
    "email",
    "payment_method",
    "from",
    "to",
  ] as const) {
    const v = incoming[key];
    const s = Array.isArray(v) ? v[0] : v;
    if (typeof s === "string" && s) q.set(key, s);
  }

  const url = `${baseUrl}/api/v1/registrations${q.toString() ? `?${q.toString()}` : ""}`;
  const upstream = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    res
      .status(upstream.status >= 500 ? 502 : upstream.status)
      .json({ error: "Upstream CRM list failed", detail: text });
    return;
  }

  const body: unknown = await upstream.json();
  res.json(body);
}

export async function getCrmRegistrationDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const baseUrl = getCrmBaseUrl();

  const reference = req.params.reference;
  if (!reference || typeof reference !== "string") {
    res.status(400).json({ error: "Missing reference" });
    return;
  }

  const encoded = encodeURIComponent(reference);
  const url = `${baseUrl}/api/v1/registrations/${encoded}`;
  const upstream = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (upstream.status === 404) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    res
      .status(upstream.status >= 500 ? 502 : upstream.status)
      .json({ error: "Upstream CRM detail failed", detail: text });
    return;
  }

  const body: unknown = await upstream.json();
  res.json(body);
}
