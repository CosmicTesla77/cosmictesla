const express = require('express');
const Parser = require('rss-parser');
const path = require('path');

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

app.get('/api/reddit', async (req, res) => {
  try {
    const response = await fetch('https://www.reddit.com/r/all/hot.json?limit=5', {
      headers: { 'User-Agent': 'CosmicTesla/1.0' },
    });
    const json = await response.json();
    const posts = json.data.children.map(({ data: p }) => ({
      title: p.title,
      subreddit: p.subreddit,
      score: p.score,
      numComments: p.num_comments,
      url: 'https://www.reddit.com' + p.permalink,
    }));
    res.json({ posts });
  } catch (error) {
    console.error('Error fetching Reddit:', error.message);
    res.status(500).json({ error: 'Failed to fetch Reddit posts' });
  }
});

app.listen(PORT, () => {
console.log(`CosmicTesla is running at http://localhost:${PORT}`);
});