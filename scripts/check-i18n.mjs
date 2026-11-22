import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../messages/", import.meta.url);

function catalogs(locale) {
  const directory = new URL(locale + "/", root);
  return new Map(
    readdirSync(directory, { recursive: true })
      .filter((path) => path.endsWith(".json"))
      .map((path) => {
        const key = path.replaceAll("\\", "/");
        const messages = JSON.parse(readFileSync(new URL(key, directory), "utf8"));
        return [key, messages];
      }),
  );
}

function placeholders(text) {
  return [...text.matchAll(/\{([a-zA-Z]\w*)\}/g)].map((match) => match[1]).sort().join(",");
}

const de = catalogs("de");
const it = catalogs("it");
const errors = [];
let count = 0;

for (const path of new Set([...de.keys(), ...it.keys()])) {
  const german = de.get(path);
  const italian = it.get(path);
  if (!german || !italian) {
    errors.push(path + ": missing in " + (!german ? "de" : "it"));
    continue;
  }
  for (const key of new Set([...Object.keys(german), ...Object.keys(italian)])) {
    const context = join(path, key);
    for (const [locale, value] of [["de", german[key]], ["it", italian[key]]]) {
      if (typeof value !== "string" || !value.trim()) {
        errors.push(context + ": missing, empty or invalid in " + locale);
      }
    }
    if (typeof german[key] === "string" && typeof italian[key] === "string" &&
      placeholders(german[key]) !== placeholders(italian[key])) {
      errors.push(context + ": mismatched placeholders");
    }
    count++;
  }
}

if (errors.length || !count) {
  console.error(errors.join("\n") || "Catalogs are empty");
  process.exitCode = 1;
} else {
  console.log(count + " matching messages across " + de.size + " catalogs");
}
