"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChartNoAxesCombined,
  Database,
  Sparkles,
  Target,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/constants";
import { useDataStore, useHydrated, useSettingsStore, type CurrencyCode } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";

const FEATURES = [
  { icon: ChartNoAxesCombined, title: "See the whole picture", text: "Spending, income and trends in one calm view." },
  { icon: Target, title: "Save on purpose", text: "Goals and budgets that stay out of your way." },
  { icon: Database, title: "Yours alone", text: "Everything is stored locally in this browser." },
];

export function Onboarding() {
  const hydrated = useHydrated();
  const onboardingComplete = useDataStore((state) => state.onboardingComplete);
  const completeOnboarding = useDataStore((state) => state.completeOnboarding);
  const setDisplayName = useSettingsStore((state) => state.setDisplayName);
  const setCurrency = useSettingsStore((state) => state.setCurrency);

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [name, setName] = useState("Aarav");
  const [currency, setCurrencyLocal] = useState<CurrencyCode>("INR");

  if (!hydrated || onboardingComplete) return null;

  function finish() {
    setDisplayName(name);
    setCurrency(currency);
    completeOnboarding(mode);
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-6 sm:py-10">
        <div className="flex items-center justify-between">
          <Brand />
          <button
            type="button"
            onClick={finish}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        </div>

        <div className="mb-8 mt-10 flex gap-1.5" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                index <= step ? "bg-primary" : "bg-elevated",
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            {step === 0 ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                  Welcome to {APP_NAME}
                </p>
                <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground sm:text-[42px]">
                  {APP_TAGLINE}
                </h2>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  A quieter way to understand your money. Built for students and young earners who
                  want clarity, not noise.
                </p>

                <div className="mt-10 space-y-3">
                  {FEATURES.map((feature) => (
                    <div
                      key={feature.title}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                        <feature.icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{feature.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{feature.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                  Choose your starting point
                </p>
                <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[38px]">
                  How would you like to begin?
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  You can switch between these any time in Settings.
                </p>

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={() => setMode("demo")}
                    className={cn(
                      "flex w-full gap-4 rounded-xl border p-4 text-left transition-colors",
                      mode === "demo"
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:bg-elevated",
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        Explore with sample data
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        Realistic examples to see every screen. Nothing is saved to your journal.
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("live")}
                    className={cn(
                      "flex w-full gap-4 rounded-xl border p-4 text-left transition-colors",
                      mode === "live"
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:bg-elevated",
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-elevated text-muted-foreground">
                      <Database className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        Start with an empty journal
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                        Private local storage from the first entry. No samples, no clutter.
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                  Almost there
                </p>
                <h2 className="mt-3 text-[32px] font-semibold leading-tight tracking-tight text-foreground sm:text-[38px]">
                  Make it yours.
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Just two details. Both can be changed later in Settings.
                </p>

                <div className="mt-8 space-y-5 rounded-xl border border-border bg-card p-5">
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-name">What should we call you?</Label>
                    <Input
                      id="onboarding-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      maxLength={32}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-currency">Currency</Label>
                    <Select
                      id="onboarding-currency"
                      value={currency}
                      onChange={(event) => setCurrencyLocal(event.target.value as CurrencyCode)}
                    >
                      <option value="INR">INR — Indian Rupee</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                    </Select>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? finish() : setStep(step - 1))}
          >
            {step === 0 ? "Skip" : <><ArrowLeft className="size-4" aria-hidden="true" /> Back</>}
          </Button>
          <Button onClick={() => (step === 2 ? finish() : setStep(step + 1))}>
            {step === 2 ? "Enter KLYRO" : "Continue"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
