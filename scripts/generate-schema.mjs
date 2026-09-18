#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { manifestSchemaV2, SCHEMA_URL } from "../src/manifest/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_PATH = path.resolve(__dirname, "../schema/lumen.config.v2.json");

// zod v4 native JSON Schema generator - drift-free, no external lib needed
const jsonSchema = z.toJSONSchema(manifestSchemaV2, {
  target: "draft-2020-12",
  io: "input",
});

// Ensure top-level metadata is stable and required by #4
jsonSchema.$schema = "https://json-schema.org/draft/2020-12/schema";
jsonSchema.$id = SCHEMA_URL;
jsonSchema.title = "Lumen manifest v2";
jsonSchema.description =
  "Schema for lumen.config.json v2 - emitted by create-lumen, consumed by lumen-cli. See docs/manifest-v2.md";

// Ensure deterministic key ordering at top-level
const ordered = {};
const keyOrder = ["$schema", "$id", "title", "description", "type", "properties", "required", "additionalProperties", "definitions", "$defs"];
for (const k of keyOrder) {
  if (k in jsonSchema) ordered[k] = jsonSchema[k];
}
// copy any remaining keys not in keyOrder
for (const k of Object.keys(jsonSchema)) {
  if (!(k in ordered)) ordered[k] = jsonSchema[k];
}

await mkdir(path.dirname(OUT_PATH), { recursive: true });
await writeFile(OUT_PATH, JSON.stringify(ordered, null, 2) + "\n", "utf8");
console.log(`Generated ${path.relative(process.cwd(), OUT_PATH)}`);
