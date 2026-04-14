"""Router for LinkedIn post creation and management."""

from fastapi import APIRouter, HTTPException

from app.models.schemas import CreatePostRequest, CreatePostResponse
from app.services.mcp_manager import mcp_manager

router = APIRouter()


@router.post("/", response_model=CreatePostResponse)
async def create_post(request: CreatePostRequest):
    """Create a new LinkedIn post."""
    result = await mcp_manager.create_post(request.content)

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to create post"))

    return CreatePostResponse(
        success=True,
        message=result.get("message", "Post created successfully!"),
    )


@router.get("/user-info")
async def get_user_info():
    """Get current logged-in LinkedIn user info."""
    result = await mcp_manager.get_user_info()

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to get user info"))

    return result
