export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const focusRingStrong =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const focusRingSoft =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

export const focusRingOnDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E1326]";

export const surfaceCard = "rounded-2xl border border-border bg-white/90 shadow-sm";
export const surfaceSoft = "rounded-2xl border border-border bg-surface/80";

export const cx = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");
