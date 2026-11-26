"use client";

import { ErrorState } from "@/components/ui/error-state";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState
        title="This view hit a snag"
        description="Your data is safe. Try rendering this screen again."
        onRetry={reset}
      />
    </div>
  );
}
