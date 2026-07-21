// pages/api/chat/start.js
// Starts a Camber agent chat run. Returns immediately with a conversation_id —
// the reply is NOT available yet. The frontend polls /api/chat/status to get it.

const CAMBER_ENDPOINT = "https://camber-mcp.cambercloud.com/mcp";
const AGENT_TAG = "@nukgod.vaibhav_clone";
const REQUEST_TIMEOUT_MS = 10000; // this call is fast — it doesn't wait for the agent to finish

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.CAMBER_API_KEY;
  if (!apiKey) {
    console.error("[api/chat/start] Missing CAMBER_API_KEY environment variable");
    return res.status(500).json({ error: "Server is not configured. Missing API credentials." });
  }

  const { message, conversation_id } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "A non-empty 'message' string is required." });
  }
  if (message.length > 4000) {
    return res.status(400).json({ error: "Message is too long (max 4000 characters)." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "agents_chat_start",
        arguments: {
          agent_tag: AGENT_TAG,
          message: message.trim(),
          // Pass through if the client is continuing an existing conversation,
          // so Camber keeps multi-turn context server-side.
          ...(conversation_id ? { conversation_id } : {}),
        },
      },
      id: Date.now(),
    };

    const upstream = await fetch(CAMBER_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawText = await upstream.text();
    let data;
    try {
      data = parseCamberResponse(rawText);
    } catch (parseErr) {
      console.error("[api/chat/start] Non-JSON response from Camber:", rawText.slice(0, 500));
      return res.status(502).json({ error: "Agent returned an unexpected response format." });
    }

    if (!upstream.ok) {
      console.error("[api/chat/start] Camber HTTP error", upstream.status, data);
      return res.status(502).json({ error: `Agent service error (${upstream.status}).` });
    }

    if (data.result && data.result.isError) {
      console.error("[api/chat/start] Camber Tool Error:", data.result.content);
      const errorMsg = data.result.content?.[0]?.text || "Agent Tool Error";
      return res.status(502).json({ error: `Camber API Rejected Request: ${errorMsg}` });
    }

    if (data.error) {
      console.error("[api/chat/start] Camber JSON-RPC error:", data.error);
      return res.status(502).json({ error: data.error.message || "The agent could not process that message." });
    }

    const result = extractResult(data);
    if (!result?.conversation_id) {
      console.error("[api/chat/start] No conversation_id in response:", JSON.stringify(data));
      return res.status(502).json({ error: "Agent did not return a conversation id." });
    }

    return res.status(200).json({
      conversation_id: result.conversation_id,
      status: result.status || "running",
      chat_url: result.chat_url || null,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("[api/chat/start] Request to Camber timed out");
      return res.status(504).json({ error: "The agent took too long to start. Please try again." });
    }
    console.error("[api/chat/start] Unexpected error:", err);
    return res.status(500).json({ error: "Something went wrong reaching the agent." });
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------
// Shared helpers (duplicated in status.js on purpose — keeps each function
// self-contained, which matters for serverless cold-start bundling).
// ---------------------------------------------------------------------

function parseCamberResponse(rawText) {
  if (rawText.includes("data: ")) {
    const dataLine = rawText.split("\n").find((line) => line.startsWith("data: "));
    const jsonString = dataLine ? dataLine.replace("data: ", "").trim() : "{}";
    return JSON.parse(jsonString);
  }
  return rawText ? JSON.parse(rawText) : {};
}

function extractResult(data) {
  const result = data.result;
  if (!result) return null;

  // MCP tool results often wrap the actual payload inside content[] as a JSON string.
  // UNVERIFIED: confirm this shape against a real response and adjust if Camber returns
  // structuredContent directly instead — log the raw `data` once and check.
  if (Array.isArray(result.content)) {
    const textPart = result.content.find((c) => c && typeof c.text === "string");
    if (textPart) {
      try {
        return JSON.parse(textPart.text);
      } catch {
        return { content: textPart.text };
      }
    }
  }

  return result;
}