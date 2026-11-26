import { Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function InsightStatements({ statements }: { statements: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-4 text-primary" aria-hidden="true" />
          What the numbers say
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Statements generated only from your recorded data.
        </p>
      </CardHeader>

      <div className="px-5 pb-5">
        {statements.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            Add a few transactions to generate insights. Comparisons appear once there is data for a
            previous period.
          </p>
        ) : (
          <div className="space-y-2.5">
            {statements.map((statement) => (
              <div
                key={statement}
                className="flex gap-3 rounded-lg border border-border bg-elevated/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {statement}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
