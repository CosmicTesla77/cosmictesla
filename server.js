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

async function fetchHeadlines(topic) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 3).map((item) => ({
      title: item.title,
      link: item.link,
    }));
  } catch (e) {
    return [];
  }
}

const VALID_HOURS = [1, 4, 24, 168];
const TIMEFRAME_LABELS = { 1: 'Past hour', 4: 'Past 4 hours', 24: 'Past 24 hours', 168: 'Past 7 days' };

app.get('/api/trends', async (req, res) => {
  const hours = VALID_HOURS.includes(parseInt(req.query.hours, 10))
    ? parseInt(req.query.hours, 10)
    : 24;

  try {
    const feed = await parser.parseURL(
      `https://trends.google.com/trending/rss?geo=US&hours=${hours}`
    );

    const trends = feed.items.map((item) => ({
      title: item.title,
      traffic: item.traffic || 'Trending',
      trafficNum: parseTraffic(item.traffic),
      link: `https://www.google.com/search?q=${encodeURIComponent(item.title)}`,
      pubDate: item.pubDate,
      image: item.picture || null,
    }));

    trends.sort((a, b) => b.trafficNum - a.trafficNum);
    const top20 = trends.slice(0, 20);

    const headlines = await Promise.all(top20.map((t) => fetchHeadlines(t.title)));
    const trendsWithHeadlines = top20.map((t, i) => ({ ...t, headlines: headlines[i] }));

    res.json({
      date: new Date().toLocaleDateString(),
      timeframe: TIMEFRAME_LABELS[hours],
      trends: trendsWithHeadlines,
    });
  } catch (error) {
    console.error('Error fetching trends:', error.message);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

app.listen(PORT, () => {
console.log(`CosmicTesla is running at http://localhost:${PORT}`);
});