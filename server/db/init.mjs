import { openDatabase } from "./client.mjs";
import { BATCH1_TABLES, SCHEMA_SQL } from "./schema.mjs";

export async function initLocalSandboxDatabase({ dbPath } = {}) {
  const db = openDatabase(dbPath);
  try {
    db.exec(SCHEMA_SQL);
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    return {
      dbPath: dbPath ?? null,
      tables: BATCH1_TABLES.filter((tableName) => tables.includes(tableName)),
    };
  } finally {
    db.close();
  }
}
