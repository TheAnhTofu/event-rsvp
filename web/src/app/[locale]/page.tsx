import Image from "next/image";
import { useTranslations } from "next-intl";
import { EventSiteFooter } from "@/components/layout/event-site-footer";
import { HeroBanner } from "@/components/layout/hero-banner";
import { Link } from "@/i18n/navigation";

const CARD_SHADOW =
  "shadow-[-10px_-10px_20px_rgba(0,0,0,0.1),10px_10px_20px_rgba(0,0,0,0.1)]";
const CARD_SHADOW_VIRTUAL =
  "shadow-[-10px_-10px_20px_rgba(0,0,0,0.1),10px_10px_20px_rgba(0,0,0,0.1),10px_10px_5px_rgba(0,0,0,0.1)]";

const AUDIENCE_CARDS = [
  {
    id: "members",
    titleLine1: "cards.members.titleLine1",
    titleLine2: "cards.members.titleLine2",
    description: "cards.members.description",
    icon: "/figma-assets/homepage/homepage-members.svg",
    shadow: CARD_SHADOW,
  },
  {
    id: "industry",
    titleLine1: "cards.industry.titleLine1",
    titleLine2: "cards.industry.titleLine2",
    description: "cards.industry.description",
    icon: "/figma-assets/homepage/homepage-industry.svg",
    shadow: CARD_SHADOW,
  },
  {
    id: "fellow",
    titleLine1: "cards.fellow.titleLine1",
    titleLine2: null,
    description: "cards.fellow.description",
    icon: "/figma-assets/homepage/homepage-fellow.svg",
    shadow: CARD_SHADOW,
  },
  {
    id: "virtual",
    titleLine1: "cards.virtual.titleLine1",
    titleLine2: "cards.virtual.titleLine2",
    description: "cards.virtual.description",
    icon: "/figma-assets/homepage/homepage-virtual.svg",
    shadow: CARD_SHADOW_VIRTUAL,
  },
] as const;

export default function HomePage() {
  const t = useTranslations("Home");
  const contactEmail = t("contactEmail");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="w-full bg-[#f3f6ff]">
        {/* Single source of truth — same component used by RegistrationPageShell
            and LegalPageShell; ships responsive desktop/mobile crops with
            `object-cover` so no #28a9e0 letterbox shows on ultra-wide screens. */}
        <HeroBanner />

        <section className="flex flex-col items-center px-6 py-[60px] md:px-[60px] lg:px-20">
          <h1 className="mb-12 max-w-[960px] text-center font-display text-[22px] font-bold leading-[32px] text-[#28a9e0] md:text-[26px] md:leading-[40px]">
            {t("eyebrow")}
            <br />
            {t("title")}
          </h1>

          <div className="mb-12 flex w-full max-w-[828px] flex-col gap-2.5 text-left text-[16px] leading-[28px] text-[#353535] md:text-[16px] md:leading-[28px]">
            <p className="text-[#1b1b1b]">
              {t("welcomePrefix")}{" "}
              <strong className="font-bold">{t("eventName")}</strong>
              {t("welcomeSuffix")}
            </p>
            <p>
              {t("instructionsLine1")}
              <br />
              {t("instructionsLine2")}
            </p>
            <p>
              {t("inviteLine1")}
              <br />
              {t("contactPrefix")}{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-medium text-[#2f80ed] underline underline-offset-2"
              >
                {contactEmail}
              </a>
              {t("contactEmailSuffix")} {t("websitePrefix")}{" "}
              <a
                href="https://www.iais.org/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#2f80ed] underline underline-offset-2"
              >
                {t("iaisWebsite")}
                <Image
                  src="/figma-assets/homepage/homepage-popup.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="inline-block size-[18px]"
                />
              </a>
              {t("websiteSuffix")}
            </p>
          </div>

          <div className="grid w-full max-w-[828px] grid-cols-1 gap-[28px] md:grid-cols-2">
            {AUDIENCE_CARDS.map((card) => (
              <article
                key={card.id}
                className={`flex min-h-[520px] flex-col items-center gap-5 rounded-2xl bg-[linear-gradient(66deg,#f1f2f4_8.97%,#fafafa_85.05%)] p-10 text-center ${card.shadow}`}
              >
                <div className="flex size-[200px] shrink-0 items-center justify-center">
                  <Image
                    src={card.icon}
                    alt=""
                    width={200}
                    height={200}
                    className="max-h-[200px] max-w-[200px] object-contain"
                  />
                </div>
                <h2 className="min-h-0 text-[24px] font-bold leading-normal text-[#000d25]">
                  {t(card.titleLine1)}
                  {card.titleLine2 ? (
                    <>
                      <br />
                      {t(card.titleLine2)}
                    </>
                  ) : null}
                </h2>
                <p className="min-h-0 flex-1 text-[18px] leading-[30px] text-[#353535]">
                  {t(card.description)}
                </p>
                <Link
                  href={`/register?audience=${card.id}`}
                  className="mt-auto flex w-full max-w-none shrink-0 items-center justify-center rounded-xl bg-[#28a9e0] px-[43px] py-3 text-center text-[16px] font-medium leading-6 text-white transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#28a9e0]"
                >
                  {t("registerNow")}
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 flex max-w-[934px] flex-col items-center gap-1 text-center text-[18px] leading-[30px]">
            <p className="font-medium text-[#353535]">{t("paymentPrompt")}</p>
            <a
              href={`mailto:${contactEmail}?subject=Secure%20payment%20link%20request`}
              className="font-medium text-[#2f80ed] underline underline-offset-2"
            >
              {t("paymentLink")}
            </a>
          </div>
        </section>
      </main>

      <EventSiteFooter />
    </div>
  );
}
