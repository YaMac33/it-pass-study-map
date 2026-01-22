/* scripts/build_index.js
 * docs/data/new_items/*.json を集約して docs/data/index.json を生成する
 * 出力は「配列」: app.js がそのまま map できる形
 */

const fs = require("fs");
const path = require("path");

const NEW_ITEMS_DIR = path.join("docs", "data", "new_items");
const OUT_PATH = path.join("docs", "data", "index.json");

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
  if (typeof tags === "string") return tags.split(",").map(t => t.trim()).filter(Boolean);
  return [];
}

function normalizePostPath(p) {
  let s = String(p || "").trim();
  s = s.replace(/^\/+/, "");
  if (s && !s.endsWith("/")) s += "/";
  return s;
}

function parseTime(ts) {
  const t = Date.parse(String(ts || ""));
  return Number.isNaN(t) ? -Infinity : t;
}

function main() {
  if (!fs.existsSync(NEW_ITEMS_DIR)) {
    console.log(`[skip] not found: ${NEW_ITEMS_DIR}`);
    // new_items が無い場合でも index.json は空配列で作っておく
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, "[]\n", "utf8");
    return;
  }

  const files = fs.readdirSync(NEW_ITEMS_DIR).filter(f => f.endsWith(".json"));

  const items = [];
  for (const f of files) {
    const full = path.join(NEW_ITEMS_DIR, f);
    let meta;
    try {
      meta = JSON.parse(fs.readFileSync(full, "utf8"));
    } catch (e) {
      console.log(`[warn] invalid json: ${full}`);
      continue;
    }

    const id = String(meta.id || meta.dr || meta.dir || "").trim();
    const timestamp = String(meta.timestamp || "").trim();
    const title = String(meta.title || "").trim();
    const summary = String(meta.summary || "").trim();
    const category_lv1 = String(meta.category_lv1 || "").trim();
    const category_lv2 = String(meta.category_lv2 || "").trim();
    const post_path = normalizePostPath(meta.post_path);

    // 必須最低限（足りないのはスキップ）
    if (!id || !timestamp || !title || !post_path) {
      console.log(`[warn] missing required fields: ${f} (id/timestamp/title/post_path)`);
      continue;
    }

    items.push({
      id,
      timestamp,
      title,
      summary,
      tags: normalizeTags(meta.tags),
      category_lv1,
      category_lv2,
      post_path,
    });
  }

  // 新しい順（timestamp desc）
  items.sort((a, b) => parseTime(b.timestamp) - parseTime(a.timestamp));

  // 出力
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(items, null, 2) + "\n", "utf8");

  console.log(`[ok] built ${OUT_PATH} (${items.length} items)`);
}

main();
