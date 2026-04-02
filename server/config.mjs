import { resolve } from "node:path";

export const DEFAULT_DB_PATH = resolve(process.cwd(), "data", "pilot-sandbox.sqlite");
export const DEFAULT_API_PORT = Number(process.env.PILOT_SANDBOX_API_PORT ?? 4318);
