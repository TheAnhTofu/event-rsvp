import { redirect } from "next/navigation";

export default async function CookiesRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  redirect("/register?cookies=1");
}
