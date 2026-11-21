#!/usr/bin/env node
// bump.mjs — Utilitaire de gestion de version pour DCC Assistant
// Usage :
//   node bump.mjs --inspect          Affiche les versions et les propositions SemVer
//   node bump.mjs --commits          Affiche les commits depuis le dernier tag
//   node bump.mjs --apply <V> --notes "<N>"   Applique la version V et les notes N

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const PACKAGE_JSON = resolve(ROOT, "package.json");
const INDEX_HTML = resolve(ROOT, "index.html");
const CHANGELOG = resolve(ROOT, "CHANGELOG.md");

function die(msg) {
  console.error(`❌ ERREUR : ${msg}`);
  process.exit(1);
}

/** Parse un triplet SemVer "X.Y.Z" → [major, minor, patch] */
function parseSemver(v) {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) die(`Version invalide : "${v}"`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Compare deux versions SemVer, retourne > 0 si a > b */
function cmpSemver(a, b) {
  const pa = parseSemver(a),
    pb = parseSemver(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function readPackageVersion() {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  return pkg.version;
}

function readIndexVersion() {
  const html = readFileSync(INDEX_HTML, "utf8");
  const m = html.match(
    /<span\s+class="app-version"[^>]*>(\d+\.\d+\.\d+)<\/span>/
  );
  if (!m) die("Impossible de trouver <span class=\"app-version\">X.Y.Z</span> dans index.html");
  return m[1];
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Actions ──────────────────────────────────────────────────────────────────

function inspect() {
  const pkgV = readPackageVersion();
  const idxV = readIndexVersion();
  const ref = cmpSemver(pkgV, idxV) >= 0 ? pkgV : idxV;
  const [major, minor, patch] = parseSemver(ref);

  console.log(`📦 package.json : ${pkgV}`);
  console.log(`🌐 index.html   : ${idxV}`);
  console.log(`📌 Référence    : ${ref}`);
  console.log();
  console.log("Propositions SemVer :");
  console.log(`  patch → ${major}.${minor}.${patch + 1}`);
  console.log(`  minor → ${major}.${minor + 1}.0`);
  console.log(`  major → ${major + 1}.0.0`);
}

function commits() {
  let lastTag;
  try {
    lastTag = execSync("git describe --tags --abbrev=0", {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    lastTag = null;
  }

  const range = lastTag ? `${lastTag}..HEAD` : "HEAD~20..HEAD";
  const label = lastTag ? `depuis le tag ${lastTag}` : "(aucun tag trouvé, 20 derniers commits)";

  console.log(`📜 Commits ${label} :`);
  console.log();

  try {
    const log = execSync(
      `git log ${range} --oneline --no-decorate`,
      { cwd: ROOT, encoding: "utf8" }
    ).trim();

    if (!log) {
      console.log("  (aucun commit trouvé)");
    } else {
      console.log(log);
    }
  } catch {
    console.log("  (erreur lors de la lecture du log git)");
  }
}

function apply(version, notes) {
  // Valider le format
  parseSemver(version);

  // ── 1. package.json ──
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  pkg.version = version;
  writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n", "utf8");

  // ── 2. index.html ──
  let html = readFileSync(INDEX_HTML, "utf8");

  // Mettre à jour le numéro dans <span class="app-version">
  const versionRegex =
    /(<span\s+class="app-version"[^>]*>)(\d+\.\d+\.\d+)(<\/span>)/;
  if (!versionRegex.test(html)) {
    die('Pattern <span class="app-version">X.Y.Z</span> introuvable dans index.html');
  }
  html = html.replace(versionRegex, `$1${version}$3`);

  // Mettre à jour le contenu du tooltip
  const tooltipRegex =
    /(<span\s+class="version-tooltip">)([\s\S]*?)(<\/span>\s*<\/span>)/;
  if (tooltipRegex.test(html)) {
    const tooltipContent = notes.replace(/\\n/g, "\n");
    html = html.replace(tooltipRegex, `$1${tooltipContent}$3`);
  }

  writeFileSync(INDEX_HTML, html, "utf8");

  // ── 3. CHANGELOG.md ──
  const changelogNotes = notes.replace(/\\n/g, "\n");
  const newSection = `## [${version}] - ${today()}\n${changelogNotes}`;

  if (existsSync(CHANGELOG)) {
    const content = readFileSync(CHANGELOG, "utf8");
    // Insérer après la première ligne vide qui suit l'en-tête
    const insertPoint = content.search(/\n## \[/);
    if (insertPoint !== -1) {
      // Insérer avant la première section existante
      const updated =
        content.slice(0, insertPoint) +
        "\n" +
        newSection +
        "\n" +
        content.slice(insertPoint);
      writeFileSync(CHANGELOG, updated, "utf8");
    } else {
      // Pas de section existante, ajouter à la fin
      writeFileSync(CHANGELOG, content.trimEnd() + "\n\n" + newSection + "\n", "utf8");
    }
  } else {
    const header = `# Journal des Modifications (Changelog)

Toutes les modifications notables de ce projet sont documentées dans ce fichier.
Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
et ce projet adhère à [Semantic Versioning](https://semver.org/lang/fr/).

`;
    writeFileSync(CHANGELOG, header + newSection + "\n", "utf8");
  }

  // ── 4. Vérification finale ──
  const finalPkgV = readPackageVersion();
  const finalIdxV = readIndexVersion();

  if (finalPkgV !== version || finalIdxV !== version) {
    die(
      `Incohérence détectée ! package.json=${finalPkgV}, index.html=${finalIdxV}, attendu=${version}`
    );
  }

  console.log(`✅ Version mise à jour : ${version}`);
  console.log(`✅ package.json : ${finalPkgV}`);
  console.log(`✅ index.html   : ${finalIdxV}`);
  console.log(`✅ CHANGELOG.md mis à jour`);
  console.log(`✅ Tooltip de version mis à jour`);
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--inspect")) {
  inspect();
} else if (args.includes("--commits")) {
  commits();
} else if (args.includes("--apply")) {
  const vIdx = args.indexOf("--apply");
  const version = args[vIdx + 1];
  if (!version) die("Usage : --apply <VERSION> --notes \"<NOTES>\"");

  const nIdx = args.indexOf("--notes");
  const notes = nIdx !== -1 ? args[nIdx + 1] : "";
  if (!notes) die("Usage : --apply <VERSION> --notes \"<NOTES>\"");

  apply(version, notes);
} else {
  console.log("Usage :");
  console.log("  node bump.mjs --inspect");
  console.log("  node bump.mjs --commits");
  console.log('  node bump.mjs --apply <VERSION> --notes "<NOTES>"');
  process.exit(1);
}
