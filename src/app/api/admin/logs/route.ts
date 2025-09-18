import { NextRequest, NextResponse } from "next/server";

// Middleware to check admin authentication
function requireAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin-auth=true")) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Mock system logs - in production, you would read actual log files
    const mockLogs = [
      {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Admin console accessed",
        source: "admin-panel"
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: "INFO",
        message: "Quiz submission received",
        source: "quiz-api"
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: "INFO",
        message: "User authentication successful",
        source: "auth-service"
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: "INFO",
        message: "Database connection established",
        source: "database"
      },
      {
        timestamp: new Date(Date.now() - 240000).toISOString(),
        level: "INFO",
        message: "Server started successfully",
        source: "server"
      }
    ];

    // Return logs as HTML for browser viewing
    const logsHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TechSummit System Logs</title>
        <style>
          body { font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px; }
          .log-entry { margin: 5px 0; padding: 5px; border-left: 3px solid #00ff00; }
          .timestamp { color: #888; }
          .level { font-weight: bold; }
          .message { margin-left: 20px; }
          .source { color: #0099ff; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>🔍 TechSummit System Logs</h1>
        <p>Last updated: ${new Date().toISOString()}</p>
        <hr>
        ${mockLogs.map(log => `
          <div class="log-entry">
            <span class="timestamp">[${log.timestamp}]</span>
            <span class="level">[${log.level}]</span>
            <span class="source">[${log.source}]</span>
            <div class="message">${log.message}</div>
          </div>
        `).join('')}
        <hr>
        <p><em>📊 Showing last 5 log entries. In production, this would show actual application logs.</em></p>
      </body>
      </html>
    `;

    return new NextResponse(logsHtml, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch system logs" }, { status: 500 });
  }
}