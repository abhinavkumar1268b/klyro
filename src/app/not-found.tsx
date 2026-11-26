import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        icon={ArrowLeft}
        title="Page not found"
        description="This page doesn’t exist in KLYRO. Head back to your overview."
        action={
          <Button asChild size="sm">
            <Link href="/">Back to overview</Link>
          </Button>
        }
      />
    </div>
  );
}
