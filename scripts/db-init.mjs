import { DEFAULT_DB_PATH } from "../server/config.mjs";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";

const result = await initLocalSandboxDatabase({ dbPath: DEFAULT_DB_PATH });
console.log(`Initialized local sandbox DB at ${DEFAULT_DB_PATH}`);
console.log(`Tables: ${result.tables.join(", ")}`);
