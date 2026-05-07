"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

/**
 * Footer — mirrors Figma node `1342:7559`
 * (IAIS – AIF | Registration Form Web).
 * Copy lives under the `Footer` namespace in messages.
 */
export function EventSiteFooter() {
  const t = useTranslations("Footer");
  const supportEmail = t("supportEmail");

  return (
    <footer className="mt-auto w-full shrink-0 bg-[linear-gradient(180deg,#216fde_0%,#2094e9_55%,#72cbf5_100%)] text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-6 py-[60px] md:px-[60px] lg:px-20">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 max-w-full">
            <p className="text-[20px] font-bold leading-[30px] tracking-[1.2px]">
              {t("eventTitle")}
            </p>
            <p className="text-[16px] leading-6">
              {t("eventDates")}
              <br />
              {t("eventLocation")}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <p className="text-[16px] font-bold leading-5 tracking-[1.2px]">
              {t("contactSupport")}
            </p>
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-2 text-[14px] leading-[21.6px] underline underline-offset-2 decoration-solid"
            >
              <Image
                src="/figma-assets/homepage/homepage-sms.svg"
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0"
              />
              {supportEmail}
            </a>
          </div>
        </div>

        <div className="border-t border-white pt-[25px]">
          <p className="text-center text-[13px] leading-5 tracking-[1.2px]">
            {t("followPrefix")}{" "}
            <a
              href="https://www.linkedin.com/company/international-association-of-insurance-supervisors/"
              target="_blank"
              rel="noreferrer"
              className="text-[#0042ff] underline underline-offset-2 decoration-solid"
            >
              LinkedIn
            </a>{" "}
            {t("subscribePrefix")}{" "}
            <a
              href="https://www.iais.org/newsletter/"
              target="_blank"
              rel="noreferrer"
              className="text-[#0042ff] underline underline-offset-2 decoration-solid"
            >
              {t("emailAlerts")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
