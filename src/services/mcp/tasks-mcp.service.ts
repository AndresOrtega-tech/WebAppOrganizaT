import { tasksApiClient } from "../api.client";
import { Reminder } from "../task.service";

type MCPMessageRole = "user" | "model";

export interface MCPToolCall {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPTaskContext {
  jwt?: string;
}

export interface MCPTaskToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface MCPTaskStreamMessage {
  role: MCPMessageRole;
  text: string;
}

const MCP_BASE_URL = "https://mcp-organizt.onrender.com/mcp";

// Module-level session cache (lives for the lifetime of the edge worker)
let _mcpSessionId: string | null = null;
let _rpcIdCounter = 1;

function buildHeaders(
  jwt?: string,
  sessionId?: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };

  if (jwt) {
    headers.Authorization = `bearer ${jwt}`;
  }

  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }

  return headers;
}

function getUserJwt(explicitJwt?: string) {
  if (explicitJwt) return explicitJwt;
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("access_token") || undefined;
}

/**
 * Sends the MCP initialize handshake and returns the session ID.
 * The session ID comes from the `Mcp-Session-Id` response header.
 */
async function initializeMcpSession(jwt?: string): Promise<string | null> {
  const rpcId = String(_rpcIdCounter++);

  const response = await fetch(MCP_BASE_URL, {
    method: "POST",
    headers: buildHeaders(jwt),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "OrganizaT",
          version: "1.0.0",
        },
      },
    }),
  });

  // Session ID comes back as a response header
  const sessionId = response.headers.get("Mcp-Session-Id");

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`MCP initialize failed (${response.status}): ${errorText}`);
  }

  return sessionId;
}

/**
 * Returns a valid session ID, initializing if needed.
 */
async function getOrCreateSession(jwt?: string): Promise<string | null> {
  if (_mcpSessionId) return _mcpSessionId;

  _mcpSessionId = await initializeMcpSession(jwt);
  return _mcpSessionId;
}

async function callMcpTool<T = unknown>(
  toolName: string,
  args: Record<string, unknown> = {},
  jwt?: string,
): Promise<T> {
  const rpcId = String(_rpcIdCounter++);

  // Ensure we have a session before calling any tool
  const sessionId = await getOrCreateSession(jwt);

  const response = await fetch(MCP_BASE_URL, {
    method: "POST",
    headers: buildHeaders(jwt, sessionId),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  // If session expired, reset and retry once
  if (response.status === 400) {
    const errorText = await response.text().catch(() => "");
    if (
      errorText.includes("Missing session ID") ||
      errorText.includes("session")
    ) {
      _mcpSessionId = null;
      const newSessionId = await getOrCreateSession(jwt);
      const retryResponse = await fetch(MCP_BASE_URL, {
        method: "POST",
        headers: buildHeaders(jwt, newSessionId),
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: String(_rpcIdCounter++),
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args,
          },
        }),
      });

      if (!retryResponse.ok) {
        const retryError = await retryResponse.text().catch(() => "");
        throw new Error(
          `MCP request failed after session reset (${retryResponse.status}): ${retryError}`,
        );
      }

      const retryContentType = retryResponse.headers.get("content-type") || "";
      const retryRpcResponse = await readMcpResponse(
        retryResponse,
        retryContentType,
      );
      return extractRpcResult<T>(retryRpcResponse);
    }

    throw new Error(`MCP request failed (400): ${errorText}`);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `MCP request failed (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const rpcResponse = await readMcpResponse(response, contentType);
  return extractRpcResult<T>(rpcResponse);
}

/**
 * Reads the MCP response body — handles both JSON and SSE (text/event-stream).
 */
async function readMcpResponse(
  response: Response,
  contentType: string,
): Promise<unknown> {
  if (contentType.includes("text/event-stream")) {
    const reader = response.body?.getReader();
    if (!reader) {
      return null;
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let rpcResponse: unknown = null;
    let rawFullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      rawFullText += chunk;
      buffer += chunk;
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const lines = event.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const rawData = line.replace(/^data:\s*/, "").trim();
          if (!rawData) continue;
          try {
            rpcResponse = JSON.parse(rawData);
          } catch {
            // keep last valid parse
          }
        }
      }
    }

    // Also try parsing any remaining buffer
    if (buffer.trim()) {
      const remainingLines = buffer.split("\n");
      for (const line of remainingLines) {
        if (!line.startsWith("data:")) continue;
        const rawData = line.replace(/^data:\s*/, "").trim();
        if (!rawData) continue;
        try {
          rpcResponse = JSON.parse(rawData);
        } catch {
          // keep last valid parse
        }
      }
    }

    return rpcResponse;
  }

  const jsonBody = await response.json();

  return jsonBody;
}

function extractRpcResult<T>(rpcResponse: unknown): T {
  if (!rpcResponse || typeof rpcResponse !== "object") {
    return rpcResponse as T;
  }

  const rpc = rpcResponse as Record<string, unknown>;

  // JSON-RPC error
  if (rpc.error) {
    const err = rpc.error as Record<string, unknown>;
    throw new Error(`MCP error (${err.code}): ${err.message}`);
  }

  // JSON-RPC result — MCP wraps tool output in result.content[].text
  if ("result" in rpc) {
    const result = rpc.result as Record<string, unknown>;

    if (Array.isArray(result.content) && result.content.length > 0) {
      const firstContent = result.content[0] as Record<string, unknown>;
      const textValue = firstContent.text;

      if (typeof textValue === "string") {
        try {
          return JSON.parse(textValue) as T;
        } catch {
          return textValue as T;
        }
      }
    }

    return result as T;
  }

  return rpcResponse as T;
}

function normalizeReminders(reminders?: Reminder[] | null) {
  if (!reminders || reminders.length === 0) return undefined;

  return reminders.map((reminder) => ({
    unit: reminder.unit,
    value: reminder.value,
  }));
}

export const tasksMcpService = {
  async health(): Promise<{ status: string }> {
    const response = await fetch(`${MCP_BASE_URL}/health`, {
      method: "GET",
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`MCP health check failed (${response.status})`);
    }

    return (await response.json()) as { status: string };
  },

  async createTask(
    title: string,
    description?: string,
    priority: "baja" | "media" | "alta" = "media",
    due_date?: string | null,
    reminders?: Reminder[] | null,
    jwt?: string,
  ): Promise<unknown> {
    const userJwt = getUserJwt(jwt);
    return callMcpTool(
      "create_task",
      {
        title,
        description,
        priority,
        due_date: due_date ?? null,
        reminders: normalizeReminders(reminders),
      },
      userJwt,
    );
  },

  async listTasks(
    view: "home" | "tasks" = "tasks",
    options?: {
      tab?: "pending" | "completed";
      tag_ids?: string[];
      priority?: "baja" | "media" | "alta";
      end_date?: string;
      limit?: number;
      cursor?: string;
      jwt?: string;
    },
  ): Promise<unknown> {
    const userJwt = getUserJwt(options?.jwt);
    return callMcpTool(
      "list_tasks",
      {
        view,
        tab: options?.tab,
        tag_ids: options?.tag_ids,
        priority: options?.priority,
        end_date: options?.end_date,
        limit: options?.limit,
        cursor: options?.cursor,
      },
      userJwt,
    );
  },

  async getTask(taskId: string, jwt?: string): Promise<unknown> {
    return callMcpTool("get_task", { task_id: taskId }, getUserJwt(jwt));
  },

  async getTaskRelated(taskId: string, jwt?: string): Promise<unknown> {
    return callMcpTool(
      "get_task_related",
      { task_id: taskId },
      getUserJwt(jwt),
    );
  },

  async assignTagToTask(
    taskId: string,
    tagId: string,
    jwt?: string,
  ): Promise<unknown> {
    return callMcpTool(
      "assign_tag_to_task",
      {
        task_id: taskId,
        tag_id: tagId,
      },
      getUserJwt(jwt),
    );
  },

  async updateTask(
    taskId: string,
    updates: {
      title?: string;
      description?: string;
      priority?: "baja" | "media" | "alta";
      due_date?: string | null;
      is_completed?: boolean;
      reminders?: Reminder[] | null;
    },
    jwt?: string,
  ): Promise<unknown> {
    return callMcpTool(
      "update_task",
      {
        task_id: taskId,
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
        due_date: updates.due_date ?? null,
        is_completed: updates.is_completed,
        reminders: normalizeReminders(updates.reminders),
      },
      getUserJwt(jwt),
    );
  },

  async deleteTask(taskId: string, jwt?: string): Promise<unknown> {
    return callMcpTool("delete_task", { task_id: taskId }, getUserJwt(jwt));
  },

  async createTaskDirect(
    title: string,
    description: string | null,
    priority: "baja" | "media" | "alta",
    due_date: string | null,
    reminders: Reminder[] | null,
  ) {
    return tasksApiClient.post("/tasks/", {
      title,
      description,
      priority,
      due_date,
      reminders: normalizeReminders(reminders),
    });
  },
};
