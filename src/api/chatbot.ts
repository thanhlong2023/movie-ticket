// Raw response structure from n8n (can vary)
interface RawN8nResponse {
  ui?: {
    ui?: UiResponse;
    message?: string;
    options?: string[];
    step?: string;
    isFinal?: boolean;
    data?: Record<string, unknown>;
  };
  output?: string | Record<string, unknown>;
  message?: string;
  text?: string;
  reply?: string;
  answer?: string;
  result?: string;
  state?: Record<string, unknown>;
  [key: string]: unknown;
}

export type UiResponse = {
  message: string;
  options: string[];
  step: string;
  isFinal: boolean;
  data?: Record<string, unknown>;
};

export type N8nResponse = {
  output: string;
  state: Record<string, unknown>;
  ui: UiResponse;
};

export type ChatUser = {
  id: number | string;
  name?: string | null;
};

type SendParams = {
  sessionId: string;
  chatInput: string;
  state?: Record<string, unknown>;
  user?: ChatUser | null;
};

// Dùng proxy dev: /api/chat (vite.config.ts đã map sẵn)
// Prod thì bạn có thể set VITE_N8N_CHAT_URL
const ENDPOINT = import.meta.env.DEV
  ? "/n8n-proxy/chat"
  : import.meta.env.VITE_N8N_CHAT_URL ?? "/api/chat";

export async function sendToN8n(params: SendParams): Promise<N8nResponse> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n error ${res.status}: ${text}`);
  }

  const json = await res.json();
  let data: RawN8nResponse = json;

  // 1. Unwrap "ui" if doubly nested (common with n8n "Put Response in Field")
  if (data.ui && data.ui.ui) {
    data = data.ui as RawN8nResponse;
  }

  // 2. Ensure we have the standard N8nResponse structure
  //    Default to empty structure if missing
  const state = data.state || {};
  const ui = data.ui || {};

  // 3. Fallback: if 'ui' is missing or has no message, try to find it in 'output', 'message', 'text', 'reply'
  if (!ui.message) {
    const keysToCheck = [
      "output",
      "message",
      "text",
      "reply",
      "answer",
      "result",
    ];
    let rawMsg: unknown = "";

    // Helper to extract string from deeply nested object
    const findString = (obj: unknown): string | null => {
      if (typeof obj === "string") return obj;
      if (typeof obj !== "object" || obj === null) return null;

      const objRecord = obj as Record<string, unknown>;

      // Prioritize specific keys
      for (const key of keysToCheck) {
        if (
          typeof objRecord[key] === "string" &&
          (objRecord[key] as string).trim()
        ) {
          return objRecord[key] as string;
        }
      }

      // If no key found, try valid nested objects
      for (const key of Object.keys(objRecord)) {
        if (typeof objRecord[key] === "object") {
          const found = findString(objRecord[key]);
          if (found) return found;
        }
      }
      return null;
    };

    // Try top-level keys first
    for (const key of keysToCheck) {
      if (data[key]) {
        rawMsg = data[key];
        break;
      }
    }

    // Resolve final string
    const finalMsg =
      findString(rawMsg) || (typeof rawMsg === "string" ? rawMsg : "");
    ui.message = finalMsg;

    // If we still have an empty message but we have data, we shouldn't show JSON.
    // Better to show a generic error or nothing than raw JSON.
    if (!ui.message && Object.keys(data).length > 0) {
      // Last resort: check if 'data' itself is the message string (rare but possible)
      if (typeof data === "string") ui.message = data;
    }
  }

  // 4. Ensure options is an array
  if (!Array.isArray(ui.options)) {
    ui.options = [];
  }

  return {
    output: typeof data.output === "string" ? data.output : "",
    state,
    ui: {
      message: String(ui.message || "").trim(),
      options: ui.options,
      step: ui.step || "UNKNOWN",
      isFinal: !!ui.isFinal,
      data: ui.data,
    },
  };
}
