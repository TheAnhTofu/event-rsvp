"use client";

import type { AppLocale } from "@/i18n/routing";
import type { RegistrationDetailResponse } from "@/types/crm";
import { buildQrPayload } from "../utils";

type Props = {
  row: RegistrationDetailResponse;
  locale: AppLocale;
};

export function QrCodeCard({ row, locale }: Props) {
  const p = row.payload;

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-admin-border bg-white p-6">
      <h2 className="text-[18px] font-semibold leading-[22px] text-admin-navy">
        QR Code
      </h2>
      <div className="relative size-[300px] shrink-0">
        {typeof p.qrCodeUrl === "string" && p.qrCodeUrl.trim() !== "" ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-supplied asset URL
          <img
            src={p.qrCodeUrl.trim()}
            alt=""
            width={300}
            height={300}
            className="size-[300px] object-contain"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- external QR render; optional NEXT_PUBLIC_APP_URL for absolute thank-you URL
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
              buildQrPayload(row, locale, p),
            )}`}
            alt=""
            width={300}
            height={300}
            className="size-[300px] object-contain"
          />
        )}
      </div>
    </section>
  );
}
