from pydantic import BaseModel, Field


class CreatePostRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=3000, description="Post content text")


class CreatePostResponse(BaseModel):
    success: bool
    message: str


class SearchPeopleRequest(BaseModel):
    keywords: str = Field(..., min_length=1, description="Search keywords")
    location: str | None = Field(None, description="Optional location filter")


class PersonProfile(BaseModel):
    url: str = ""
    sections: dict[str, str] = {}
    references: dict | None = None
    unknown_sections: list[str] | None = None


class ConnectRequest(BaseModel):
    linkedin_username: str = Field(..., min_length=1)
    note: str | None = Field(None, max_length=300, description="Optional connection note")


class ConnectResponse(BaseModel):
    success: bool
    status: str
    message: str
    note_sent: bool = False


class BulkConnectRequest(BaseModel):
    usernames: list[str] = Field(..., min_items=1, description="List of LinkedIn usernames")
    note_template: str | None = Field(
        None,
        max_length=300,
        description="Optional note template. Use {name} as placeholder.",
    )
    delay_seconds: int = Field(default=5, ge=1, le=60, description="Delay between connection requests")


class BulkConnectResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: list[dict]


class CompanyProfile(BaseModel):
    url: str = ""
    sections: dict[str, str] = {}
    references: dict | None = None


class MCPServerConfig(BaseModel):
    scraper_command: str = Field(
        default="uvx",
        description="Command to start the scraper MCP server",
    )
    scraper_args: list[str] = Field(
        default=["linkedin-scraper-mcp@latest"],
        description="Arguments for the scraper MCP server",
    )
    poster_type: str = Field(
        default="api",
        description="Poster type: 'api' for direct LinkedIn API, 'mcp' for MCP server",
    )
    linkedin_client_id: str | None = Field(None, description="LinkedIn OAuth Client ID")
    linkedin_client_secret: str | None = Field(None, description="LinkedIn OAuth Client Secret")
    linkedin_access_token: str | None = Field(None, description="LinkedIn API Access Token")


class MCPStatusResponse(BaseModel):
    scraper_connected: bool
    poster_connected: bool
    scraper_tools: list[str]
    poster_tools: list[str]
