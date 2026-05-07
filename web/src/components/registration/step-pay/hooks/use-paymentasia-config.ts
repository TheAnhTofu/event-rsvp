import { useEffect, useState } from "react";

export function usePaymentAsiaEnabled(): boolean {
  const [paymentAsiaEnabled, setPaymentAsiaEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/paymentasia/config")
      .then((r) => r.json())
      .then((p) => {
        if (!cancelled) {
          setPaymentAsiaEnabled(Boolean((p as { enabled?: boolean }).enabled));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return paymentAsiaEnabled;
}
