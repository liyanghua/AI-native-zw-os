import { DEFAULT_DB_PATH } from "../server/config.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";

const result = await seedLocalSandboxDatabase({ dbPath: DEFAULT_DB_PATH });
console.log(`Seeded ${result.projectCount} local sandbox projects into ${DEFAULT_DB_PATH}`);
