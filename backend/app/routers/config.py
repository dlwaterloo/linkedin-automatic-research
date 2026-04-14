"""Router for MCP server configuration management."""

from fastapi import APIRouter

from app.models.schemas import MCPServerConfig
from app.services.mcp_manager import mcp_manager

router = APIRouter()


@router.get("/")
async def get_config():
    """Get current MCP server configuration."""
    return {
        "scraper": {
            "command": mcp_manager._scraper_command,
            "args": mcp_manager._scraper_args,
            "connected": mcp_manager.scraper_connected,
            "tools": mcp_manager.scraper_tools,
        },
        "poster": {
            "type": "api",
            "connected": mcp_manager.poster_connected,
            "has_access_token": mcp_manager._linkedin_access_token is not None,
            "tools": mcp_manager.poster_tools,
        },
    }


@router.put("/")
async def update_config(config: MCPServerConfig):
    """Update MCP server configuration."""
    mcp_manager.update_config(
        scraper_command=config.scraper_command,
        scraper_args=config.scraper_args,
        linkedin_access_token=config.linkedin_access_token,
        linkedin_client_id=config.linkedin_client_id,
        linkedin_client_secret=config.linkedin_client_secret,
    )

    return {"message": "Configuration updated successfully"}


@router.post("/connect-scraper")
async def connect_scraper():
    """Connect to the LinkedIn scraper MCP server."""
    success = await mcp_manager.connect_scraper()
    if success:
        return {
            "connected": True,
            "tools": mcp_manager.scraper_tools,
        }
    return {
        "connected": False,
        "message": "Failed to connect. Make sure 'uvx' is installed and you've logged in with 'uvx linkedin-scraper-mcp@latest --login'",
    }


@router.post("/disconnect")
async def disconnect_all():
    """Disconnect from all MCP servers."""
    await mcp_manager.disconnect_all()
    return {"message": "Disconnected from all MCP servers"}
