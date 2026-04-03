import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { initLocalSandboxDatabase } from "../server/db/init.mjs";
import { seedLocalSandboxDatabase } from "../server/db/seed.mjs";
import { startLocalSandboxApiServer } from "../server/api/server.mjs";

export default async function run() {
  const dir = await mkdtemp(join(tmpdir(), "pilot-sandbox-ontology-bridge-api-"));
  const dbPath = join(dir, "sandbox.sqlite");

  try {
    await initLocalSandboxDatabase({ dbPath });
    await seedLocalSandboxDatabase({ dbPath });
    const serverHandle = await startLocalSandboxApiServer({ dbPath, port: 0 });

    try {
      const registryResponse = await fetch(
        `${serverHandle.baseUrl}/api/ontology/registry?itemType=role_profile&status=active`,
      );
      assert.equal(registryResponse.status, 200);
      const registryJson = await registryResponse.json();
      assert.ok(Array.isArray(registryJson.items), "expected ontology registry list");
      assert.ok(
        registryJson.items.some((item) => item.registryId === "ontology-role-profile-boss"),
        "expected boss role profile registry item",
      );

      const detailResponse = await fetch(
        `${serverHandle.baseUrl}/api/ontology/registry/ontology-role-profile-boss`,
      );
      assert.equal(detailResponse.status, 200);
      const detailJson = await detailResponse.json();
      assert.equal(detailJson.item.registryId, "ontology-role-profile-boss");
      assert.ok(Array.isArray(detailJson.versions), "expected ontology versions");

      const deprecateResponse = await fetch(`${serverHandle.baseUrl}/api/ontology/deprecate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          registryId: "ontology-template-launch-creative",
          operator: "批次6测试",
          reason: "Temporarily deprecate launch creative template.",
        }),
      });
      assert.equal(deprecateResponse.status, 200);
      const deprecateJson = await deprecateResponse.json();
      assert.equal(deprecateJson.item.status, "deprecated");

      const activateResponse = await fetch(`${serverHandle.baseUrl}/api/ontology/activate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          registryId: "ontology-template-launch-creative",
          operator: "批次6测试",
          reason: "Restore template to active state.",
        }),
      });
      assert.equal(activateResponse.status, 200);
      const activateJson = await activateResponse.json();
      assert.equal(activateJson.item.status, "active");

      const adaptersResponse = await fetch(`${serverHandle.baseUrl}/api/bridge/adapters`);
      assert.equal(adaptersResponse.status, 200);
      const adaptersJson = await adaptersResponse.json();
      assert.ok(Array.isArray(adaptersJson.adapters), "expected bridge adapters");
      assert.ok(
        adaptersJson.adapters.some((adapter) => adapter.adapterId === "adapter-file-bridge"),
        "expected file bridge adapter",
      );

      const syncResponse = await fetch(`${serverHandle.baseUrl}/api/bridge/sync`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          adapterId: "adapter-file-bridge",
        }),
      });
      assert.equal(syncResponse.status, 200);
      const syncJson = await syncResponse.json();
      assert.equal(syncJson.adapter.adapterId, "adapter-file-bridge");
      assert.ok(syncJson.syncRecord.rowsImported >= 1, "expected imported rows");

      const syncRecordsResponse = await fetch(
        `${serverHandle.baseUrl}/api/bridge/sync-records?adapterId=adapter-file-bridge`,
      );
      assert.equal(syncRecordsResponse.status, 200);
      const syncRecordsJson = await syncRecordsResponse.json();
      assert.ok(Array.isArray(syncRecordsJson.records), "expected sync records");
      assert.ok(
        syncRecordsJson.records.some((record) => record.syncId === syncJson.syncRecord.syncId),
        "expected newly created sync record",
      );
    } finally {
      await serverHandle.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
