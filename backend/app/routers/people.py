"""Router for LinkedIn people search, profiles, and connections."""

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import ConnectRequest, ConnectResponse
from app.services.mcp_manager import mcp_manager

router = APIRouter()


@router.get("/search")
async def search_people(
    keywords: str = Query(..., min_length=1, description="Search keywords"),
    location: str | None = Query(None, description="Optional location filter"),
):
    """Search for people on LinkedIn by keywords and optional location."""
    result = await mcp_manager.call_scraper_tool(
        "search_people",
        {"keywords": keywords, **({"location": location} if location else {})},
    )

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Search failed"))

    return result


@router.get("/profile/{username}")
async def get_person_profile(
    username: str,
    sections: str | None = Query(
        None,
        description="Comma-separated sections: experience, education, skills, contact_info, posts",
    ),
):
    """Get a LinkedIn user's profile by username."""
    args: dict = {"linkedin_username": username}
    if sections:
        args["sections"] = sections

    result = await mcp_manager.call_scraper_tool("get_person_profile", args)

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Profile fetch failed"))

    return result


@router.post("/connect", response_model=ConnectResponse)
async def connect_with_person(request: ConnectRequest):
    """Send a LinkedIn connection request to a user."""
    args: dict = {"linkedin_username": request.linkedin_username}
    if request.note:
        args["note"] = request.note

    result = await mcp_manager.call_scraper_tool("connect_with_person", args)

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Connection failed"))

    return ConnectResponse(
        success=True,
        status=result.get("status", "unknown"),
        message=result.get("message", "Connection request sent"),
        note_sent=result.get("note_sent", False),
    )


@router.get("/sidebar/{username}")
async def get_sidebar_profiles(username: str):
    """Get recommended profiles from sidebar of a user's profile page."""
    result = await mcp_manager.call_scraper_tool(
        "get_sidebar_profiles",
        {"linkedin_username": username},
    )

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed"))

    return result
