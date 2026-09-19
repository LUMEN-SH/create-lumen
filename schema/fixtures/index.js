import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FIXTURES_DIR = __dirname;
export const VALID_FIXTURES_DIR = path.join(__dirname, "v2", "valid");
export const INVALID_FIXTURES_DIR = path.join(__dirname, "v2", "invalid");

/**
 * Loads all valid manifest fixtures as an array of { name, filename, manifest }.
 * @returns {Promise<Array<{ name: string, filename: string, manifest: object }>>}
 */
export async function loadValidFixtures() {
  const files = (await readdir(VALID_FIXTURES_DIR)).filter((f) => f.endsWith(".json"));
  const fixtures = [];
  for (const filename of files) {
    const filePath = path.join(VALID_FIXTURES_DIR, filename);
    const content = await readFile(filePath, "utf8");
    fixtures.push({
      name: path.basename(filename, ".json"),
      filename,
      manifest: JSON.parse(content),
    });
  }
  return fixtures;
}

/**
 * Loads all invalid manifest fixtures as an array of { name, filename, manifest }.
 * @returns {Promise<Array<{ name: string, filename: string, manifest: object }>>}
 */
export async function loadInvalidFixtures() {
  const files = (await readdir(INVALID_FIXTURES_DIR)).filter((f) => f.endsWith(".json"));
  const fixtures = [];
  for (const filename of files) {
    const filePath = path.join(INVALID_FIXTURES_DIR, filename);
    const content = await readFile(filePath, "utf8");
    fixtures.push({
      name: path.basename(filename, ".json"),
      filename,
      manifest: JSON.parse(content),
    });
  }
  return fixtures;
}

/**
 * Loads a single fixture by category ('valid' | 'invalid') and fixture name.
 * @param {'valid' | 'invalid'} category
 * @param {string} name
 * @returns {Promise<object>}
 */
export async function getFixture(category, name) {
  const dir = category === "valid" ? VALID_FIXTURES_DIR : INVALID_FIXTURES_DIR;
  const filename = name.endsWith(".json") ? name : `${name}.json`;
  const filePath = path.join(dir, filename);
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}
