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

const locales = ["de", "it", "en"];
const translations = locales.map((locale) => catalogs(locale));
const errors = [];
let count = 0;

const paths = new Set(translations.flatMap((catalog) => [...catalog.keys()]));
for (const path of paths) {
  const messages = translations.map((catalog) => catalog.get(path));
  for (const [index, catalog] of messages.entries()) {
    if (!catalog) errors.push(path + ": missing in " + locales[index]);
  }
  for (const key of new Set(messages.flatMap((catalog) => Object.keys(catalog ?? {})))) {
    const context = join(path, key);
    const values = messages.map((catalog) => catalog?.[key]);
    for (const [index, value] of values.entries()) {
      if (typeof value !== "string" || !value.trim()) {
        errors.push(context + ": missing, empty or invalid in " + locales[index]);
      }
    }
    if (new Set(values.filter((value) => typeof value === "string").map(placeholders)).size > 1) {
      errors.push(context + ": mismatched placeholders");
    }
    count++;
  }
}

if (errors.length || !count) {
  console.error(errors.join("\n") || "Catalogs are empty");
  process.exitCode = 1;
} else {
  console.log(count + " matching messages across " + paths.size + " catalogs in " + locales.join(", "));
}
