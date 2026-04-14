"""
MCP Manager - Manages connections to both LinkedIn MCP servers.

1. Scraper MCP (stickerdaniel/linkedin-mcp-server): For search, profiles, connect, messaging
   - Runs as subprocess via stdio transport
   - Requires: uvx + linkedin-scraper-mcp package + LinkedIn browser login

2. Poster MCP (fredericbarthelet/linkedin-mcp-server): For creating posts
   - Connects via HTTP+SSE transport
   - Requires: LinkedIn OAuth credentials (client_id, client_secret)
   
Alternatively, posting can use the LinkedIn REST API directly with an access token.
"""

import asyncio
import json
import logging
import os
from typing import Any

import httpx
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger(__name__)


class MCPManager:
    """Manages connections to LinkedIn MCP servers."""

    def __init__(self) -> None:
        self._scraper_session: ClientSession | None = None
        self._scraper_context: Any = None
        self._scraper_read: Any = None
        self._scraper_write: Any = None
        self._scraper_cm: Any = None
        self._session_cm: Any = None
        self._scraper_tools: list[str] = []
        self._poster_tools: list[str] = ["create-post", "user-info"]

        self._scraper_command: str = os.getenv("SCRAPER_COMMAND", "uvx")
        self._scraper_args: list[str] = json.loads(
            os.getenv("SCRAPER_ARGS", '["linkedin-scraper-mcp@latest"]')
        )

        self._linkedin_access_token: str | None = os.getenv("LINKEDIN_ACCESS_TOKEN")
        self._linkedin_client_id: str | None = os.getenv("LINKEDIN_CLIENT_ID")
        self._linkedin_client_secret: str | None = os.getenv("LINKEDIN_CLIENT_SECRET")

        self._lock = asyncio.Lock()

    @property
    def scraper_connected(self) -> bool:
        return self._scraper_session is not None

    @property
    def poster_connected(self) -> bool:
        return self._linkedin_access_token is not None

    @property
    def scraper_tools(self) -> list[str]:
        return self._scraper_tools

    @property
    def poster_tools(self) -> list[str]:
        return self._poster_tools if self.poster_connected else []

    async def connect_scraper(self) -> bool:
        """Connect to the LinkedIn scraper MCP server via stdio."""
        async with self._lock:
            if self._scraper_session is not None:
                return True

            try:
                server_params = StdioServerParameters(
                    command=self._scraper_command,
                    args=self._scraper_args,
                    env={
                        **os.environ,
                        "UV_HTTP_TIMEOUT": "300",
                    },
                )

                self._scraper_cm = stdio_client(server_params)
                self._scraper_read, self._scraper_write = await self._scraper_cm.__aenter__()

                self._session_cm = ClientSession(self._scraper_read, self._scraper_write)
                self._scraper_session = await self._session_cm.__aenter__()

                await self._scraper_session.initialize()

                tools_response = await self._scraper_session.list_tools()
                self._scraper_tools = [t.name for t in tools_response.tools]

                logger.info(
                    "Connected to scraper MCP server. Tools: %s",
                    self._scraper_tools,
                )
                return True

            except Exception as e:
                logger.error("Failed to connect to scraper MCP: %s", e)
                self._scraper_session = None
                return False

    async def call_scraper_tool(self, tool_name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        """Call a tool on the scraper MCP server."""
        if not self._scraper_session:
            connected = await self.connect_scraper()
            if not connected:
                return {
                    "error": True,
                    "message": "Scraper MCP server not connected. Run 'uvx linkedin-scraper-mcp@latest --login' first.",
                }

        try:
            result = await self._scraper_session.call_tool(tool_name, arguments)

            content_parts = []
            for item in result.content:
                if hasattr(item, "text"):
                    content_parts.append(item.text)
                elif hasattr(item, "data"):
                    content_parts.append(f"[{item.type} data]")

            combined_text = "\n".join(content_parts)

            try:
                parsed = json.loads(combined_text)
                return parsed
            except json.JSONDecodeError:
                return {"text": combined_text, "is_error": getattr(result, "isError", False)}

        except Exception as e:
            logger.error("Error calling scraper tool '%s': %s", tool_name, e)
            return {"error": True, "message": str(e)}

    async def create_post(self, content: str) -> dict[str, Any]:
        """Create a LinkedIn post using the REST API directly."""
        if not self._linkedin_access_token:
            return {
                "error": True,
                "message": "LinkedIn access token not configured. Set LINKEDIN_ACCESS_TOKEN in .env",
            }

        try:
            async with httpx.AsyncClient() as client:
                me_response = await client.get(
                    "https://api.linkedin.com/v2/me",
                    headers={
                        "Authorization": f"Bearer {self._linkedin_access_token}",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                    params={"projection": "(id)"},
                )
                me_response.raise_for_status()
                person_id = me_response.json()["id"]

                post_data = {
                    "author": f"urn:li:person:{person_id}",
                    "commentary": content,
                    "visibility": "PUBLIC",
                    "distribution": {
                        "feedDistribution": "MAIN_FEED",
                        "targetEntities": [],
                        "thirdPartyDistributionChannels": [],
                    },
                    "lifecycleState": "PUBLISHED",
                    "isReshareDisabledByAuthor": False,
                }

                post_response = await client.post(
                    "https://api.linkedin.com/rest/posts",
                    headers={
                        "Authorization": f"Bearer {self._linkedin_access_token}",
                        "X-Restli-Protocol-Version": "2.0.0",
                        "LinkedIn-Version": "202503",
                        "Content-Type": "application/json",
                    },
                    json=post_data,
                )
                post_response.raise_for_status()

                return {
                    "success": True,
                    "message": "Post created successfully!",
                }

        except httpx.HTTPStatusError as e:
            error_body = e.response.text
            logger.error("LinkedIn API error: %s - %s", e.response.status_code, error_body)
            return {
                "error": True,
                "message": f"LinkedIn API error ({e.response.status_code}): {error_body}",
            }
        except Exception as e:
            logger.error("Error creating post: %s", e)
            return {"error": True, "message": str(e)}

    async def get_user_info(self) -> dict[str, Any]:
        """Get the current LinkedIn user's info."""
        if not self._linkedin_access_token:
            return {
                "error": True,
                "message": "LinkedIn access token not configured.",
            }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.linkedin.com/v2/me",
                    headers={
                        "Authorization": f"Bearer {self._linkedin_access_token}",
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                    params={
                        "projection": "(localizedFirstName,localizedLastName,localizedHeadline)",
                    },
                )
                response.raise_for_status()
                data = response.json()
                return {
                    "name": f"{data.get('localizedFirstName', '')} {data.get('localizedLastName', '')}",
                    "headline": data.get("localizedHeadline", ""),
                }

        except Exception as e:
            logger.error("Error getting user info: %s", e)
            return {"error": True, "message": str(e)}

    def update_config(
        self,
        scraper_command: str | None = None,
        scraper_args: list[str] | None = None,
        linkedin_access_token: str | None = None,
        linkedin_client_id: str | None = None,
        linkedin_client_secret: str | None = None,
    ) -> None:
        """Update MCP server configuration."""
        if scraper_command is not None:
            self._scraper_command = scraper_command
        if scraper_args is not None:
            self._scraper_args = scraper_args
        if linkedin_access_token is not None:
            self._linkedin_access_token = linkedin_access_token
        if linkedin_client_id is not None:
            self._linkedin_client_id = linkedin_client_id
        if linkedin_client_secret is not None:
            self._linkedin_client_secret = linkedin_client_secret

    async def disconnect_all(self) -> None:
        """Disconnect from all MCP servers."""
        if self._scraper_session and self._session_cm:
            try:
                await self._session_cm.__aexit__(None, None, None)
            except Exception:
                pass
        if self._scraper_cm:
            try:
                await self._scraper_cm.__aexit__(None, None, None)
            except Exception:
                pass
        self._scraper_session = None
        self._scraper_cm = None
        self._session_cm = None
        self._scraper_tools = []
        logger.info("Disconnected from all MCP servers")


# Singleton instance
mcp_manager = MCPManager()
