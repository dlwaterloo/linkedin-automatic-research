const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Status
  getStatus: () => request<{
    scraper_connected: boolean;
    poster_connected: boolean;
    scraper_tools: string[];
    poster_tools: string[];
  }>("/api/status"),

  // Posts
  createPost: (content: string) =>
    request<{ success: boolean; message: string }>("/api/posts/", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getUserInfo: () =>
    request<{ name: string; headline: string }>("/api/posts/user-info"),

  // People
  searchPeople: (keywords: string, location?: string) => {
    const params = new URLSearchParams({ keywords });
    if (location) params.set("location", location);
    return request<{ url?: string; sections?: Record<string, string>; text?: string }>(
      `/api/people/search?${params}`
    );
  },

  getProfile: (username: string, sections?: string) => {
    const params = sections ? `?sections=${encodeURIComponent(sections)}` : "";
    return request<{ url?: string; sections?: Record<string, string> }>(
      `/api/people/profile/${encodeURIComponent(username)}${params}`
    );
  },

  connectWithPerson: (username: string, note?: string) =>
    request<{ success: boolean; status: string; message: string; note_sent: boolean }>(
      "/api/people/connect",
      {
        method: "POST",
        body: JSON.stringify({ linkedin_username: username, note }),
      }
    ),

  getSidebarProfiles: (username: string) =>
    request<{ url?: string; sidebar_profiles?: Record<string, string[]> }>(
      `/api/people/sidebar/${encodeURIComponent(username)}`
    ),

  // Companies
  getCompanyProfile: (name: string, sections?: string) => {
    const params = sections ? `?sections=${encodeURIComponent(sections)}` : "";
    return request<{ url?: string; sections?: Record<string, string> }>(
      `/api/companies/profile/${encodeURIComponent(name)}${params}`
    );
  },

  getCompanyPosts: (name: string) =>
    request<{ url?: string; sections?: Record<string, string> }>(
      `/api/companies/posts/${encodeURIComponent(name)}`
    ),

  // Automation
  bulkConnect: (usernames: string[], noteTemplate?: string, delaySeconds?: number) =>
    request<{
      total: number;
      successful: number;
      failed: number;
      results: Array<{ username: string; success: boolean; message: string; status?: string }>;
    }>("/api/automation/bulk-connect", {
      method: "POST",
      body: JSON.stringify({
        usernames,
        note_template: noteTemplate,
        delay_seconds: delaySeconds || 5,
      }),
    }),

  // Config
  getConfig: () =>
    request<{
      scraper: { command: string; args: string[]; connected: boolean; tools: string[] };
      poster: { type: string; connected: boolean; has_access_token: boolean; tools: string[] };
    }>("/api/config/"),

  updateConfig: (config: {
    scraper_command?: string;
    scraper_args?: string[];
    linkedin_access_token?: string;
    linkedin_client_id?: string;
    linkedin_client_secret?: string;
  }) =>
    request<{ message: string }>("/api/config/", {
      method: "PUT",
      body: JSON.stringify(config),
    }),

  connectScraper: () =>
    request<{ connected: boolean; tools?: string[]; message?: string }>(
      "/api/config/connect-scraper",
      { method: "POST" }
    ),

  disconnectAll: () =>
    request<{ message: string }>("/api/config/disconnect", { method: "POST" }),
};
