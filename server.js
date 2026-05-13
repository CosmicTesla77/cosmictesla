const express = require('express');
const Parser = require('rss-parser');
const path = require('path');
const https = require('https');

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
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=10&key=${key}`;
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
    const videos = json.items.map((item) => ({
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      views: item.statistics.viewCount || '0',
      thumbnail: (item.snippet.thumbnails.medium || item.snippet.thumbnails.default).url,
      url: `https://www.youtube.com/watch?v=${item.id}`,
    }));
    res.json({ videos });
  } catch (error) {
    console.error('YouTube fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch YouTube trends' });
  }
});

app.listen(PORT, () => {
console.log(`CosmicTesla is running at http://localhost:${PORT}`);
});