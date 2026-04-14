# LinkedIn Automation Tool

A fullstack web application for LinkedIn automation that integrates two MCP (Model Context Protocol) servers:

1. **[fredericbarthelet/linkedin-mcp-server](https://github.com/fredericbarthelet/linkedin-mcp-server)** - LinkedIn Community Management API for creating posts
2. **[stickerdaniel/linkedin-mcp-server](https://github.com/stickerdaniel/linkedin-mcp-server)** - Browser-based scraping for searching people/companies and connecting

## Features

### People & Connections
- **Search People** - Find professionals by keywords and location
- **View Profiles** - Look up LinkedIn profiles with detailed sections (experience, education, skills, etc.)
- **Connect** - Send connection requests with optional personalized notes
- **Bulk Connect** - Send connection requests to multiple people with configurable delays
- **Sidebar Profiles** - Discover recommended profiles from sidebar sections

### Posts
- **Create Posts** - Compose and publish LinkedIn posts via the REST API
- **User Info** - View your LinkedIn profile information

### Companies
- **Company Profiles** - Research company information including about, posts, and jobs
- **Company Posts** - View recent posts from any company

### Automation
- **Bulk Connect** - Send connection requests to multiple people at once
- **Search & Connect** - Search for people and connect with results in one workflow

## Architecture

```
linkedin-automatic-research/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app with CORS and routers
│   │   ├── routers/
│   │   │   ├── posts.py       # Post creation endpoints
│   │   │   ├── people.py      # People search/profile/connect endpoints
│   │   │   ├── companies.py   # Company profile/posts endpoints
│   │   │   ├── automation.py  # Bulk connect workflows
│   │   │   └── config.py      # MCP server configuration
│   │   ├── services/
│   │   │   └── mcp_manager.py # MCP client managing both servers
│   │   └── models/
│   │       └── schemas.py     # Pydantic models
│   └── pyproject.toml
├── frontend/                   # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.tsx            # Main app with all pages
│   │   ├── lib/
│   │   │   ├── api.ts         # API client
│   │   │   └── utils.ts       # Utility functions
│   │   └── components/ui/     # shadcn/ui components
│   └── package.json
└── README.md
```

## Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (for the scraper MCP server)

### Backend Setup

```bash
cd backend
poetry install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Start the development server
poetry run fastapi dev app/main.py
```

### Frontend Setup

```bash
cd frontend
npm install

# Start the development server
npm run dev
```

### Configuration

#### For People Search & Connections (Scraper MCP)

1. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. Login to LinkedIn: `uvx linkedin-scraper-mcp@latest --login`
3. Click "Connect Scraper" in the Settings page

#### For Creating Posts (LinkedIn API)

1. Create a LinkedIn app at [developers.linkedin.com](https://www.linkedin.com/developers/apps)
2. Add the "Community Management API" product
3. Generate an OAuth access token
4. Enter it in the Settings page or set `LINKEDIN_ACCESS_TOKEN` in `.env`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LINKEDIN_ACCESS_TOKEN` | LinkedIn OAuth access token for posting |
| `LINKEDIN_CLIENT_ID` | LinkedIn app client ID |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn app client secret |
| `SCRAPER_COMMAND` | Command to start scraper MCP (default: `uvx`) |
| `SCRAPER_ARGS` | JSON array of args for scraper (default: `["linkedin-scraper-mcp@latest"]`) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | Get MCP server connection status |
| POST | `/api/posts/` | Create a LinkedIn post |
| GET | `/api/posts/user-info` | Get current user info |
| GET | `/api/people/search` | Search for people |
| GET | `/api/people/profile/{username}` | Get person profile |
| POST | `/api/people/connect` | Send connection request |
| GET | `/api/people/sidebar/{username}` | Get sidebar profiles |
| GET | `/api/companies/profile/{name}` | Get company profile |
| GET | `/api/companies/posts/{name}` | Get company posts |
| POST | `/api/automation/bulk-connect` | Bulk connect workflow |
| POST | `/api/automation/search-and-connect` | Search & connect workflow |
| GET | `/api/config/` | Get configuration |
| PUT | `/api/config/` | Update configuration |
| POST | `/api/config/connect-scraper` | Connect to scraper MCP |
| POST | `/api/config/disconnect` | Disconnect all MCP servers |

## License

MIT
