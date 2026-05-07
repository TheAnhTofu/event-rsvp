"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCookiesModal } from "@/components/cookies/cookies-modal-context";

/** Opens the cookies modal when the URL contains `?cookies=1`, then removes the param. */
export function CookiesSearchParamsSync() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { open } = useCookiesModal();

  useEffect(() => {
    if (searchParams.get("cookies") !== "1") return;
    open();
    router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router, open]);

  return null;
}
