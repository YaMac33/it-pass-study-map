/* scripts/generate_shortcuts.js */
const fs = require("fs");
const path = require("path");

// ====== slug マップ（必要に応じて追加） ======
const LV1 = {
  "ストラテジ系": "strategy",
  "マネジメント系": "management",
  "テクノロジ系": "technology",
};

const LV2 = {
  "企業と法務": "corporate-law",
  "経営戦略": "business-strategy",
  "マーケティング": "marketing",
  "財務": "finance",
  "事業継続": "business-continuity",

  "開発技術": "development",
  "プロジェクトマネジメント": "project-management",
  "サービスマネジメント": "service-management",

  "基礎理論": "fundamentals",
  "コンピュータシステム": "computer-systems",
  "ネットワーク": "network",
  "データベース": "database",
  "セキュリティ": "security",
  "新技術・先端技術": "emerging-tech",
};

// ====== 入出力パス ======
const NEW_ITEMS_DIR = path.join("docs", "data", "new_items");
const DOCS_DIR = "docs";

// /posts/<dr>/ に飛ばす（GitHub Pages の docs/ 配下想定）
function makeRedirectHtml(dr) {
  const target = `/posts/${dr}/`;
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0; url=${target}" />
  <link rel="canonical" href="${target}" />
  <meta name="robots" content="noindex" />
  <title>Redirecting...</title>
</head>
<body>
  <p>Redirecting to <a href="${target}">${target}</a></p>
</body>
</html>
`;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  if (!fs.existsSync(NEW_ITEMS_DIR)) {
    console.log(`[skip] ${NEW_ITEMS_DIR} not found`);
    return;
  }

  const files = fs.readdirSync(NEW_ITEMS_DIR).filter(f => f.endsWith(".json"));
  if (files.length === 0) {
    console.log("[skip] no new_items json");
    return;
  }

  let generated = 0;

  for (const file of files) {
    const full = path.join(NEW_ITEMS_DIR, file);
    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (e) {
      console.log(`[warn] invalid json: ${full}`);
      continue;
    }

    const dr = meta.id || meta.dr;
    const lv1Name = (meta.category_lv1 || "").trim();
    const lv2Name = (meta.category_lv2 || "").trim();

    if (!dr || !lv1Name || !lv2Name) {
      console.log(`[warn] missing fields in ${file}`);
      continue;
    }

    const lv1Slug = LV1[lv1Name];
    const lv2Slug = LV2[lv2Name];

    if (!lv1Slug || !lv2Slug) {
      console.log(`[warn] unknown category: ${lv1Name} / ${lv2Name} in ${file}`);
      continue;
    }

    const outDir = path.join(DOCS_DIR, lv1Slug, lv2Slug, dr);
    ensureDir(outDir);

    const outPath = path.join(outDir, "index.html");
    fs.writeFileSync(outPath, makeRedirectHtml(dr), "utf8");
    generated++;
  }

  console.log(`[ok] generated shortcuts: ${generated}`);
}

main();
