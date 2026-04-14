import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Send,
  Users,
  Building2,
  Settings,
  Linkedin,
  UserPlus,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

type Page = "dashboard" | "search" | "posts" | "companies" | "automation" | "settings";

// ─── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({
  status,
  onNavigate,
}: {
  status: { scraper_connected: boolean; poster_connected: boolean; scraper_tools: string[]; poster_tools: string[] } | null;
  onNavigate: (page: Page) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Your LinkedIn automation control center</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scraper MCP Server</CardTitle>
            {status?.scraper_connected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="destructive">Disconnected</Badge>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Search people, view profiles, send connections
            </p>
            {status?.scraper_tools && status.scraper_tools.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {status.scraper_tools.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LinkedIn Post API</CardTitle>
            {status?.poster_connected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="destructive">Not Configured</Badge>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Create and publish LinkedIn posts via API
            </p>
            {status?.poster_tools && status.poster_tools.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {status.poster_tools.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onNavigate("search")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Search className="mr-2 h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Search People</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Find and connect with professionals</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onNavigate("posts")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Send className="mr-2 h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Create Post</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Publish content to LinkedIn</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onNavigate("companies")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Building2 className="mr-2 h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Research company profiles</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onNavigate("automation")}>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Automation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Bulk connect workflows</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── People Search ───────────────────────────────────────────────────────────

function PeopleSearch() {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileData, setProfileData] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [connectUsername, setConnectUsername] = useState("");
  const [connectNote, setConnectNote] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectResult, setConnectResult] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!keywords.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await api.searchPeople(keywords, location || undefined);
      setResults(JSON.stringify(data, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGetProfile = async () => {
    if (!profileUsername.trim()) return;
    setProfileLoading(true);
    setProfileData(null);
    try {
      const data = await api.getProfile(profileUsername, "experience,education,skills");
      setProfileData(JSON.stringify(data, null, 2));
    } catch (e) {
      setProfileData(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!connectUsername.trim()) return;
    setConnectLoading(true);
    setConnectResult(null);
    try {
      const data = await api.connectWithPerson(connectUsername, connectNote || undefined);
      setConnectResult(`${data.status}: ${data.message}`);
    } catch (e) {
      setConnectResult(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">People Search</h2>
        <p className="text-muted-foreground">Search for professionals and connect with them</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search People
            </CardTitle>
            <CardDescription>Find people by keywords and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Keywords</label>
              <Input
                placeholder='e.g. "software engineer", "recruiter at Google"'
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location (optional)</label>
              <Input
                placeholder='e.g. "San Francisco", "Remote"'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !keywords.trim()} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search
            </Button>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            {results && (
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{results}</pre>
            )}
          </CardContent>
        </Card>

        {/* Profile Lookup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              View Profile
            </CardTitle>
            <CardDescription>Look up a specific LinkedIn profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn Username</label>
              <Input
                placeholder='e.g. "williamhgates"'
                value={profileUsername}
                onChange={(e) => setProfileUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGetProfile()}
              />
            </div>
            <Button onClick={handleGetProfile} disabled={profileLoading || !profileUsername.trim()} className="w-full">
              {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              View Profile
            </Button>
            {profileData && (
              <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{profileData}</pre>
            )}
          </CardContent>
        </Card>

        {/* Connect */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Connect With Person
            </CardTitle>
            <CardDescription>Send a connection request with an optional note</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">LinkedIn Username</label>
                <Input
                  placeholder='e.g. "johndoe"'
                  value={connectUsername}
                  onChange={(e) => setConnectUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional, max 300 chars)</label>
                <Input
                  placeholder="Hi, I'd love to connect!"
                  value={connectNote}
                  onChange={(e) => setConnectNote(e.target.value)}
                  maxLength={300}
                />
              </div>
            </div>
            <Button onClick={handleConnect} disabled={connectLoading || !connectUsername.trim()}>
              {connectLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Send Connection Request
            </Button>
            {connectResult && (
              <div className="rounded-md bg-muted p-3 text-sm">{connectResult}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Post Composer ───────────────────────────────────────────────────────────

function PostComposer() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.createPost(content);
      setResult(data);
      if (data.success) setContent("");
    } catch (e) {
      setResult({ success: false, message: e instanceof Error ? e.message : "Failed to create post" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create Post</h2>
        <p className="text-muted-foreground">Compose and publish a LinkedIn post</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            New Post
          </CardTitle>
          <CardDescription>Write your post content below. Posts are published as public.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What do you want to talk about?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={3000}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/3000 characters</span>
            <Button onClick={handlePost} disabled={loading || !content.trim()}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publish Post
            </Button>
          </div>
          {result && (
            <div
              className={`rounded-md p-3 text-sm flex items-start gap-2 ${
                result.success ? "bg-green-50 text-green-800" : "bg-destructive/10 text-destructive"
              }`}
            >
              {result.success ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Companies ───────────────────────────────────────────────────────────────

function Companies() {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [postsCompany, setPostsCompany] = useState("");
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsData, setPostsData] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!companyName.trim()) return;
    setLoading(true);
    setData(null);
    try {
      const result = await api.getCompanyProfile(companyName, "posts,jobs");
      setData(JSON.stringify(result, null, 2));
    } catch (e) {
      setData(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetPosts = async () => {
    if (!postsCompany.trim()) return;
    setPostsLoading(true);
    setPostsData(null);
    try {
      const result = await api.getCompanyPosts(postsCompany);
      setPostsData(JSON.stringify(result, null, 2));
    } catch (e) {
      setPostsData(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setPostsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
        <p className="text-muted-foreground">Research company profiles and posts</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Profile
            </CardTitle>
            <CardDescription>Look up a company on LinkedIn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input
                placeholder='e.g. "anthropic", "microsoft", "google"'
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !companyName.trim()} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
              Get Company Profile
            </Button>
            {data && <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{data}</pre>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Company Posts
            </CardTitle>
            <CardDescription>View recent posts from a company</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company Name</label>
              <Input
                placeholder='e.g. "docker", "openai"'
                value={postsCompany}
                onChange={(e) => setPostsCompany(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGetPosts()}
              />
            </div>
            <Button onClick={handleGetPosts} disabled={postsLoading || !postsCompany.trim()} className="w-full">
              {postsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Get Posts
            </Button>
            {postsData && <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">{postsData}</pre>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Automation ──────────────────────────────────────────────────────────────

function Automation() {
  const [usernames, setUsernames] = useState("");
  const [noteTemplate, setNoteTemplate] = useState("");
  const [delay, setDelay] = useState("5");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    results: Array<{ username: string; success: boolean; message: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBulkConnect = async () => {
    const names = usernames
      .split(/[\n,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    if (names.length === 0) return;

    setLoading(true);
    setResults(null);
    setError(null);
    try {
      const data = await api.bulkConnect(names, noteTemplate || undefined, parseInt(delay) || 5);
      setResults(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk connect failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Automation</h2>
        <p className="text-muted-foreground">Bulk connection requests and automated workflows</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Bulk Connect
          </CardTitle>
          <CardDescription>
            Send connection requests to multiple people at once. Enter usernames separated by commas or new lines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">LinkedIn Usernames</label>
            <Textarea
              placeholder={"johndoe\njanesmith\nbobbuilder"}
              value={usernames}
              onChange={(e) => setUsernames(e.target.value)}
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Note Template (optional)</label>
            <Input
              placeholder='Hi {name}, I would love to connect!'
              value={noteTemplate}
              onChange={(e) => setNoteTemplate(e.target.value)}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">Use {"{name}"} as a placeholder for the username</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Delay between requests (seconds)</label>
            <Input
              type="number"
              min="1"
              max="60"
              value={delay}
              onChange={(e) => setDelay(e.target.value)}
            />
          </div>
          <Button onClick={handleBulkConnect} disabled={loading || !usernames.trim()}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {loading ? "Connecting..." : "Send Connection Requests"}
          </Button>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {results && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="outline">Total: {results.total}</Badge>
                <Badge variant="success">Success: {results.successful}</Badge>
                {results.failed > 0 && <Badge variant="destructive">Failed: {results.failed}</Badge>}
              </div>
              <div className="space-y-2">
                {results.results.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-md p-2 text-sm flex items-center gap-2 ${
                      r.success ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    {r.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span className="font-medium">{r.username}</span>
                    <span className="text-muted-foreground">{r.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────

function SettingsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [scraperConnecting, setScraperConnecting] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [config, setConfig] = useState<{
    scraper: { connected: boolean; tools: string[] };
    poster: { connected: boolean; has_access_token: boolean; tools: string[] };
  } | null>(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  const handleConnectScraper = async () => {
    setScraperConnecting(true);
    setMessage(null);
    try {
      const result = await api.connectScraper();
      if (result.connected) {
        setMessage({ type: "success", text: `Connected! Tools: ${result.tools?.join(", ")}` });
        api.getConfig().then(setConfig);
      } else {
        setMessage({ type: "error", text: result.message || "Failed to connect" });
      }
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Connection failed" });
    } finally {
      setScraperConnecting(false);
    }
  };

  const handleSaveToken = async () => {
    setSavingConfig(true);
    setMessage(null);
    try {
      await api.updateConfig({ linkedin_access_token: accessToken });
      setMessage({ type: "success", text: "Access token saved successfully!" });
      setAccessToken("");
      api.getConfig().then(setConfig);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to save" });
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Configure your LinkedIn MCP server connections</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Scraper MCP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Scraper MCP Server
            </CardTitle>
            <CardDescription>
              Powers people search, profile viewing, and connections.
              Uses{" "}
              <a
                href="https://github.com/stickerdaniel/linkedin-mcp-server"
                target="_blank"
                className="underline text-primary"
              >
                linkedin-scraper-mcp
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              {config?.scraper.connected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="destructive">Disconnected</Badge>
              )}
            </div>
            <div className="rounded-md bg-muted p-3 text-sm space-y-2">
              <p className="font-medium">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Install uv:{" "}
                  <code className="bg-background px-1 rounded">curl -LsSf https://astral.sh/uv/install.sh | sh</code>
                </li>
                <li>
                  Login to LinkedIn:{" "}
                  <code className="bg-background px-1 rounded">uvx linkedin-scraper-mcp@latest --login</code>
                </li>
                <li>Click "Connect" below</li>
              </ol>
            </div>
            <Button onClick={handleConnectScraper} disabled={scraperConnecting}>
              {scraperConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Connect Scraper
            </Button>
          </CardContent>
        </Card>

        {/* LinkedIn API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              LinkedIn Post API
            </CardTitle>
            <CardDescription>
              Powers post creation via LinkedIn's REST API.
              Based on{" "}
              <a
                href="https://github.com/fredericbarthelet/linkedin-mcp-server"
                target="_blank"
                className="underline text-primary"
              >
                fredericbarthelet/linkedin-mcp-server
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Status:</span>
              {config?.poster.has_access_token ? (
                <Badge variant="success">Configured</Badge>
              ) : (
                <Badge variant="destructive">Not Configured</Badge>
              )}
            </div>
            <div className="rounded-md bg-muted p-3 text-sm space-y-2">
              <p className="font-medium">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Create a LinkedIn app at{" "}
                  <a href="https://www.linkedin.com/developers/apps" target="_blank" className="underline text-primary">
                    developers.linkedin.com
                  </a>
                </li>
                <li>Add "Community Management API" product</li>
                <li>Generate an OAuth access token</li>
                <li>Paste it below</li>
              </ol>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn Access Token</label>
              <Input
                type="password"
                placeholder="Paste your access token here"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveToken} disabled={savingConfig || !accessToken.trim()}>
              {savingConfig ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Settings className="mr-2 h-4 w-4" />}
              Save Token
            </Button>
          </CardContent>
        </Card>
      </div>

      {message && (
        <div
          className={`max-w-2xl rounded-md p-3 text-sm flex items-start gap-2 ${
            message.type === "success" ? "bg-green-50 text-green-800" : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [status, setStatus] = useState<{
    scraper_connected: boolean;
    poster_connected: boolean;
    scraper_tools: string[];
    poster_tools: string[];
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setStatus(data);
    } catch {
      // Backend not running
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Linkedin className="h-4 w-4" /> },
    { id: "search", label: "People", icon: <Users className="h-4 w-4" /> },
    { id: "posts", label: "Posts", icon: <Send className="h-4 w-4" /> },
    { id: "companies", label: "Companies", icon: <Building2 className="h-4 w-4" /> },
    { id: "automation", label: "Automation", icon: <Zap className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <div className="flex items-center gap-2 mr-8">
            <Linkedin className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">LinkedIn Automation</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  page === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {status?.scraper_connected && <Badge variant="success" className="text-xs">Scraper</Badge>}
            {status?.poster_connected && <Badge variant="success" className="text-xs">Post API</Badge>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {page === "dashboard" && <Dashboard status={status} onNavigate={setPage} />}
        {page === "search" && <PeopleSearch />}
        {page === "posts" && <PostComposer />}
        {page === "companies" && <Companies />}
        {page === "automation" && <Automation />}
        {page === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}

export default App;
