import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { manifestSchemaV2, SCHEMA_URL } from "../../src/manifest/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_PATH = path.resolve(__dirname, "../../schema/lumen.config.v2.json");

test("schema drift: committed JSON Schema matches Zod source (#4)", async () => {
  const raw = await readFile(SCHEMA_PATH, "utf8");
  const committed = JSON.parse(raw);

  const generated = z.toJSONSchema(manifestSchemaV2, {
    target: "draft-2020-12",
    io: "input",
  });
  generated.$schema = "https://json-schema.org/draft/2020-12/schema";
  generated.$id = SCHEMA_URL;
  generated.title = "Lumen manifest v2";
  generated.description =
    "Schema for lumen.config.json v2 — emitted by create-lumen, consumed by lumen-cli. See docs/manifest-v2.md";

  // deterministic ordering helper mirrors scripts/generate-schema.mjs
  const order = (obj) => {
    const ordered = {};
    const keyOrder = ["$schema", "$id", "title", "description", "type", "properties", "required", "additionalProperties", "definitions", "$defs"];
    for (const k of keyOrder) if (k in obj) ordered[k] = obj[k];
    for (const k of Object.keys(obj)) if (!(k in ordered)) ordered[k] = obj[k];
    return ordered;
  };

  const committedOrdered = order(committed);
  const generatedOrdered = order(generated);

  assert.deepStrictEqual(
    committedOrdered,
    generatedOrdered,
    "Drift detected: schema/lumen.config.v2.json is out of sync with src/manifest/schema.js. Run: npm run gen:schema"
  );

  // sanity: every field of manifest v2 is covered
  assert.ok(committed.properties.framework, "framework missing in JSON Schema");
  assert.ok(committed.properties.paths, "paths missing");
  assert.ok(committed.properties.tooling, "tooling missing");
  assert.equal(committed.$id, SCHEMA_URL);
});
