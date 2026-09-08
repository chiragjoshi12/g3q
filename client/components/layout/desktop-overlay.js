/**
 * Phone sheets stay bottom-docked. From `lg` up they become a centered card
 * so they never stretch across the wide desktop canvas.
 */
export const DESKTOP_OVERLAY =
  "absolute inset-0 z-[60] flex items-end justify-center lg:items-center";

export const DESKTOP_OVERLAY_CARD =
  "lg:mx-0 lg:mb-0 lg:w-[min(26rem,90vw)] lg:max-h-[min(36rem,82dvh)] lg:rounded-[1.75rem] lg:shadow-[0_24px_64px_rgb(15_23_42/0.18)]";
