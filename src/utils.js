import fs from "fs";
import path from "path";
import { CONFIG } from './config.js';

/**
 * Build full path for JSON file with security checks
 * @param {string[]} parts - Path parts to join
 * @returns {string} - Resolved file path
 */
export function jsonPath(parts, appName) {
  const safeParts = parts.map(p => p.replace(/[^a-zA-Z0-9_-]/g, ""));
  const filePath = path.join(CONFIG.DATA_DIR, appName, ...safeParts) + ".json";
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(path.resolve(CONFIG.DATA_DIR))) {
    throw new Error("Invalid path");
  }
  return resolved;
}

/**
 * Ensure data directory exists
 */
export function ensureDataDir() {
  if (!fs.existsSync(CONFIG.DATA_DIR)) {
    fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Read JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object} - Parsed JSON data
 */
export function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * Write JSON file
 * @param {string} filePath - Path to write to
 * @param {Object} data - Data to write
 */
export function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Delete file
 * @param {string} filePath - Path to delete
 */
export function deleteFile(filePath) {
  fs.unlinkSync(filePath);
}

/**
 * Returns the id path (used in the clients and routes) of file from the file path
 * @param {string} filePath - full path of the file
 */
export function pathIdentifier(filePath, appName) {
  const cwdData = path.join(process.cwd(), CONFIG.DATA_DIR, appName);
  const relativePath = path.relative(cwdData, filePath);
  return '/' + relativePath.replace(/\.json$/, "");
}

/**
 * Pretty prints as bullets objects
 * @param {any} object - Object to be printed
 */
export function prettyPrint(object) {
  let output = [];
  for (const [attribute, value] of Object.entries(object)) {
    output.push(`\t- ${attribute}: ${JSON.stringify(value)}`);
  }
  return (output.length > 0 ? '\n' : '') + output.join('\n');
}

/**
 * Stringify a json data in a one liner with limit number of characters
 * @param {any} object - Object to be printed
 */
export function shortify(object, len = 100) {
  const str = JSON.stringify(object);
  return str.length < len ? str : str.substring(len) + "...";
}
