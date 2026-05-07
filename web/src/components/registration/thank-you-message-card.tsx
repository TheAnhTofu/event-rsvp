"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Green success banner — shared by {@link ThankYouMessageCard} and the full
 * registration summary on thank-you (Figma `1423:48828`).
 */
export function ThankYouSuccessBanner() {
  const t = useTranslations("ThankYou");

  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-6 rounded-[16px] border-2 border-solid border-[#10b981] bg-[rgba(16,185,129,0.1)] px-[18px] py-10 md:gap-10 md:py-[62px]"
      data-figma-node="1318:9425"
    >
      <Image
        src="/figma-assets/thank-you/check-circle.svg"
        alt=""
        aria-hidden
        width={60}
        height={60}
        className="size-12 shrink-0 md:size-[60px]"
      />
      <h1 className="m-0 text-center text-[22px] font-bold leading-[34px] text-[#10b981] md:text-[30px] md:leading-[50px]">
        {t("heading")}
      </h1>
    </div>
  );
}

/**
 * Post-submit confirmation card — Figma `718:6897`
 * (834p Thank you for your registration).
 *
 * The frame collapses the post-submit page to a single white card
 * containing:
 *   1. A green success panel ("Thank you for your registration").
 *   2. A light-cyan Notes panel.
 *   3. A "Return to Homepage" outline-blue CTA.
 *
 * The hero banner above and the dark-blue footer below are provided
 * by `RegistrationPageShell` (`HeroBanner` + `EventSiteFooter`), so
 * this component renders only the inner card.
 */
export function ThankYouMessageCard() {
  const t = useTranslations("ThankYou");

  return (
    <div
      className="flex w-full flex-col items-center gap-6 rounded-bl-[16px] rounded-br-[16px] rounded-tl-[6px] rounded-tr-[16px] bg-white p-5 shadow-[0_4px_2px_rgba(0,0,0,0.25)] md:gap-8 md:p-10"
      data-figma-node="1318:9340"
    >
      <ThankYouSuccessBanner />

      <section
        className="flex w-full flex-col gap-2 rounded-[20px] bg-[#e9fcff] p-5"
        data-figma-node="1318:9373"
        aria-labelledby="thank-you-notes-title"
      >
        <div className="flex w-full items-center gap-2.5">
          <Image
            src="/figma-assets/thank-you/info.svg"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className="size-6 shrink-0"
          />
          <h2
            id="thank-you-notes-title"
            className="m-0 text-[17px] font-bold leading-normal text-[#333]"
          >
            {t("notesLabel")}
          </h2>
        </div>
        <div className="flex w-full flex-col text-[13px] leading-normal text-[#333]">
          <p className="m-0">
            {t("bodyLine1")} {t("bodyLine2")}
          </p>
          <p className="m-0">{t("bodyLine3")}</p>
        </div>
      </section>

      <Link
        href="/"
        className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-solid border-[#0d6efd] bg-white px-4 py-3 text-[16px] font-normal leading-6 text-[#0d6efd] transition hover:bg-[#0d6efd]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d6efd] md:px-[43px]"
        data-figma-node="1318:9589"
      >
        <Image
          src="/figma-assets/thank-you/home.svg"
          alt=""
          aria-hidden
          width={24}
          height={24}
          className="size-6 shrink-0"
        />
        <span>{t("returnToHomepage")}</span>
      </Link>
    </div>
  );
}
