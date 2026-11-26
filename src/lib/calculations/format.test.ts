import { beforeEach, describe, expect, it } from "vitest";
import { formatCurrency } from "./format";
import { useSettingsStore } from "@/stores/settings-store";

describe("currency preferences", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      currency: "INR",
      country: "IN",
      showCents: false,
    });
  });

  it("formats whole amounts by default", () => {
    expect(formatCurrency(120000)).toBe("₹1,200");
  });

  it("shows cents when the preference is enabled", () => {
    useSettingsStore.setState({ showCents: true });
    expect(formatCurrency(120000)).toBe("₹1,200.00");
  });

  it("uses the country locale and selected currency", () => {
    useSettingsStore.setState({ country: "US", currency: "USD" });
    expect(formatCurrency(120000)).toBe("$1,200");
  });
});
