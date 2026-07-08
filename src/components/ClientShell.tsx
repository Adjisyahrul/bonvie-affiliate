"use client";

import { useEffect, useState } from "react";

/**
 * Prevents hydration mismatch errors caused by browser extensions
 * (e.g. Honey, Shopee Assistant) that inject attributes like
 * `bis_skin_checked` into the DOM before React hydrates.
 *
 * Children render only after client-side mount — this is safe for
 * a fully internal dashboard that doesn't need SSR content.
 */
export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a same-structure placeholder during SSR/hydration
  // so React doesn't complain about mismatches
  if (!mounted) {
    return (
      <div className="flex min-h-screen" aria-hidden="true" suppressHydrationWarning />
    );
  }

  return <>{children}</>;
}
