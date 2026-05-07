import { getTranslations } from "next-intl/server";
import { LegalPageShell } from "@/components/layout/legal-page-shell";
import { PoliciesFaqAccordion } from "@/components/legal/policies-faq-accordion";

const CONTACT_EMAIL = "iais@ia.org.hk";

export default async function PrivacyPage() {
  const t = await getTranslations("PoliciesPage");

  return (
    <LegalPageShell>
      <article className="flex w-full max-w-[1280px] flex-col gap-10 md:gap-12">
        <h1 className="font-display text-center text-[28px] font-bold leading-tight text-brand-deep md:text-[30px] md:leading-[50px]">
          {t("pageTitle")}
        </h1>

        <section
          id="privacy-policy"
          className="flex flex-col gap-3 scroll-mt-24"
        >
          <h2 className="font-display text-[26px] font-bold text-brand-deep md:text-[28px]">
            {t("privacyTitle")}
          </h2>
          <div className="flex flex-col gap-4 text-[18px] leading-6 text-[#313131]">
            <p>{t("privacyP1")}</p>
            <p>{t("privacyP2")}</p>
            <p>{t("privacyP3")}</p>
            <p>{t("privacyP4")}</p>
            <p>
              {t("privacyContactBefore")}
              <a
                className="font-bold text-[#186ddf] underline [text-decoration-skip-ink:none]"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
              {t("privacyContactAfter")}
            </p>
          </div>
        </section>

        <section id="refund-policy" className="flex flex-col gap-3 scroll-mt-24">
          <h2 className="font-display text-[26px] font-bold text-brand-deep md:text-[28px]">
            {t("refundTitle")}
          </h2>
          <div className="flex flex-col gap-4 text-[18px] leading-6 text-[#313131]">
            <p>{t("refundP1")}</p>
            <p>{t("refundP2")}</p>
            <p>{t("refundP3")}</p>
            <p>
              {t("refundContactBefore")}
              <a
                className="font-bold text-[#186ddf] underline [text-decoration-skip-ink:none]"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
              {t("refundContactAfter")}
            </p>
          </div>
        </section>

        <section id="cookies-consent" className="flex flex-col gap-3 scroll-mt-24">
          <h2 className="font-display text-[26px] font-bold text-brand-deep md:text-[28px]">
            {t("cookiesSectionTitle")}
          </h2>
          <div className="flex flex-col gap-4 text-[18px] leading-6 text-[#313131]">
            <p>{t("cookiesP1")}</p>
            <p>{t("cookiesP2")}</p>
            <p>{t("cookiesP3")}</p>
            <p>
              {t("cookiesContactBefore")}
              <a
                className="font-bold text-[#186ddf] underline [text-decoration-skip-ink:none]"
                href={`mailto:${CONTACT_EMAIL}`}
              >
                {CONTACT_EMAIL}
              </a>
              {t("cookiesContactAfter")}
            </p>
          </div>
        </section>

        <PoliciesFaqAccordion />
      </article>
    </LegalPageShell>
  );
}
