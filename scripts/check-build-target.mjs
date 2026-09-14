import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const platform = process.argv[2];
assert.ok(["sites", "vercel"].includes(platform), "Choose sites or vercel.");
function javascript(directory) {
  return readdirSync(directory, { withFileTypes: true }).map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? javascript(path) : entry.name.endsWith(".js") ? readFileSync(path, "utf8") : "";
  }).join("\n");
}
const server = javascript(platform === "sites" ? "dist/server" : ".next/server");
const client = javascript(platform === "sites" ? "dist/client" : ".next/static");
const usesBlob = server.includes("echo-habitat/world.json");
const trustsSiteIdentity = server.includes("oai-authenticated-user-email");
assert.equal(usesBlob, platform === "vercel", "Wrong storage adapter in the production bundle.");
assert.equal(trustsSiteIdentity, platform === "sites", "Wrong identity adapter in the production bundle.");
if (platform === "sites") assert.ok(server.includes("SELECT state, revision FROM habitats WHERE id"), "The existing D1 save must remain in use.");
for (const key of ["HABITAT_OWNER_KEY", "HABITAT_OWNER_EMAIL", "CRON_SECRET", "BLOB_READ_WRITE_TOKEN"]) assert.ok(!client.includes(key), "Server credentials must not enter the client bundle.");
console.log(platform + ": storage, identity and client-secret boundaries verified.");
