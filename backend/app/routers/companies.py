"""Router for LinkedIn company search and profiles."""

from fastapi import APIRouter, HTTPException, Query

from app.services.mcp_manager import mcp_manager

router = APIRouter()


@router.get("/profile/{company_name}")
async def get_company_profile(
    company_name: str,
    sections: str | None = Query(
        None,
        description="Comma-separated sections: posts, jobs",
    ),
):
    """Get a company's LinkedIn profile."""
    args: dict = {"company_name": company_name}
    if sections:
        args["sections"] = sections

    result = await mcp_manager.call_scraper_tool("get_company_profile", args)

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Company profile fetch failed"))

    return result


@router.get("/posts/{company_name}")
async def get_company_posts(company_name: str):
    """Get recent posts from a company's LinkedIn feed."""
    result = await mcp_manager.call_scraper_tool(
        "get_company_posts",
        {"company_name": company_name},
    )

    if result.get("error"):
        raise HTTPException(status_code=400, detail=result.get("message", "Failed to get company posts"))

    return result
