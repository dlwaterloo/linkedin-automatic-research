"""Router for LinkedIn automation workflows (bulk connect, etc.)."""

import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import BulkConnectRequest, BulkConnectResponse
from app.services.mcp_manager import mcp_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/bulk-connect", response_model=BulkConnectResponse)
async def bulk_connect(request: BulkConnectRequest):
    """Send connection requests to multiple LinkedIn users."""
    if not mcp_manager.scraper_connected:
        connected = await mcp_manager.connect_scraper()
        if not connected:
            raise HTTPException(
                status_code=503,
                detail="Scraper MCP server not connected. Run 'uvx linkedin-scraper-mcp@latest --login' first.",
            )

    results = []
    successful = 0
    failed = 0

    for username in request.usernames:
        args: dict = {"linkedin_username": username}
        if request.note_template:
            args["note"] = request.note_template.replace("{name}", username)

        try:
            result = await mcp_manager.call_scraper_tool("connect_with_person", args)

            if result.get("error"):
                failed += 1
                results.append({
                    "username": username,
                    "success": False,
                    "message": result.get("message", "Failed"),
                })
            else:
                successful += 1
                results.append({
                    "username": username,
                    "success": True,
                    "status": result.get("status", "unknown"),
                    "message": result.get("message", "Connection request sent"),
                })

        except Exception as e:
            failed += 1
            results.append({
                "username": username,
                "success": False,
                "message": str(e),
            })

        # Rate limiting delay between connection requests
        if request.delay_seconds > 0 and username != request.usernames[-1]:
            await asyncio.sleep(request.delay_seconds)

    return BulkConnectResponse(
        total=len(request.usernames),
        successful=successful,
        failed=failed,
        results=results,
    )


@router.post("/search-and-connect")
async def search_and_connect(
    keywords: str,
    note_template: str | None = None,
    location: str | None = None,
    delay_seconds: int = 5,
):
    """Search for people and connect with all results.
    
    This is a convenience endpoint that combines search_people and bulk_connect.
    """
    # First search for people
    search_args: dict = {"keywords": keywords}
    if location:
        search_args["location"] = location

    search_result = await mcp_manager.call_scraper_tool("search_people", search_args)

    if search_result.get("error"):
        raise HTTPException(status_code=400, detail=search_result.get("message", "Search failed"))

    return {
        "search_results": search_result,
        "message": "Search completed. Use the usernames from results with /bulk-connect to connect.",
    }
