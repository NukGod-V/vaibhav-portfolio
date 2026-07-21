// pages/api/chat/status.js
// Checks the status of a Camber agent chat run started via /api/chat/start.
// The frontend polls this endpoint on an interval until status is "idle" or "failed".

const CAMBER_ENDPOINT = "https://camber-mcp.cambercloud.com/mcp";
// agents_chat_status's own description says it "checks the CLI twice over 30 seconds"
// internally before responding — so a single call can legitimately take up to ~30s.
// Timeout here must comfortably exceed that, or every call aborts before Camber replies.
const REQUEST_TIMEOUT_MS = 35000;

// Tells Vercel to allow this function to run longer than the platform default (often 10s
// on Hobby plans). Confirm your plan's actual ceiling in the Vercel dashboard — Hobby may
// cap lower than this regardless of what's set here; Pro typically allows up to 60s+.
export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.CAMBER_API_KEY;
  if (!apiKey) {
    console.error("[api/chat/status] Missing CAMBER_API_KEY environment variable");
    return res.status(500).json({ error: "Server is not configured. Missing API credentials." });
  }

  const { conversation_id } = req.body || {};
  if (!conversation_id || typeof conversation_id !== "string") {
    return res.status(400).json({ error: "A 'conversation_id' string is required." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const payload = {
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: "agents_chat_status",
        arguments: { conversation_id },
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
      console.error("[api/chat/status] Non-JSON response from Camber:", rawText.slice(0, 500));
      return res.status(502).json({ error: "Agent returned an unexpected response format." });
    }

    if (!upstream.ok) {
      console.error("[api/chat/status] Camber HTTP error", upstream.status, data);
      return res.status(502).json({ error: `Agent service error (${upstream.status}).` });
    }

    if (data.result && data.result.isError) {
      console.error("[api/chat/status] Camber Tool Error:", data.result.content);
      const errorMsg = data.result.content?.[0]?.text || "Agent Tool Error";
      return res.status(502).json({ error: `Camber API Rejected Request: ${errorMsg}` });
    }

    if (data.error) {
      console.error("[api/chat/status] Camber JSON-RPC error:", data.error);
      return res.status(502).json({ error: data.error.message || "Could not check agent status." });
    }

    const result = extractResult(data);
    if (!result?.status) {
      console.error("[api/chat/status] No status in response:", JSON.stringify(data));
      return res.status(502).json({ error: "Agent returned an unreadable status." });
    }

    // Pass through exactly what the frontend needs: status ("running" | "idle" | "failed"),
    // content (only meaningful once idle), and error (only meaningful once failed).
    return res.status(200).json({
      conversation_id: result.conversation_id || conversation_id,
      status: result.status,
      content: result.content || null,
      error: result.error || null,
      chat_url: result.chat_url || null,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("[api/chat/status] Request to Camber timed out");
      return res.status(504).json({ error: "Status check timed out. Please try again." });
    }
    console.error("[api/chat/status] Unexpected error:", err);
    return res.status(500).json({ error: "Something went wrong checking agent status." });
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------
// Shared helpers (duplicated from start.js on purpose — see note there)
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

  // UNVERIFIED shape — same caveat as start.js. Confirm against a real response.
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