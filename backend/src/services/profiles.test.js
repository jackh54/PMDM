import test from "node:test";
import assert from "node:assert/strict";
import { buildMobileConfig } from "./profiles.js";

test("buildMobileConfig creates plist bytes", () => {
  const buffer = buildMobileConfig({
    name: "Restrictions",
    profileType: "restrictions",
    values: { disableAirDrop: true },
    minOsVersion: "10.13"
  });

  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.toString("utf8").includes("PayloadType"));
});
