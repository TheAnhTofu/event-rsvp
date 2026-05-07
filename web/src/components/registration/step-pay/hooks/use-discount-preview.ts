import { useEffect, useMemo, useState } from "react";
import {
  buildDiscountBreakdown,
  type DiscountBreakdown,
} from "@/lib/discount-code";

type Params = {
  baseFeeHkd: number;
  appliedDiscountCode: string | undefined;
  suppressAutoDiscount: boolean;
};

export function useDiscountPreview({
  baseFeeHkd,
  appliedDiscountCode,
  suppressAutoDiscount,
}: Params) {
  const [discountPreview, setDiscountPreview] = useState<DiscountBreakdown | null>(
    null,
  );
  const [discountPreviewError, setDiscountPreviewError] = useState<string | null>(
    null,
  );
  const [discountPreviewLoading, setDiscountPreviewLoading] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const code = appliedDiscountCode?.trim() ?? "";
    setDiscountPreviewLoading(true);
    setDiscountPreviewError(null);
    void (async () => {
      try {
        const u = new URLSearchParams({
          code,
          baseFeeHkd: String(baseFeeHkd),
        });
        if (suppressAutoDiscount) {
          u.set("autoApply", "false");
        }
        const res = await fetch(`/api/discount/preview?${u}`, {
          signal: ac.signal,
        });
        const data = (await res.json().catch(() => ({}))) as {
          breakdown?: DiscountBreakdown;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setDiscountPreview(null);
          setDiscountPreviewError(
            code ? (data.error ?? "Invalid code") : (data.error ?? "Could not load pricing"),
          );
          return;
        }
        if (data.breakdown) {
          setDiscountPreview(data.breakdown);
          setDiscountPreviewError(null);
        }
      } catch {
        if (cancelled) return;
        setDiscountPreview(null);
        setDiscountPreviewError(
          code ? "Could not validate code" : "Could not load pricing",
        );
      } finally {
        if (!cancelled) setDiscountPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [appliedDiscountCode, baseFeeHkd, suppressAutoDiscount]);

  const discountBreakdown = useMemo((): DiscountBreakdown => {
    if (discountPreview) return discountPreview;
    return buildDiscountBreakdown(baseFeeHkd, null, "");
  }, [baseFeeHkd, discountPreview]);

  const discountApiPayload = useMemo((): {
    discountCode?: string;
    skipAutomaticDiscount?: boolean;
  } => {
    const manual = appliedDiscountCode?.trim();
    if (manual) {
      return { discountCode: manual };
    }
    if (suppressAutoDiscount) {
      return { skipAutomaticDiscount: true };
    }
    return {};
  }, [appliedDiscountCode, suppressAutoDiscount]);

  return {
    discountPreviewLoading,
    discountPreviewError,
    setDiscountPreviewError,
    discountBreakdown,
    discountApiPayload,
  };
}
