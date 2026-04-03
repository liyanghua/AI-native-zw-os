import { openDatabase } from "./client.mjs";
import { LOCAL_SANDBOX_TABLES, SCHEMA_SQL } from "./schema.mjs";

const COLUMN_MIGRATIONS = {
  actions: {
    decision_id: "TEXT",
    role: "TEXT",
    action_domain: "TEXT",
    expected_direction: "TEXT",
    confidence: "TEXT",
  },
  reviews: {
    source_action_id: "TEXT",
    source_run_id: "TEXT",
    review_status: "TEXT",
    review_type: "TEXT",
    review_quality_score: "REAL",
    is_promoted_to_asset: "INTEGER",
    updated_at: "TEXT",
  },
  asset_candidates: {
    source_review_id: "TEXT",
    asset_type: "TEXT",
    review_status: "TEXT",
    publish_status: "TEXT",
    reusability_score: "REAL",
    feedback_to_knowledge: "TEXT",
    updated_at: "TEXT",
  },
};

function ensureColumn(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

export async function initLocalSandboxDatabase({ dbPath } = {}) {
  const db = openDatabase(dbPath);
  try {
    db.exec(SCHEMA_SQL);
    Object.entries(COLUMN_MIGRATIONS).forEach(([tableName, columns]) => {
      Object.entries(columns).forEach(([columnName, definition]) => {
        ensureColumn(db, tableName, columnName, definition);
      });
    });
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    return {
      dbPath: dbPath ?? null,
      tables: LOCAL_SANDBOX_TABLES.filter((tableName) => tables.includes(tableName)),
    };
  } finally {
    db.close();
  }
}
