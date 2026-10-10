"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function UxPlannerError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <main className="mx-auto grid w-full max-w-2xl gap-5 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">This planning file could not be read.</h1>
      <p className="text-ux-muted leading-7">
        Check the planning file in <code>docs/ux</code>, then retry.
      </p>
      <div><Button onClick={reset}>Retry</Button></div>
    </main>
  );
}
