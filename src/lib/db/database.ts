import { KlyroDatabase } from "./schema";

/** Single Dexie instance shared by services, hooks and the dev console. */
export const db = new KlyroDatabase();
