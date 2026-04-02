import assert from "node:assert/strict";
import { createSeedSources } from "../src/data-access/pilotSources";
import { mapOpportunitySignalSourceRefs } from "../src/data-access/source-adapters/opportunitySignalAdapter";
import { mapProductDefinitionSourceRefs } from "../src/data-access/source-adapters/productDefinitionAdapter";
import { mapKpiSnapshotSourceRefs } from "../src/data-access/source-adapters/kpiSnapshotAdapter";
import { mapExecutionEventSourceRefs } from "../src/data-access/source-adapters/executionEventAdapter";
import { mapReviewAssetSourceRefs } from "../src/data-access/source-adapters/reviewAssetAdapter";

export default async function run() {
  const rawState = createSeedSources();

  assert.ok(
    mapOpportunitySignalSourceRefs(rawState, "OPP_URBAN_LITE").length > 0,
    "expected opportunity adapter to map signal source refs",
  );
  assert.ok(
    mapProductDefinitionSourceRefs(rawState, "INC_OFFICE_ELITE").length > 0,
    "expected definition adapter to map definition source refs",
  );
  assert.ok(
    mapKpiSnapshotSourceRefs(rawState, "LAUNCH_SUMMER_REFRESH").length > 0,
    "expected KPI adapter to map performance source refs",
  );
  assert.ok(
    mapExecutionEventSourceRefs(rawState, "LAUNCH_SUMMER_REFRESH").length > 0,
    "expected execution adapter to map action source refs",
  );
  assert.ok(
    mapReviewAssetSourceRefs(rawState, "REVIEW_BUSINESS_ELITE").length > 0,
    "expected review adapter to map review and asset source refs",
  );
}
