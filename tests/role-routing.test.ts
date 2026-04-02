import assert from "node:assert/strict";
import { getPageTitle, roles } from "../src/app/navigation";
import { roleRouteManifest } from "../src/app/routeManifest";

export default async function run() {
  const productRole = roles.find((role) => role.id === "product");
  assert.ok(productRole, "expected product role switcher entry");
  assert.equal(productRole.path, "/product-rnd-director");

  assert.equal(getPageTitle("/product-rnd-director"), "产品研发总监工作台");

  assert.equal(roleRouteManifest.canonical.product_rnd_director, "/product-rnd-director");
  assert.equal(roleRouteManifest.aliases["/product-director"], "/product-rnd-director");
}
