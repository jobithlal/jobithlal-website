"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="container-x flex min-h-[70svh] flex-col justify-center pt-32" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display-lg mt-6">This section didn&apos;t load.</h1>
      <p className="lead mt-6 max-w-lg">Please try again. If the problem continues, email jobithlal@gmail.com.</p>
      <div className="mt-10">
        <Button onClick={reset}>Try again</Button>
      </div>
    </section>
  );
}
