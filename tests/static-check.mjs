import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function webpDimensions(buffer) {
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "RIFF", "Evidence derivative must use a RIFF container");
  assert.equal(buffer.subarray(8, 12).toString("ascii"), "WEBP", "Evidence derivative must be a valid WebP file");
  const format = buffer.subarray(12, 16).toString("ascii");
  if (format === "VP8X") {
    const width = 1 + buffer[24] + (buffer[25] << 8) + (buffer[26] << 16);
    const height = 1 + buffer[27] + (buffer[28] << 8) + (buffer[29] << 16);
    return [width, height];
  }
  if (format === "VP8 ") {
    assert.equal(buffer.subarray(23, 26).toString("hex"), "9d012a", "Evidence WebP is missing the VP8 frame marker");
    return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
  }
  if (format === "VP8L") {
    assert.equal(buffer[20], 0x2f, "Evidence WebP is missing the VP8L signature");
    return [
      1 + buffer[21] + ((buffer[22] & 0x3f) << 8),
      1 + (buffer[22] >> 6) + (buffer[23] << 2) + ((buffer[24] & 0x0f) << 10),
    ];
  }
  assert.fail(`Evidence derivative uses unsupported WebP encoding ${format}`);
}

function extractDemoModel(source) {
  const start = source.indexOf("const roles =");
  const end = source.indexOf("let state =", start);
  assert.ok(start >= 0 && end > start, "The embedded AP demo model must remain inspectable");
  const modelSource = source.slice(start, end);
  return Function(`${modelSource}\nreturn {
    roles,
    districts,
    alerts: typeof alertRecords !== "undefined"
      ? alertRecords
      : (typeof alerts !== "undefined" ? alerts : undefined),
    cases: typeof caseRecords !== "undefined" ? caseRecords : undefined,
    treatments: typeof treatmentRecords !== "undefined" ? treatmentRecords : undefined,
    managedUsers: typeof managedUsers !== "undefined" ? managedUsers : undefined,
    currentUserByRole: typeof CURRENT_USER_BY_ROLE !== "undefined" ? CURRENT_USER_BY_ROLE : undefined,
    adminScopeOptions: typeof ADMIN_SCOPE_OPTIONS !== "undefined" ? ADMIN_SCOPE_OPTIONS : undefined,
    roleAccessMatrix: typeof ROLE_ACCESS_MATRIX !== "undefined" ? ROLE_ACCESS_MATRIX : undefined,
    activityEvents: typeof activityEvents !== "undefined" ? activityEvents : undefined,
    evidenceTreeId: typeof EVIDENCE_TREE_ID !== "undefined" ? EVIDENCE_TREE_ID : undefined,
    treeEvidenceManifest: typeof TREE_EVIDENCE_MANIFEST !== "undefined" ? TREE_EVIDENCE_MANIFEST : undefined,
    treeObservation: typeof TREE_OBSERVATION !== "undefined" ? TREE_OBSERVATION : undefined,
    ganodermaIndicators: typeof GANODERMA_INDICATORS !== "undefined" ? GANODERMA_INDICATORS : undefined,
    companyProfiles: typeof COMPANY_PROFILES !== "undefined" ? COMPANY_PROFILES : undefined,
    companyAreaRows: typeof COMPANY_AREA_ROWS !== "undefined" ? COMPANY_AREA_ROWS : undefined,
    companyPortfolios: typeof COMPANY_PORTFOLIOS !== "undefined" ? COMPANY_PORTFOLIOS : undefined
  };`)();
}

function extractArrayConstant(source, name) {
  const declaration = source.indexOf(`const ${name} =`);
  assert.ok(declaration >= 0, `Missing inspectable constant: ${name}`);
  const open = source.indexOf("[", declaration);
  assert.ok(open >= 0, `${name} must be an array literal`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "[") depth += 1;
    if (character === "]") {
      depth -= 1;
      if (depth === 0) return Function(`return (${source.slice(open, index + 1)})`)();
    }
  }
  assert.fail(`${name} has an unterminated array literal`);
}

function extractObjectConstant(source, name) {
  const declaration = source.indexOf(`const ${name} =`);
  assert.ok(declaration >= 0, `Missing inspectable constant: ${name}`);
  const open = source.indexOf("{", declaration);
  assert.ok(open >= 0, `${name} must be an object literal`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return Function(`return (${source.slice(open, index + 1)})`)();
    }
  }
  assert.fail(`${name} has an unterminated object literal`);
}

function functionBody(source, name) {
  const declaration = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  assert.ok(declaration, `Missing required function: ${name}`);
  const open = source.indexOf("{", declaration.index);
  assert.ok(open >= 0, `${name} must have a function body`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  assert.fail(`${name} has an unterminated function body`);
}

function flattenFarms(districts) {
  return districts.flatMap((district) =>
    district.mandals.flatMap((mandal) =>
      mandal.villages.flatMap((village) =>
        village.farms.map((farm) => ({
          ...farm,
          district: district.name,
          mandal: mandal.name,
          village: village.name
        }))
      )
    )
  );
}

const required = [
  "Andhra Pradesh",
  "PalmWatch By Buckleson X ESN LABS",
  "Godrej Agrovet Oil Palm",
  "Navabharat Limited / NBL",
  "TGOILFED",
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
  "No NDVI, NDRE, diagnosis, Ganoderma confidence, canopy temperature, or recent trend is derived from the supplied images"
];

for (const token of required) {
  if (!html.includes(token)) {
    throw new Error(`Missing expected UI contract: ${token}`);
  }
}

assert.match(html, /TGOF\|TG\|Bhadradri Kothagudem\|Aswaraopeta/, "TGOILFED workbook rows must include Telangana geography");

// The visual map must be a real slippy map, constrained to Andhra Pradesh,
// with the required OpenStreetMap attribution visible in the integration.
assert.match(html, /leaflet(?:\.css|@|\/)/i, "Leaflet CSS must be loaded");
assert.match(
  html,
  /<link\b[^>]*href=["'][^"']*leaflet@1\.9\.4\/dist\/leaflet\.css["'][^>]*integrity=["']sha256-p4NxAoJBhIIN\+hmNHrzRCf9tD\/miZyoHS5obTRR9BMY=["'][^>]*>/i,
  "Leaflet 1.9.4 CSS must use the verified Subresource Integrity hash"
);
assert.match(html, /leaflet(?:\.js|@|\/)/i, "Leaflet JavaScript must be loaded");
assert.match(html, /L\.map\s*\(/, "The Overview must initialize a Leaflet map");
assert.match(html, /L\.tileLayer\s*\([^)]*openstreetmap/is, "The Leaflet map must use OpenStreetMap tiles");
assert.match(html, /attribution\s*:[^\n]*OpenStreetMap/i, "OpenStreetMap attribution must be configured");
assert.match(html, /(?:AP_BOUNDS|apBounds|ANDHRA_PRADESH_BOUNDS)/, "Named Andhra Pradesh bounds must be defined");
assert.match(html, /(?:fitBounds|maxBounds)\s*[:(]/, "The map viewport must be constrained to Andhra Pradesh bounds");
assert.match(html, /\.main\{[^}]*min-width:0/, "The main application column must not force horizontal overflow");
assert.match(html, /\.content\{[^}]*min-width:0/, "The scrollable content column must not force horizontal overflow");
assert.match(html, /@media\(max-width:620px\)[^@]*\.topbar\{[^}]*flex-wrap:wrap/, "Mobile top bar must wrap controls instead of overflowing");
assert.match(html, /@media\(max-width:620px\)[^@]*\.leaflet-map,\s*\.map-fallback\{[^}]*min-height:420px/, "Mobile map and fallback must keep matching stable heights");
assert.match(html, /@media\(max-width:380px\)/, "Ultra-narrow devices need a dedicated compact breakpoint");
assert.match(html, /@media\(max-width:380px\)[^@]*\.treegrid\{[^}]*gap:3px/, "Ultra-narrow farm grids must tighten without changing 8x8 layout");
assert.match(html, /@media\(max-width:380px\)[^@]*\.tcell\{[^}]*font-size:8px/, "Ultra-narrow tree cells must keep labels inside their cells");

const {
  roles,
  districts,
  alerts,
  cases,
  treatments,
  managedUsers,
  currentUserByRole,
  adminScopeOptions,
  roleAccessMatrix,
  activityEvents,
  evidenceTreeId,
  treeEvidenceManifest,
  treeObservation,
  ganodermaIndicators,
  companyProfiles,
  companyAreaRows,
  companyPortfolios
} = extractDemoModel(html);
const reportDefinitions = extractArrayConstant(html, "reportDefinitions");
const caseActionsByRole = extractObjectConstant(html, "CASE_ACTIONS_BY_ROLE");
const caseTransitions = extractObjectConstant(html, "CASE_TRANSITIONS");
const treatmentTransitions = extractObjectConstant(html, "TREATMENT_TRANSITIONS");
const farms = flattenFarms(districts);

assert.deepEqual(Object.keys(companyProfiles).sort(), ["gavl", "nbl", "tgoilfed"], "Landing must expose the three approved company choices");
for (const [companyId, expected] of Object.entries({ gavl: 20, nbl: 20, tgoilfed: 20 })) {
  assert.equal(companyAreaRows[companyId].length, expected, `${companyId} must carry the 20 workbook-derived rows`);
  const portfolioFarms = flattenFarms(companyPortfolios[companyId].districts);
  assert.equal(portfolioFarms.length, expected, `${companyId} portfolio must produce ${expected} farms`);
  assert.ok(portfolioFarms.every((farm) => farm.companyId === companyId), `${companyId} farms must not leak another company ID`);
}
assert.ok(companyPortfolios.gavl.districts.some((district) => district.mandals.some((mandal) => mandal.name === "Chintalapudi")), "GAVL data must include Chintalapudi");
assert.deepEqual(companyPortfolios.nbl.districts.map((district) => district.name), ["Eluru", "East Godavari"], "NBL data must stay in its workbook districts");
assert.deepEqual(companyPortfolios.tgoilfed.districts.map((district) => district.name), ["Bhadradri Kothagudem", "Khammam"], "TGOILFED data must use the workbook Telangana districts");
assert.match(html, /\.company-card\{[^}]*grid-template-columns:76px 1fr auto/, "Company cards must reserve a separate logo column");
assert.match(html, /\.htr\{[^}]*minmax\(132px,\s*\.95fr\)/, "Table health column must reserve enough width for status badges without overlap");

assert.deepEqual(
  districts.map((district) => district.name),
  ["Eluru", "East Godavari", "West Godavari", "Krishna", "Kakinada", "NTR"],
  "The operational demo portfolio must contain only the approved AP districts"
);
assert.equal(districts.length, 6, "The AP demo portfolio must contain exactly six districts");
assert.equal(
  districts.reduce((total, district) => total + district.mandals.length, 0),
  12,
  "The AP demo hierarchy must contain exactly 12 mandals"
);
assert.equal(
  districts.reduce(
    (total, district) => total + district.mandals.reduce((sum, mandal) => sum + mandal.villages.length, 0),
    0
  ),
  13,
  "The AP demo hierarchy must contain exactly 13 villages"
);
assert.equal(farms.length, 19, "The AP portfolio must contain exactly 19 discoverable farms");
assert.equal(farms.reduce((total, farm) => total + farm.acres, 0), 153, "The AP demo acreage must reconcile to 153 acres");
assert.equal(farms.reduce((total, farm) => total + farm.trees, 0), 8280, "The AP demo portfolio must reconcile to 8,280 planted palms");
assert.ok(farms.every((farm) => /^FRM-AP-/.test(farm.id)), "Every active farm ID must be AP-scoped");

const metricsForBody = functionBody(html, "metricsFor");
const metricsFor = Function(
  "flatFarms",
  `return function metricsFor(items){${metricsForBody}};`
)(flattenFarms);
const portfolioMetrics = metricsFor(farms);
assert.deepEqual(
  portfolioMetrics,
  {
    farms: farms.length,
    acres: farms.reduce((total, farm) => total + farm.acres, 0),
    totalTrees: farms.reduce((total, farm) => total + farm.trees, 0),
    surveyed: farms.reduce((total, farm) => total + farm.surveyed, 0),
    infected: farms.reduce((total, farm) => total + farm.infected, 0),
    pending: farms.reduce((total, farm) => total + farm.pending, 0),
    coverage: farms.reduce((total, farm) => total + farm.surveyed, 0) / farms.reduce((total, farm) => total + farm.trees, 0),
    rate: farms.reduce((total, farm) => total + farm.infected, 0) / farms.reduce((total, farm) => total + farm.trees, 0),
  },
  "The Overview metric strip must reconcile exactly with the complete AP farm portfolio"
);

// The Kakinada and NTR expansion is an explicit deterministic fixture, not
// synthetic output generated at runtime. Exact geography and field values make
// later drift, incorrect parentage, and misleading metric inflation visible.
const expansionHierarchy = [
  {
    district: "Kakinada", lat: 16.9891, lon: 82.2475,
    mandals: [
      { name: "Peddapuram", lat: 17.0770, lon: 82.1380, village: "Kandrakota", villageLat: 17.166187, villageLon: 82.118812 },
      { name: "Jaggampeta", lat: 17.1795, lon: 82.0548, village: "Gurrappalem", villageLat: 17.208118, villageLon: 82.062042 },
    ],
  },
  {
    district: "NTR", lat: 16.5062, lon: 80.6480,
    mandals: [
      { name: "Mylavaram", lat: 16.7630, lon: 80.6377, village: "Velvadam", villageLat: 16.762213, villageLon: 80.663593 },
      { name: "Tiruvuru", lat: 17.1056, lon: 80.6100, village: "Mustikuntla", villageLat: 17.061054, villageLon: 80.555219 },
    ],
  },
];
for (const expectedDistrict of expansionHierarchy) {
  const district = districts.find((item) => item.name === expectedDistrict.district);
  assert.ok(district, `${expectedDistrict.district} must be present in the AP hierarchy`);
  assert.equal(district.lat, expectedDistrict.lat, `${district.name} must retain its accepted map latitude`);
  assert.equal(district.lon, expectedDistrict.lon, `${district.name} must retain its accepted map longitude`);
  assert.deepEqual(
    district.mandals.map((mandal) => mandal.name),
    expectedDistrict.mandals.map((mandal) => mandal.name),
    `${district.name} must retain its accepted mandal hierarchy`
  );
  for (const expectedMandal of expectedDistrict.mandals) {
    const mandal = district.mandals.find((item) => item.name === expectedMandal.name);
    assert.equal(mandal.lat, expectedMandal.lat, `${mandal.name} must retain its accepted map latitude`);
    assert.equal(mandal.lon, expectedMandal.lon, `${mandal.name} must retain its accepted map longitude`);
    assert.equal(mandal.villages.length, 1, `${mandal.name} must contain its one accepted demo village`);
    const [village] = mandal.villages;
    assert.equal(village.name, expectedMandal.village, `${mandal.name} must retain its accepted village`);
    assert.equal(village.lat, expectedMandal.villageLat, `${village.name} must retain its accepted map latitude`);
    assert.equal(village.lon, expectedMandal.villageLon, `${village.name} must retain its accepted map longitude`);
  }
}

const expectedExpansionFarms = [
  { id:"FRM-AP-KAK-0401", district:"Kakinada", mandal:"Peddapuram", village:"Kandrakota", lat:17.1674, lon:82.1201, acres:7, density:52, trees:364, surveyed:331, infected:11, suspected:24, pending:8, risk:.029, lastSurvey:"2026-08-01" },
  { id:"FRM-AP-KAK-0402", district:"Kakinada", mandal:"Peddapuram", village:"Kandrakota", lat:17.1649, lon:82.1168, acres:9, density:53, trees:477, surveyed:419, infected:29, suspected:46, pending:15, risk:.061, lastSurvey:"2026-07-29" },
  { id:"FRM-AP-KAK-0413", district:"Kakinada", mandal:"Jaggampeta", village:"Gurrappalem", lat:17.2095, lon:82.0634, acres:8, density:54, trees:432, surveyed:395, infected:8, suspected:20, pending:7, risk:.018, lastSurvey:"2026-08-05" },
  { id:"FRM-AP-KAK-0421", district:"Kakinada", mandal:"Jaggampeta", village:"Gurrappalem", lat:17.2067, lon:82.0608, acres:10, density:55, trees:550, surveyed:468, infected:41, suspected:62, pending:20, risk:.074, lastSurvey:"2026-07-31" },
  { id:"FRM-AP-NTR-0501", district:"NTR", mandal:"Mylavaram", village:"Velvadam", lat:16.7635, lon:80.6650, acres:6, density:56, trees:336, surveyed:302, infected:9, suspected:21, pending:8, risk:.027, lastSurvey:"2026-08-02" },
  { id:"FRM-AP-NTR-0510", district:"NTR", mandal:"Mylavaram", village:"Velvadam", lat:16.7609, lon:80.6619, acres:8, density:57, trees:456, surveyed:414, infected:22, suspected:38, pending:12, risk:.049, lastSurvey:"2026-08-06" },
  { id:"FRM-AP-NTR-0522", district:"NTR", mandal:"Tiruvuru", village:"Mustikuntla", lat:17.0624, lon:80.5567, acres:9, density:52, trees:468, surveyed:381, infected:39, suspected:58, pending:22, risk:.083, lastSurvey:"2026-07-27" },
  { id:"FRM-AP-NTR-0530", district:"NTR", mandal:"Tiruvuru", village:"Mustikuntla", lat:17.0597, lon:80.5538, acres:7, density:54, trees:378, surveyed:352, infected:6, suspected:16, pending:5, risk:.016, lastSurvey:"2026-08-07" },
];
const expansionFarmIds = new Set(expectedExpansionFarms.map((farm) => farm.id));
assert.deepEqual(
  farms.filter((farm) => ["Kakinada", "NTR"].includes(farm.district)).map((farm) => farm.id),
  expectedExpansionFarms.map((farm) => farm.id),
  "Kakinada and NTR must contain exactly the accepted eight expansion farms"
);
for (const expected of expectedExpansionFarms) {
  const actual = farms.find((farm) => farm.id === expected.id);
  assert.ok(actual, `${expected.id} must be present in the deterministic AP portfolio`);
  for (const key of ["district", "mandal", "village", "lat", "lon", "acres", "density", "trees", "surveyed", "infected", "suspected", "pending", "risk", "lastSurvey"]) {
    assert.equal(actual[key], expected[key], `${expected.id} ${key} changed from the accepted deterministic fixture`);
  }
  assert.match(actual.name, /demo/i, `${expected.id} must be visibly labelled as demo data`);
}
assert.equal(
  new Set(farms.map((farm) => `${farm.lat.toFixed(6)},${farm.lon.toFixed(6)}`)).size,
  farms.length,
  "Every farm marker must have unique coordinates"
);
for (const farm of farms.filter((item) => expansionFarmIds.has(item.id))) {
  const village = districts.find((district) => district.name === farm.district)
    ?.mandals.find((mandal) => mandal.name === farm.mandal)
    ?.villages.find((item) => item.name === farm.village);
  assert.ok(village, `${farm.id} must resolve through its district, mandal, and village parents`);
  assert.ok(Math.hypot(farm.lat - village.lat, farm.lon - village.lon) < .01, `${farm.id} coordinates must stay near its village anchor`);
}

// Exact protected-role geography remains the authoritative RBAC demo contract.
assert.equal(roles.admin.districts, "all", "System Administrator must retain full AP scope");
assert.equal(roles.ceo.districts, "all", "CEO / General Manager must retain full AP scope");
assert.deepEqual(roles.head.districts, ["Eluru", "East Godavari"], "Plantation Head scope changed unexpectedly");
assert.deepEqual(roles.manager.districts, ["Eluru"], "Area Manager district scope changed unexpectedly");
assert.deepEqual(roles.manager.mandals, ["Pedavegi"], "Area Manager mandal scope changed unexpectedly");
assert.deepEqual(roles.staff.farmIds, ["FRM-AP-ELR-0004"], "Field Staff farm assignment changed unexpectedly");

// The authoritative scope selector must preserve a valid hierarchy after
// pruning, return the accepted farm counts for every built-in role, and fail
// closed without throwing when presented with a malformed/unknown principal.
const scopedDistrictsBodyForRegression = functionBody(html, "scopedDistricts");
const localFarmVisibleBodyForRegression = /function\s+localFarmVisibleForRole\s*\(/.test(html)
  ? functionBody(html, "localFarmVisibleForRole")
  : null;
const mergedDistrictsBodyForRegression = /function\s+mergedDistricts\s*\(/.test(html)
  ? functionBody(html, "mergedDistricts")
  : null;
function evaluateScopedDistricts(roleId, localFarms = []) {
  if (mergedDistrictsBodyForRegression && localFarmVisibleBodyForRegression) {
    return Function(
      "roles",
      "districts",
      "demoState",
      "CURRENT_USER_BY_ROLE",
      "roleId",
      `const state={role:roleId};
       function localFarmVisibleForRole(farm,roleId){${localFarmVisibleBodyForRegression}}
       function mergedDistricts(roleId=state.role){${mergedDistrictsBodyForRegression}}
       return mergedDistricts(roleId);`
    )(roles, districts, { localFarms }, currentUserByRole, roleId);
  }
  return Function(
    "roles",
    "districts",
    "state",
    `return (function scopedDistricts(){${scopedDistrictsBodyForRegression}})();`
  )(roles, districts, { role: roleId });
}
const scopedByRole = Object.fromEntries(
  ["admin", "ceo", "head", "manager", "staff"].map((roleId) => [roleId, evaluateScopedDistricts(roleId)])
);
assert.equal(flattenFarms(scopedByRole.admin).length, 19, "System Administrator must see all 19 AP demo farms");
assert.equal(flattenFarms(scopedByRole.ceo).length, 19, "CEO / General Manager must see all 19 AP demo farms");
assert.equal(scopedByRole.admin.length, 6, "System Administrator must see all six AP demo districts");
assert.equal(scopedByRole.ceo.length, 6, "CEO / General Manager must see all six AP demo districts");
assert.equal(flattenFarms(scopedByRole.head).length, 7, "Plantation Head must see exactly 7 assigned AP farms");
assert.equal(flattenFarms(scopedByRole.manager).length, 3, "Area Manager must see exactly 3 Pedavegi farms");
assert.ok(
  scopedByRole.manager.every((district) =>
    district.mandals.every((mandal) => mandal.name === "Pedavegi")
  ),
  "Area Manager scope must not retain a mandal outside Pedavegi"
);
const staffFarms = flattenFarms(scopedByRole.staff);
assert.deepEqual(staffFarms.map((farm) => farm.id), ["FRM-AP-ELR-0004"], "Field Staff must receive only its assigned farm");
assert.deepEqual(
  scopedByRole.staff.map((district) => ({
    district: district.name,
    mandals: district.mandals.map((mandal) => ({
      mandal: mandal.name,
      villages: mandal.villages.map((village) => village.name)
    }))
  })),
  [{ district: "Eluru", mandals: [{ mandal: "Pedavegi", villages: ["Munduru"] }] }],
  "Field Staff pruning must preserve the Eluru / Pedavegi / Munduru hierarchy"
);
let malformedScope;
assert.doesNotThrow(
  () => { malformedScope = evaluateScopedDistricts("__malformed_role__"); },
  "An unknown role principal must fail closed without throwing"
);
assert.deepEqual(malformedScope, [], "An unknown role principal must expose no AP geography or farm identity");

// Operational navigation is permission-led. Disease Analytics is deliberately
// removed, while Reports remains available to every export-capable role.
assert.deepEqual(
  roles.admin.nav,
  ["Overview", "New Farm", "Alerts", "Reports", "Cases & Treatments", "Administration", "Settings"],
  "System Administrator navigation must match the accepted operational pages"
);
assert.deepEqual(roles.ceo.nav, roles.admin.nav, "CEO / General Manager must retain the same page access as Admin");
assert.deepEqual(
  roles.head.nav,
  ["Overview", "Alerts", "Reports", "Cases & Treatments", "Settings"],
  "Plantation Head navigation must exclude create/admin pages"
);
assert.deepEqual(
  roles.manager.nav,
  ["Overview", "Alerts", "Reports", "Cases & Treatments", "Settings"],
  "Area Manager must retain scoped reporting without create/admin access"
);
assert.deepEqual(
  roles.staff.nav,
  ["Overview", "Alerts", "Cases & Treatments", "Settings"],
  "Field Staff navigation must remain assignment-focused"
);
assert.doesNotMatch(html, /Disease Analytics/, "Disease Analytics must be removed from navigation and rendering");

// Alerts are explicit AP demo records linked to the existing authorized farm
// model. This prevents orphaned alerts and accidental non-AP identity leakage.
assert.ok(Array.isArray(alerts) && alerts.length > 0, "The Infection watchlist needs inspectable demo alert records");
const knownFarmIds = new Set(farms.map((farm) => farm.id));
const allowedSeverities = new Set(["danger", "suspected", "okay", "no-reading"]);
for (const [label, records] of [["alert", alerts], ["case", cases], ["treatment", treatments]]) {
  assert.ok(Array.isArray(records), `The ${label} demo records must remain inspectable`);
  assert.ok(records.every((record) => knownFarmIds.has(record.farmId)), `Every existing ${label} must remain linked to a known AP farm`);
  assert.ok(
    records.every((record) => !expansionFarmIds.has(record.farmId)),
    `The eight new portfolio farms must not receive invented ${label} records`
  );
}
for (const alert of alerts) {
  assert.ok(/^ALT-AP-/.test(alert.id), `${alert.id || "Alert"} must use an AP-scoped alert ID`);
  assert.ok(knownFarmIds.has(alert.farmId), `${alert.id} must link to a known active AP farm`);
  assert.ok(allowedSeverities.has(alert.severity), `${alert.id} has an unsupported severity`);
  assert.ok(Number.isInteger(alert.affected) && alert.affected >= 0, `${alert.id} affected palms must be a non-negative integer`);
  assert.ok(typeof alert.date === "string" && alert.date.length > 0, `${alert.id} must have a deterministic date`);
}
assert.ok(alerts.some((alert) => alert.severity === "danger"), "Watchlist demo data must exercise Danger state");
assert.ok(alerts.some((alert) => alert.severity === "suspected"), "Watchlist demo data must exercise Suspected state");

const renderAlertsBody = functionBody(html, "renderAlerts");
assert.match(renderAlertsBody, /Infection watchlist/i, "Alerts must use the approved watchlist composition");
assert.match(renderAlertsBody, /Active alerts/i, "Alerts must expose the active-alert records panel");
for (const label of ["All", "Unread", "Danger", "Suspected"]) {
  assert.match(renderAlertsBody, new RegExp(`(?:>${label}<|${label} alerts|value=["']${label.toLowerCase()})`, "i"), `Missing ${label} alert filter`);
}
assert.match(renderAlertsBody, /affected/i, "Alert rows must communicate affected palms in text");
assert.match(renderAlertsBody, /infection rate|rate/i, "Alert rows must communicate infection rate in text");
assert.match(renderAlertsBody, /severity|danger/i, "Alert ranking/filtering must use explicit severity state");
assert.match(renderAlertsBody, /unread|read/i, "The Unread filter must use owned read state");
assert.match(renderAlertsBody, /data-(?:alert|farm)/i, "Alert rows need stable interaction hooks");
assert.match(renderAlertsBody, /aria-(?:label|pressed|live)|role=["']status/i, "Alert controls and updates need accessible names/status");

const scopedAlertsBody = functionBody(html, "scopedAlerts");
assert.match(scopedAlertsBody, /scopedDistricts|flatFarms|farmIds|farmId/i, "Alert selection must intersect the signed-in farm scope");
assert.match(scopedAlertsBody, /\.sort\s*\(/, "The authoritative scoped alert selector must rank alerts worst-first");
assert.match(scopedAlertsBody, /rank|severity/i, "Worst-first alert sorting must use explicit severity rank");
assert.match(scopedAlertsBody, /risk|affected|date/i, "Equal-severity alerts need a deterministic risk/date tie-breaker");
const markOneBody = functionBody(html, "markAlertRead");
assert.match(markOneBody, /scopedAlerts|farmId|find|some/i, "Mark-one must verify the alert belongs to the current scope");
assert.match(markOneBody, /read/i, "Mark-one must persist a read state");
const markAllBody = functionBody(html, "markAllAlertsRead");
assert.match(markAllBody, /scopedAlerts/i, "Mark-all must update only the current role's scoped alerts");
assert.match(markAllBody, /read/i, "Mark-all must persist read states");
const openScopedFarmBody = functionBody(html, "openScopedFarm");
assert.match(openScopedFarmBody, /scopedDistricts|scopedFarms|flatFarms/i, "Alert farm links must check the current geographic scope");
assert.match(openScopedFarmBody, /find|some/i, "Unknown or unauthorized Farm IDs must fail closed");
assert.match(openScopedFarmBody, /Overview/, "Authorized alert links must return through the guarded Overview farm detail");

// Local changes are demo-only, versioned and account/role-scoped. A single reset
// hook must restore deterministic defaults rather than mutating farm seed data.
assert.match(html, /palmwatch[.:_-]ap[.:_-]v\d+/i, "Local demo state must use a versioned AP namespace");
assert.match(html, /localStorage\.(?:getItem|setItem|removeItem)\s*\(/, "Alert read state must be browser-local");
assert.match(html, /(?:state\.role|account|principal|roleKey)/, "Owned demo state must be keyed by the signed-in role/account");
const resetBody = functionBody(html, "resetDemoState");
assert.match(resetBody, /localStorage|demoState/i, "Reset must clear or replace browser-local demo changes");

assert.match(html, /Mark all (?:as )?read/i, "Alerts need an explicit mark-all-read control");
assert.match(html, /Mark (?:alert )?(?:as )?read/i, "Each unread alert needs a labelled mark-read control");
assert.match(html, /aria-live=["']polite["']|role=["']status["']/i, "Alert actions must announce status changes");
assert.match(html, /(?:Open|View) farm/i, "Alert records must expose a clearly labelled farm destination");
assert.match(html, /(?:Healthy|Okay|Suspected|Danger|No reading)/i, "Alert severity must include visible text in addition to colour");
assert.match(
  html,
  /\$\{pct\(alert\.farm\.risk\)\}<\/strong>(?:\s|<[^>]+>)+infection rate/i,
  "The rendered percentage and 'infection rate' label must have visible separation"
);

// Reports retain the original PalmWatch catalogue semantics while rendering in
// the Buckleson visual language. One openable report and five Excel-compatible
// workbook exports are intentionally part of the public demo contract.
assert.ok(Array.isArray(reportDefinitions), "Reports need an inspectable report definition catalogue");
assert.equal(reportDefinitions.length, 6, "Reports must expose one report and five Excel offerings");
assert.deepEqual(
  reportDefinitions.map((report) => report.title),
  [
    "Executive report",
    "Survey coverage by plantation area",
    "Suspected palms by quarter",
    "Open inspections by assignee",
    "Infected case status",
    "Treatment progress"
  ],
  "The accepted six-report catalogue changed unexpectedly"
);
const printableReports = reportDefinitions.filter((report) => report.format === "printable");
const excelReports = reportDefinitions.filter((report) => report.format === "excel");
assert.equal(printableReports.length, 1, "Exactly one report must use the printable view");
assert.equal(excelReports.length, 5, "Exactly five reports must generate Excel-compatible workbooks");
assert.equal(new Set(reportDefinitions.map((report) => report.id)).size, 6, "Report IDs must be unique");

assert.deepEqual(
  Object.keys(roles).filter((roleId) => roles[roleId].nav.includes("Reports")),
  ["admin", "ceo", "head", "manager"],
  "Only System Admin, CEO/GM, Plantation Head, and Area Manager may export reports"
);
assert.ok(!roles.staff.nav.includes("Reports"), "Field Staff must not have a Reports destination");

const scopedReportRowsBody = functionBody(html, "scopedReportRows");
assert.match(
  scopedReportRowsBody,
  /scopedDistricts|scopedFarms|flatFarms|farmIds/,
  "Report rows must be built from the signed-in role's scoped AP farms"
);
assert.match(scopedReportRowsBody, /farmId/, "Every operational report row must remain linked to a scoped Farm ID");
assert.match(
  scopedReportRowsBody,
  /new Set\s*\([^)]*farms\.map/,
  "Report row construction must derive an authorized Farm ID set from scoped farms"
);
assert.match(
  scopedReportRowsBody,
  /\.rows\s*\(\s*(?:authorizedFarms|farms)\s*,\s*farmIds\s*\)/,
  "Operational report builders must receive only scoped farms and their authorized Farm IDs"
);

const renderReportsBody = functionBody(html, "renderReports");
assert.match(renderReportsBody, /Reports|report catalog/i, "Reports needs a dedicated catalogue composition");
assert.match(renderReportsBody, /flatFarms\s*\(\s*scopedDistricts\s*\(\s*\)\s*\)/, "Reports must consume the complete role-scoped portfolio, including new AP districts");
assert.match(renderReportsBody, /scopedReportRows/, "Displayed report availability and row counts must use scoped rows");
assert.match(
  renderReportsBody,
  /count\s*=\s*scopedReportRows\s*\(\s*report\.id\s*\)\.length[^]*fmt\s*\(\s*count\s*\)/i,
  "Each report card must show the exact number of rows that its export will contain"
);
assert.doesNotMatch(
  renderReportsBody,
  /publicFacts|65,000|75,000|Godrej Agrovet/i,
  "Public Godrej context must never be mixed into role-scoped report totals"
);

const escapeCsvCellMatch = /function\s+escapeCsvCell\s*\(\s*value\s*\)\s*\{([\s\S]*?)^\s*\}/m.exec(html);
assert.ok(escapeCsvCellMatch, "Missing required function: escapeCsvCell");
const escapeCsvCellBody = escapeCsvCellMatch[1];
const escapeCsvCell = Function("value", escapeCsvCellBody);
assert.equal(escapeCsvCell("plain"), "plain", "Plain CSV cells must remain unquoted");
assert.equal(escapeCsvCell("Eluru, AP"), '"Eluru, AP"', "CSV fields containing commas must be quoted");
assert.equal(escapeCsvCell('A "quoted" value'), '"A ""quoted"" value"', "CSV quotes must be doubled");
assert.equal(escapeCsvCell("line one\nline two"), '"line one\nline two"', "CSV fields containing newlines must be quoted");

const buildReportCsvBody = functionBody(html, "buildReportCsv");
assert.match(buildReportCsvBody, /escapeCsvCell/, "CSV headers and rows must use the shared RFC-style escaping hook");
assert.match(buildReportCsvBody, /\r\n|\\r\\n/, "CSV generation must use deterministic CRLF row separators");
const downloadReportExcelBody = functionBody(html, "downloadReportExcel");
assert.match(downloadReportExcelBody, /scopedReportRows/, "Excel download must scope rows before generating the file");
assert.match(downloadReportExcelBody, /buildReportExcel/, "Excel download must build from the already-scoped row collection");
assert.ok(
  downloadReportExcelBody.indexOf("scopedReportRows") < downloadReportExcelBody.indexOf("buildReportExcel"),
  "Report rows must be scoped before the Excel builder is called"
);
assert.match(downloadReportExcelBody, /application\/vnd\.ms-excel/, "Excel export must use an Excel-compatible MIME type");
assert.match(downloadReportExcelBody, /\.xls/, "Excel export must provide an .xls filename");
assert.match(downloadReportExcelBody, /new Blob\s*\(/, "Excel export must create a browser Blob");
assert.match(downloadReportExcelBody, /URL\.createObjectURL/, "Excel export must create a temporary object URL");
assert.match(downloadReportExcelBody, /\.download\s*=|setAttribute\s*\(\s*["']download/i, "Excel export must provide a download filename");
assert.match(downloadReportExcelBody, /\.click\s*\(/, "Excel export must activate a browser download");
assert.match(downloadReportExcelBody, /URL\.revokeObjectURL/, "Excel export must release its temporary object URL");
assert.match(downloadReportExcelBody, /recordReportDownload/, "Successful downloads must enter the local history");

const recordReportDownloadBody = functionBody(html, "recordReportDownload");
assert.match(recordReportDownloadBody, /reportHistory/, "Download history must use the versioned demo-state document");
assert.match(recordReportDownloadBody, /saveDemoState|localStorage/, "Download history must persist in browser-local demo state");
assert.match(recordReportDownloadBody, /state\.role|account|principal|roleKey/, "Download history must retain account/role ownership");
assert.match(html, /Recent (?:downloads|exports)|Download history/i, "Reports must render browser-local download history");

const printableBody = functionBody(html, "renderPrintableExecutiveReport");
assert.match(printableBody, /scope|assigned|Andhra Pradesh/i, "The printable report must visibly identify the signed-in AP scope");
assert.match(printableBody, /scopedReportRows|scopedDistricts|flatFarms/, "Printable totals must derive from authorized AP records");
assert.doesNotMatch(
  printableBody,
  /publicFacts|65,000|75,000/i,
  "Public context figures must not appear in the operational printable report"
);
assert.match(html, /@page\s*\{[^}]*size\s*:\s*A4/is, "The executive report needs an A4 print page definition");
assert.match(html, /@media\s+print/i, "The executive report needs a dedicated print stylesheet");
assert.match(html, /window\.print\s*\(/, "The printable executive report needs an explicit print action");
assert.match(html, /aria-live=["']polite["']|role=["']status["']/i, "Report generation and download changes must be announced");

// Cases and Treatments use explicit AP-linked records. Scope is resolved from
// authorized farms before status/search filters, so an empty or malformed
// principal cannot learn that an operational record exists.
assert.ok(Array.isArray(cases) && cases.length > 0, "Cases & Treatments needs inspectable AP demo case records");
assert.ok(Array.isArray(treatments) && treatments.length > 0, "Cases & Treatments needs inspectable AP demo treatment records");
assert.equal(new Set(cases.map((item) => item.id)).size, cases.length, "Case IDs must be unique");
assert.equal(new Set(treatments.map((item) => item.id)).size, treatments.length, "Treatment IDs must be unique");
const knownCaseIds = new Set(cases.map((item) => item.id));
for (const caseRecord of cases) {
  assert.match(caseRecord.id, /^CASE-AP-/, `${caseRecord.id || "Case"} must use an AP-scoped ID`);
  assert.ok(knownFarmIds.has(caseRecord.farmId), `${caseRecord.id} must link to a known active AP farm`);
  assert.ok(typeof caseRecord.status === "string" && caseRecord.status.length > 0, `${caseRecord.id} must have a status`);
  assert.ok(typeof caseRecord.opened === "string" && caseRecord.opened.length > 0, `${caseRecord.id} must have a deterministic opened date`);
  assert.ok(Number.isInteger(caseRecord.affectedPalms) && caseRecord.affectedPalms >= 0, `${caseRecord.id} affected palms must be a non-negative integer`);
  assert.ok(typeof caseRecord.owner === "string" && caseRecord.owner.length > 0, `${caseRecord.id} must identify its demo owner`);
  assert.match(caseRecord.treeId, new RegExp(`^${caseRecord.farmId}-T\\d+$`), `${caseRecord.id} must link to a supporting tree in its farm`);
}
for (const treatment of treatments) {
  assert.match(treatment.id, /^TRT-AP-/, `${treatment.id || "Treatment"} must use an AP-scoped ID`);
  assert.ok(knownFarmIds.has(treatment.farmId), `${treatment.id} must link to a known active AP farm`);
  assert.ok(knownCaseIds.has(treatment.caseId), `${treatment.id} must link to a known AP case`);
  assert.equal(cases.find((item) => item.id === treatment.caseId).farmId, treatment.farmId, `${treatment.id} and its case must share a farm`);
  assert.ok(typeof treatment.treatment === "string" && treatment.treatment.length > 0, `${treatment.id} needs a recommendation`);
  assert.ok(Number.isInteger(treatment.progress) && treatment.progress >= 0 && treatment.progress <= 100, `${treatment.id} progress must be 0-100`);
  if (treatment.status === "Completed") {
    assert.ok(typeof treatment.outcome === "string" && treatment.outcome.trim().length >= 10, `${treatment.id} completed outcome must be meaningful`);
  }
}

const scopedCasesBody = functionBody(html, "scopedCases");
assert.match(scopedCasesBody, /scopedDistricts|flatFarms/, "Case scope must originate from authorized AP farms");
assert.match(scopedCasesBody, /new (?:Set|Map)\s*\([^)]*\.map\s*\(/, "Case scope must construct an authorized Farm ID collection");
assert.match(scopedCasesBody, /\b\w*FarmIds\.has\s*\(\s*record\.farmId\s*\)/i, "Case records must be intersected with authorized Farm IDs before overrides or filtering");
assert.match(scopedCasesBody, /demoState\.cases/, "Scoped cases must apply browser-local case status overrides");
assert.doesNotMatch(scopedCasesBody, /caseStatus|caseSearch/, "The authoritative case selector must scope records before UI filtering");
const scopedTreatmentsBody = functionBody(html, "scopedTreatments");
assert.match(scopedTreatmentsBody, /scopedDistricts|flatFarms|scopedCases/, "Treatment scope must originate from authorized AP farms/cases");
assert.match(scopedTreatmentsBody, /farmId|caseId/, "Treatment selection must intersect authorized linked records");
assert.match(scopedTreatmentsBody, /demoState\.treatments/, "Scoped treatments must apply browser-local progress and outcome overrides");
assert.doesNotMatch(scopedTreatmentsBody, /treatmentStatus|treatmentSearch/, "The authoritative treatment selector must scope records before UI filtering");

const getCaseRecordBody = functionBody(html, "getCaseRecord");
assert.match(getCaseRecordBody, /scopedCases\s*\(\s*\)/, "Case lookup must search only the signed-in scope");
assert.match(getCaseRecordBody, /\.find\s*\(/, "Case lookup must require an exact authorized ID match");
assert.match(getCaseRecordBody, /\|\|\s*null|\?\?\s*null/, "Unknown and unauthorized case IDs must return the same null result");
const getTreatmentRecordBody = functionBody(html, "getTreatmentRecord");
assert.match(getTreatmentRecordBody, /scopedTreatments\s*\(\s*\)/, "Treatment lookup must search only the signed-in scope");
assert.match(getTreatmentRecordBody, /\.find\s*\(/, "Treatment lookup must require an exact authorized ID match");
assert.match(getTreatmentRecordBody, /\|\|\s*null|\?\?\s*null/, "Unknown and unauthorized treatment IDs must return the same null result");

// The accepted role/action matrix is intentionally small and fail-closed.
assert.deepEqual(caseActionsByRole, {
  admin: ["field-assessment", "area-action", "reopen"],
  ceo: ["reopen"],
  head: ["reopen"],
  manager: ["area-action"],
  staff: ["field-assessment"]
}, "Case actions must match the accepted five-role responsibility matrix");
assert.deepEqual(caseTransitions, {
  "field-assessment": { from: "Under assessment", to: "Confirmed" },
  "area-action": { from: "Confirmed", to: "Treatment active" },
  reopen: { from: "Closed", to: "Monitoring" }
}, "Case actions must enforce the accepted legal status transitions without alternate entry states");
assert.deepEqual(treatmentTransitions, {
  Recommended: "Planned",
  Planned: "In progress",
  "In progress": "Completed"
}, "Treatment progress must follow the accepted legal sequence with no transition out of Completed");

const applyCaseActionBody = functionBody(html, "applyCaseAction");
assert.match(applyCaseActionBody, /getCaseRecord/, "Case mutation must resolve an already-scoped case before acting");
assert.match(applyCaseActionBody, /CASE_ACTIONS_BY_ROLE/, "Case mutation must enforce the role/action matrix");
assert.match(applyCaseActionBody, /CASE_TRANSITIONS/, "Case mutation must use the legal transition graph");
assert.match(applyCaseActionBody, /includes\s*\(\s*action\s*\)/, "Unconfigured case actions must fail closed");
assert.match(applyCaseActionBody, /field-assessment/, "Field Staff assessment needs an explicit legal transition");
assert.match(applyCaseActionBody, /area-action/, "Area Manager action needs an explicit legal transition");
assert.match(applyCaseActionBody, /reopen/, "CEO/GM and Plantation Head reopen needs an explicit legal transition");
assert.match(applyCaseActionBody, /demoState\.cases/, "Legal case actions must be browser-local overrides");
assert.match(applyCaseActionBody, /saveDemoState/, "Legal case actions must persist through the versioned demo-state document");
assert.match(applyCaseActionBody, /not available in your assigned AP scope|not available/i, "Denied and unknown case actions need non-identifying status copy");

const progressTreatmentBody = functionBody(html, "progressTreatment");
assert.match(progressTreatmentBody, /getTreatmentRecord/, "Treatment mutation must resolve an already-scoped treatment before acting");
assert.match(progressTreatmentBody, /admin|manager/, "Only System Administrator and Area Manager may progress treatment");
assert.match(progressTreatmentBody, /TREATMENT_TRANSITIONS/, "Treatment mutation must use the legal transition sequence");
assert.match(progressTreatmentBody, /outcome\.trim\s*\(\s*\)/, "Treatment completion must validate a trimmed outcome");
assert.match(progressTreatmentBody, /10/, "A completed treatment must require at least ten outcome characters");
assert.match(progressTreatmentBody, /demoState\.treatments/, "Treatment progress must be a browser-local override");
assert.match(progressTreatmentBody, /saveDemoState/, "Treatment progress must persist through the versioned demo-state document");
assert.match(progressTreatmentBody, /not available in your assigned AP scope|not available/i, "Denied and unknown treatment actions need non-identifying status copy");

const renderCasesTreatmentsBody = functionBody(html, "renderCasesTreatments");
const renderCasesPanelBody = functionBody(html, "renderCasesPanel");
const renderCaseModalBody = functionBody(html, "renderCaseModal");
const renderTreatmentsPanelBody = functionBody(html, "renderTreatmentsPanel");
const renderCaseDetailBody = functionBody(html, "renderCaseDetail");
const renderTreatmentDetailBody = functionBody(html, "renderTreatmentDetail");
const bindCaseTreatmentEventsBody = functionBody(html, "bindCaseTreatmentEvents");
const focusWorkDetailBody = functionBody(html, "focusWorkDetail");
const selectCaseRecordBody = functionBody(html, "selectCaseRecord");
const selectTreatmentRecordBody = functionBody(html, "selectTreatmentRecord");
const caseTreatmentUi = [
  renderCasesTreatmentsBody,
  renderCasesPanelBody,
  renderCaseModalBody,
  renderTreatmentsPanelBody,
  renderCaseDetailBody,
  renderTreatmentDetailBody,
  bindCaseTreatmentEventsBody,
  focusWorkDetailBody,
  selectCaseRecordBody,
  selectTreatmentRecordBody
].join("\n");
assert.match(renderCasesTreatmentsBody, /role=["']tablist["']/, "Cases & Treatments must expose an accessible tab list");
assert.ok((renderCasesTreatmentsBody.match(/role=["']tab["']/g) || []).length >= 2, "Cases and Treatments both need accessible tabs");
assert.match(renderCasesTreatmentsBody, /aria-selected/, "The active Cases/Treatments tab must be announced");
assert.match(renderCasesTreatmentsBody, /aria-controls/, "Cases/Treatments tabs must identify their controlled panel");
assert.match(renderCasesTreatmentsBody, /role=["']tabpanel["']/, "Cases/Treatments content must use an accessible tab panel");
assert.match(caseTreatmentUi, /caseSearch|treatmentSearch|Search/i, "Cases and Treatments must provide scoped text search");
assert.match(caseTreatmentUi, /caseStatus|treatmentStatus|Status/i, "Cases and Treatments must provide status filtering");
assert.match(caseTreatmentUi, /mcard|metric|KPI|Open cases|Active treatments/i, "Cases and Treatments must show scoped KPIs");
assert.match(caseTreatmentUi, /selectedCaseId|selectedTreatmentId|caseModalOpen/, "Cases and Treatments must render an explicit selected-record detail state");
assert.match(renderCasesPanelBody, /scopedCases\s*\(\s*\)/, "Case UI must begin from authorized scoped cases");
assert.match(renderTreatmentsPanelBody, /scopedTreatments\s*\(\s*\)/, "Treatment UI must begin from authorized scoped treatments");
assert.ok(
  renderCasesPanelBody.indexOf("scopedCases()") < renderCasesPanelBody.indexOf("caseStatus") &&
  renderTreatmentsPanelBody.indexOf("scopedTreatments()") < renderTreatmentsPanelBody.indexOf("treatmentStatus"),
  "Cases and Treatments must scope linked AP records before status/search filtering"
);
assert.match(caseTreatmentUi, /openScopedFarm/, "Case details must use the guarded Farm destination");
assert.match(caseTreatmentUi, /openScopedTree/, "Case evidence must use a guarded Tree destination");
assert.match(caseTreatmentUi, /applyCaseAction/, "Case details must bind only role-approved workflow actions");
assert.match(caseTreatmentUi, /progressTreatment/, "Treatment details must bind the guarded progress action");
assert.match(caseTreatmentUi, /outcome/i, "Treatment completion must expose an outcome field");
assert.match(renderCasesTreatmentsBody, /aria-live=["']polite["']|role=["']status["']/, "Case/treatment changes must be announced live");
assert.match(renderCasesPanelBody, /renderCaseModal\s*\(\s*selected\s*\)/, "Cases must open selected case details through the modal renderer");
assert.match(renderCaseModalBody, /role=["']dialog["'][^]*aria-modal=["']true["']/, "Selected case details must open as an accessible modal dialog");
assert.match(renderCaseModalBody, /id=["']selectedCaseDetails["'][^>]*tabindex=["']-1["']|tabindex=["']-1["'][^>]*id=["']selectedCaseDetails["']/, "Selected case modal must expose a stable focus target");
assert.match(renderCaseModalBody, /data-case-close|Close case details/, "Selected case modal must include an explicit close control");
assert.match(renderTreatmentsPanelBody, /id=["']selectedTreatmentDetails["'][^>]*tabindex=["']-1["']|tabindex=["']-1["'][^>]*id=["']selectedTreatmentDetails["']/, "Selected treatment details must expose a stable focus target");
assert.match(focusWorkDetailBody, /scrollIntoView/, "Open actions must scroll selected details into view");
assert.match(focusWorkDetailBody, /\.focus\s*\(/, "Open actions must move keyboard focus to selected details");
assert.match(selectCaseRecordBody, /getCaseRecord\s*\(/, "Case Open must resolve the record through scoped case lookup");
assert.match(selectCaseRecordBody, /selectedCaseId\s*=\s*record\.id/, "Case Open must update the selected case");
assert.match(selectCaseRecordBody, /Opened\s*\$\{record\.id\}\s*details/, "Case Open must announce the selected detail");
assert.match(selectCaseRecordBody, /caseModalOpen\s*=\s*true/, "Case Open must launch the selected case modal");
assert.match(selectCaseRecordBody, /focusWorkDetail\s*\(\s*["']selectedCaseDetails["']\s*\)/, "Case Open must focus the selected case modal");
const closeCaseModalBody = functionBody(html, "closeCaseModal");
assert.match(closeCaseModalBody, /caseModalOpen\s*=\s*false/, "Case modal close must clear the modal state");
assert.match(closeCaseModalBody, /\.focus\s*\(/, "Case modal close must return focus to the opening row control");
assert.match(selectTreatmentRecordBody, /getTreatmentRecord\s*\(/, "Treatment Open must resolve the record through scoped treatment lookup");
assert.match(selectTreatmentRecordBody, /selectedTreatmentId\s*=\s*record\.id/, "Treatment Open must update the selected treatment");
assert.match(selectTreatmentRecordBody, /Opened\s*\$\{record\.id\}\s*details/, "Treatment Open must announce the selected detail");
assert.match(selectTreatmentRecordBody, /focusWorkDetail\s*\(\s*["']selectedTreatmentDetails["']\s*\)/, "Treatment Open must focus the selected treatment detail panel");
assert.match(bindCaseTreatmentEventsBody, /data-case-select[^]*selectCaseRecord/, "Case table and attention Open actions must use the shared case selector");
assert.match(bindCaseTreatmentEventsBody, /data-treatment-select[^]*selectTreatmentRecord/, "Treatment table Open actions must use the shared treatment selector");
assert.match(bindCaseTreatmentEventsBody, /data-treatment-case[^]*selectCaseRecord/, "Treatment detail View case must use the shared case selector");
for (const label of ["Record field assessment", "Take area-manager action", "Reopen case", "Advance treatment"]) {
  assert.match(html, new RegExp(label, "i"), `Missing role-controlled action label: ${label}`);
}

const renderAppBody = functionBody(html, "render");
assert.match(renderAppBody, /Cases & Treatments[^]*renderCasesTreatments/, "The Cases & Treatments destination must render its dedicated page rather than a placeholder");

const openScopedTreeBody = functionBody(html, "openScopedTree");
assert.match(openScopedTreeBody, /scopedDistricts|flatFarms|getCaseRecord/, "Tree links must verify the current AP farm/case scope");
assert.match(openScopedTreeBody, /cellsFor/, "Tree links must verify that the supporting tree belongs to an occupied farm cell");
assert.match(openScopedTreeBody, /find|some/, "Unknown or unauthorized Tree IDs must fail closed");
assert.match(openScopedTreeBody, /not available in your assigned AP scope|not available/i, "Tree denial must not disclose identity outside the current scope");

const defaultDemoStateBody = functionBody(html, "defaultDemoState");
assert.match(defaultDemoStateBody, /cases\s*:\s*\{\s*\}/, "Default local state must reserve isolated case overrides");
assert.match(defaultDemoStateBody, /treatments\s*:\s*\{\s*\}/, "Default local state must reserve isolated treatment overrides");
assert.match(resetBody, /defaultDemoState|removeItem/, "Reset must restore deterministic case and treatment defaults");

// A Field Staff assessment is a durable, append-only operational note rather
// than an invented case. The form is limited to the one assigned AP farm and
// records enough actor/linkage information to render an auditable timeline
// after a refresh.
assert.match(defaultDemoStateBody, /caseActions\s*:\s*\[\s*\]/, "Fresh demo state must start with an empty case-action timeline");
const migrateDemoStateCaseActionsBody = functionBody(html, "migrateDemoState");
assert.match(migrateDemoStateCaseActionsBody, /caseActions[^]*(?:Array\.isArray|\?)[^]*:\s*\[\s*\]/, "Migration must preserve valid case actions and safely default malformed history");

const scopedCaseActionsBody = functionBody(html, "scopedCaseActions");
assert.match(scopedCaseActionsBody, /getCaseRecord\s*\(/, "Timeline lookup must first resolve the case through the current AP scope");
assert.match(scopedCaseActionsBody, /demoState\.caseActions/, "Timeline entries must come from browser-local demo state");
assert.match(scopedCaseActionsBody, /caseId/, "Timeline entries must be linked to their authorized case");
assert.match(scopedCaseActionsBody, /sort\s*\(/, "Case actions must render in deterministic timeline order");

const activeStaffForCaseBody = functionBody(html, "activeStaffForCase");
assert.match(activeStaffForCaseBody, /getCaseRecord|record\.farmId|farmId/, "Assessment owners must be resolved from the scoped case farm");
assert.match(activeStaffForCaseBody, /managedUsers/, "Assessment owners must originate from the managed user directory");
assert.match(activeStaffForCaseBody, /roleId\s*===?\s*["']staff["']|roleId[^]*staff/, "Only Field Staff accounts may own a field assessment");
assert.match(activeStaffForCaseBody, /active/, "Inactive Field Staff accounts must not be offered as assessment owners");
assert.match(activeStaffForCaseBody, /scope[^]*(?:farmId|record\.farmId)|(?:farmId|record\.farmId)[^]*scope/, "Assessment owners must be explicitly assigned to the case farm");

const submitCaseAssessmentBody = functionBody(html, "submitCaseAssessment");
assert.match(submitCaseAssessmentBody, /getCaseRecord\s*\(/, "Assessment submission must resolve an already-scoped case before validation or mutation");
assert.match(submitCaseAssessmentBody, /admin[^]*staff|staff[^]*admin/, "Only System Administrator and Field Staff may submit the assessment form");
assert.match(submitCaseAssessmentBody, /Under assessment/, "The assessment form must be limited to cases still under assessment");
assert.match(submitCaseAssessmentBody, /Pending[^]*In progress[^]*Completed/, "Assessment status must use the exact Pending, In progress, and Completed options");
assert.match(submitCaseAssessmentBody, /(?:new Set|includes)[^]*(?:Pending|In progress|Completed)/, "Assessment status must be checked against a fail-closed allowlist");
assert.match(submitCaseAssessmentBody, /description[^]*trim\s*\(/, "Assessment observations must be trimmed before validation and persistence");
assert.match(submitCaseAssessmentBody, /replace\s*\([^]*(?:\\s|space)/, "Assessment observations must normalize internal whitespace");
assert.match(submitCaseAssessmentBody, /10[^]*500|500[^]*10/, "Assessment observations must enforce the accepted 10-500 character range");
assert.match(submitCaseAssessmentBody, /[A-Za-z]|letter/i, "Assessment observations must contain at least three letters rather than punctuation alone");
assert.match(submitCaseAssessmentBody, /activeStaffForCase\s*\(/, "Assessment owner validation must use the active assigned-staff selector");
assert.match(submitCaseAssessmentBody, /ownerId/, "Assessment submission must validate a stable owner ID rather than trusting visible owner text");
assert.match(submitCaseAssessmentBody, /Completed[^]*Confirmed|Confirmed[^]*Completed/, "Only a completed field assessment may confirm an Under assessment case");
assert.match(submitCaseAssessmentBody, /Pending|In progress/, "Pending and in-progress assessments must remain valid timeline-only updates");
assert.match(submitCaseAssessmentBody, /caseActions[^]*(?:push|\.\.\.)/, "A valid assessment must append an immutable timeline entry");
for (const field of ["caseId", "farmId", "treeId", "action", "description", "status", "ownerId", "owner", "actor", "actorRole", "timestamp"]) {
  assert.match(submitCaseAssessmentBody, new RegExp(`\\b${field}\\b`), `CaseActionEntry must persist ${field}`);
}
assert.match(submitCaseAssessmentBody, /CURRENT_USER_BY_ROLE|currentUser|actor/, "Timeline entries must identify the signed-in demo actor");
assert.match(submitCaseAssessmentBody, /roles\[state\.role\]|actorRole/, "Timeline entries must identify the actor role");
assert.match(submitCaseAssessmentBody, /new Date\s*\(\s*\)\.toISOString\s*\(\s*\)/, "Timeline entries must carry an ISO event time");
assert.match(submitCaseAssessmentBody, /saveDemoState\s*\(/, "Assessment submission must persist through the versioned browser-local state document");
assert.match(submitCaseAssessmentBody, /if\s*\(\s*!saveDemoState|saveDemoState\s*\(\s*\)\s*===\s*false|saved/, "Assessment submission must detect a browser storage failure");
assert.match(submitCaseAssessmentBody, /previous|rollback|caseActions\s*=|demoState\s*=/, "A failed assessment write must restore the previous in-memory state");
assert.match(submitCaseAssessmentBody, /not available in your assigned AP scope|not available/i, "Unknown and out-of-scope cases must receive the same non-identifying denial");
assert.match(submitCaseAssessmentBody, /focus\s*\(/, "Invalid assessment submission must focus the first invalid control");
assert.match(submitCaseAssessmentBody, /statusMessage|aria-live|announce/i, "Assessment validation and success must be announced to assistive technology");

const renderCaseAssessmentFormBody = functionBody(html, "renderCaseAssessmentForm");
const renderCaseTimelineBody = functionBody(html, "renderCaseTimeline");
const caseAssessmentUi = [renderCaseDetailBody, renderCaseAssessmentFormBody, renderCaseTimelineBody].join("\n");
for (const id of ["caseAssessmentDescription", "caseAssessmentStatus", "caseAssessmentOwner", "caseAssessmentError"]) {
  assert.match(caseAssessmentUi, new RegExp(id), `Assessment UI must expose stable ${id} semantics`);
}
assert.match(renderCaseDetailBody, /renderCaseAssessmentForm\s*\(/, "Case Detail must include the guarded assessment form composition");
assert.match(renderCaseDetailBody, /renderCaseTimeline\s*\(/, "Case Detail must include its append-only timeline composition");
assert.match(renderCaseAssessmentFormBody, /data-case-assessment/, "Assessment submission needs an explicit form/action hook");
assert.match(renderCaseAssessmentFormBody, /Pending[^]*In progress[^]*Completed/, "The assessment form must visibly expose the exact accepted status choices");
assert.match(renderCaseTimelineBody, /case-timeline/, "Case Detail must render the append-only field assessment timeline");
assert.match(renderCaseTimelineBody, /scopedCaseActions\s*\(/, "Case Detail timeline must contain only actions for its authorized case");
assert.match(renderCaseAssessmentFormBody, /role=["']alert["']|aria-live=["'](?:assertive|polite)["']/, "Assessment validation errors must be announced live");
assert.match(bindCaseTreatmentEventsBody, /submitCaseAssessment\s*\(/, "The Field Staff assessment form must bind through the guarded assessment mutation");

// Legal role workflows remain available alongside the richer assessment form.
// Completed treatments are terminal, while advancing into Completed requires a
// meaningful outcome and remains restricted to Administrator/Area Manager.
assert.deepEqual(caseActionsByRole.admin, ["field-assessment", "area-action", "reopen"], "System Administrator must retain all case actions");
assert.deepEqual(caseActionsByRole.manager, ["area-action"], "Area Manager must retain the area action only");
assert.deepEqual(caseActionsByRole.ceo, ["reopen"], "CEO / General Manager must retain reopen only");
assert.deepEqual(caseActionsByRole.head, ["reopen"], "Plantation Head must retain reopen only");
assert.match(progressTreatmentBody, /Completed[^]*(?:return|not available|cannot|immutable)|!nextStatus/, "Completed treatments must remain immutable");
assert.match(progressTreatmentBody, /10/, "Completing a treatment must require a meaningful outcome of at least ten characters");
assert.doesNotMatch(scopedCasesBody, /localFarms|source\s*===?\s*["']local-user["'][^]*(?:caseRecords\.push|caseActions\.push)/, "Creating a browser-local farm must not invent a case");
assert.doesNotMatch(scopedTreatmentsBody, /localFarms|source\s*===?\s*["']local-user["'][^]*treatmentRecords\.push/, "Creating a browser-local farm must not invent a treatment");
assert.match(resetBody, /defaultDemoState|removeItem/, "Reset must remove appended assessment timelines and restore deterministic case/treatment state");

// Administration is an AP-only, browser-local demonstration. Its seed users,
// scope options, and access matrix remain inspectable so permission drift is
// caught independently of visual navigation checks.
assert.deepEqual(
  Object.keys(roles).filter((roleId) => roles[roleId].nav.includes("Administration")),
  ["admin", "ceo"],
  "Administration must be visible only to System Administrator and CEO / General Manager"
);
assert.ok(Array.isArray(managedUsers) && managedUsers.length >= 5, "Administration needs an inspectable AP demo user directory");
assert.equal(new Set(managedUsers.map((user) => user.id)).size, managedUsers.length, "Managed user IDs must be unique");
for (const user of managedUsers) {
  assert.match(user.id, /^usr-/, `${user.id || "Managed user"} must have a stable demo account ID`);
  assert.ok(Object.hasOwn(roles, user.roleId), `${user.id} must use a built-in role`);
  assert.ok(typeof user.name === "string" && user.name.length > 0, `${user.id} must have a display name`);
  assert.match(user.email, /@palmwatch\.demo$/, `${user.id} must use a clearly demo-labelled email`);
  assert.ok(
    adminScopeOptions[user.roleId].some((option) => option.id === user.scope),
    `${user.id} scope must be one of its role's approved AP-only options`
  );
}
assert.deepEqual(
  managedUsers.filter((user) => user.protected).map((user) => ({ id: user.id, roleId: user.roleId })),
  [{ id: "usr-admin", roleId: "admin" }],
  "Exactly the System Administrator demo account must be protected"
);
assert.deepEqual(Object.keys(currentUserByRole), Object.keys(roles), "Every built-in role needs one current demo identity");
for (const [roleId, userId] of Object.entries(currentUserByRole)) {
  assert.equal(managedUsers.find((user) => user.id === userId)?.roleId, roleId, `${roleId} must map to its own current demo account`);
}
assert.deepEqual(
  roleAccessMatrix.map((row) => row.roleId),
  Object.keys(roles),
  "The read-only built-in role matrix must include every role exactly once"
);
assert.deepEqual(
  roleAccessMatrix.filter((row) => row.administration).map((row) => row.roleId),
  ["admin", "ceo"],
  "The built-in role matrix must agree with Administration navigation"
);
assert.ok(Array.isArray(activityEvents) && activityEvents.length > 0, "System Administrator needs inspectable AP demo security activity");
assert.ok(activityEvents.every((event) => /^EVT-AP-/.test(event.id)), "Every activity event must be AP-scoped demo data");

const currentManagedUserBody = functionBody(html, "currentManagedUser");
assert.match(currentManagedUserBody, /CURRENT_USER_BY_ROLE\s*\[\s*state\.role\s*\]/, "Current-user guards must derive identity from the signed-in role");
const scopedManagedUsersBody = functionBody(html, "scopedManagedUsers");
assert.match(scopedManagedUsersBody, /admin|ceo/, "Managed users must fail closed for roles without Administration access");
assert.match(scopedManagedUsersBody, /return\s*\[\s*\]/, "Unauthorized Administration access must expose no user identity");
assert.match(scopedManagedUsersBody, /managedUsers/, "Authorized Administration access must derive from the AP demo directory");
const getManagedUserBody = functionBody(html, "getManagedUser");
assert.match(getManagedUserBody, /scopedManagedUsers\s*\(\s*\)/, "Managed-user lookup must search only the authorized Administration scope");
assert.match(getManagedUserBody, /\|\|\s*null|\?\?\s*null/, "Unknown and unauthorized user IDs must return the same null result");

const updateManagedUserStatusBody = functionBody(html, "updateManagedUserStatus");
assert.match(updateManagedUserStatusBody, /getManagedUser/, "Account status mutation must resolve an already-scoped managed user");
assert.match(updateManagedUserStatusBody, /protected/, "The protected System Administrator account must be immutable");
assert.match(updateManagedUserStatusBody, /currentManagedUser|CURRENT_USER_BY_ROLE/, "A current user must not deactivate their own account");
assert.match(updateManagedUserStatusBody, /demoState\.administration/, "Account activation changes must remain browser-local demo overrides");
assert.match(updateManagedUserStatusBody, /saveDemoState/, "Account activation changes must persist through the versioned demo state");
assert.match(updateManagedUserStatusBody, /not available|cannot|protected/i, "Denied account changes need non-identifying or explicit protected/self status copy");
const updateManagedUserScopeBody = functionBody(html, "updateManagedUserScope");
assert.match(updateManagedUserScopeBody, /getManagedUser/, "Scope mutation must resolve an already-scoped managed user");
assert.match(updateManagedUserScopeBody, /ADMIN_SCOPE_OPTIONS/, "Scope changes must validate against the target role's AP-only options");
assert.match(updateManagedUserScopeBody, /protected/, "The protected System Administrator scope must be immutable");
assert.match(updateManagedUserScopeBody, /demoState\.administration/, "Scope changes must remain browser-local demo overrides");
assert.match(updateManagedUserScopeBody, /saveDemoState/, "Scope changes must persist through the versioned demo state");
const issuePasswordResetBody = functionBody(html, "issuePasswordReset");
assert.match(issuePasswordResetBody, /getManagedUser/, "Password-reset demonstration must resolve an already-scoped managed user");
assert.match(issuePasswordResetBody, /demoState\.administration/, "Password-reset demonstration must record only browser-local activity");
assert.match(issuePasswordResetBody, /saveDemoState/, "Password-reset activity must persist through the versioned demo state");
assert.doesNotMatch(issuePasswordResetBody, /password\s*=|credential|token/i, "The static demo must never create credentials or reset tokens");

const scopedActivityEventsBody = functionBody(html, "scopedActivityEvents");
assert.match(scopedActivityEventsBody, /state\.role\s*!==?\s*["']admin["']|state\.role\s*===?\s*["']admin["']/, "Full security activity must be restricted to System Administrator");
assert.match(scopedActivityEventsBody, /return\s*\[\s*\]/, "CEO/GM and lower roles must receive no full security activity rows");
assert.match(scopedActivityEventsBody, /activityEvents/, "System Administrator activity must include deterministic AP seed events");

const previewCustomRoleBody = functionBody(html, "previewCustomRole");
assert.match(previewCustomRoleBody, /name|permission|scope/i, "Custom-role preview must validate its identity, permissions, and AP scope");
assert.match(previewCustomRoleBody, /error|valid|trim|required/i, "Incomplete custom roles must produce validation feedback");
assert.doesNotMatch(previewCustomRoleBody, /demoState|saveDemoState|localStorage/, "Custom-role preview must never create or persist a role");

// Settings is available to every role and owns only per-role preferences.
assert.ok(Object.values(roles).every((role) => role.nav.includes("Settings")), "Settings must remain available to every built-in role");
const getPreferencesBody = functionBody(html, "getPreferences");
assert.match(getPreferencesBody, /demoState\.preferences/, "Preferences must be read from browser-local demo state");
assert.match(getPreferencesBody, /state\.role/, "Preferences must be isolated to the current role/account");
assert.match(getPreferencesBody, /notifications/, "Notification preference needs a deterministic default");
assert.match(getPreferencesBody, /comfortable/, "Display density must default to comfortable");
const applyPreferencesBody = functionBody(html, "applyPreferences");
assert.match(applyPreferencesBody, /density-compact|compact/, "Compact density preference must visibly affect the application shell");
assert.match(applyPreferencesBody, /document\.(?:body|documentElement)|classList|dataset/, "Display density must be applied to rendered UI");
const updatePreferenceBody = functionBody(html, "updatePreference");
assert.match(updatePreferenceBody, /notifications|density/, "Only supported notification and density preferences may be changed");
assert.match(updatePreferenceBody, /comfortable|compact/, "Display density must accept only comfortable or compact");
assert.match(updatePreferenceBody, /state\.role/, "Preference writes must be isolated to the current role/account");
assert.match(updatePreferenceBody, /saveDemoState/, "Preference changes must persist through the versioned demo state");
assert.match(updatePreferenceBody, /applyPreferences/, "Density changes must apply immediately after persistence");

const loadDemoStateBody = functionBody(html, "loadDemoState");
const saveDemoStateBody = functionBody(html, "saveDemoState");
assert.match(loadDemoStateBody, /try\s*\{[^]*localStorage\.getItem[^]*\}\s*catch/s, "Unavailable or corrupt local storage must safely fall back during load");
assert.match(saveDemoStateBody, /try\s*\{[^]*localStorage\.setItem[^]*\}\s*catch/s, "Unavailable local storage must not break preference or admin actions");
assert.match(resetBody, /try\s*\{[^]*localStorage\.removeItem[^]*\}\s*catch/s, "Unavailable local storage must not break demo reset");
for (const stateArea of ["accounts", "cases", "treatments", "administration", "reportHistory", "preferences"]) {
  assert.match(defaultDemoStateBody, new RegExp(`${stateArea}\\s*:`), `Reset defaults must include ${stateArea}`);
}

const renderAdministrationBody = functionBody(html, "renderAdministration");
assert.match(renderAdministrationBody, /\[\s*["']admin["']\s*,\s*["']ceo["']\s*\]\.includes\s*\(\s*state\.role\s*\)/, "Administration rendering must independently enforce Admin/CEO access");
assert.match(renderAdministrationBody, /scopedManagedUsers\s*\(\s*\)/, "Administration must render only AP-scoped managed users");
assert.match(renderAdministrationBody, /scopedActivityEvents\s*\(\s*\)/, "Administration must use the System Administrator-only activity selector");
assert.match(renderAdministrationBody, /User directory/i, "Administration needs a managed user directory");
assert.match(renderAdministrationBody, /protected[^]*disabled|disabled[^]*protected/i, "Protected System Administrator controls must be disabled in the UI");
assert.match(renderAdministrationBody, /currentManagedUser|isSelf/, "Self-account controls must be identified before rendering deactivation actions");
assert.match(renderAdministrationBody, /AP assignment[^]*<select/i, "Managed user scopes need an explicitly labelled AP selector");
assert.match(renderAdministrationBody, /Issue reset link/i, "Administration needs a clearly labelled password-reset demonstration action");
assert.match(renderAdministrationBody, /Built-in role and access matrix/i, "Administration needs the read-only built-in role matrix");
assert.match(renderAdministrationBody, /role=["']table["']/, "The built-in role matrix needs accessible table semantics");
assert.match(renderAdministrationBody, /Custom role preview/i, "Administration needs custom-role validation and preview");
assert.match(renderAdministrationBody, /not saved|without creating or storing/i, "Custom role UI must disclose that previews are not persisted");
assert.match(renderAdministrationBody, /Restricted to System Administrator/i, "CEO/GM must see an explicit security-activity restriction state");
assert.match(renderAdministrationBody, /role=["']status["'][^]*aria-live=["']polite["']|aria-live=["']polite["'][^]*role=["']status["']/, "Administration changes and validation need an accessible live status");

const renderSettingsBody = functionBody(html, "renderSettings");
for (const label of ["Account and assignment", "Name", "Email", "Role", "AP scope"]) {
  assert.match(renderSettingsBody, new RegExp(label, "i"), `Settings account summary is missing ${label}`);
}
assert.match(renderSettingsBody, /Notifications/i, "Settings needs an operational notifications preference");
assert.match(renderSettingsBody, /type=["']checkbox["']/, "Notifications must use a labelled checkbox");
assert.match(renderSettingsBody, /Display density/i, "Settings needs display-density controls");
assert.match(renderSettingsBody, /role=["']radiogroup["'][^]*aria-label=["']Display density["']|aria-label=["']Display density["'][^]*role=["']radiogroup["']/, "Density choices need an accessible labelled radio group");
assert.match(renderSettingsBody, /value=["']comfortable["']/, "Settings must offer Comfortable density");
assert.match(renderSettingsBody, /value=["']compact["']/, "Settings must offer Compact density");
assert.match(renderSettingsBody, /resetConfirm/, "Reset must require an explicit confirmation state");
assert.match(renderSettingsBody, /confirmDemoReset/, "Reset must require a second confirmed action");
assert.match(renderSettingsBody, /cancelDemoReset/, "The reset confirmation must be cancellable");
for (const label of ["alert", "case", "treatment", "administration", "report history", "preferences"]) {
  assert.match(renderSettingsBody, new RegExp(label, "i"), `Reset disclosure must identify cleared ${label} state`);
}
assert.match(renderSettingsBody, /deterministic AP farm dataset remains unchanged|will not remove farms or trees/i, "Reset must disclose that AP farm/tree seed data is retained");
assert.match(renderSettingsBody, /role=["']status["'][^]*aria-live=["']polite["']|aria-live=["']polite["'][^]*role=["']status["']/, "Settings changes need an accessible live status");

const renderProfileMenuBody = functionBody(html, "renderProfileMenu");
assert.match(html, /id=["']profileBtn["'][^>]*aria-haspopup=["']menu["'][^>]*aria-expanded=["']false["']|id=["']profileBtn["'][^>]*aria-expanded=["']false["'][^>]*aria-haspopup=["']menu["']/, "Profile trigger needs accessible menu state");
assert.match(html, /id=["']profileMenu["'][^>]*role=["']menu["']/, "Profile actions need a menu container");
assert.match(renderProfileMenuBody, /role=["']menuitem["'][^]*Settings/i, "Profile menu must provide Settings as a menu item");
assert.match(renderProfileMenuBody, /role=["']menuitem["'][^]*Sign out/i, "Profile menu must provide Sign out as a menu item");
assert.match(renderProfileMenuBody, /aria-expanded/, "Opening and closing the profile menu must update its expanded state");
assert.match(renderProfileMenuBody, /state\.signedOut\s*=\s*true/, "Sign out must enter a dedicated fail-closed view");
const renderSignedOutBody = functionBody(html, "renderSignedOut");
assert.match(renderSignedOutBody, /nav\.innerHTML\s*=\s*["']{2}/, "Signed-out view must remove operational navigation");
assert.match(renderSignedOutBody, /Signed out/i, "Signed-out state needs a clear heading");
assert.match(renderSignedOutBody, /Return to sign in/i, "Signed-out state needs an explicit local demo return action");
assert.doesNotMatch(renderSignedOutBody, /flatFarms|scopedDistricts|caseRecords|treatmentRecords|alertRecords/, "Signed-out rendering must not read or disclose operational records");

assert.match(renderAppBody, /Administration[^]*renderAdministration/, "Administration must render its dedicated page rather than a placeholder");
assert.match(renderAppBody, /Settings[^]*renderSettings/, "Settings must render its dedicated page rather than a placeholder");
assert.match(renderAppBody, /roles\[state\.role\]\.nav\.includes\s*\(\s*state\.page\s*\)/, "Guarded navigation must fail closed before rendering an unauthorized page");

for (const farm of farms) {
  assert.ok(Number.isInteger(farm.acres) && farm.acres > 0, `${farm.id} must have positive whole-acre demo acreage`);
  assert.ok(farm.density >= 50 && farm.density <= 57, `${farm.id} density must stay within 50-57 palms per acre`);
  assert.equal(farm.trees, farm.acres * farm.density, `${farm.id} planted palms must reconcile with acreage and density`);
  assert.ok(farm.lat >= 12.5 && farm.lat <= 19.2, `${farm.id} latitude must be within Andhra Pradesh bounds`);
  assert.ok(farm.lon >= 76.7 && farm.lon <= 84.8, `${farm.id} longitude must be within Andhra Pradesh bounds`);
  assert.ok(farm.infected >= 0, `${farm.id} infected count cannot be negative`);
  for (const field of ["trees", "surveyed", "infected", "suspected", "pending"]) {
    assert.ok(Number.isInteger(farm[field]), `${farm.id} ${field} must be a whole-palm count`);
  }
  assert.ok(farm.infected <= farm.suspected, `${farm.id} infected palms cannot exceed suspected palms`);
  assert.ok(farm.suspected <= farm.surveyed, `${farm.id} suspected palms cannot exceed surveyed palms`);
  assert.ok(farm.surveyed <= farm.trees, `${farm.id} surveyed palms cannot exceed planted palms`);
  assert.ok(farm.pending >= 0 && farm.pending <= farm.trees, `${farm.id} pending work must reconcile within the farm population`);
  assert.ok(farm.risk >= 0 && farm.risk <= 1, `${farm.id} infection rate must be a valid proportion`);
  assert.ok(Math.abs(farm.risk - farm.infected / farm.trees) <= .005, `${farm.id} infection rate must reconcile with infected and planted palms`);
}

assert.match(html, /deterministic demo data/i, "Operational data must be explicitly labelled deterministic demo data");

// Map and Table must render the same scoped node collection and share the same
// drill-down hook so switching views cannot widen or change the portfolio.
assert.match(functionBody(html, "renderOverview"), /scopedDistricts\s*\(/, "Explorer roots must be built from the complete role-scoped AP hierarchy");
assert.match(html, /mapView\s*\(\s*nodes\s*,\s*level\s*\)/, "Map view must consume the scoped Explorer nodes");
assert.match(html, /tableView\s*\(\s*nodes\s*,\s*level\s*\)/, "Table view must consume the scoped Explorer nodes");
const tableViewBody = functionBody(html, "tableView");
for (const column of ["farm", "Planted palms", "Infected", "Infection", "Yield", "Health"]) {
  assert.match(tableViewBody, new RegExp(column, "i"), `Table view must expose the ${column} column`);
}
assert.match(tableViewBody, /role=["']region["'][^]*portfolio table/i, "Table view must be a named horizontally-scrollable region");
assert.ok((html.match(/data-open=/g) || []).length >= 2, "Map and Table need equivalent drill-down hooks");

const scopeFarmIdsBodyForExpansion = functionBody(html, "scopeFarmIds");
const scopeFarmIdsForExpansion = Function(
  "districts",
  "flatFarms",
  `return function scopeFarmIds(scope){${scopeFarmIdsBodyForExpansion}};`
)(districts, flattenFarms);
const allApAdminFarmIds = scopeFarmIdsForExpansion("ap-all");
assert.equal(allApAdminFarmIds.length, 19, "Administration's All Andhra Pradesh assignment must include all 19 farms");
for (const farmId of expansionFarmIds) {
  assert.ok(allApAdminFarmIds.includes(farmId), `Administration scope must include the new farm ${farmId}`);
}
assert.ok(adminScopeOptions.head.some((option) => option.id === "kakinada-ntr"), "Administration must offer a Kakinada + NTR Plantation Head assignment");
for (const scope of ["peddapuram", "jaggampeta", "mylavaram", "tiruvuru"]) {
  assert.ok(adminScopeOptions.manager.some((option) => option.id === scope), `Administration must offer the ${scope} Area Manager assignment`);
  assert.equal(scopeFarmIdsForExpansion(scope).length, 2, `${scope} Administration scope must resolve its two accepted farms`);
}
assert.deepEqual(
  new Set(scopeFarmIdsForExpansion("kakinada-ntr")),
  expansionFarmIds,
  "The Kakinada + NTR Administration assignment must resolve exactly the eight expansion farms"
);
assert.deepEqual(scopeFarmIdsForExpansion("__unknown_scope__"), [], "Unknown Administration scopes must fail closed");

const renderOverviewBody = functionBody(html, "renderOverview");
for (const [pattern, description] of [
  [/Operational data basis/i, "the removed operational-data notice"],
  [/Public context/i, "the removed public-context notice"],
  [/Planting-density reference|agritech\.tnau\.ac\.in/i, "the planting-density source link"],
  [/godrejagrovet\.com\/businesses\/oil-palm-business|Godrej Agrovet|65,000|75,000/i, "Godrej public-source copy or figures"],
  [/horticulture\.ap\.nic\.in|226,528|476,913|24 districts/i, "AP Horticulture source copy or figures"],
  [/publicFacts/i, "the obsolete publicFacts runtime model"],
]) {
  assert.doesNotMatch(renderOverviewBody, pattern, `Overview must not render ${description}`);
}

const overviewSubtitleMatch = /<p\s+class=["']sub["']>([^<]+)<\/p>/i.exec(renderOverviewBody);
assert.ok(overviewSubtitleMatch, "Overview needs one concise operational-data subtitle");
const overviewSubtitle = overviewSubtitleMatch[1].replace(/\s+/g, " ").trim();
assert.match(overviewSubtitle, /deterministic demo data from the supplied workbook/i, "Overview subtitle must identify the company-scoped workbook-derived demo data");
assert.match(
  overviewSubtitle,
  /do(?:es)? not imply (?:farm )?ownership|not necessarily company-owned|not proof of (?:farm )?ownership/i,
  "Overview subtitle must retain the non-ownership qualification"
);
assert.ok(overviewSubtitle.length <= 220, "Overview subtitle must stay concise rather than recreating the removed notices");
assert.match(
  renderOverviewBody,
  /\$\{\s*metricStrip\s*\(\s*m\s*\)\s*\}\s*\$\{\s*state\.view\s*===\s*["']map["']\s*\?\s*mapView\s*\(\s*nodes\s*,\s*level\s*\)\s*:\s*tableView\s*\(\s*nodes\s*,\s*level\s*\)\s*\}/,
  "The Map/Table explorer must follow the metric strip immediately and both views must receive the same scoped nodes"
);

// The supplied survey gallery is a fixed, audited demo asset set. Source hashes
// preserve provenance; derivative hashes and dimensions prevent a later asset
// replacement or accidental reintroduction of the identifying top overlay.
const evidenceManifestUrl = new URL("../assets/tree-evidence/manifest.json", import.meta.url);
assert.ok(existsSync(evidenceManifestUrl), "The audited tree-evidence manifest must be bundled with the static app");
const evidenceManifest = JSON.parse(readFileSync(evidenceManifestUrl, "utf8"));
assert.equal(evidenceManifest.version, 2, "The supplied 0001 gallery manifest needs an explicit version");
assert.equal(evidenceManifest.captureId, "DJI_20260620095043_0001", "The gallery must use the supplied 0001 capture");
assert.equal(evidenceManifest.classification, "demo", "Supplied survey imagery must remain classified as demo context");
assert.equal(evidenceManifest.captureDate, "2026-06-20", "The source capture date must remain deterministic");
assert.equal(evidenceManifest.sourcesRetainedOutsideWebBundle, true, "Original source captures must stay outside the browser bundle");
assert.match(evidenceManifest.notice, /real demonstration survey context/i, "The manifest must identify the images as real demonstration survey context");
assert.match(evidenceManifest.notice, /reused for every simulated tree/i, "The manifest must state that the supplied capture is reused across demo trees");
assert.match(evidenceManifest.notice, /proof of farm ownership/i, "The manifest must not imply ownership from survey imagery");
assert.match(evidenceManifest.notice, /not .*source of displayed NDVI, NDRE, Ganoderma confidence, temperature, or trend values/i, "The manifest must prohibit image-derived indices and assessment");
assert.deepEqual(
  evidenceManifest.views.map(({ id, label, band, sourceFilename }) => ({ id, label, band, sourceFilename })),
  [
    { id:"rgb", label:"RGB", band:"Visible RGB", sourceFilename:"DJI_20260620095043_0001_D.JPG" },
    { id:"false-colour", label:"False colour", band:"Camera false-colour", sourceFilename:"DJI_20260620095043_0001_F.JPG" },
    { id:"green", label:"Green", band:"Green", sourceFilename:"DJI_20260620095043_0001_MS_G.TIF" },
    { id:"red", label:"Red", band:"Red", sourceFilename:"DJI_20260620095043_0001_MS_R.TIF" },
    { id:"red-edge", label:"Red-edge", band:"Red-edge", sourceFilename:"DJI_20260620095043_0001_MS_RE.TIF" },
    { id:"near-infrared", label:"NIR", band:"Near-infrared", sourceFilename:"DJI_20260620095043_0001_MS_NIR.TIF" },
  ],
  "The audited external manifest must list the supplied 0001 RGB, false-colour, Green, Red, Red-edge, and NIR views"
);
for (const item of evidenceManifest.views) {
  assert.match(item.sourceSha256, /^[a-f0-9]{64}$/, `${item.id} must record the supplied source hash`);
  assert.ok(Array.isArray(item.sourceDimensions) && item.sourceDimensions.length === 2, `${item.id} must record source dimensions`);
  assert.match(item.derivative, /^assets\/tree-evidence\/.+\.webp$/, `${item.id} must point to a browser WebP derivative`);
  assert.ok(item.derivativeDimensions[0] <= 1400 && item.derivativeDimensions[1] <= 1400, `${item.id} derivative must be review-sized`);
  assert.match(item.processing, /resized to maximum 1400 px/i, `${item.id} processing must document the browser derivative`);
  assert.equal(item.classification, "demo", `${item.id} must retain demo classification`);
  const derivativeUrl = new URL(`../${item.derivative}`, import.meta.url);
  assert.ok(existsSync(derivativeUrl), `${item.id} browser derivative is missing: ${item.derivative}`);
  assert.deepEqual(webpDimensions(readFileSync(derivativeUrl)), item.derivativeDimensions, `${item.id} derivative dimensions must match the manifest`);
}
assert.equal(treeObservation.treeId, "demo-all-trees", "The deterministic observation template must be reusable across demo trees");
assert.match(treeObservation.disclosure, /Demo interpretation bands and simulated readings only/i, "Tree indicators must disclose their simulated interpretation basis");
assert.match(treeObservation.disclosure, /No NDVI, NDRE, diagnosis, Ganoderma confidence, canopy temperature, or recent trend is derived from the supplied images/i, "Tree indicators must explicitly separate every reading from the supplied imagery");
assert.equal(treeEvidenceManifest.captureId, evidenceManifest.captureId, "The rendered gallery must use the audited manifest capture");
assert.equal(treeEvidenceManifest.classification, "demo", "The rendered gallery must retain demo classification");
assert.deepEqual(
  treeEvidenceManifest.views.map(({ id, label, band, src }) => ({ id, label, band, src })),
  evidenceManifest.views.map(({ id, label, band, derivative }) => ({ id, label, band, src: derivative })),
  "The gallery's rendered view list must exactly mirror the audited external manifest"
);
assert.ok(treeEvidenceManifest.views.every((view) => /demonstration|demo|supplied/i.test(view.alt)), "Every evidence image needs meaningful demonstration-context alt text");

assert.doesNotMatch(
  html,
  /(?:near-infrared|\bnir\b)\s*[-+]\s*(?:red|red-edge)|(?:red|red-edge)\s*[-+]\s*(?:near-infrared|\bnir\b)/i,
  "The static app must never calculate NDVI or NDRE from the supplied uncalibrated image bands"
);

const treeEvidenceForBody = functionBody(html, "treeEvidenceFor");
assert.match(treeEvidenceForBody, /TREE_EVIDENCE_MANIFEST/, "Every demo tree must receive the supplied evidence manifest");
assert.match(treeEvidenceForBody, /status===["']neutral["'][^]*values\s*:\s*null|values\s*:\s*null[^]*status===["']neutral["']/, "No-data trees must not receive fabricated Ganoderma readings");
assert.match(treeEvidenceForBody, /ganodermaConfidence\s*:\s*82/, "Danger trees need high Ganoderma confidence demo readings");
assert.match(treeEvidenceForBody, /ganodermaConfidence\s*:\s*52/, "Suspected trees need moderate Ganoderma confidence demo readings");
assert.match(treeEvidenceForBody, /ganodermaConfidence\s*:\s*18/, "Healthy trees need low Ganoderma confidence demo readings");

const renderTreeBody = functionBody(html, "renderTree");
assert.match(renderTreeBody, /treeEvidenceFor\s*\(\s*cell\s*\)/, "Tree Details must resolve evidence from the selected tree health state");
assert.match(renderTreeBody, /renderTreeEvidence\s*\(\s*observation\s*\)/, "Tree Details must render the supplied gallery result");
assert.match(renderTreeBody, /renderGanodermaIndicators\s*\(\s*observation\s*\)/, "Tree Details must render indicators from the separate deterministic observation");

const renderTreeEvidenceBody = functionBody(html, "renderTreeEvidence");
assert.match(renderTreeEvidenceBody, /role=["']tablist["'][^]*aria-label=["']Survey image views["']|aria-label=["']Survey image views["'][^]*role=["']tablist["']/, "Gallery view buttons need an accessible named selector");
assert.match(renderTreeEvidenceBody, /role=["']tab["'][^]*aria-selected=["']\$\{view\.id===selected\.id\}["'][^]*tabindex=["']\$\{view\.id===selected\.id\?0:-1\}["']/, "Gallery buttons need roving keyboard focus and selected state");
assert.match(renderTreeEvidenceBody, /role=["']tabpanel["'][^]*aria-labelledby=/, "The full-size evidence preview needs tabpanel semantics");
assert.match(renderTreeEvidenceBody, /<img[^>]*alt=["']\$\{selected\.alt\}["']/, "The evidence preview must use its meaningful manifest alt text");
assert.match(renderTreeEvidenceBody, /Loading \$\{selected\.label\} preview/i, "The evidence gallery needs a visible loading fallback");
assert.match(renderTreeEvidenceBody, /preview could not be loaded/i, "The evidence gallery needs an actionable image-error fallback");
assert.match(renderTreeEvidenceBody, /real demonstration survey context/i, "The gallery must visibly identify the real imagery as demo context");
assert.match(renderTreeEvidenceBody, /identifying overlays cropped/i, "The gallery must disclose the privacy crop");
assert.match(renderTreeEvidenceBody, /spectral bands are independently display-stretched/i, "The gallery must disclose independent TIFF display stretching");

const handleEvidenceKeydownBody = functionBody(html, "handleEvidenceKeydown");
for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
  assert.match(handleEvidenceKeydownBody, new RegExp(`["']${key}["']`), `Gallery keyboard navigation must support ${key}`);
}
assert.match(handleEvidenceKeydownBody, /preventDefault\s*\(\s*\)/, "Handled gallery navigation keys must not scroll the page");
assert.match(handleEvidenceKeydownBody, /setEvidenceView\s*\([^,]+,\s*true\s*\)/, "Keyboard gallery navigation must move focus with selection");
const bindTreeEvidenceBody = functionBody(html, "bindTreeEvidence");
assert.match(bindTreeEvidenceBody, /addEventListener\s*\(\s*["']keydown["']\s*,\s*handleEvidenceKeydown\s*\)/, "Every gallery tab must bind keyboard navigation");
assert.match(bindTreeEvidenceBody, /addEventListener\s*\(\s*["']load["']\s*,\s*markEvidenceReady\s*\)/, "Evidence loading state must resolve on image load");
assert.match(bindTreeEvidenceBody, /addEventListener\s*\(\s*["']error["']\s*,\s*markEvidenceError\s*\)/, "Evidence image failure must reveal the fallback");

const indicatorStatusBody = functionBody(html, "indicatorStatus");
const indicatorStatus = Function("indicator", `return (function indicatorStatus(indicator){${indicatorStatusBody}})(indicator);`);
for (const [id, values] of Object.entries({
  ndvi: [[0.44, "bad"], [0.55, "risk"], [0.7, "ok"]],
  ndre: [[0.2, "bad"], [0.32, "risk"], [0.5, "ok"]],
  ganodermaConfidence: [[20, "ok"], [50, "risk"], [80, "bad"]],
  canopyTemperature: [[31, "ok"], [33, "risk"], [36, "bad"]],
  recentRiskTrend: [[0.03, "ok"], [0.1, "risk"], [0.2, "bad"]],
})) {
  for (const [value, status] of values) {
    assert.equal(indicatorStatus({ id, value }), status, `${id} ${value} must honor its direction-aware ${status} band`);
  }
}

const renderGanodermaIndicatorsBody = functionBody(html, "renderGanodermaIndicators");
assert.match(renderGanodermaIndicatorsBody, /No indicator reading recorded/i, "A palm without an observation needs an honest no-reading state");
assert.match(renderGanodermaIndicatorsBody, /GANODERMA_INDICATOR_DEFINITIONS\.map/, "The widget must render all five accepted indicators from shared definitions");
assert.match(renderGanodermaIndicatorsBody, /formatIndicatorValue/, "The widget must format health-consistent readings from the selected tree observation");
assert.match(renderGanodermaIndicatorsBody, /observation\.disclosure/, "The widget must visibly repeat the no-image-derived-reading disclosure");
assert.match(renderGanodermaIndicatorsBody, /demonstration thresholds, not diagnostic cut-offs/i, "Indicator ranges must not be presented as clinical cut-offs");
const renderIndicatorBody = functionBody(html, "renderIndicator");
assert.match(renderIndicatorBody, /indicatorStatus\s*\(\s*indicator\s*\)/, "Every indicator's text badge must use the direction-aware classifier");
assert.match(renderIndicatorBody, /role=["']img["'][^]*aria-label=/, "Each visual scale needs an equivalent accessible value/range description");
assert.match(renderIndicatorBody, /indicator-marker[^]*left:\$\{marker\}%/, "Every scale needs a marker at the exact recorded value");
assert.match(renderIndicatorBody, /indicator\.ranges\.map/, "Every indicator must show each Okay, Suspected, and Danger range in text");
assert.match(renderIndicatorBody, /aria-label=["']About \$\{indicator\.label\}["']/, "Every metric needs a keyboard-focusable named help control");
assert.match(renderIndicatorBody, /aria-describedby=["']\$\{indicator\.id\}-help["']/, "Every metric help control must expose its explanation to assistive technology");

// New Farm v2 is a deliberate preview-only workflow. Its versioned browser
// state may preserve earlier local demo fields for migration compatibility, but
// the active route must not write farm/tree records or widen AP scope.
const versionMatch = /const\s+DEMO_STATE_VERSION\s*=\s*(\d+)/.exec(html);
assert.ok(versionMatch, "Browser-local demo state must publish a numeric schema version");
assert.equal(Number(versionMatch[1]), 2, "New Farm persistence must use demo-state schema version 2");
assert.match(html, /const\s+DEFAULT_FARM_DRAFT\s*=/, "New Farm must publish deterministic draft defaults");

const defaultDemoStateV2Body = functionBody(html, "defaultDemoState");
assert.match(defaultDemoStateV2Body, /localFarms\s*:\s*\[\s*\]/, "Fresh v2 demo state must start with no browser-local farms");
assert.match(defaultDemoStateV2Body, /version\s*:\s*DEMO_STATE_VERSION/, "Fresh demo state must carry the current schema version");

const migrateDemoStateBody = functionBody(html, "migrateDemoState");
assert.doesNotMatch(migrateDemoStateBody, /saved\.version\s*!==?\s*DEMO_STATE_VERSION[^]*return\s+fallback/i, "Migration must not discard the previous v1 state solely because its version differs");
assert.match(migrateDemoStateBody, /localFarms[^]*(?:Array\.isArray|\?)[^]*:\s*\[\s*\]/, "The v1 to v2 migration must default localFarms to an empty array");
assert.match(migrateDemoStateBody, /accounts|cases|treatments|administration|reportHistory|preferences/, "Migration must preserve existing browser-local operational preferences and actions");
assert.match(migrateDemoStateBody, /DEMO_STATE_VERSION/, "Migrated state must be stamped with the current version");
const loadDemoStateV2Body = functionBody(html, "loadDemoState");
assert.match(loadDemoStateV2Body, /migrateDemoState\s*\(/, "Loading browser state must pass persisted data through the v2 migration");
assert.match(loadDemoStateV2Body, /try\s*\{|catch\s*\(/, "Malformed browser state must fail safely to deterministic defaults");

// Creation remains restricted to the two accepted portfolio roles.
assert.ok(roles.admin.nav.includes("New Farm"), "System Administrator must be able to open New Farm");
assert.ok(roles.ceo.nav.includes("New Farm"), "CEO / General Manager must be able to open New Farm");
for (const roleId of ["head", "manager", "staff"]) {
  assert.ok(!roles[roleId].nav.includes("New Farm"), `${roles[roleId].name} must not receive New Farm access`);
}
const renderNewFarmV2Body = functionBody(html, "renderNewFarm");
assert.match(functionBody(html, "render"), /roles\[state\.role\]\.nav\.includes\s*\(\s*state\.page\s*\)/, "Guarded page dispatch must fail closed when the selected role cannot access New Farm");
assert.match(renderNewFarmV2Body, /scopedDistricts|mergedDistricts|districts/, "New Farm geography must come from the approved AP hierarchy");
assert.match(renderNewFarmV2Body, /districts\.map\s*\(/, "New Farm's district selector must enumerate the complete six-district AP hierarchy");
assert.match(renderNewFarmV2Body, /District[^]*Mandal[^]*Village/i, "New Farm must collect district, mandal, and village through the AP hierarchy");
assert.match(renderNewFarmV2Body, /Latitude[^]*Longitude/i, "The selected AP location must expose its mapped coordinates");
assert.match(renderNewFarmV2Body, /assigned|assignment/i, "A saved local farm must have an explicit role assignment");

// One independently editable 8 x 8 layout is required for every acre.
const defaultAcreLayoutBody = functionBody(html, "createDefaultAcreLayout");
assert.match(defaultAcreLayoutBody, /64|8\s*\*\s*8/, "Every default acre layout must contain exactly 64 cells");
assert.match(defaultAcreLayoutBody, /row/, "Every layout cell must record its row");
assert.match(defaultAcreLayoutBody, /column/, "Every layout cell must record its column");
assert.match(defaultAcreLayoutBody, /occupied/, "Every layout cell must record whether a palm is plotted");
assert.match(defaultAcreLayoutBody, /target|treeCount|treesPerAcre|density/i, "Each acre layout must retain its own selected tree target");
const createDefaultAcreLayout = Function(
  `return function createDefaultAcreLayout(acre,target=54){${defaultAcreLayoutBody}};`
)();
for (const target of [50, 54, 57]) {
  const layout = createDefaultAcreLayout(2, target);
  assert.equal(layout.acre, 2, "A default layout must retain the requested acre number");
  assert.equal(layout.target, target, "Every acre must retain its independent target");
  assert.equal(layout.cells.length, 64, "Every acre must contain one exact 8 x 8 cell set");
  assert.equal(layout.cells.filter((cell) => cell.occupied).length, target, `Default acre occupancy must exactly match ${target}`);
  assert.equal(new Set(layout.cells.map((cell) => `${cell.acre}:${cell.row}:${cell.column}`)).size, 64, "Acre coordinates must be unique");
  assert.ok(layout.cells.every((cell) => cell.row >= 1 && cell.row <= 8 && cell.column >= 1 && cell.column <= 8), "Every cell coordinate must remain inside the 8 x 8 grid");
}

const normalizeNewFarmDraftBody = functionBody(html, "normalizeNewFarmDraft");
assert.match(normalizeNewFarmDraftBody, /Math\.(?:min|max)|clamp|1[^]*24|24[^]*1/, "Draft normalization must constrain acreage to 1 through 24");
assert.match(normalizeNewFarmDraftBody, /50[^]*57|57[^]*50/, "Draft normalization must constrain independent acre targets to 50 through 57");
assert.match(normalizeNewFarmDraftBody, /createDefaultAcreLayout/, "Newly added acres must receive deterministic 8 x 8 defaults");
assert.match(normalizeNewFarmDraftBody, /slice|Array\.from|map/, "Changing acreage must produce exactly the requested number of acre layouts");
const normalizeNewFarmDraft = Function(
  "DEFAULT_FARM_DRAFT",
  "createDefaultAcreLayout",
  `return function normalizeNewFarmDraft(input={}){${normalizeNewFarmDraftBody}};`
)(
  { name: "", district: "Eluru", mandal: "Pedavegi", village: "Munduru", lat: 16.8792, lon: 81.1471, acres: 1, headUserId: "usr-head", managerUserId: "usr-manager", staffUserId: "usr-staff" },
  createDefaultAcreLayout
);
const exactAcreOne = createDefaultAcreLayout(1, 50);
const exactAcreTwo = createDefaultAcreLayout(2, 57);
exactAcreOne.cells[0].occupied = !exactAcreOne.cells[0].occupied;
exactAcreOne.cells[63].occupied = !exactAcreOne.cells[63].occupied;
const normalizedExactDraft = normalizeNewFarmDraft({
  name: "Exact layout fixture",
  district: "Eluru",
  mandal: "Pedavegi",
  village: "Munduru",
  lat: 16.8792,
  lon: 81.1471,
  acres: 2,
  layouts: [exactAcreOne, exactAcreTwo],
});
assert.equal(normalizedExactDraft.layouts.length, 2, "Two requested acres must produce exactly two independent layouts");
assert.equal(normalizedExactDraft.layouts[0].target, 50, "Acre 1 must retain its independent target");
assert.equal(normalizedExactDraft.layouts[1].target, 57, "Acre 2 must retain its independent target");
assert.deepEqual(
  normalizedExactDraft.layouts[0].cells.map((cell) => cell.occupied),
  exactAcreOne.cells.map((cell) => cell.occupied),
  "Draft normalization must preserve the user's exact selected positions"
);

const validateNewFarmDraftBody = functionBody(html, "validateNewFarmDraft");
for (const rule of [
  [/1[^]*24|24[^]*1/, "validate the accepted 1-24 acre range"],
  [/50[^]*57|57[^]*50/, "validate every acre's independent 50-57 target"],
  [/64|8\s*\*\s*8/, "validate all 64 coordinates on every acre"],
  [/occupied[^]*(?:target|treeCount|treesPerAcre)|(?:target|treeCount|treesPerAcre)[^]*occupied/i, "require the plotted count to exactly match each acre target"],
  [/row[^]*column|column[^]*row/, "validate acre-row-column coordinate identity"],
]) {
  assert.match(validateNewFarmDraftBody, rule[0], `New Farm validation must ${rule[1]}`);
}
assert.match(validateNewFarmDraftBody, /districts\.(?:find|some)[^]*(?:mandals|mandal)/i, "Validation must resolve the selected mandal inside its approved AP district");
assert.match(validateNewFarmDraftBody, /mandal[^]*(?:villages|village)/i, "Validation must resolve the selected village inside its approved AP mandal");
assert.match(validateNewFarmDraftBody, /12\.55[^]*19\.25[^]*76\.70[^]*84\.85|AP_BOUNDS/i, "Coordinates must remain inside the accepted Andhra Pradesh bounds");
assert.match(renderNewFarmV2Body, /<select[^>]+(?:name|id)=["']mandal/i, "Mandal must use an approved hierarchy selector rather than arbitrary text");
assert.match(renderNewFarmV2Body, /<select[^>]+(?:name|id)=["']village/i, "Village must use an approved hierarchy selector rather than arbitrary text");
assert.match(renderNewFarmV2Body, /Previous/i, "The acre editor needs a Previous control");
assert.match(renderNewFarmV2Body, /Next/i, "The acre editor needs a Next control");
assert.match(renderNewFarmV2Body, /Reset this acre/i, "The acre editor needs Reset this acre");
assert.match(renderNewFarmV2Body, /Reset all acres/i, "The acre editor needs Reset all acres");
assert.match(renderNewFarmV2Body, /Copy this pattern to all acres/i, "The acre editor needs Copy this pattern to all acres");
assert.match(renderNewFarmV2Body, /(?:plotted|selected)[^]*\/[^]*(?:target|trees)|\$\{[^}]+\}\/\$\{[^}]+\}\s*plotted/i, "Each acre must announce selected versus target palms");
assert.match(renderNewFarmV2Body, /remaining|over target/i, "The acre editor must explain remaining or excess cells");
assert.match(renderNewFarmV2Body, /aria-live=["']polite["']|role=["']status["']/i, "Layout counts and validation must be announced accessibly");
assert.match(renderNewFarmV2Body, /aria-label=["'][^"']*(?:acre|row|column|tree)/i, "Editable grid cells must have coordinate-aware accessible names");

// New Farm preview is intentionally separate from persistence. The accepted
// AP-only implementation generates display-only IDs and keeps the farm out of
// mock data, local farms, audit, notifications, cases, treatments, and storage.
assert.match(renderNewFarmV2Body, /Preview (?:farm|exact farm|layout)|Generate preview/i, "New Farm must offer an explicit preview action");
const renderNewFarmPreviewBody = functionBody(html, "renderNewFarmPreview");
assert.doesNotMatch(renderNewFarmPreviewBody, /Save farm|Confirm and save/i, "New Farm preview must not expose a persistence action");
assert.match(renderNewFarmPreviewBody, /(?:Preview only|Exact preview ready)[^]*(?:not saved|not yet saved)/i, "The preview must clearly state that it has not been persisted");
assert.match(renderNewFarmPreviewBody, /display-only|does not call persistence|does not write/i, "Preview IDs must be clearly labelled display-only");
assert.match(renderNewFarmV2Body, /validateNewFarmDraft\s*\(/, "Preview and save must use the authoritative exact-layout validator");
assert.doesNotMatch(functionBody(html, "bindNewFarmBuilder"), /saveNewFarmPreview\s*\(/, "The active New Farm route must not invoke local-farm persistence");

const previewIdBody = functionBody(html, "generatePreviewFarmId");
assert.match(previewIdBody, /FRM-AP-/, "Generated Farm IDs must remain AP-scoped");
assert.match(previewIdBody, /(?:existing|used|collision|some|find|Set)/i, "Farm ID generation must avoid collisions with existing and local farms");
const previewTreeIdsBody = functionBody(html, "generatePreviewTreeIds");
assert.match(previewTreeIdsBody, /sort|acre[^]*row[^]*column|flatMap/i, "Tree IDs must be assigned deterministically in acre-row-column order");
assert.match(previewTreeIdsBody, /occupied/, "Only occupied cells may receive Tree IDs");
assert.match(previewTreeIdsBody, /treeId/, "Tree ID generation must persist identity on occupied layout cells");
const generatePreviewTreeIds = Function(
  `return function generatePreviewTreeIds(farmId,layouts){${previewTreeIdsBody}};`
)();
const identifiedLayouts = generatePreviewTreeIds("FRM-AP-ELR-TEST0001", normalizedExactDraft.layouts);
const occupiedIdentities = identifiedLayouts.flatMap((layout) => layout.cells.filter((cell) => cell.occupied));
assert.equal(occupiedIdentities.length, 107, "Multi-acre Tree ID generation must reconcile to the sum of independent targets");
assert.equal(new Set(occupiedIdentities.map((cell) => cell.treeId)).size, occupiedIdentities.length, "Generated Tree IDs must be unique");
assert.ok(identifiedLayouts.flatMap((layout) => layout.cells).filter((cell) => !cell.occupied).every((cell) => !("treeId" in cell)), "Every black cell must omit Tree ID entirely");
assert.deepEqual(
  occupiedIdentities.map((cell) => cell.treeId),
  [...occupiedIdentities]
    .sort((left, right) => left.acre - right.acre || left.row - right.row || left.column - right.column)
    .map((cell) => cell.treeId),
  "Tree IDs must be emitted in deterministic acre-row-column order"
);

const saveNewFarmPreviewBody = functionBody(html, "saveNewFarmPreview");
assert.match(saveNewFarmPreviewBody, /preview-only/i, "Retained compatibility save helper must refuse persistence");
assert.doesNotMatch(saveNewFarmPreviewBody, /localStorage\.setItem|localFarms\s*:\s*\[|demoState\s*=|validateNewFarmDraft\s*\(/, "New Farm preview must not write browser-local farm records");
assert.doesNotMatch(saveNewFarmPreviewBody, /caseRecords|treatmentRecords|\.cases\s*=|\.treatments\s*=/, "Preview-only New Farm must not invent cases or treatments");

// Local farms join the base portfolio through one merged hierarchy so every
// Overview consumer and report sees the same role-scoped source of truth.
const mergedDistrictsBody = functionBody(html, "mergedDistricts");
assert.match(mergedDistrictsBody, /districts/, "Merged geography must begin with the deterministic AP hierarchy");
assert.match(mergedDistrictsBody, /demoState\.localFarms|localFarms/, "Merged geography must add browser-local farms");
assert.match(mergedDistrictsBody, /district[^]*mandal[^]*village[^]*farm/i, "Local farms must merge into the complete AP hierarchy");
assert.match(mergedDistrictsBody, /structuredClone|JSON\.(?:parse|stringify)|map\s*\(/, "Merging local farms must not mutate the deterministic base dataset");
assert.match(functionBody(html, "scopedDistricts"), /mergedDistricts\s*\(/, "RBAC must be applied after base and local farms are merged");
for (const consumer of ["renderExplorer", "metricsFor", "renderReports", "renderFarm"]) {
  if (new RegExp(`function\\s+${consumer}\\s*\\(`).test(html)) {
    const body = functionBody(html, consumer);
    assert.match(body, /scopedDistricts|mergedDistricts|flatFarms|farms|findFarm/i, `${consumer} must consume the merged role-scoped farm collection`);
  }
}
const scopedDistrictsV2Body = functionBody(html, "scopedDistricts");
assert.match(functionBody(html, "localFarmVisibleForRole"), /assignments[^]*(?:headUserId|managerUserId|staffUserId)/i, "Local farm visibility must intersect the exact head, manager, and staff assignments");
assert.match(scopedDistrictsV2Body, /mergedDistricts\s*\(/, "Role scope must intersect local farm assignments rather than exposing every saved farm");
const assignedLocalFarmFixture = {
  id: "FRM-AP-ELR-LOCALTEST",
  name: "Browser-local assigned farm fixture",
  district: "Eluru",
  mandal: "Pedavegi",
  village: "Munduru",
  lat: 16.8792,
  lon: 81.1471,
  acres: 2,
  density: 53.5,
  trees: 107,
  surveyed: 0,
  infected: 0,
  suspected: 0,
  pending: 107,
  risk: 0,
  source: "local-user",
  assignments: { headUserId: "usr-head", managerUserId: "usr-manager", staffUserId: "usr-staff" },
  layouts: identifiedLayouts,
};
for (const roleId of ["admin", "ceo", "head", "manager", "staff"]) {
  const visible = flattenFarms(evaluateScopedDistricts(roleId, [assignedLocalFarmFixture]));
  assert.ok(visible.some((farm) => farm.id === assignedLocalFarmFixture.id), `${roles[roleId].name} must see a local farm explicitly assigned within its scope`);
}
const unassignedLocalFarmFixture = {
  ...assignedLocalFarmFixture,
  id: "FRM-AP-ELR-LOCALOTHER",
  assignments: { headUserId: "usr-head-west", managerUserId: "usr-manager-east", staffUserId: "usr-staff-other" },
};
assert.ok(flattenFarms(evaluateScopedDistricts("admin", [unassignedLocalFarmFixture])).some((farm) => farm.id === unassignedLocalFarmFixture.id), "System Administrator must see every AP browser-local farm");
assert.ok(flattenFarms(evaluateScopedDistricts("ceo", [unassignedLocalFarmFixture])).some((farm) => farm.id === unassignedLocalFarmFixture.id), "CEO / General Manager must see every AP browser-local farm");
for (const roleId of ["head", "manager", "staff"]) {
  assert.ok(!flattenFarms(evaluateScopedDistricts(roleId, [unassignedLocalFarmFixture])).some((farm) => farm.id === unassignedLocalFarmFixture.id), `${roles[roleId].name} must not see a browser-local farm assigned to another principal`);
}

const resetDemoStateV2Body = functionBody(html, "resetDemoState");
assert.match(resetDemoStateV2Body, /defaultDemoState\s*\(/, "Reset must restore deterministic v2 defaults");
assert.match(resetDemoStateV2Body, /localStorage\.(?:removeItem|setItem)/, "Reset must remove or replace persisted local farms");
assert.doesNotMatch(resetDemoStateV2Body, /districts\s*=|\.farms\s*=\s*\[\s*\]/, "Reset must not delete deterministic base farms");

const renderFarmV2Body = functionBody(html, "renderFarm");
assert.match(renderFarmV2Body, /acre/i, "Farm Detail must expose an acre selector for multi-acre farms");
assert.match(renderFarmV2Body, /layout|cells/i, "Farm Detail must render the exact persisted per-acre layout");
assert.match(renderFarmV2Body, /disabled[^]*(?:No tree|h-empty)|(?:No tree|h-empty)[^]*disabled/i, "Persisted black cells must be disabled and expose no tree identity");
assert.match(renderFarmV2Body, /treeId/, "Persisted occupied cells must open their deterministic Tree IDs");

console.log("Static UI contract passed.");
