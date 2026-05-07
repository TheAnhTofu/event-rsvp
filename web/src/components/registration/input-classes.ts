const inputVisual =
  "w-full rounded-lg border border-border-subtle bg-surface py-3 text-[16px] text-ink leading-6 outline-none transition-shadow placeholder:text-text-muted shadow-[inset_0_1px_2px_rgba(62,69,239,0.08)] focus:border-blue-solid focus:ring-2 focus:ring-blue-solid/20";

export const inputClassName = `${inputVisual} px-4`;

/** `<select>` with consistent down-arrow icon across browsers. */
export const selectClassName = `${inputVisual} appearance-none bg-[url('/icons/chevron-down.svg')] bg-[length:18px_18px] bg-[right_1rem_center] bg-no-repeat pl-4 pr-14`;
