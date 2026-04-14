from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import posts, people, companies, automation, config
from app.services.mcp_manager import mcp_manager


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle - initialize and cleanup MCP connections."""
    yield
    await mcp_manager.disconnect_all()


app = FastAPI(
    title="LinkedIn Automation",
    description="Unified LinkedIn automation tool for search, connect, and posting",
    version="0.1.0",
    lifespan=lifespan,
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(posts.router, prefix="/api/posts", tags=["posts"])
app.include_router(people.router, prefix="/api/people", tags=["people"])
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(automation.router, prefix="/api/automation", tags=["automation"])
app.include_router(config.router, prefix="/api/config", tags=["config"])


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/api/status")
async def status():
    """Get the connection status of both MCP servers."""
    return {
        "scraper_connected": mcp_manager.scraper_connected,
        "poster_connected": mcp_manager.poster_connected,
        "scraper_tools": mcp_manager.scraper_tools,
        "poster_tools": mcp_manager.poster_tools,
    }
