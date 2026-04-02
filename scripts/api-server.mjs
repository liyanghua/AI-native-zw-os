import { DEFAULT_API_PORT, DEFAULT_DB_PATH } from "../server/config.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";

await initLocalSandboxDatabase({ dbPath: DEFAULT_DB_PATH });
const serverHandle = await startLocalSandboxApiServer({
  dbPath: DEFAULT_DB_PATH,
  port: DEFAULT_API_PORT,
});

console.log(`Local sandbox API listening on ${serverHandle.baseUrl}`);

const shutdown = async () => {
  await serverHandle.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
