"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Project-wide Toaster wrapper. Mount once in the root layout.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        className: "rounded-xl",
      }}
    />
  );
}

export { toast };
