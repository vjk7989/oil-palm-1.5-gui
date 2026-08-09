import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const required = [
  "Andhra Pradesh",
  "System Administrator",
  "CEO / General Manager",
  "Plantation Head",
  "Area Manager",
  "Field Staff",
  "Map",
  "Table",
  "Tree layout - 8 x 8 acre grid",
  "Black means no tree",
  "New Farm Preview",
  "Preview only - not saved yet",
  "Godrej Agrovet",
  "around 65,000",
  "more than 75,000",
  "No NDVI, NDRE, diagnosis, or confidence is derived from the supplied images"
];

for (const token of required) {
  if (!html.includes(token)) {
    throw new Error(`Missing expected UI contract: ${token}`);
  }
}

for (const forbidden of ["Telangana", "Khammam", "Bhadradri"]) {
  if (html.includes(forbidden)) {
    throw new Error(`Found out-of-scope geography: ${forbidden}`);
  }
}

console.log("Static UI contract passed.");
