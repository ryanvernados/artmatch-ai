import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Development login route for testing (enabled in all environments for now)
  // TODO: Remove or restrict this in production
  {
    app.get("/api/dev-login", async (req: Request, res: Response) => {
      try {
        const devOpenId = "dev-user-" + Date.now();
        const devName = getQueryParam(req, "name") || "Dev User";
        const devEmail = getQueryParam(req, "email") || "dev@artmatch.local";
        const role = getQueryParam(req, "role") === "admin" ? "admin" : "user";

        console.log("[Dev Login] Starting login for:", devName, devEmail, role);

        // Create or update the dev user in database (skip if DB not available)
        try {
          await db.upsertUser({
            openId: devOpenId,
            name: devName,
            email: devEmail,
            loginMethod: "dev",
            role: role as "user" | "admin",
            lastSignedIn: new Date(),
          });
          console.log("[Dev Login] User created in DB");
        } catch (dbError) {
          console.warn("[Dev Login] DB not available, skipping user creation");
        }

        // Create session token
        const sessionToken = await sdk.createSessionToken(devOpenId, {
          name: devName,
          expiresInMs: ONE_YEAR_MS,
        });
        console.log("[Dev Login] Session token created");

        const cookieOptions = getSessionCookieOptions(req);
        console.log("[Dev Login] Cookie options:", JSON.stringify(cookieOptions));
        
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        console.log("[Dev Login] Cookie set with name:", COOKIE_NAME);

        console.log(`[Dev Login] ✅ Successfully logged in ${devName} (${devEmail}) with role: ${role}`);
        
        // Send HTML response with redirect
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Login Successful</title>
            <meta http-equiv="refresh" content="1;url=/" />
          </head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>✅ Login Successful!</h1>
            <p>Redirecting to home page...</p>
            <p>If not redirected, <a href="/">click here</a></p>
          </body>
          </html>
        `);
      } catch (error) {
        console.error("[Dev Login] ❌ Failed with error:", error);
        res.status(500).json({ 
          error: "Dev login failed", 
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });

    // Dev login page
    app.get("/dev-login", (req: Request, res: Response) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dev Login - ArtMatch AI</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
            h1 { color: #1e40af; }
            form { display: flex; flex-direction: column; gap: 15px; }
            label { font-weight: 500; }
            input, select { padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; }
            button { background: #1e40af; color: white; padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
            button:hover { background: #1e3a8a; }
            .note { background: #fef3c7; padding: 10px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>🎨 Dev Login</h1>
          <div class="note">⚠️ Development mode only - This bypasses OAuth authentication</div>
          <form action="/api/dev-login" method="get">
            <label>Name</label>
            <input type="text" name="name" value="Test User" required />
            <label>Email</label>
            <input type="email" name="email" value="test@artmatch.local" required />
            <label>Role</label>
            <select name="role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Login</button>
          </form>
        </body>
        </html>
      `);
    });

    console.log("[OAuth] Dev login enabled at /dev-login");
  }

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
