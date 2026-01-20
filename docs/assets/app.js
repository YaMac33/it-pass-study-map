/**
 * Application Logic
 * - Index page: render post list from ./data/index.json + search
 * - Common: GA init (config only), scroll progress, smooth scroll
 */

const GA_ID = 'G-MQ9ZB4LYWP';
const DATA_URL = './data/index.json';

document.addEventListener('DOMContentLoaded', () => {
  initAnalytics();
  initScrollProgress();
  initSmoothScroll();
  initIndexPage();
});

/**
 * Initialize Google Analytics (GA4)
 * Assumes the gtag script is already included in <head>.
 */
function initAnalytics() {
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('js', new Date());
  gtag('config', GA_ID);
}

/**
 * Scroll Progress Bar
 */
function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.id = 'scroll-progress';
  document.body.prepend(progressBar);

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    progressBar.style.width = scrolled + '%';
  });
}

/**
 * Smooth Scroll for internal anchor links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/**
 * Index page: load + render posts + search
 */
function initIndexPage() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const list = document.getElementById('postList');
  const searchInput = document.getElementById('searchInput');
  const noResults = document.getElementById('noResults');
  const loadingState = document.getElementById('loadingState');
  const loadError = document.getElementById('loadError');
  const loadErrorMsg = document.getElementById('loadErrorMsg');

  // index.html 以外でも app.js を読み得るので、DOMがなければ終了
  if (!list || !searchInput) return;

  let allPosts = [];

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

  function renderPosts(posts) {
    list.innerHTML = '';

    if (!posts || posts.length === 0) {
      if (noResults) noResults.style.display = 'block';
      return;
    }
    if (noResults) noResults.style.display = 'none';

    posts.forEach(post => {
      const dateLabel = formatDateJa(post.timestamp);
      const datetime = toDatetimeAttr(post.timestamp);

      const li = document.createElement('li');
      li.className = 'post-item';

      const safeTitle = escapeHtml(post.title);
      const safeSummary = escapeHtml(post.summary);

      const tags = Array.isArray(post.tags) ? post.tags : [];
      const tagsHtml = tags.length
        ? `<ul class="tag-list" aria-label="tags">
            ${tags.map(t => `<li class="tag">${escapeHtml(t)}</li>`).join('')}
          </ul>`
        : '';

      li.innerHTML = `
        <article>
          <time class="post-meta" datetime="${escapeHtml(datetime)}">${escapeHtml(dateLabel)}</time>
          ${tagsHtml}
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

  async function loadPosts() {
    try {
      const res = await fetch(DATA_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      allPosts = (json || []).map(p => ({
        title: p.title || '',
        summary: p.summary || '',
        tags: normalizeTags(p.tags),
        timestamp: p.timestamp || '',
        url: p.public_url || p.repo_path || '#'
      }));

      allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      renderPosts(allPosts);

    } catch (e) {
      console.error(e);
      if (loadError) loadError.style.display = 'block';
      if (loadErrorMsg) loadErrorMsg.textContent = e.message || String(e);
    } finally {
      if (loadingState) loadingState.remove();
    }
  }

  searchInput.addEventListener('input', () => {
    const q = (searchInput.value || '').toLowerCase();
    const filtered = allPosts.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.summary || '').toLowerCase().includes(q) ||
      (p.tags || []).join(' ').toLowerCase().includes(q)
    );
    renderPosts(filtered);
  });

  loadPosts();
}
