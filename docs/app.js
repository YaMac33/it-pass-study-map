// =====================================================
// MonoHub - Vanilla JS App
// =====================================================

// -----------------------------
// state
// -----------------------------
let activeFilter = 'all';

// -----------------------------
// mock data (あとで index.json に置換可)
// -----------------------------
const allPosts = [
  {
    id: 1,
    type: 'news',
    category: 'Technology',
    title: '次世代AIモデル「Gemini」が産業構造をどう変えるか',
    excerpt: '最新のベンチマーク結果により、従来の予測を上回る処理能力が明らかになりました。',
    date: '2024.05.15',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    featured: true,
    path: './2026-01-15_name/'
  },
  {
    id: 2,
    type: 'blog',
    category: 'Lifestyle',
    title: 'ミニマリストのデスクセットアップ術 2024',
    excerpt: '生産性を最大化するための、ケーブル管理とガジェット選び。',
    author: 'Yuki Tanaka',
    date: '2024.05.14',
    image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=800&auto=format&fit=crop',
    path: './2026-01-15_name/'
  },
  {
    id: 3,
    type: 'news',
    category: 'Finance',
    title: '日経平均、一時4万円台を回復',
    excerpt: '海外投資家の買い越しが続き、半導体関連株が上昇。',
    date: '2024.05.14',
    readTime: '2 min read',
    image: null,
    path: './2026-01-15_name/'
  }
];

// -----------------------------
// init
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFilter();
  renderPosts();
  renderFooter();
  bindScroll();
});

// -----------------------------
// header
// -----------------------------
function renderHeader() {
  document.getElementById('header').innerHTML = `
    <div class="header-inner">
      <strong>MonoHub</strong>
    </div>
  `;
}

// -----------------------------
// filter UI
// -----------------------------
function renderFilter() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <section class="intro">
      <h1>The Feed</h1>
      <p>最新のヘッドラインと、深掘りエッセイを一箇所で。</p>

      <div class="filters">
        ${['all', 'news', 'blog']
          .map(
            f => `
            <button data-filter="${f}" class="filter-btn ${f === activeFilter ? 'active' : ''}">
              ${f.toUpperCase()}
            </button>`
          )
          .join('')}
      </div>

      <div id="post-grid" class="grid"></div>
    </section>
  `;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      renderFilter();
      renderPosts();
    });
  });
}

// -----------------------------
// render posts
// -----------------------------
function renderPosts() {
  const grid = document.getElementById('post-grid');

  const posts =
    activeFilter === 'all'
      ? allPosts
      : allPosts.filter(p => p.type === activeFilter);

  grid.innerHTML = posts
    .map(post => {
      const isFeatured = post.featured && activeFilter === 'all';

      return `
        <a href="${post.path}" class="card ${isFeatured ? 'featured' : ''}">
          ${post.image ? `<img src="${post.image}" alt="">` : ''}
          <div class="card-body">
            <small>${post.category} • ${post.date}</small>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
            <div class="meta">
              ${
                post.author
                  ? `<span>${post.author}</span>`
                  : `<span>Read</span>`
              }
              ${post.readTime ? `<span>${post.readTime}</span>` : ''}
            </div>
          </div>
        </a>
      `;
    })
    .join('');
}

// -----------------------------
// footer
// -----------------------------
function renderFooter() {
  document.getElementById('footer').innerHTML = `
    <p>© 2024 MonoHub</p>
  `;
}

// -----------------------------
// scroll effect
// -----------------------------
function bindScroll() {
  window.addEventListener('scroll', () => {
    document.body.classList.toggle('scrolled', window.scrollY > 20);
  });
}
