import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CrmProvider = "hubspot" | "salesforce" | "xero";

interface OAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string[];
  authorize_url: string;
  token_url: string;
}

// ---------------------------------------------------------------------------
// Token encryption helpers
// NOTE: This uses basic XOR obfuscation. For production, replace with
// AES-GCM via crypto.subtle or a dedicated secrets manager.
// ---------------------------------------------------------------------------

function getEncryptionKey(): string {
  return Deno.env.get("CRM_TOKEN_ENCRYPTION_KEY") || "advisory-hub-default-key-change-in-production";
}

function xorEncrypt(plaintext: string, key: string): string {
  const result: number[] = [];
  for (let i = 0; i < plaintext.length; i++) {
    result.push(plaintext.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  // Encode as base64 for safe storage
  return btoa(String.fromCharCode(...result));
}

function xorDecrypt(ciphertext: string, key: string): string {
  const decoded = atob(ciphertext);
  const result: number[] = [];
  for (let i = 0; i < decoded.length; i++) {
    result.push(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return String.fromCharCode(...result);
}

function encryptToken(token: string): string {
  return xorEncrypt(token, getEncryptionKey());
}

function decryptToken(encrypted: string): string {
  return xorDecrypt(encrypted, getEncryptionKey());
}

// ---------------------------------------------------------------------------
// Provider OAuth configurations
// ---------------------------------------------------------------------------

function getProviderConfig(provider: CrmProvider): OAuthConfig {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const redirectUri = `${supabaseUrl}/functions/v1/crm-oauth?action=callback&provider=${provider}`;

  switch (provider) {
    case "hubspot":
      return {
        client_id: Deno.env.get("HUBSPOT_CLIENT_ID") || "",
        client_secret: Deno.env.get("HUBSPOT_CLIENT_SECRET") || "",
        redirect_uri: redirectUri,
        scopes: [
          "crm.objects.contacts.read",
          "crm.objects.contacts.write",
          "crm.objects.deals.read",
          "crm.objects.deals.write",
        ],
        authorize_url: "https://app.hubspot.com/oauth/authorize",
        token_url: "https://api.hubapi.com/oauth/v1/token",
      };

    case "salesforce":
      return {
        client_id: Deno.env.get("SALESFORCE_CLIENT_ID") || "",
        client_secret: Deno.env.get("SALESFORCE_CLIENT_SECRET") || "",
        redirect_uri: redirectUri,
        scopes: ["api", "refresh_token"],
        authorize_url: "https://login.salesforce.com/services/oauth2/authorize",
        token_url: "https://login.salesforce.com/services/oauth2/token",
      };

    case "xero":
      return {
        client_id: Deno.env.get("XERO_CLIENT_ID") || "",
        client_secret: Deno.env.get("XERO_CLIENT_SECRET") || "",
        redirect_uri: redirectUri,
        scopes: ["openid", "profile", "email", "accounting.contacts"],
        authorize_url: "https://login.xero.com/identity/connect/authorize",
        token_url: "https://identity.xero.com/connect/token",
      };

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

function redirect(url: string) {
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: url },
  });
}

function validateProvider(provider: string | null): provider is CrmProvider {
  return !!provider && ["hubspot", "salesforce", "xero"].includes(provider);
}

// ---------------------------------------------------------------------------
// Action: authorize — build and return the OAuth redirect URL
// ---------------------------------------------------------------------------

function handleAuthorize(provider: CrmProvider, orgId: string): Response {
  const config = getProviderConfig(provider);

  if (!config.client_id) {
    return json(
      { error: `${provider} OAuth is not configured. Set the required environment variables.` },
      400,
    );
  }

  // Build a state param that encodes org_id so we can associate on callback
  const state = btoa(JSON.stringify({ org_id: orgId, provider, ts: Date.now() }));

  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    scope: config.scopes.join(" "),
    response_type: "code",
    state,
  });

  const authorizeUrl = `${config.authorize_url}?${params.toString()}`;

  return json({ authorize_url: authorizeUrl });
}

// ---------------------------------------------------------------------------
// Action: callback — exchange authorization code for tokens
// ---------------------------------------------------------------------------

async function handleCallback(
  provider: CrmProvider,
  code: string,
  state: string,
  supabase: any,
): Promise<Response> {
  const config = getProviderConfig(provider);

  // Decode state to get org_id
  let orgId: string;
  try {
    const stateData = JSON.parse(atob(state));
    orgId = stateData.org_id;
    if (!orgId) throw new Error("Missing org_id in state");
  } catch {
    return json({ error: "Invalid state parameter" }, 400);
  }

  // Exchange code for tokens
  const tokenParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirect_uri,
    client_id: config.client_id,
    client_secret: config.client_secret,
  });

  const tokenRes = await fetch(config.token_url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenParams.toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error(`Token exchange failed for ${provider}:`, errBody);
    return json(
      { error: `Token exchange failed: ${tokenRes.status}`, detail: errBody },
      502,
    );
  }

  const tokenData = await tokenRes.json();

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token || "";
  const expiresIn = tokenData.expires_in; // seconds
  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  // Provider-specific extra fields
  let instanceUrl: string | null = null;
  let tenantId: string | null = null;

  if (provider === "salesforce") {
    instanceUrl = tokenData.instance_url || null;
  }

  if (provider === "xero") {
    // Fetch Xero tenant connections to get the tenant ID
    try {
      const connectionsRes = await fetch(
        "https://api.xero.com/connections",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (connectionsRes.ok) {
        const connections = await connectionsRes.json();
        if (connections.length > 0) {
          tenantId = connections[0].tenantId;
        }
      }
    } catch (connErr) {
      console.error("Failed to fetch Xero tenant connections:", connErr);
    }
  }

  // Encrypt tokens before storage
  const encryptedAccessToken = encryptToken(accessToken);
  const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;

  // Upsert the integration record
  const { data: existing } = await supabase
    .from("crm_integrations")
    .select("id")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .maybeSingle();

  const integrationData: Record<string, unknown> = {
    org_id: orgId,
    provider,
    access_token: encryptedAccessToken,
    refresh_token: encryptedRefreshToken,
    token_expires_at: tokenExpiresAt,
    instance_url: instanceUrl,
    tenant_id: tenantId,
    is_active: true,
    connected_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase
      .from("crm_integrations")
      .update(integrationData)
      .eq("id", existing.id);
  } else {
    await supabase.from("crm_integrations").insert(integrationData);
  }

  // Log the connection event
  await supabase.from("crm_sync_logs").insert({
    org_id: orgId,
    provider,
    action: "oauth_connected",
    success: true,
    attempt: 1,
  });

  // Redirect to the app settings page with success indicator
  const appUrl = Deno.env.get("APP_URL") || "https://app.advisoryscore.com";
  return redirect(
    `${appUrl}/settings?tab=integrations&crm=${provider}&status=connected`,
  );
}

// ---------------------------------------------------------------------------
// Action: refresh — refresh an expired access token
// ---------------------------------------------------------------------------

async function handleRefresh(
  provider: CrmProvider,
  orgId: string,
  supabase: any,
): Promise<Response> {
  const config = getProviderConfig(provider);

  // Look up current integration
  const { data: integration, error } = await supabase
    .from("crm_integrations")
    .select("*")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .eq("is_active", true)
    .single();

  if (error || !integration) {
    return json({ error: "No active integration found for this provider" }, 404);
  }

  const currentRefreshToken = integration.refresh_token
    ? decryptToken(integration.refresh_token)
    : null;

  if (!currentRefreshToken) {
    return json({ error: "No refresh token available. Please re-authorize." }, 400);
  }

  // Build refresh request
  const refreshParams = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: currentRefreshToken,
    client_id: config.client_id,
    client_secret: config.client_secret,
  });

  const tokenRes = await fetch(config.token_url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: refreshParams.toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error(`Token refresh failed for ${provider}:`, errBody);

    // Mark integration as needing re-auth if refresh permanently fails
    if (tokenRes.status === 400 || tokenRes.status === 401) {
      await supabase
        .from("crm_integrations")
        .update({ is_active: false, disconnected_at: new Date().toISOString() })
        .eq("id", integration.id);
    }

    return json(
      { error: `Token refresh failed: ${tokenRes.status}`, detail: errBody },
      502,
    );
  }

  const tokenData = await tokenRes.json();

  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token || currentRefreshToken;
  const expiresIn = tokenData.expires_in;
  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  // Encrypt and store updated tokens
  const encryptedAccess = encryptToken(newAccessToken);
  const encryptedRefresh = encryptToken(newRefreshToken);

  const updateData: Record<string, unknown> = {
    access_token: encryptedAccess,
    refresh_token: encryptedRefresh,
    token_expires_at: tokenExpiresAt,
  };

  // Salesforce may return a new instance_url
  if (provider === "salesforce" && tokenData.instance_url) {
    updateData.instance_url = tokenData.instance_url;
  }

  await supabase
    .from("crm_integrations")
    .update(updateData)
    .eq("id", integration.id);

  // Log refresh event
  await supabase.from("crm_sync_logs").insert({
    org_id: orgId,
    provider,
    action: "token_refreshed",
    success: true,
    attempt: 1,
  });

  // Return the decrypted access token (used internally by crm-sync)
  return json({
    success: true,
    access_token: newAccessToken,
    expires_at: tokenExpiresAt,
  });
}

// ---------------------------------------------------------------------------
// Action: disconnect — deactivate a CRM integration
// ---------------------------------------------------------------------------

async function handleDisconnect(
  provider: CrmProvider,
  orgId: string,
  supabase: any,
): Promise<Response> {
  const { data: integration } = await supabase
    .from("crm_integrations")
    .select("id")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration) {
    return json({ error: "Integration not found" }, 404);
  }

  await supabase
    .from("crm_integrations")
    .update({
      is_active: false,
      access_token: null,
      refresh_token: null,
      disconnected_at: new Date().toISOString(),
    })
    .eq("id", integration.id);

  await supabase.from("crm_sync_logs").insert({
    org_id: orgId,
    provider,
    action: "oauth_disconnected",
    success: true,
    attempt: 1,
  });

  return json({ success: true, message: `${provider} integration disconnected` });
}

// ---------------------------------------------------------------------------
// Action: status — check integration status for an org
// ---------------------------------------------------------------------------

async function handleStatus(
  provider: CrmProvider,
  orgId: string,
  supabase: any,
): Promise<Response> {
  const { data: integration } = await supabase
    .from("crm_integrations")
    .select("provider, is_active, connected_at, last_synced_at, token_expires_at")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .maybeSingle();

  if (!integration) {
    return json({
      connected: false,
      provider,
    });
  }

  return json({
    connected: integration.is_active,
    provider: integration.provider,
    connected_at: integration.connected_at,
    last_synced_at: integration.last_synced_at,
    token_expires_at: integration.token_expires_at,
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);

    // ------------------------------------------------------------------
    // GET requests — authorize and callback flows
    // ------------------------------------------------------------------
    if (req.method === "GET") {
      const action = url.searchParams.get("action");
      const provider = url.searchParams.get("provider");

      if (!action) {
        return json({ error: "action query parameter is required" }, 400);
      }

      if (!validateProvider(provider)) {
        return json(
          { error: "Invalid provider. Must be hubspot, salesforce, or xero." },
          400,
        );
      }

      if (action === "authorize") {
        const orgId = url.searchParams.get("org_id");
        if (!orgId) {
          return json({ error: "org_id query parameter is required" }, 400);
        }
        return handleAuthorize(provider, orgId);
      }

      if (action === "callback") {
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state") || "";
        if (!code) {
          // Check for error from provider
          const errorParam = url.searchParams.get("error");
          const errorDesc = url.searchParams.get("error_description");
          return json(
            {
              error: "OAuth callback failed",
              detail: errorDesc || errorParam || "No authorization code received",
            },
            400,
          );
        }
        return handleCallback(provider, code, state, supabase);
      }

      if (action === "status") {
        const orgId = url.searchParams.get("org_id");
        if (!orgId) {
          return json({ error: "org_id query parameter is required" }, 400);
        }
        return handleStatus(provider, orgId, supabase);
      }

      return json({ error: `Unknown GET action: ${action}` }, 400);
    }

    // ------------------------------------------------------------------
    // POST requests — refresh and disconnect
    // ------------------------------------------------------------------
    if (req.method === "POST") {
      const body = await req.json();
      const { action, provider: providerStr, org_id } = body;

      if (!action) {
        return json({ error: "action is required in request body" }, 400);
      }

      if (!validateProvider(providerStr)) {
        return json(
          { error: "Invalid provider. Must be hubspot, salesforce, or xero." },
          400,
        );
      }

      const provider: CrmProvider = providerStr;

      if (!org_id) {
        return json({ error: "org_id is required" }, 400);
      }

      if (action === "refresh") {
        return handleRefresh(provider, org_id, supabase);
      }

      if (action === "disconnect") {
        return handleDisconnect(provider, org_id, supabase);
      }

      return json({ error: `Unknown POST action: ${action}` }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err: any) {
    console.error("CRM OAuth error:", err);
    return json({ error: err.message || "Internal error" }, 500);
  }
});
