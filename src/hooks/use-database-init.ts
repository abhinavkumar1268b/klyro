"use client";

import { useEffect, useState } from "react";
import { initializeDatabase } from "@/lib/db";

export type DatabaseStatus = "loading" | "ready" | "error";

/** Runs idempotent first-run seeding once on the client. */
export function useDatabaseInit(): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>("loading");

  useEffect(() => {
    let active = true;
    initializeDatabase()
      .then(() => active && setStatus("ready"))
      .catch((error) => {
        console.error("KLYRO could not initialise local storage", error);
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  return status;
}
