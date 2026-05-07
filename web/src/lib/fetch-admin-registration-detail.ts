import type { AdminRegistrationAdminDetailResponse } from "@/types/admin-registration-detail";

/**
 * Browser fetch for admin registration detail. Logic + pipeline live on source-backend
 * (`GET /api/admin/registrations/:reference/admin-detail`).
 */
export async function fetchAdminRegistrationAdminDetail(
  reference: string,
): Promise<AdminRegistrationAdminDetailResponse> {
  const encoded = encodeURIComponent(reference);
  const res = await fetch(
    `/api/admin/registrations/${encoded}/admin-detail`,
    {
      headers: { Accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    },
  );
  if (res.status === 404) {
    throw new Error("Not found");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Admin registration detail failed (${res.status}): ${text}`,
    );
  }
  return res.json() as Promise<AdminRegistrationAdminDetailResponse>;
}
