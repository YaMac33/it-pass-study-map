<script>
  document.getElementById('year').textContent = new Date().getFullYear();

  // ===============================
  // Config
  // ===============================
  const DATA_URL = './data/index.json';

  // ===============================
  // State / DOM
  // ===============================
  let allPosts = [];
  let currentFilter = { lv1: '', lv2: '' };

  const list = document.getElementById('postList');
  const searchInput = document.getElementById('searchInput');
  const noResults = document.getElementById('noResults');
  const loadingState = document.getElementById('loadingState');
  const loadError = document.getElementById('loadError');
  const loadErrorMsg = document.getElementById('loadErrorMsg');

  // カテゴリツリー表示先（HTMLに無ければJSで作る）
  let categoryTreeEl = document.getElementById('categoryTree');

  // ===============================
  // Category slug maps (Actionsと同じ)
  // ===============================
  const LV1_SLUG = {
    "ストラテジ系": "strategy",
    "マネジメント系": "management",
    "テクノロジ系": "technology"
  };

  const LV2_SLUG = {
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
    "新技術・先端技術": "emerging-tech"
  };

  // ===============================
  // Utils
  // ===============================
  function normalizeTags(tags) {
    if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean);
    if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
    return [];
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function formatDateJa(timestamp) {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  }

  function toDatetimeAttr(timestamp) {
    const d = new Date(timestamp);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function makeShortcutUrl(lv1Name, lv2Name, id) {
    const lv1 = LV1_SLUG[lv1Name] || '';
    const lv2 = LV2_SLUG[lv2Name] || '';
    if (!lv1 || !lv2 || !id) return '#';
    // docs/index.html からの相対パス
    return `./${lv1}/${lv2}/${encodeURIComponent(id)}/`;
  }

  // ===============================
  // Tree building
  // ===============================
  function buildCategoryTree(posts) {
    // { lv1: { lv2: [post, ...] } }
    const tree = {};
    for (const p of posts) {
      const lv1 = (p.category_lv1 || '').trim();
      const lv2 = (p.category_lv2 || '').trim();
      if (!lv1 || !lv2) continue;
      tree[lv1] ||= {};
      tree[lv1][lv2] ||= [];
      tree[lv1][lv2].push(p);
    }

    // 各カテゴリ内は新しい順
    for (const lv1 of Object.keys(tree)) {
      for (const lv2 of Object.keys(tree[lv1])) {
        tree[lv1][lv2].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    }
    return tree;
  }

  function ensureCategoryTreeMount() {
    if (categoryTreeEl) return categoryTreeEl;

    // 無ければ search の上に作る
    const main = document.querySelector('main');
    if (!main) return null;

    categoryTreeEl = document.createElement('section');
    categoryTreeEl.id = 'categoryTree';
    categoryTreeEl.style.margin = '0 0 18px 0';

    const searchWrap = document.querySelector('.search-wrap');
    if (searchWrap && searchWrap.parentNode === main) {
      main.insertBefore(categoryTreeEl, searchWrap);
    } else {
      main.insertBefore(categoryTreeEl, main.firstChild);
    }
    return categoryTreeEl;
  }

  function applyFiltersAndRender() {
    const q = (searchInput.value || '').toLowerCase();
    const lv1 = currentFilter.lv1;
    const lv2 = currentFilter.lv2;

    const filtered = allPosts.filter(p => {
      const matchText =
        (p.title || '').toLowerCase().includes(q) ||
        (p.summary || '').toLowerCase().includes(q) ||
        (p.tags || []).join(' ').toLowerCase().includes(q);

      const matchLv1 = !lv1 || p.category_lv1 === lv1;
      const matchLv2 = !lv2 || p.category_lv2 === lv2;

      return matchText && matchLv1 && matchLv2;
    });

    renderPosts(filtered);
  }

  function setCategoryFilter(lv1, lv2) {
    currentFilter = { lv1: lv1 || '', lv2: lv2 || '' };
    applyFiltersAndRender();
    // ツリーの見た目更新
    renderCategoryTree(allPosts);
    // 目線を一覧へ
    list?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearCategoryFilter() {
    currentFilter = { lv1: '', lv2: '' };
    applyFiltersAndRender();
    renderCategoryTree(allPosts);
  }

  function renderCategoryTree(posts) {
    const mount = ensureCategoryTreeMount();
    if (!mount) return;

    const tree = buildCategoryTree(posts);

    // カテゴリの並び順を固定（見やすさ重視）
    const lv1Order = ["ストラテジ系", "マネジメント系", "テクノロジ系"];

    const activeLv1 = currentFilter.lv1;
    const activeLv2 = currentFilter.lv2;

    const html = [];

    html.push(`
      <div class="category-tree">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px;">
          <div style="font-weight:600;">カテゴリ</div>
          <button type="button" id="clearCategoryBtn" class="read-more" style="padding:6px 10px;">
            フィルタ解除
          </button>
        </div>
    `);

    for (const lv1 of lv1Order.filter(x => tree[x])) {
      const lv2Map = tree[lv1];
      const lv2Names = Object.keys(lv2Map);

      // lv2 は件数降順→名前
      lv2Names.sort((a, b) => (lv2Map[b].length - lv2Map[a].length) || a.localeCompare(b, 'ja'));

      html.push(`
        <details ${activeLv1 === lv1 ? 'open' : ''} style="border:1px solid rgba(148,163,184,.35); border-radius:12px; padding:10px 12px; margin:10px 0;">
          <summary style="cursor:pointer; list-style:none; display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <span>${escapeHtml(lv1)}</span>
            <span style="opacity:.7; font-size:.9em;">${lv2Names.reduce((n, k) => n + lv2Map[k].length, 0)}件</span>
          </summary>
          <div style="margin-top:10px; display:flex; flex-wrap:wrap; gap:8px;">
      `);

      // 「lv1だけで絞る」ボタン
      html.push(`
        <button type="button"
          class="tag"
          data-lv1="${escapeHtml(lv1)}"
          data-lv2=""
          style="cursor:pointer; padding:6px 10px; border-radius:999px; border:1px solid rgba(148,163,184,.45); background:transparent;">
          ${activeLv1 === lv1 && !activeLv2 ? '✅ ' : ''}${escapeHtml(lv1)}（全て）
        </button>
      `);

      for (const lv2 of lv2Names) {
        const count = lv2Map[lv2].length;

        html.push(`
          <button type="button"
            class="tag"
            data-lv1="${escapeHtml(lv1)}"
            data-lv2="${escapeHtml(lv2)}"
            style="cursor:pointer; padding:6px 10px; border-radius:999px; border:1px solid rgba(148,163,184,.45); background:transparent;">
            ${activeLv1 === lv1 && activeLv2 === lv2 ? '✅ ' : ''}${escapeHtml(lv2)}（${count}）
          </button>
        `);
      }

      html.push(`
          </div>
        </details>
      `);
    }

    html.push(`</div>`);

    mount.innerHTML = html.join('');

    // イベント
    const clearBtn = document.getElementById('clearCategoryBtn');
    if (clearBtn) {
      clearBtn.onclick = () => clearCategoryFilter();
    }

    mount.querySelectorAll('button.tag[data-lv1]').forEach(btn => {
      btn.addEventListener('click', () => {
        const lv1 = btn.getAttribute('data-lv1') || '';
        const lv2 = btn.getAttribute('data-lv2') || '';
        setCategoryFilter(lv1, lv2);
      });
    });
  }

  // ===============================
  // Fetch
  // ===============================
  async function loadPosts() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json(); // ←ここ、元ファイルのtypoを修正

      allPosts = (json || []).map(p => ({
        // id は index.json が dir/dr/id のどれで来ても拾えるようにする
        id: p.id || p.dir || p.dr || '',
        title: p.title || '',
        summary: p.summary || '',
        tags: normalizeTags(p.tags),
        timestamp: p.timestamp || '',
        category_lv1: p.category_lv1 || '',
        category_lv2: p.category_lv2 || '',
        // 既存互換：public_url が無い運用でも動く
        url: p.public_url || p.repo_path || (p.post_path ? `./${String(p.post_path).replace(/^\/+/, '')}` : '#'),
        // post_path があるなら保持（将来使う用）
        post_path: p.post_path || ''
      }));

      allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // ツリー描画 → 一覧描画
      renderCategoryTree(allPosts);
      renderPosts(allPosts);

    } catch (e) {
      console.error(e);
      loadError.style.display = 'block';
      loadErrorMsg.textContent = e.message || String(e);
    } finally {
      if (loadingState) loadingState.remove();
    }
  }

  // ===============================
  // Render (List)
  // ===============================
  function renderPosts(posts) {
    list.innerHTML = '';

    if (!posts || posts.length === 0) {
      noResults.style.display = 'block';
      return;
    }
    noResults.style.display = 'none';

    posts.forEach(post => {
      const dateLabel = formatDateJa(post.timestamp);
      const datetime = toDatetimeAttr(post.timestamp);

      const li = document.createElement('li');
      li.className = 'post-item';

      const safeTitle = escapeHtml(post.title);
      const safeSummary = escapeHtml(post.summary);

      // カテゴリが取れるなら軽く表示（任意）
      const catLabel = (post.category_lv1 && post.category_lv2)
        ? `<span style="opacity:.7; font-size:.9em;">${escapeHtml(post.category_lv1)} / ${escapeHtml(post.category_lv2)}</span>`
        : '';

      li.innerHTML = `
        <article>
          <time class="post-meta" datetime="${escapeHtml(datetime)}">${escapeHtml(dateLabel)}</time>
          ${catLabel}
          <h2 class="post-title">
            <a href="${escapeHtml(post.url)}">${safeTitle}</a>
          </h2>
          <p class="post-excerpt">${safeSummary}</p>
          <a href="${escapeHtml(post.url)}" class="read-more">Read Article →</a>
        </article>
      `;

      list.appendChild(li);
    });
  }

  // ===============================
  // Search (text)  ※カテゴリフィルタと共存
  // ===============================
  searchInput.addEventListener('input', () => {
    applyFiltersAndRender();
  });

  // Init
  loadPosts();
</script>
