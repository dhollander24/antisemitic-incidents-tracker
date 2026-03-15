const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API keys from environment
const NEWS_API_KEY_STRING = process.env.NEWS_API_KEY;
const GNEWS_API_KEY_STRING = process.env.GNEWS_API_KEY;

// In-memory storage (in production, use a database like MongoDB or PostgreSQL)
let incidents = [];


function extractSharedData(article) {
  let location = 'United States'; 
  const usStates = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
  
  const textToSearch = (article.title + ' ' + (article.description || article.content || '')).replace(/[^\w\s]/g, ' ');
  for (const state of usStates) {
    const stateRegex = new RegExp(`\\b${state}\\b`, 'i');
    if (stateRegex.test(textToSearch)) {
      location = state;
      const match = textToSearch.match(new RegExp(`([A-Z][a-z]+)[\\s,]+${state}`, 'i'));
      if (match && match[1] && !['In', 'The', 'At', 'Near', 'To', 'From'].includes(match[1])) {
          location = `${match[1]}, ${state}`;
      }
      break;
    }
  }

  const titleLower = article.title.toLowerCase();
  const descLower = ((article.description || '') + ' ' + (article.content || '')).toLowerCase();
  let category = 'Harassment';
  if (titleLower.includes('assault') || descLower.includes('assault') || titleLower.includes('attack') || titleLower.includes('punched')) {
      category = 'Physical Assault';
  } else if (titleLower.includes('vandal') || descLower.includes('vandal') || titleLower.includes('swastika') || titleLower.includes('graffiti')) {
      category = 'Vandalism';
  } else if (titleLower.includes('threat') || descLower.includes('threat') || titleLower.includes('bomb')) {
      category = 'Threat';
  }

  return { location, category };
}

// Map NewsAPI structure
function parseNewsApiIncident(article) {
  const { location, category } = extractSharedData(article);
  return {
    id: Math.random().toString(36).substring(2, 15),
    title: article.title,
    description: article.description || article.content || 'No description available.',
    date: article.publishedAt,
    location: location,
    source: article.source?.name || 'NewsAPI',
    url: article.url,
    category: category,
    status: 'pending_review' 
  };
}

// Map GNews structure
function parseGnewsIncident(article) {
  const { location, category } = extractSharedData(article);
  return {
    id: Math.random().toString(36).substring(2, 15),
    title: article.title,
    description: article.description || article.content || 'No description available.',
    date: article.publishedAt,
    location: location,
    source: article.source?.name || 'GNews',
    url: article.url,
    category: category,
    status: 'pending_review' 
  };
}

// Routes

// Get all incidents
app.get('/api/incidents', (req, res) => {
  const { status, category, location, sortBy = 'date' } = req.query;
  
  let filtered = incidents;
  
  if (status) {
    filtered = filtered.filter(i => i.status === status);
  }
  if (category && category !== 'All') {
    filtered = filtered.filter(i => i.category === category);
  }
  if (location && location !== 'All') {
    filtered = filtered.filter(i => i.location === location);
  }
  
  // Sort
  if (sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'location') {
    filtered.sort((a, b) => a.location.localeCompare(b.location));
  }
  
  res.json(filtered);
});

// Get single incident
app.get('/api/incidents/:id', (req, res) => {
  const incident = incidents.find(i => i.id == req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json(incident);
});

// Update incident status/category
app.patch('/api/incidents/:id', (req, res) => {
  const incident = incidents.find(i => i.id == req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  
  const { status, category, notes } = req.body;
  if (status) incident.status = status;
  if (category) incident.category = category;
  if (notes) incident.notes = notes;
  
  res.json(incident);
});

// Delete incident
app.delete('/api/incidents/:id', (req, res) => {
  incidents = incidents.filter(i => i.id != req.params.id);
  res.json({ success: true });
});

// Fetch from News API
app.post('/api/fetch-news', async (req, res) => {
  try {
    const newsApiKeys = NEWS_API_KEY_STRING ? NEWS_API_KEY_STRING.split(',').map(k => k.trim()).filter(k => k) : [];
    const gnewsApiKeys = GNEWS_API_KEY_STRING ? GNEWS_API_KEY_STRING.split(',').map(k => k.trim()).filter(k => k) : [];
    
    if (newsApiKeys.length === 0 && gnewsApiKeys.length === 0) {
      return res.status(400).json({ error: 'No valid API keys found in NEWS_API_KEY or GNEWS_API_KEY' });
    }
    
    const searchQueries = [
      'antisemitic OR antisemitism',
      'hate crime Jewish',
      'swastika incident',
    ];
    
    let newIncidents = [];
    const timeframe = req.query.timeframe || 'month'; // 'month' or 'year' or 'today'
    
    const fromDate = new Date();
    let toDateString = null;
    if (timeframe === 'year') {
      const lastYear = fromDate.getFullYear() - 1;
      fromDate.setFullYear(lastYear, 0, 1);
      const toDate = new Date();
      toDate.setFullYear(lastYear, 11, 31);
      toDateString = toDate.toISOString().split('T')[0];
    } else if (timeframe === 'today') {
      fromDate.setDate(fromDate.getDate() - 1); // 24 hours ago
    } else {
      fromDate.setDate(fromDate.getDate() - 28);
    }
    const fromDateString = fromDate.toISOString().split('T')[0];
    
    for (const query of searchQueries) {
      // 1. Fetch from GNews (Real-time, bypasses 24h delay)
      if (gnewsApiKeys.length > 0) {
        let gnewsSuccess = false;
        let gKeyIdx = 0;
        while (!gnewsSuccess && gKeyIdx < gnewsApiKeys.length) {
          try {
            const params = {
              q: query,
              from: fromDateString + 'T00:00:00Z',
              lang: 'en',
              apikey: gnewsApiKeys[gKeyIdx],
              max: 100, // GNews max
            };
            if (toDateString) params.to = toDateString + 'T23:59:59Z';

            const response = await axios.get('https://gnews.io/api/v4/search', {
              params: params,
              timeout: 10000,
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (response.data.articles) {
              newIncidents.push(
                ...response.data.articles
                  .filter(article => article.title && article.title !== '[Removed]')
                  .map(article => parseGnewsIncident(article))
              );
            }
            gnewsSuccess = true;
          } catch (e) {
            console.error(`GNews query "${query}" failed on key ${gKeyIdx}:`, e.response?.data?.message || e.message);
            gKeyIdx++;
          }
        }
      }

      // 2. Fetch from NewsAPI (Extensive catalog)
      if (newsApiKeys.length > 0) {
        let newsApiSuccess = false;
        let nKeyIdx = 0;
        while (!newsApiSuccess && nKeyIdx < newsApiKeys.length) {
          try {
            const params = {
              q: query,
              from: fromDateString,
              sortBy: 'publishedAt',
              language: 'en',
              apiKey: newsApiKeys[nKeyIdx],
              pageSize: 100,
            };
            if (toDateString) params.to = toDateString;

            const response = await axios.get('https://newsapi.org/v2/everything', {
              params: params,
              timeout: 10000,
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (response.data.articles) {
              newIncidents.push(
                ...response.data.articles
                  .filter(article => article.title && article.title !== '[Removed]' && article.url !== 'https://removed.com')
                  .map(article => parseNewsApiIncident(article))
              );
            }
            newsApiSuccess = true;
          } catch (e) {
            console.error(`NewsAPI query "${query}" failed on key ${nKeyIdx}:`, e.response?.data?.message || e.message);
            nKeyIdx++;
          }
        }
      }
    }
    
    // Add new incidents (avoid duplicates based on URL)
    const existingUrls = new Set(incidents.map(i => i.url));
    const uniqueNewIncidents = newIncidents.filter(i => !existingUrls.has(i.url));
    
    incidents.push(...uniqueNewIncidents);
    
    res.json({
      success: true,
      newIncidentsAdded: uniqueNewIncidents.length,
      totalIncidents: incidents.length,
    });
  } catch (error) {
    console.error('Error fetching from News API:', error.message);
    res.status(500).json({ error: 'Failed to fetch news: ' + error.message });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    total: incidents.length,
    pending: incidents.filter(i => i.status === 'pending_review').length,
    verified: incidents.filter(i => i.status === 'verified').length,
    disputed: incidents.filter(i => i.status === 'disputed').length,
    byLocation: {},
    byCategory: {},
  };
  
  incidents.forEach(incident => {
    stats.byLocation[incident.location] = (stats.byLocation[incident.location] || 0) + 1;
    stats.byCategory[incident.category] = (stats.byCategory[incident.category] || 0) + 1;
  });
  
  res.json(stats);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
