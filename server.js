const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// News API key from environment
const NEWS_API_KEY = process.env.NEWS_API_KEY;

// In-memory storage (in production, use a database like MongoDB or PostgreSQL)
let incidents = [];

// Helper function to extract incident data from article
function parseIncident(article) {
  return {
    id: Date.now() + Math.random(),
    title: article.title || 'No Title',
    description: article.description || article.content || '',
    url: article.url,
    source: article.source?.name || 'Unknown',
    date: new Date(article.publishedAt),
    imageUrl: article.urlToImage,
    category: 'Unconfirmed', // Can be manual or auto-categorized
    location: extractLocation((article.title || '') + ' ' + (article.description || '')),
    status: 'pending_review', // pending_review, verified, disputed
    addedDate: new Date(),
  };
}

// Simple location extraction (can be enhanced with NLP)
function extractLocation(text) {
  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];
  
  for (const state of usStates) {
    if (text.toLowerCase().includes(state.toLowerCase())) {
      return state;
    }
  }
  return 'United States';
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
    if (!NEWS_API_KEY) {
      return res.status(400).json({ error: 'NEWS_API_KEY not configured' });
    }
    
    const searchQueries = [
      'antisemitic attack United States',
      'antisemitism incident USA',
      'hate crime Jewish',
      'swastika incident America',
    ];
    
    let newIncidents = [];
    const timeframe = req.query.timeframe || 'month'; // 'month' or 'year'
    
    // Calculate date for filtering
    const fromDate = new Date();
    if (timeframe === 'year') {
      fromDate.setFullYear(fromDate.getFullYear() - 1);
    } else if (timeframe === 'today') {
      fromDate.setDate(fromDate.getDate() - 1); // 24 hours ago
    } else {
      fromDate.setDate(fromDate.getDate() - 28); // Safer than 1 full month to avoid 426 errors
    }
    const fromDateString = fromDate.toISOString().split('T')[0];
    
    for (const query of searchQueries) {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            from: fromDateString,
            sortBy: 'publishedAt',
            language: 'en',
            apiKey: NEWS_API_KEY,
            pageSize: 100,
          },
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
      
      if (response.data.articles) {
        newIncidents.push(
          ...response.data.articles.map(article => parseIncident(article))
        );
      }
      } catch (queryError) {
        console.error(`Error with query "${query}":`, queryError.response?.data?.message || queryError.message);
        continue;
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
