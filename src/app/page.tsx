import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard";

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return <DashboardView />;
}
