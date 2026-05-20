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
const tmdbCache = { data: null, fetchedAt: null };
const cryptoCache = { data: null, fetchedAt: null };
const steamCache = { data: null, fetchedAt: null };
const booksCache = { data: null, fetchedAt: null };
const twitchCache = { data: null, fetchedAt: null };
const spotifyCache = { data: null, fetchedAt: null };
const CACHE_TTL_2H = 2 * 60 * 60 * 1000;

let spotifyToken = null;
let spotifyTokenExpiry = 0;

async function getSpotifyToken() {
  if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const payload = 'grant_type=client_credentials';
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'accounts.spotify.com', path: '/api/token', method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(raw);
          spotifyToken = j.access_token;
          spotifyTokenExpiry = Date.now() + (j.expires_in - 60) * 1000;
          resolve(spotifyToken);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
const CACHE_TTL_60M = 60 * 60 * 1000;
const CACHE_TTL_5M = 5 * 60 * 1000;

let twitchToken = null;
let twitchTokenExpiry = 0;

async function getTwitchToken() {
  if (twitchToken && Date.now() < twitchTokenExpiry) return twitchToken;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const payload = `client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'id.twitch.tv', path: '/oauth2/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let raw = '';
      res.on('data', (c) => { raw += c; });
      res.on('end', () => {
        try {
          const j = JSON.parse(raw);
          twitchToken = j.access_token;
          twitchTokenExpiry = Date.now() + (j.expires_in - 3600) * 1000;
          resolve(twitchToken);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
const CACHE_TTL_10M = 10 * 60 * 1000;

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

app.get('/api/tmdb-trending', async (req, res) => {
  if (tmdbCache.data && tmdbCache.fetchedAt && (Date.now() - tmdbCache.fetchedAt < CACHE_TTL_2H)) {
    return res.json(tmdbCache.data);
  }
  const key = process.env.TMDB_API_KEY;
  if (!key) return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
  try {
    const raw = await fetchRaw(`https://api.themoviedb.org/3/trending/all/day?api_key=${key}`);
    const json = JSON.parse(raw);
    const items = (json.results || []).slice(0, 10).map((item) => {
      const title = item.title || item.name || '';
      const mediaType = item.media_type === 'tv' ? 'TV Show' : 'Movie';
      const poster = item.poster_path
        ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : null;
      const affiliateUrl = `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=cosmictesla-20`;
      return { title, mediaType, overview: item.overview || '', poster, affiliateUrl };
    });
    const result = { items };
    tmdbCache.data = result;
    tmdbCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching TMDB:', error.message);
    res.status(500).json({ error: 'Failed to fetch TMDB trending' });
  }
});

app.get('/api/crypto-trending', async (req, res) => {
  if (cryptoCache.data && cryptoCache.fetchedAt && (Date.now() - cryptoCache.fetchedAt < CACHE_TTL_10M)) {
    return res.json(cryptoCache.data);
  }
  try {
    const raw = await fetchRaw('https://api.coingecko.com/api/v3/search/trending', false, {
      'Accept': 'application/json',
      'User-Agent': 'CosmicTesla/1.0 (https://cosmictesla.com; contact@cosmictesla.com)',
    });
    const json = JSON.parse(raw);
    const coins = (json.coins || []).slice(0, 10).map(({ item }) => ({
      name: item.name,
      symbol: item.symbol.toUpperCase(),
      rank: item.market_cap_rank || null,
      thumb: item.small || item.thumb || null,
      priceChange: item.data?.price_change_percentage_24h?.usd ?? null,
      price: item.data?.price || null,
    }));
    const result = { coins };
    cryptoCache.data = result;
    cryptoCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching CoinGecko:', error.message);
    res.status(500).json({ error: 'Failed to fetch crypto trending' });
  }
});

app.get('/api/steam-trending', async (req, res) => {
  if (steamCache.data && steamCache.fetchedAt && (Date.now() - steamCache.fetchedAt < CACHE_TTL_2H)) {
    return res.json(steamCache.data);
  }
  try {
    const html = await fetchRaw('https://store.steampowered.com/search/?filter=topsellers', false, {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml',
    });
    const $ = cheerio.load(html);
    const games = [];
    $('a.search_result_row').each((i, el) => {
      if (games.length >= 10) return false;
      const title = $(el).find('span.title').text().trim();
      if (!title) return;
      const appId = $(el).attr('data-ds-appid');
      const price = $(el).find('.discount_final_price').text().trim()
        || $(el).find('.search_price').text().trim().replace(/\s+/g, ' ')
        || 'Free';
      const reviewRaw = $(el).find('span[data-tooltip-html]').first().attr('data-tooltip-html') || '';
      const review = reviewRaw.split('<br>')[0].trim();
      const image = appId ? `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg` : null;
      const url = $(el).attr('href') || `https://store.steampowered.com/app/${appId}/`;
      const affiliateUrl = `https://www.amazon.com/s?k=${encodeURIComponent(title)}&tag=cosmictesla-20`;
      games.push({ title, price, review, image, url, affiliateUrl });
    });
    const result = { games };
    steamCache.data = result;
    steamCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Steam:', error.message);
    res.status(500).json({ error: 'Failed to fetch Steam top sellers' });
  }
});

app.get('/api/books-trending', async (req, res) => {
  if (booksCache.data && booksCache.fetchedAt && (Date.now() - booksCache.fetchedAt < CACHE_TTL_60M)) {
    return res.json(booksCache.data);
  }
  const key = process.env.NYT_API_KEY;
  if (!key) return res.status(500).json({ error: 'NYT_API_KEY not configured' });
  try {
    const [ficRaw, nonficRaw] = await Promise.all([
      fetchRaw(`https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key=${key}`),
      fetchRaw(`https://api.nytimes.com/svc/books/v3/lists/current/hardcover-nonfiction.json?api-key=${key}`),
    ]);
    const mapBooks = (raw) => JSON.parse(raw).results.books.slice(0, 10).map((b) => ({
      rank: b.rank,
      title: b.title,
      author: b.author,
      description: b.description,
      weeksOnList: b.weeks_on_list,
      cover: b.book_image || null,
      affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(b.title + ' ' + b.author)}&tag=cosmictesla-20`,
    }));
    const result = { fiction: mapBooks(ficRaw), nonfiction: mapBooks(nonficRaw) };
    booksCache.data = result;
    booksCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching NYT Books:', error.message);
    res.status(500).json({ error: 'Failed to fetch books trending' });
  }
});

app.get('/api/twitch-trending', async (req, res) => {
  if (twitchCache.data && twitchCache.fetchedAt && (Date.now() - twitchCache.fetchedAt < CACHE_TTL_5M)) {
    return res.json(twitchCache.data);
  }
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(500).json({ error: 'Twitch credentials not configured' });
  try {
    const token = await getTwitchToken();
    const twitchHeaders = { 'Client-ID': clientId, 'Authorization': `Bearer ${token}` };
    const [gamesRaw, streamsRaw] = await Promise.all([
      fetchRaw('https://api.twitch.tv/helix/games/top?first=20', false, twitchHeaders),
      fetchRaw('https://api.twitch.tv/helix/streams?first=100', false, twitchHeaders),
    ]);
    const gamesJson = JSON.parse(gamesRaw);
    const streamsJson = JSON.parse(streamsRaw);
    const viewersByGame = {};
    (streamsJson.data || []).forEach((s) => {
      viewersByGame[s.game_id] = (viewersByGame[s.game_id] || 0) + s.viewer_count;
    });
    const games = (gamesJson.data || []).map((g) => ({
      name: g.name,
      boxArt: g.box_art_url.replace('{width}', '144').replace('{height}', '192'),
      viewers: viewersByGame[g.id] || 0,
      affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(g.name)}&tag=cosmictesla-20`,
    }));
    const result = { games };
    twitchCache.data = result;
    twitchCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Twitch:', error.message);
    res.status(500).json({ error: 'Failed to fetch Twitch trending' });
  }
});

app.get('/api/spotify-trending', async (req, res) => {
  if (spotifyCache.data && spotifyCache.fetchedAt && (Date.now() - spotifyCache.fetchedAt < CACHE_TTL_5M)) {
    return res.json(spotifyCache.data);
  }
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Spotify credentials not configured' });
  }
  try {
    const token = await getSpotifyToken();
    // /v1/recommendations works with client credentials (no user OAuth required).
    // seed_genres drives genre diversity; min_popularity filters out obscure tracks.
    const raw = await fetchRaw(
      'https://api.spotify.com/v1/recommendations?seed_genres=pop%2Chip-hop%2Crock&limit=20&min_popularity=60',
      false, { 'Authorization': `Bearer ${token}` }
    );
    const json = JSON.parse(raw);
    const tracks = (json.tracks || []).slice(0, 20).map((t, i) => {
      const artist = (t.artists || []).map((a) => a.name).join(', ');
      const images = t.album?.images || [];
      const art = (images.find((img) => img.width >= 200 && img.width <= 400) || images[0])?.url || null;
      return {
        rank: i + 1,
        name: t.name,
        artist,
        art,
        affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(t.name + ' ' + artist)}&tag=cosmictesla-20`,
      };
    });
    const result = { tracks };
    spotifyCache.data = result;
    spotifyCache.fetchedAt = Date.now();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Spotify:', error.message);
    res.status(500).json({ error: 'Failed to fetch Spotify trending' });
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
    .site-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #1a1d29; border-bottom: 1px solid #2a2d3a; display: flex; align-items: center; justify-content: center; gap: 2px; padding: 0 16px; height: 44px; }
    .nav-group { position: relative; height: 44px; display: flex; align-items: center; }
    .nav-group-btn { background: none; border: none; cursor: pointer; font-family: inherit; color: #8b8fa3; font-size: 0.85rem; font-weight: 500; padding: 6px 10px; border-radius: 6px; display: flex; align-items: center; gap: 4px; transition: color 0.2s, background 0.2s; white-space: nowrap; }
    .nav-group.open .nav-group-btn, .nav-group-btn:hover { color: #e2e4e9; background: rgba(255,255,255,0.06); }
    .nav-group .chev { font-size: 0.5rem; transition: transform 0.2s; display: inline-block; }
    .nav-group.open .chev { transform: rotate(180deg); }
    .nav-dropdown { display: none; position: absolute; top: 44px; left: 0; background: #1e2130; border: 1px solid #2a2d3a; border-radius: 8px; min-width: 180px; padding: 6px; z-index: 200; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
    .nav-group.open .nav-dropdown { display: block; }
    .nav-dropdown a { display: block; color: #8b8fa3; text-decoration: none; font-size: 0.85rem; font-weight: 500; padding: 8px 12px; border-radius: 6px; white-space: nowrap; transition: color 0.2s, background 0.2s; }
    .nav-dropdown a:hover { color: #e2e4e9; background: rgba(255,255,255,0.06); }
    .nav-standalone { color: #8b8fa3; text-decoration: none; font-size: 0.85rem; font-weight: 500; padding: 6px 10px; border-radius: 6px; white-space: nowrap; transition: color 0.2s, background 0.2s; }
    .nav-standalone:hover { color: #e2e4e9; background: rgba(255,255,255,0.06); }
    .nav-standalone.active { color: #00d4aa; background: rgba(0,212,170,0.08); }
    .nav-hamburger { display: none; flex-direction: column; justify-content: center; gap: 5px; cursor: pointer; padding: 4px 6px; border: none; background: none; margin-left: auto; }
    .nav-hamburger span { display: block; width: 22px; height: 2px; background: #e2e4e9; border-radius: 2px; }
    .nav-mobile-menu { display: none; position: fixed; top: 44px; left: 0; right: 0; background: #1a1d29; border-bottom: 1px solid #2a2d3a; max-height: calc(100vh - 44px); overflow-y: auto; z-index: 99; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
    .nav-mobile-menu.open { display: block; }
    .nav-acc-group { border-bottom: 1px solid rgba(42,45,58,0.6); }
    .nav-acc-btn { width: 100%; background: none; border: none; cursor: pointer; font-family: inherit; color: #8b8fa3; font-size: 0.9rem; font-weight: 600; padding: 13px 20px; text-align: left; display: flex; justify-content: space-between; align-items: center; transition: color 0.2s; }
    .nav-acc-btn:hover { color: #e2e4e9; }
    .nav-acc-btn .chev { font-size: 0.5rem; transition: transform 0.2s; }
    .nav-acc-group.open .nav-acc-btn .chev { transform: rotate(180deg); }
    .nav-acc-items { display: none; padding: 0 0 6px; }
    .nav-acc-group.open .nav-acc-items { display: block; }
    .nav-acc-items a { display: block; color: #8b8fa3; text-decoration: none; font-size: 0.88rem; padding: 9px 20px 9px 32px; transition: color 0.2s, background 0.2s; }
    .nav-acc-items a:hover { color: #e2e4e9; background: rgba(255,255,255,0.04); }
    .nav-mobile-standalone a { display: block; color: #8b8fa3; text-decoration: none; font-size: 0.9rem; padding: 13px 20px; border-bottom: 1px solid rgba(42,45,58,0.6); transition: color 0.2s; }
    .nav-mobile-standalone a:hover { color: #e2e4e9; }
    @media (max-width: 768px) { .site-nav { justify-content: flex-end; } .nav-group, .nav-standalone { display: none; } .nav-hamburger { display: flex; } }
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
    <div class="nav-group">
      <button class="nav-group-btn">Social <span class="chev">▼</span></button>
      <div class="nav-dropdown">
        <a href="/#google-trending">📈 Google Trending</a>
        <a href="/#reddit-trending">🔥 Reddit Trending</a>
        <a href="/#youtube-trending">▶️ YouTube Trending</a>
      </div>
    </div>
    <div class="nav-group">
      <button class="nav-group-btn">Tech <span class="chev">▼</span></button>
      <div class="nav-dropdown">
        <a href="/#github-trending">🐱 GitHub</a>
        <a href="/#hn-trending">🔶 Hacker News</a>
        <a href="/#ph-trending">🚀 Product Hunt</a>
      </div>
    </div>
    <div class="nav-group">
      <button class="nav-group-btn">Entertainment <span class="chev">▼</span></button>
      <div class="nav-dropdown">
        <a href="/#tmdb-trending">🎬 Movies &amp; TV</a>
        <a href="/#steam-trending">🎮 Steam</a>
        <a href="/#twitch-trending">🟣 Twitch</a>
        <a href="/#spotify-trending">🎵 Spotify</a>
      </div>
    </div>
    <div class="nav-group">
      <button class="nav-group-btn">Culture <span class="chev">▼</span></button>
      <div class="nav-dropdown">
        <a href="/#wiki-trending">📖 Wikipedia</a>
        <a href="/#books-trending">📚 Books</a>
        <a href="/#crypto-trending">🪙 Crypto</a>
      </div>
    </div>
    <a href="/blog" class="nav-standalone ${activePage === 'blog' ? 'active' : ''}">✍️ Blog</a>
    <a href="/contact" class="nav-standalone ${activePage === 'contact' ? 'active' : ''}">📬 Contact</a>
    <button class="nav-hamburger" id="navToggle" aria-label="Toggle navigation" onclick="toggleMenu()">
      <span></span><span></span><span></span>
    </button>
  </nav>
  <div class="nav-mobile-menu" id="navMobileMenu">
    <div class="nav-acc-group">
      <button class="nav-acc-btn" onclick="toggleAccordion(this)">Social <span class="chev">▼</span></button>
      <div class="nav-acc-items">
        <a href="/#google-trending" onclick="closeMenu()">📈 Google Trending</a>
        <a href="/#reddit-trending" onclick="closeMenu()">🔥 Reddit Trending</a>
        <a href="/#youtube-trending" onclick="closeMenu()">▶️ YouTube Trending</a>
      </div>
    </div>
    <div class="nav-acc-group">
      <button class="nav-acc-btn" onclick="toggleAccordion(this)">Tech <span class="chev">▼</span></button>
      <div class="nav-acc-items">
        <a href="/#github-trending" onclick="closeMenu()">🐱 GitHub</a>
        <a href="/#hn-trending" onclick="closeMenu()">🔶 Hacker News</a>
        <a href="/#ph-trending" onclick="closeMenu()">🚀 Product Hunt</a>
      </div>
    </div>
    <div class="nav-acc-group">
      <button class="nav-acc-btn" onclick="toggleAccordion(this)">Entertainment <span class="chev">▼</span></button>
      <div class="nav-acc-items">
        <a href="/#tmdb-trending" onclick="closeMenu()">🎬 Movies &amp; TV</a>
        <a href="/#steam-trending" onclick="closeMenu()">🎮 Steam</a>
        <a href="/#twitch-trending" onclick="closeMenu()">🟣 Twitch</a>
        <a href="/#spotify-trending" onclick="closeMenu()">🎵 Spotify</a>
      </div>
    </div>
    <div class="nav-acc-group">
      <button class="nav-acc-btn" onclick="toggleAccordion(this)">Culture <span class="chev">▼</span></button>
      <div class="nav-acc-items">
        <a href="/#wiki-trending" onclick="closeMenu()">📖 Wikipedia</a>
        <a href="/#books-trending" onclick="closeMenu()">📚 Books</a>
        <a href="/#crypto-trending" onclick="closeMenu()">🪙 Crypto</a>
      </div>
    </div>
    <div class="nav-mobile-standalone">
      <a href="/blog" onclick="closeMenu()">✍️ Blog</a>
      <a href="/contact" onclick="closeMenu()">📬 Contact</a>
    </div>
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
    document.querySelectorAll('.nav-group').forEach(function(g) {
      g.addEventListener('mouseenter', function() { this.classList.add('open'); });
      g.addEventListener('mouseleave', function() { this.classList.remove('open'); });
    });
    function toggleMenu() { document.getElementById('navMobileMenu').classList.toggle('open'); }
    function closeMenu() { document.getElementById('navMobileMenu').classList.remove('open'); }
    function toggleAccordion(btn) { btn.closest('.nav-acc-group').classList.toggle('open'); }
    document.addEventListener('click', function(e) {
      var menu = document.getElementById('navMobileMenu');
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

// ── Startup environment variable check ────────────────────────────────────
const REQUIRED_ENV = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'YOUTUBE_API_KEY',
  'TMDB_API_KEY',
  'NYT_API_KEY',
  'PRODUCT_HUNT_TOKEN',
];
console.log('[CosmicTesla] Startup environment check:');
REQUIRED_ENV.forEach((key) => {
  const val = process.env[key];
  console.log(`  ${key}: ${val ? `SET (${val.length} chars)` : 'NOT SET ⚠️'}`);
});

app.listen(PORT, () => {
  console.log(`[CosmicTesla] Server running at http://localhost:${PORT}`);
});