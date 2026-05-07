"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";

/* Bank slip upload (Figma 718:6506 empty, 718:6797 with preview) */
export function BankSlipUploadArea({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  const t = useTranslations("Pay");
  const uploadIconClipId = useId().replace(/:/g, "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const isImage = Boolean(file?.type.startsWith("image/"));
  const showImagePreview = Boolean(file && previewUrl && isImage);
  const showNonImageFile = Boolean(file && !isImage);

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-6 transition",
          dragging
            ? "border-[#4e73f8] bg-[#f4f7ff]"
            : "border-[rgba(0,23,66,0.2)] bg-[#fdfdfd]",
          showImagePreview ? "gap-4" : "",
        ].join(" ")}
      >
        {showImagePreview ? (
          <>
            <img
              src={previewUrl!}
              alt={file?.name || t("slipPreviewAlt")}
              className="mx-auto max-h-[min(420px,55vh)] w-full max-w-[min(100%,337px)] rounded-md object-contain"
            />
            <div className="mx-auto flex w-full max-w-[265px] items-center justify-between px-0.5 pt-1">
              <span
                className="flex size-[14px] shrink-0 items-center justify-center text-[#292d32] opacity-35"
                aria-hidden
              >
                <svg
                  className="size-3.5 rotate-90"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <button
                type="button"
                onClick={() => onFile(null)}
                className="relative flex size-[34px] shrink-0 items-center justify-center rounded-full border-2 border-[#456cf6] bg-[rgba(0,0,0,0.55)] text-white shadow-sm transition hover:opacity-90"
                aria-label={t("slipUploadRemove")}
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14ZM10 11v6M14 11v6" />
                </svg>
              </button>
              <span
                className="flex size-[14px] shrink-0 items-center justify-center text-[#292d32] opacity-35"
                aria-hidden
              >
                <svg
                  className="size-3.5 -rotate-90"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="m6 9 6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </>
        ) : showNonImageFile ? (
          <div className="flex w-full flex-col items-center gap-3 py-2">
            <p className="max-w-full truncate px-2 text-center text-[15px] leading-[22px] text-[#0b0b0b]">
              {file!.name}
            </p>
            <button
              type="button"
              onClick={() => onFile(null)}
              className="text-[15px] font-normal text-[#4e73f8] underline decoration-solid underline-offset-2 transition hover:opacity-80"
            >
              {t("slipUploadRemove")}
            </button>
          </div>
        ) : (
          <>
            <svg
              className="size-[34px] shrink-0"
              width={35}
              height={35}
              viewBox="0 0 35 35"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <g clipPath={`url(#${uploadIconClipId})`}>
                <path
                  d="M27.2618 2.54407H11.5547V9.05768H30.6165V5.8974C30.6165 4.04819 29.1115 2.54407 27.2618 2.54407Z"
                  fill="#E7ECFC"
                />
                <path
                  d="M18.3711 10.0601H0V4.01612C0 1.80146 1.80218 6.10352e-05 4.01762 6.10352e-05H9.8915C10.4753 6.10352e-05 11.0378 0.123097 11.5487 0.354281C12.2624 0.675847 12.8755 1.20587 13.3054 1.89837L18.3711 10.0601Z"
                  fill="#001742"
                />
                <path
                  d="M34.2391 11.4132V30.8817C34.2391 32.7333 32.7319 34.2392 30.8795 34.2392H3.3596C1.50726 34.2392 0 32.7333 0 30.8817V8.05493H30.8795C32.7319 8.05493 34.2391 9.56141 34.2391 11.4132Z"
                  fill="#001742"
                />
                <path
                  d="M34.2387 11.4132V30.8817C34.2387 32.7333 32.7314 34.2392 30.8791 34.2392H17.1191V8.05493H30.8791C32.7314 8.05493 34.2387 9.56141 34.2387 11.4132Z"
                  fill="#001742"
                />
                <path
                  d="M26.1262 21.1466C26.1262 26.1133 22.0859 30.1539 17.1198 30.1539C12.1536 30.1539 8.11328 26.1133 8.11328 21.1466C8.11328 16.1808 12.1536 12.1402 17.1198 12.1402C22.0859 12.1402 26.1262 16.1808 26.1262 21.1466Z"
                  fill="#E7ECFC"
                />
                <path
                  d="M26.1256 21.1466C26.1256 26.1133 22.0853 30.1539 17.1191 30.1539V12.1402C22.0853 12.1402 26.1256 16.1808 26.1256 21.1466Z"
                  fill="#E7ECFC"
                />
                <path
                  d="M20.0218 21.2571C19.834 21.4162 19.6039 21.4938 19.3758 21.4938C19.0903 21.4938 18.8066 21.3728 18.6081 21.1372L18.1219 20.5609V24.3338C18.1219 24.8876 17.6726 25.3369 17.1188 25.3369C16.565 25.3369 16.1157 24.8876 16.1157 24.3338V20.5609L15.6296 21.1372C15.2717 21.5607 14.6393 21.6147 14.2159 21.2571C13.7927 20.9 13.7383 20.2673 14.0954 19.8439L16.081 17.49C16.3399 17.1838 16.7176 17.0078 17.1188 17.0078C17.5201 17.0078 17.8978 17.1838 18.1567 17.49L20.1422 19.8439C20.4993 20.2673 20.445 20.9 20.0218 21.2571Z"
                  fill="#001742"
                />
                <path
                  d="M20.0221 21.2571C19.8343 21.4162 19.6042 21.4938 19.3761 21.4938C19.0906 21.4938 18.8069 21.3728 18.6084 21.1372L18.1222 20.5609V24.3338C18.1222 24.8876 17.6729 25.3369 17.1191 25.3369V17.0078C17.5204 17.0078 17.8981 17.1838 18.157 17.49L20.1425 19.8439C20.4996 20.2673 20.4453 20.9 20.0221 21.2571Z"
                  fill="#001742"
                />
              </g>
              <defs>
                <clipPath id={uploadIconClipId}>
                  <rect width="34.2391" height="34.2391" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <p className="text-center text-[15px] leading-[22px] text-[#0b0b0b]">
              {t("slipUploadDragHint")}
            </p>
            <div className="flex w-full max-w-[164px] items-center gap-2 text-[11px] leading-[12px] text-[#6d6d6d]">
              <span className="h-px min-w-0 flex-1 bg-[#e7e7e7]" />
              {t("slipUploadOr")}
              <span className="h-px min-w-0 flex-1 bg-[#e7e7e7]" />
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-lg border border-[#4e73f8] bg-white px-11 py-3 text-center text-[15px] font-normal leading-normal text-[#4e73f8] transition hover:bg-[#f4f7ff]"
      >
        {t("slipUploadButton")}
      </button>
    </div>
  );
}
