const express = require('express');
const Parser = require('rss-parser');
const path = require('path');
const https = require('https');
const fs = require('fs');
const { marked } = require('marked');
const cheerio = require('cheerio');

const app = express();
const parser = new Parser({
  customFields: {
    item: [
      ['ht:approx_traffic', 'traffic'],
      ['ht:news_item_title', 'newsTitle'],
      ['ht:news_item_url', 'newsUrl'],
      ['ht:news_item_source', 'newsSource'],
      ['ht:picture', 'picture'],
    ],
  },
});
const PORT = process.env.PORT || 3000;

const lastUpdated = { google: null, reddit: null, youtube: null };

const wikimediaCache = { data: null, fetchedAt: null };
const CACHE_TTL_3H = 3 * 60 * 60 * 1000;

const githubCache = { data: null, fetchedAt: null };
const hnCache = { data: null, fetchedAt: null };
const phCache = { data: null, fetchedAt: null };
const CACHE_TTL_2H = 2 * 60 * 60 * 1000;

app.use((req, res, next) => {
  if (req.hostname === 'cosmictesla.com') {
    return res.redirect(301, 'https://www.cosmictesla.com' + req.originalUrl);
  }
  next();
});

app.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain').send(
    'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://cosmictesla.com/sitemap.xml\n'
  );
});

app.get('/sitemap.xml', (req, res) => {
  const base = 'https://cosmictesla.com';
  const today = new Date().toISOString().slice(0, 10);
  const staticUrls = [
    { loc: `${base}/`,        priority: '1.0', changefreq: 'daily'   },
    { loc: `${base}/blog`,    priority: '0.8', changefreq: 'daily'   },
    { loc: `${base}/about`,   priority: '0.6', changefreq: 'monthly' },
    { loc: `${base}/contact`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${base}/privacy`, priority: '0.4', changefreq: 'monthly' },
  ];
  let postUrls = [];
  if (fs.existsSync(POSTS_DIR)) {
    postUrls = fs.readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ loc: `${base}/blog/${f.replace('.md', '')}`, priority: '0.7', changefreq: 'monthly' }));
  }
  const allUrls = [...staticUrls, ...postUrls];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
    allUrls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')
  }\n</urlset>`;
  res.set('Content-Type', 'application/xml').send(xml);
});

app.use(express.static(path.join(__dirname, 'public')));

const ACRONYM_MAP = new Map(
  ['XRP', 'BTC', 'ETH', 'NFT', 'AI', 'NBA', 'NFL', 'MLB', 'NHL', 'UFC',
   'NASCAR', 'NASA', 'CEO', 'FBI', 'CIA', 'DOJ', 'IRS', 'GOP', 'UK', 'USA',
   'NYC', 'LA', 'DC', 'TV', 'PC', 'DJ', 'IPO', 'GDP', 'GTA', 'WWE', 'TikTok']
  .map((a) => [a.toLowerCase(), a])
);

function toTitleCase(str) {
  return str.replace(/\w\S*/g, (word) => {
    const lower = word.toLowerCase();
    if (ACRONYM_MAP.has(lower)) return ACRONYM_MAP.get(lower);
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

const AMAZON_BLOCKED = ['dead', 'dies', 'death', 'killed', 'shooting', 'arrested', 'fraud', 'scandal', 'accused', 'indicted', 'charges', 'crash', 'murder', 'war', 'military', 'explosion', 'attack', 'hostage', 'missile', 'bombing', 'earthquake', 'hurricane', 'flood', 'wildfire'];

function getAmazonAffiliateUrl(title, headlineText = '') {
  const combined = (title + ' ' + headlineText).toLowerCase();
  if (AMAZON_BLOCKED.some((w) => combined.includes(w))) return null;
  return `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=cosmictesla-20`;
}

function parseTraffic(trafficStr) {
  if (!trafficStr) return 0;
  const cleaned = trafficStr.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

const COUNTRIES = {
  US: { name: 'United States', newsLocale: 'en-US', ceid: 'US:en' },
  GB: { name: 'United Kingdom', newsLocale: 'en-GB', ceid: 'GB:en' },
  CA: { name: 'Canada',         newsLocale: 'en-CA', ceid: 'CA:en' },
  AU: { name: 'Australia',      newsLocale: 'en-AU', ceid: 'AU:en' },
  IN: { name: 'India',          newsLocale: 'en-IN', ceid: 'IN:en' },
};

async function fetchHeadlines(topic, country) {
  try {
    const { newsLocale, ceid } = country;
    const [hl, gl] = [newsLocale, ceid.split(':')[0]];
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 3).map((item) => ({
      title: item.title,
      link: item.link,
    }));
  } catch (e) {
    return [];
  }
}

app.get('/api/trends', async (req, res) => {
  const geo = String(req.query.geo || 'US').toUpperCase();
  const country = COUNTRIES[geo] || COUNTRIES.US;

  try {
    const feed = await parser.parseURL(
      `https://trends.google.com/trending/rss?geo=${geo in COUNTRIES ? geo : 'US'}`
    );

    const trends = feed.items.map((item) => ({
      title: toTitleCase(item.title),
      traffic: item.traffic || 'Trending',
      trafficNum: parseTraffic(item.traffic),
      link: `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
      image: item.picture || null,
    }));

    trends.sort((a, b) => b.trafficNum - a.trafficNum);
    const top20 = trends.slice(0, 20);

    const headlines = await Promise.all(top20.map((t) => fetchHeadlines(t.title, country)));
    const trendsWithHeadlines = top20.map((t, i) => {
      const headlineText = headlines[i].map((h) => h.title).join(' ');
      return { ...t, headlines: headlines[i], affiliateUrl: getAmazonAffiliateUrl(t.title, headlineText) };
    });

    lastUpdated.google = new Date();
    res.json({
      date: new Date().toISOString().slice(0, 10),
      country: country.name,
      trends: trendsWithHeadlines,
    });
  } catch (error) {
    console.error('Error fetching trends:', error.message);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

app.get('/api/wikimedia-trending', async (req, res) => {
  if (wikimediaCache.data && wikimediaCache.fetchedAt && (Date.now() - wikimediaCache.fetchedAt < CACHE_TTL_3H)) {
    return res.json(wikimediaCache.data);
  }
  try {
    let raw;
    for (let daysBack = 1; daysBack <= 4; daysBack++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - daysBack);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${year}/${month}/${day}`;
      try { raw = await fetchRaw(url, false, { 'User-Agent': 'CosmicTesla/1.0 (https://cosmictesla.com; contact@cosmictesla.com)' }); break; } catch (e) { if (daysBack === 4) throw e; }
    }
    const json = JSON.parse(raw);
    const SKIP = ['Main_Page'];
    const SKIP_PREFIX = ['Special:', 'Wikipedia:', 'Talk:', 'Portal:', 'Help:', 'Category:'];
    const articles = json.items[0].articles
      .filter((a) => !SKIP.includes(a.article) && !SKIP_PREFIX.some((p) => a.article.startsWith(p)))
      .slice(0, 10)
      .map((a) => ({
        title: a.article.replace(/_/g, ' '),
        views: a.views,
        url: `https://en.wikipedia.org/wiki/${a.article}`,
      }));
    const result = { articles };
    wikimediaCache.data = result;
    wikimediaCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Wikimedia:', error.message);
    res.status(500).json({ error: 'Failed to fetch Wikipedia trends' });
  }
});

app.get('/api/github-trending', async (req, res) => {
  if (githubCache.data && githubCache.fetchedAt && (Date.now() - githubCache.fetchedAt < CACHE_TTL_2H)) {
    return res.json(githubCache.data);
  }
  try {
    const html = await fetchRaw('https://github.com/trending', false, {
      'User-Agent': 'CosmicTesla/1.0 (https://cosmictesla.com; contact@cosmictesla.com)',
      'Accept': 'text/html',
    });
    const $ = cheerio.load(html);
    const repos = [];
    $('article.Box-row').each((i, el) => {
      if (i >= 10) return false;
      const nameEl = $(el).find('h2 a');
      const name = (nameEl.attr('href') || '').replace(/^\//, '').trim();
      const description = $(el).find('p').first().text().trim();
      const language = $(el).find('[itemprop="programmingLanguage"]').text().trim();
      const starsRaw = $(el).find('.float-sm-right').text().trim();
      const starsMatch = starsRaw.match(/[\d,]+/);
      const starsToday = starsMatch ? starsMatch[0] : '0';
      if (name) repos.push({ name, description, language, starsToday, url: `https://github.com/${name}` });
    });
    const result = { repos };
    githubCache.data = result;
    githubCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching GitHub trending:', error.message);
    res.status(500).json({ error: 'Failed to fetch GitHub trending' });
  }
});

app.get('/api/hackernews-trending', async (req, res) => {
  if (hnCache.data && hnCache.fetchedAt && (Date.now() - hnCache.fetchedAt < CACHE_TTL_2H)) {
    return res.json(hnCache.data);
  }
  try {
    const topRaw = await fetchRaw('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topIds = JSON.parse(topRaw).slice(0, 10);
    const items = await Promise.all(
      topIds.map((id) =>
        fetchRaw(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then((r) => JSON.parse(r))
          .catch(() => null)
      )
    );
    const stories = items
      .filter(Boolean)
      .map((item) => ({
        title: item.title || '',
        score: item.score || 0,
        url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
        author: item.by || '',
      }));
    const result = { stories };
    hnCache.data = result;
    hnCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Hacker News:', error.message);
    res.status(500).json({ error: 'Failed to fetch Hacker News trending' });
  }
});

app.get('/api/producthunt-trending', async (req, res) => {
  if (phCache.data && phCache.fetchedAt && (Date.now() - phCache.fetchedAt < CACHE_TTL_2H)) {
    return res.json(phCache.data);
  }
  const token = process.env.PRODUCT_HUNT_TOKEN;
  if (!token) return res.status(500).json({ error: 'PRODUCT_HUNT_TOKEN not configured' });
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const query = `{ posts(order: VOTES, first: 10, postedAfter: "${today.toISOString()}") { edges { node { name tagline votesCount url thumbnail { url } } } } }`;
    const json = await postJson('https://api.producthunt.com/v2/api/graphql', { query }, {
      'Authorization': `Bearer ${token}`,
    });
    const posts = (json.data?.posts?.edges || []).map(({ node: n }) => ({
      name: n.name,
      tagline: n.tagline,
      votes: n.votesCount,
      url: n.url,
      thumbnail: n.thumbnail?.url || null,
    }));
    const result = { posts };
    phCache.data = result;
    phCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Product Hunt:', error.message);
    res.status(500).json({ error: 'Failed to fetch Product Hunt trending' });
  }
});

function postJson(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'CosmicTesla/1.0 (https://cosmictesla.com; contact@cosmictesla.com)',
        ...headers,
      },
      timeout: 8000,
    };
    const req = https.request(options, (r) => {
      let raw = '';
      r.on('data', (c) => { raw += c; });
      r.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function fetchRaw(url, allowErrorBody = false, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        ...extraHeaders,
      },
      timeout: 8000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchRaw(res.headers.location, allowErrorBody, extraHeaders).then(resolve).catch(reject);
      }
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200 && !allowErrorBody) {
          return reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
        }
        resolve(raw);
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.on('error', reject);
  });
}

app.get('/api/reddit', async (req, res) => {
  try {
    const xml = await fetchRaw('https://www.reddit.com/r/all/hot.rss');
    const feed = await parser.parseString(xml);
    const posts = feed.items.slice(0, 5).map((item) => {
      const subreddit = (item.link || '').match(/reddit\.com\/r\/([^/]+)/)?.[1] || '';
      return { title: item.title, subreddit, url: item.link };
    });
    lastUpdated.reddit = new Date();
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching Reddit:', error.message);
    res.status(500).json({ error: 'Failed to fetch Reddit posts' });
  }
});

app.get('/api/youtube', async (req, res) => {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.error('YouTube: YOUTUBE_API_KEY is not set');
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=15&key=${key}`;
    const raw = await fetchRaw(url, true);
    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error('YouTube: failed to parse response:', raw.slice(0, 500));
      return res.status(500).json({ error: 'Failed to parse YouTube response' });
    }
    if (json.error) {
      console.error('YouTube API error:', JSON.stringify(json.error));
      return res.status(500).json({ error: `YouTube API error: ${json.error.message}` });
    }
    if (!json.items || !json.items.length) {
      console.error('YouTube: no items in response:', JSON.stringify(json).slice(0, 500));
      return res.status(500).json({ error: 'No videos returned from YouTube' });
    }
    const videos = json.items
      .filter((item) => parseInt(item.statistics?.viewCount || '0', 10) > 0)
      .slice(0, 10)
      .map((item) => ({
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        views: item.statistics.viewCount,
        thumbnail: (item.snippet.thumbnails.medium || item.snippet.thumbnails.default).url,
        url: `https://www.youtube.com/watch?v=${item.id}`,
      }));
    lastUpdated.youtube = new Date();
    res.json({ videos });
  } catch (error) {
    console.error('YouTube fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube trends' });
  }
});

app.get('/api/last-updated', (req, res) => {
  res.json(lastUpdated);
});

function formatDate(dateStr) {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function blogLayout(pageTitle, bodyContent, activePage = 'blog') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(pageTitle)} | CosmicTesla</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-padding-top: 52px; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f1117; color: #e2e4e9; min-height: 100vh; padding-top: 44px; }
    .site-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #1a1d29; border-bottom: 1px solid #2a2d3a; display: flex; justify-content: center; align-items: center; gap: 4px; padding: 8px 20px; height: 44px; }
    .nav-links { display: flex; gap: 4px; align-items: center; }
    .site-nav a { color: #8b8fa3; text-decoration: none; font-size: 0.85rem; font-weight: 500; padding: 6px 16px; border-radius: 6px; transition: color 0.2s, background 0.2s; }
    .site-nav a:hover { color: #e2e4e9; background: rgba(255,255,255,0.06); }
    .site-nav a.active { color: #00d4aa; background: rgba(0,212,170,0.08); }
    .nav-hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; cursor: pointer; padding: 4px 6px; border: none; background: none; margin-left: auto; }
    .nav-hamburger span { display: block; width: 22px; height: 2px; background: #e2e4e9; border-radius: 2px; }
    .nav-menu { display: none; position: fixed; top: 44px; left: 0; right: 0; background: #1a1d29; border-bottom: 1px solid #2a2d3a; flex-direction: column; z-index: 99; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
    .nav-menu a { color: #8b8fa3; text-decoration: none; font-size: 0.9rem; font-weight: 500; padding: 12px 20px; display: block; border-bottom: 1px solid rgba(42,45,58,0.6); transition: color 0.2s, background 0.2s; }
    .nav-menu a:hover { color: #e2e4e9; background: rgba(255,255,255,0.05); }
    .nav-menu a.active { color: #00d4aa; }
    .nav-menu.open { display: flex; }
    @media (max-width: 768px) { .nav-links { display: none; } .nav-hamburger { display: flex; } .site-nav { justify-content: flex-end; padding: 0 16px; } }
    header { background: linear-gradient(135deg, #1a1d29 0%, #0f1117 100%); border-bottom: 1px solid #2a2d3a; text-align: center; padding: 24px 32px; }
    header h1 a { font-size: 2rem; font-weight: 700; color: #00d4aa; letter-spacing: 1px; text-decoration: none; }
    header p { color: #8b8fa3; margin-top: 6px; font-size: 0.95rem; }
    footer { text-align: center; padding: 24px; border-top: 1px solid #2a2d3a; color: #555a6e; font-size: 0.85rem; margin-top: 48px; }
    footer a { color: #8b8fa3; text-decoration: none; margin: 0 10px; }
    .blog-wrap { max-width: 760px; margin: 0 auto; padding: 40px 20px; }
    .blog-index-title { font-size: 1.4rem; font-weight: 700; color: #e2e4e9; margin-bottom: 24px; }
    .post-card { display: block; background: #1a1d29; border: 1px solid #2a2d3a; border-radius: 10px; padding: 20px 24px; margin-bottom: 12px; text-decoration: none; transition: border-color 0.2s; }
    .post-card:hover { border-color: #00d4aa; }
    .post-card-title { font-size: 1.1rem; font-weight: 600; color: #f0f1f5; margin-bottom: 6px; }
    .post-card-date { font-size: 0.8rem; color: #6b7080; }
    .back-link { margin-bottom: 24px; }
    .back-link a { color: #8b8fa3; text-decoration: none; font-size: 0.9rem; }
    .back-link a:hover { color: #00d4aa; }
    .post-article h1 { font-size: 1.8rem; font-weight: 700; color: #f0f1f5; margin-bottom: 8px; line-height: 1.3; }
    .post-date { font-size: 0.85rem; color: #6b7080; margin-bottom: 32px; }
    .post-content { line-height: 1.8; color: #c8cad4; }
    .post-content h2 { font-size: 1.25rem; font-weight: 700; color: #e2e4e9; margin: 32px 0 12px; }
    .post-content h3 { font-size: 1.05rem; font-weight: 600; color: #e2e4e9; margin: 24px 0 10px; }
    .post-content p { margin-bottom: 16px; }
    .post-content a { color: #00d4aa; text-decoration: underline; text-decoration-color: rgba(0,212,170,0.4); }
    .post-content a:hover { text-decoration-color: #00d4aa; }
    .post-content ul, .post-content ol { margin: 0 0 16px 24px; }
    .post-content li { margin-bottom: 6px; }
    .post-content code { background: #252838; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; color: #00d4aa; }
    .post-content pre { background: #252838; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; overflow-x: auto; margin-bottom: 16px; }
    .post-content pre code { background: none; padding: 0; color: #e2e4e9; }
    .post-content blockquote { border-left: 3px solid #00d4aa; padding-left: 16px; color: #8b8fa3; margin-bottom: 16px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #555a6e; }
    @media (max-width: 600px) { header h1 a { font-size: 1.5rem; } .blog-wrap { padding: 24px 16px; } }
  </style>
</head>
<body>
  <nav class="site-nav">
    <div class="nav-links">
      <a href="/#google-trending">📈 Google Trending</a>
      <a href="/#reddit-trending">🔥 Reddit Trending</a>
      <a href="/#youtube-trending">▶️ YouTube Trending</a>
      <a href="/#wiki-trending">📖 Wikipedia</a>
      <a href="/#github-trending">🐱 GitHub</a>
      <a href="/#hn-trending">🔶 HN</a>
      <a href="/#ph-trending">🚀 Product Hunt</a>
      <a href="/blog" class="${activePage === 'blog' ? 'active' : ''}">✍️ Blog</a>
      <a href="/contact" class="${activePage === 'contact' ? 'active' : ''}">📬 Contact</a>
    </div>
    <button class="nav-hamburger" id="navToggle" aria-label="Toggle navigation" onclick="toggleMenu()">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="nav-menu" id="navMenu">
    <a href="/#google-trending" onclick="closeMenu()">📈 Google Trending</a>
    <a href="/#reddit-trending" onclick="closeMenu()">🔥 Reddit Trending</a>
    <a href="/#youtube-trending" onclick="closeMenu()">▶️ YouTube Trending</a>
    <a href="/#wiki-trending" onclick="closeMenu()">📖 Wikipedia</a>
    <a href="/#github-trending" onclick="closeMenu()">🐱 GitHub</a>
    <a href="/#hn-trending" onclick="closeMenu()">🔶 Hacker News</a>
    <a href="/#ph-trending" onclick="closeMenu()">🚀 Product Hunt</a>
    <a href="/blog" class="${activePage === 'blog' ? 'active' : ''}" onclick="closeMenu()">✍️ Blog</a>
    <a href="/contact" class="${activePage === 'contact' ? 'active' : ''}" onclick="closeMenu()">📬 Contact</a>
  </div>
  <header>
    <h1><a href="/">CosmicTesla</a></h1>
    <p>Real-time trending searches across the internet</p>
  </header>
  ${bodyContent}
  <footer>
    <span>&copy; 2026 CosmicTesla</span>
    <a href="/about">About</a>
    <a href="/privacy">Privacy Policy</a>
    <a href="/blog">Blog</a>
    <a href="/contact">Contact</a>
  </footer>
  <script>
    function toggleMenu() { document.getElementById('navMenu').classList.toggle('open'); }
    function closeMenu() { document.getElementById('navMenu').classList.remove('open'); }
    document.addEventListener('click', function(e) {
      var menu = document.getElementById('navMenu');
      var toggle = document.getElementById('navToggle');
      if (menu && menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('open');
      }
    });
  </script>
</body>
</html>`;
}

const POSTS_DIR = path.join(__dirname, 'posts');

app.get('/blog', (req, res) => {
  let posts = [];
  if (fs.existsSync(POSTS_DIR)) {
    posts = fs.readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith('.md'))
      .map((file) => {
        const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
        const lines = raw.split('\n');
        const title = lines[0].replace(/^#+\s*/, '').trim();
        const date = lines[1].trim();
        return { title, date, slug: file.replace('.md', '') };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  const postsHtml = posts.length
    ? posts.map((p) => `
        <a class="post-card" href="/blog/${escHtml(p.slug)}">
          <div class="post-card-title">${escHtml(p.title)}</div>
          <div class="post-card-date">${escHtml(formatDate(p.date))}</div>
        </a>`).join('')
    : '<div class="empty-state">No posts yet.</div>';

  res.send(blogLayout('Blog', `
    <div class="blog-wrap">
      <div class="blog-index-title">Blog</div>
      ${postsHtml}
    </div>`));
});

app.get('/blog/:slug', (req, res) => {
  const slug = req.params.slug.replace(/[^a-zA-Z0-9-_]/g, '');
  const filePath = path.join(POSTS_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send(blogLayout('Post Not Found', `
      <div class="blog-wrap">
        <div class="back-link"><a href="/blog">← Back to Blog</a></div>
        <p style="color:#ff6b6b">Post not found.</p>
      </div>`));
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim();
  const date = lines[1].trim();
  const body = lines.slice(2).join('\n');

  res.send(blogLayout(title, `
    <div class="blog-wrap">
      <div class="back-link"><a href="/blog">← Back to Blog</a></div>
      <article>
        <h1 class="post-article" style="font-size:1.8rem;font-weight:700;color:#f0f1f5;margin-bottom:8px;line-height:1.3">${escHtml(title)}</h1>
        <div class="post-date">${escHtml(formatDate(date))}</div>
        <div class="post-content">${marked(body)}</div>
      </article>
    </div>`));
});

app.get('/contact', (req, res) => {
  res.send(blogLayout('Contact', `
    <div class="blog-wrap">
      <h1 style="font-size:1.8rem;font-weight:700;color:#f0f1f5;margin-bottom:16px;">Contact</h1>
      <p style="color:#c8cad4;line-height:1.8;margin-bottom:12px;">CosmicTesla is a real-time trending intelligence hub that aggregates what people are searching, sharing, watching, buying, and talking about across Google, Reddit, YouTube, and a growing list of platforms. The scope is expanding continuously — more data sources, richer trend breakdowns, and original insight through the CosmicTesla Blog are actively in development. For questions, feedback, or partnership inquiries, reach out directly.</p>
      <p style="color:#c8cad4;line-height:1.8;">Email: <a href="mailto:pixelridgestudio@gmail.com" style="color:#00d4aa;text-decoration:underline;text-decoration-color:rgba(0,212,170,0.4);">pixelridgestudio@gmail.com</a></p>
    </div>`, 'contact'));
});

app.listen(PORT, () => {
console.log(`CosmicTesla is running at http://localhost:${PORT}`);
});