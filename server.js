const express = require('express');
const Parser = require('rss-parser');
const path = require('path');
const https = require('https');
const fs = require('fs');
const { marked } = require('marked');

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

app.use((req, res, next) => {
  if (req.hostname === 'cosmictesla.com') {
    return res.redirect(301, 'https://www.cosmictesla.com' + req.originalUrl);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

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
      title: item.title,
      traffic: item.traffic || 'Trending',
      trafficNum: parseTraffic(item.traffic),
      link: `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
      image: item.picture || null,
    }));

    trends.sort((a, b) => b.trafficNum - a.trafficNum);
    const top20 = trends.slice(0, 20);

    const headlines = await Promise.all(top20.map((t) => fetchHeadlines(t.title, country)));
    const trendsWithHeadlines = top20.map((t, i) => ({ ...t, headlines: headlines[i] }));

    res.json({
      date: new Date().toLocaleDateString(),
      country: country.name,
      trends: trendsWithHeadlines,
    });
  } catch (error) {
    console.error('Error fetching trends:', error.message);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

function fetchRaw(url, allowErrorBody = false) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchRaw(res.headers.location, allowErrorBody).then(resolve).catch(reject);
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
    res.json({ videos });
  } catch (error) {
    console.error('YouTube fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube trends' });
  }
});

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
    .site-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #1a1d29; border-bottom: 1px solid #2a2d3a; display: flex; justify-content: center; gap: 4px; padding: 8px 20px; flex-wrap: wrap; }
    .site-nav a { color: #8b8fa3; text-decoration: none; font-size: 0.85rem; font-weight: 500; padding: 6px 16px; border-radius: 6px; transition: color 0.2s, background 0.2s; }
    .site-nav a:hover { color: #e2e4e9; background: rgba(255,255,255,0.06); }
    .site-nav a.active { color: #00d4aa; background: rgba(0,212,170,0.08); }
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
  </style>
</head>
<body>
  <nav class="site-nav">
    <a href="/#google-trending">📈 Google Trending</a>
    <a href="/#reddit-trending">🔥 Reddit Trending</a>
    <a href="/#youtube-trending">▶️ YouTube Trending</a>
    <a href="/blog" class="${activePage === 'blog' ? 'active' : ''}">✍️ Blog</a>
  </nav>
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
  </footer>
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
          <div class="post-card-date">${escHtml(p.date)}</div>
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
        <div class="post-date">${escHtml(date)}</div>
        <div class="post-content">${marked(body)}</div>
      </article>
    </div>`));
});

app.listen(PORT, () => {
console.log(`CosmicTesla is running at http://localhost:${PORT}`);
});