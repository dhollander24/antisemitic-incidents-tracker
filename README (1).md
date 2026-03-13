# Antisemitic Incidents Tracker

A web-based tracker that monitors and documents antisemitic incidents across the United States using news aggregation. The tool helps organize, categorize, and track hate incidents to raise awareness and support community safety.

## 🎯 Features

- **Real-time News Aggregation**: Fetches current news from NewsAPI about antisemitic incidents
- **Incident Dashboard**: Beautiful, intuitive interface for browsing incidents
- **Filtering & Search**: Filter by location, status, or search keywords
- **Statistics**: Track trends with incident counts by status and location
- **Categorization**: Organize incidents by verification status (pending, verified, disputed)
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Location Detection**: Automatically extracts incident locations from article content

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A free NewsAPI key from [newsapi.org](https://newsapi.org)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/antisemitic-incidents-tracker.git
cd antisemitic-incidents-tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure your News API key**
```bash
cp .env.example .env
```

Edit `.env` and add your News API key:
```
NEWS_API_KEY=your_actual_api_key_here
PORT=5000
```

4. **Start the server**
```bash
npm start
```

The app will be available at `http://localhost:5000`

### Development

For development with auto-reload:
```bash
npm run dev
```

## 📊 How to Use

1. **Load Data**: Click "Fetch Latest News" to retrieve the latest incidents from news sources
2. **Browse**: View incidents in the card-based dashboard
3. **Filter**: Use the filters to find incidents by location or status
4. **Search**: Use the search box to find specific keywords
5. **Read More**: Click "Read Full Article" to view the original news source

## 🏗️ Architecture

### Backend (Node.js/Express)

- `server.js`: Main Express server
- Handles NewsAPI requests
- Manages incident data (in-memory storage)
- Provides REST API endpoints

### Frontend

- `public/index.html`: Single-page application
- Vanilla JavaScript (no frameworks required)
- Responsive design with CSS Grid
- Real-time filtering and search

### API Endpoints

```
GET  /api/incidents              - Get all incidents (with filters)
GET  /api/incidents/:id          - Get single incident
PATCH /api/incidents/:id         - Update incident status/category
DELETE /api/incidents/:id        - Delete incident
POST /api/fetch-news             - Fetch new incidents from NewsAPI
GET  /api/stats                  - Get statistics
```

## 🔄 Data Flow

1. Frontend sends request to "Fetch Latest News"
2. Backend queries NewsAPI with multiple search terms
3. Articles are parsed and converted to incident objects
4. New incidents are added to the in-memory database
5. Frontend receives updated incident list and renders it

## 💾 Data Storage

Currently uses **in-memory storage** (data is cleared on server restart). For production, replace with:

- **MongoDB**: Cloud-hosted with Atlas
- **PostgreSQL**: Heroku or AWS RDS
- **Firebase**: Google's serverless database

## 🐋 Deployment

### Deploy to Heroku

1. **Install Heroku CLI** and login:
```bash
heroku login
```

2. **Create a new Heroku app**:
```bash
heroku create your-app-name
```

3. **Set environment variables**:
```bash
heroku config:set NEWS_API_KEY=your_key
```

4. **Deploy**:
```bash
git push heroku main
```

### Deploy to Railway, Render, or Vercel

Most modern hosting platforms support Node.js. Key requirements:

- Set `NEWS_API_KEY` environment variable
- Ensure Node.js runtime is available
- Keep app running (may need paid tier for persistent storage)

### Docker (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t antisemitic-tracker .
docker run -p 5000:5000 -e NEWS_API_KEY=your_key antisemitic-tracker
```

## 📋 Project Structure

```
.
├── server.js                 # Express server
├── public/
│   └── index.html           # Frontend dashboard
├── package.json             # Dependencies
├── .env.example             # Environment template
└── README.md                # This file
```

## 🔐 Security & Ethics

- **No personal data collection**: Only tracks public news
- **News from reputable sources**: Uses established news API
- **Verification system**: Incidents marked as pending/verified/disputed
- **Environment variables**: Never commit API keys
- **Open source**: Community can review and audit the code

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Better NLP for location extraction
- Enhanced incident categorization
- Historical trends analysis
- Data export (CSV/PDF)
- Community reporting features
- Incident deduplication
- Multi-language support

To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 📞 Support & Resources

- **NewsAPI Documentation**: https://newsapi.org/docs
- **Report an Issue**: Open a GitHub issue
- **Community Resources**: [Link to relevant organizations]

## ⚠️ Disclaimer

This tool aggregates publicly available news. While we strive for accuracy, all information should be verified independently. If you believe information is inaccurate, please report it through the appropriate channels.

---

**Last Updated**: 2024
**Node Version**: 14+
**Status**: Active Development
