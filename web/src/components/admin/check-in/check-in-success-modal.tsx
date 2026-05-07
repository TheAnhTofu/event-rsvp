"use client";

type Props = {
  modeLabel: string;
  onClose: () => void;
};

export function CheckInSuccessModal({ modeLabel, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white px-8 py-12 shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-5">
          {/* Green checkmark circle */}
          <div className="flex size-[72px] items-center justify-center rounded-full border-[3px] border-[#22c55e]">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden
            >
              <path
                d="M10 18l6 6 10-12"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-center text-[20px] font-bold text-gray-900">
            CPD {modeLabel === "Check-In" ? "Check-in" : "Check-out"} successful
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 rounded-xl border border-gray-300 bg-white px-8 py-2.5 text-[14px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back to Page
          </button>
        </div>
      </div>
    </div>
  );
}
