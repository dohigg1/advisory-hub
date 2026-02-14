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

interface SyncRequest {
  lead_id: string;
  assessment_id: string;
  org_id: string;
  provider: CrmProvider;
}

interface CrmCredentials {
  provider: CrmProvider;
  access_token: string;
  refresh_token: string;
  instance_url?: string; // Salesforce-specific
  tenant_id?: string;    // Xero-specific
  expires_at?: string;
}

interface SyncLogEntry {
  org_id: string;
  lead_id: string;
  assessment_id: string;
  provider: string;
  action: string;
  success: boolean;
  request_payload?: unknown;
  response_body?: string;
  error_message?: string;
  attempt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logSync(supabase: any, entry: SyncLogEntry) {
  try {
    await supabase.from("crm_sync_logs").insert(entry);
  } catch (err) {
    console.error("Failed to write crm_sync_logs:", err);
  }
}

/**
 * Refresh an expired access token by calling the crm-oauth function.
 * Returns the new access_token on success, or null on failure.
 */
async function refreshTokenIfNeeded(
  credentials: CrmCredentials,
  orgId: string,
): Promise<string | null> {
  if (credentials.expires_at) {
    const expiresAt = new Date(credentials.expires_at).getTime();
    // Refresh if token expires within 5 minutes
    if (expiresAt > Date.now() + 5 * 60 * 1000) {
      return credentials.access_token;
    }
  } else {
    // No expiry info — assume still valid
    return credentials.access_token;
  }

  // Token is expired or about to expire — call crm-oauth/refresh
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/crm-oauth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        action: "refresh",
        provider: credentials.provider,
        org_id: orgId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.access_token ?? null;
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Provider sync implementations
// ---------------------------------------------------------------------------

async function syncToHubSpot(
  accessToken: string,
  lead: any,
  assessment: any,
  score: any,
  tierLabel: string | null,
): Promise<{ contactId: string; dealId?: string }> {
  const baseUrl = "https://api.hubapi.com";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  // 1. Search for existing contact by email
  let contactId: string | null = null;

  const searchRes = await fetch(`${baseUrl}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            { propertyName: "email", operator: "EQ", value: lead.email },
          ],
        },
      ],
    }),
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.total > 0) {
      contactId = searchData.results[0].id;
    }
  }

  // 2. Create or update contact
  const contactProperties: Record<string, string> = {
    email: lead.email,
    firstname: lead.first_name || "",
    lastname: lead.last_name || "",
    company: lead.company || "",
    phone: lead.phone || "",
    assessment_score: String(score?.percentage ?? ""),
    assessment_tier: tierLabel || "",
    assessment_name: assessment.title || "",
  };

  if (contactId) {
    // Update existing contact
    const updateRes = await fetch(
      `${baseUrl}/crm/v3/objects/contacts/${contactId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ properties: contactProperties }),
      },
    );
    if (!updateRes.ok) {
      const errBody = await updateRes.text();
      throw new Error(`HubSpot contact update failed: ${updateRes.status} ${errBody}`);
    }
  } else {
    // Create new contact
    const createRes = await fetch(`${baseUrl}/crm/v3/objects/contacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ properties: contactProperties }),
    });
    if (!createRes.ok) {
      const errBody = await createRes.text();
      throw new Error(`HubSpot contact create failed: ${createRes.status} ${errBody}`);
    }
    const createData = await createRes.json();
    contactId = createData.id;
  }

  // 3. Create a deal linked to the contact
  let dealId: string | undefined;
  try {
    const dealProperties: Record<string, string> = {
      dealname: `${assessment.title} - ${lead.first_name || ""} ${lead.last_name || ""}`.trim(),
      pipeline: "default",
      dealstage: "appointmentscheduled",
      assessment_score: String(score?.percentage ?? ""),
      assessment_tier: tierLabel || "",
    };

    const dealRes = await fetch(`${baseUrl}/crm/v3/objects/deals`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        properties: dealProperties,
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: "HUBSPOT_DEFINED",
                associationTypeId: 3, // deal-to-contact
              },
            ],
          },
        ],
      }),
    });

    if (dealRes.ok) {
      const dealData = await dealRes.json();
      dealId = dealData.id;
    } else {
      console.error("HubSpot deal creation failed:", await dealRes.text());
    }
  } catch (dealErr) {
    console.error("HubSpot deal creation error (non-fatal):", dealErr);
  }

  return { contactId: contactId!, dealId };
}

async function syncToSalesforce(
  accessToken: string,
  instanceUrl: string,
  lead: any,
  assessment: any,
  score: any,
  tierLabel: string | null,
): Promise<{ leadId: string }> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  // 1. Search for existing Lead by email
  const queryUrl = `${instanceUrl}/services/data/v59.0/query/?q=${encodeURIComponent(
    `SELECT Id FROM Lead WHERE Email = '${lead.email.replace(/'/g, "\\'")}' LIMIT 1`,
  )}`;

  let sfLeadId: string | null = null;

  const queryRes = await fetch(queryUrl, { headers });
  if (queryRes.ok) {
    const queryData = await queryRes.json();
    if (queryData.totalSize > 0) {
      sfLeadId = queryData.records[0].Id;
    }
  }

  // 2. Build lead payload
  const leadPayload: Record<string, string> = {
    Email: lead.email,
    FirstName: lead.first_name || "",
    LastName: lead.last_name || "Unknown",
    Company: lead.company || "[Not Provided]",
    Phone: lead.phone || "",
    Assessment_Score__c: String(score?.percentage ?? ""),
    Assessment_Tier__c: tierLabel || "",
    Assessment_Name__c: assessment.title || "",
  };

  if (sfLeadId) {
    // Update existing Lead
    const updateRes = await fetch(
      `${instanceUrl}/services/data/v59.0/sobjects/Lead/${sfLeadId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(leadPayload),
      },
    );
    if (!updateRes.ok && updateRes.status !== 204) {
      const errBody = await updateRes.text();
      throw new Error(`Salesforce Lead update failed: ${updateRes.status} ${errBody}`);
    }
  } else {
    // Create new Lead
    const createRes = await fetch(
      `${instanceUrl}/services/data/v59.0/sobjects/Lead`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(leadPayload),
      },
    );
    if (!createRes.ok) {
      const errBody = await createRes.text();
      throw new Error(`Salesforce Lead create failed: ${createRes.status} ${errBody}`);
    }
    const createData = await createRes.json();
    sfLeadId = createData.id;
  }

  return { leadId: sfLeadId! };
}

async function syncToXero(
  accessToken: string,
  tenantId: string,
  lead: any,
  assessment: any,
  score: any,
  tierLabel: string | null,
): Promise<{ contactId: string }> {
  const baseUrl = "https://api.xero.com/api.xro/2.0";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Xero-Tenant-Id": tenantId,
  };

  // 1. Search for existing contact by email
  let xeroContactId: string | null = null;

  const searchRes = await fetch(
    `${baseUrl}/Contacts?where=${encodeURIComponent(`EmailAddress=="${lead.email}"`)}`,
    { headers },
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.Contacts && searchData.Contacts.length > 0) {
      xeroContactId = searchData.Contacts[0].ContactID;
    }
  }

  // 2. Build contact payload
  const fullName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || lead.email;
  const contactPayload = {
    Name: lead.company ? `${lead.company} - ${fullName}` : fullName,
    FirstName: lead.first_name || "",
    LastName: lead.last_name || "",
    EmailAddress: lead.email,
    Phones: lead.phone
      ? [{ PhoneType: "DEFAULT", PhoneNumber: lead.phone }]
      : [],
    // Store assessment data in the contact's notes since Xero doesn't have custom fields
    ContactStatus: "ACTIVE",
    // Xero doesn't support custom fields natively — embed in notes
  };

  if (xeroContactId) {
    // Update existing contact
    const updateRes = await fetch(`${baseUrl}/Contacts/${xeroContactId}`, {
      method: "POST",
      headers,
      body: JSON.stringify(contactPayload),
    });
    if (!updateRes.ok) {
      const errBody = await updateRes.text();
      throw new Error(`Xero contact update failed: ${updateRes.status} ${errBody}`);
    }
  } else {
    // Create new contact
    const createRes = await fetch(`${baseUrl}/Contacts`, {
      method: "POST",
      headers,
      body: JSON.stringify({ Contacts: [contactPayload] }),
    });
    if (!createRes.ok) {
      const errBody = await createRes.text();
      throw new Error(`Xero contact create failed: ${createRes.status} ${errBody}`);
    }
    const createData = await createRes.json();
    xeroContactId = createData.Contacts?.[0]?.ContactID;
  }

  // 3. Create a history note with assessment data on the contact
  if (xeroContactId) {
    try {
      await fetch(
        `${baseUrl}/Contacts/${xeroContactId}/History`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            HistoryRecords: [
              {
                Details: `Assessment completed: ${assessment.title}. Score: ${score?.percentage ?? "N/A"}%. Tier: ${tierLabel || "N/A"}.`,
              },
            ],
          }),
        },
      );
    } catch (histErr) {
      console.error("Xero history note failed (non-fatal):", histErr);
    }
  }

  return { contactId: xeroContactId! };
}

// ---------------------------------------------------------------------------
// Retry wrapper
// ---------------------------------------------------------------------------

async function syncWithRetry(
  supabase: any,
  provider: CrmProvider,
  credentials: CrmCredentials,
  lead: any,
  assessment: any,
  score: any,
  tierLabel: string | null,
  orgId: string,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Attempt to refresh token before each retry
      const token =
        attempt === 1
          ? credentials.access_token
          : (await refreshTokenIfNeeded(credentials, orgId)) ??
            credentials.access_token;

      let result: unknown;

      switch (provider) {
        case "hubspot":
          result = await syncToHubSpot(token, lead, assessment, score, tierLabel);
          break;
        case "salesforce":
          if (!credentials.instance_url) {
            throw new Error("Salesforce instance_url not configured");
          }
          result = await syncToSalesforce(
            token,
            credentials.instance_url,
            lead,
            assessment,
            score,
            tierLabel,
          );
          break;
        case "xero":
          if (!credentials.tenant_id) {
            throw new Error("Xero tenant_id not configured");
          }
          result = await syncToXero(
            token,
            credentials.tenant_id,
            lead,
            assessment,
            score,
            tierLabel,
          );
          break;
        default:
          throw new Error(`Unsupported CRM provider: ${provider}`);
      }

      // Log success
      await logSync(supabase, {
        org_id: orgId,
        lead_id: lead.id,
        assessment_id: assessment.id,
        provider,
        action: "sync_contact",
        success: true,
        response_body: JSON.stringify(result).substring(0, 2000),
        attempt,
      });

      return { success: true, data: result };
    } catch (err: any) {
      console.error(`CRM sync attempt ${attempt}/${maxAttempts} failed:`, err.message);

      // Log failure attempt
      await logSync(supabase, {
        org_id: orgId,
        lead_id: lead.id,
        assessment_id: assessment.id,
        provider,
        action: "sync_contact",
        success: false,
        error_message: err.message || String(err),
        attempt,
      });

      // Don't retry on configuration errors
      if (
        err.message?.includes("not configured") ||
        err.message?.includes("Unsupported")
      ) {
        return { success: false, error: err.message };
      }

      if (attempt < maxAttempts) {
        // Exponential backoff: 2s, 4s
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  return { success: false, error: "Max retry attempts exceeded" };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body: SyncRequest = await req.json();
    const { lead_id, assessment_id, org_id, provider } = body;

    // Validate required fields
    if (!lead_id || !assessment_id || !org_id || !provider) {
      return json(
        { error: "lead_id, assessment_id, org_id, and provider are required" },
        400,
      );
    }

    const validProviders: CrmProvider[] = ["hubspot", "salesforce", "xero"];
    if (!validProviders.includes(provider)) {
      return json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(", ")}` },
        400,
      );
    }

    // ------------------------------------------------------------------
    // 1. Look up CRM credentials for this org + provider
    // ------------------------------------------------------------------
    const { data: integration, error: integErr } = await supabase
      .from("crm_integrations")
      .select("*")
      .eq("org_id", org_id)
      .eq("provider", provider)
      .eq("is_active", true)
      .single();

    if (integErr || !integration) {
      return json({
        success: false,
        message: "CRM not configured",
        detail: `No active ${provider} integration found for this organisation.`,
      });
    }

    const credentials: CrmCredentials = {
      provider,
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
      instance_url: integration.instance_url ?? undefined,
      tenant_id: integration.tenant_id ?? undefined,
      expires_at: integration.token_expires_at ?? undefined,
    };

    // ------------------------------------------------------------------
    // 2. Fetch lead, assessment, and score data
    // ------------------------------------------------------------------
    const [leadRes, assessmentRes, scoreRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", lead_id).single(),
      supabase.from("assessments").select("*").eq("id", assessment_id).single(),
      supabase.from("scores").select("*").eq("lead_id", lead_id).single(),
    ]);

    const lead = leadRes.data;
    const assessment = assessmentRes.data;
    const score = scoreRes.data;

    if (!lead) {
      return json({ error: "Lead not found" }, 404);
    }
    if (!assessment) {
      return json({ error: "Assessment not found" }, 404);
    }

    // Resolve tier label
    let tierLabel: string | null = null;
    if (score?.tier_id) {
      const { data: tier } = await supabase
        .from("score_tiers")
        .select("label")
        .eq("id", score.tier_id)
        .single();
      tierLabel = tier?.label ?? null;
    }

    // ------------------------------------------------------------------
    // 3. Perform the sync with retry logic
    // ------------------------------------------------------------------
    const result = await syncWithRetry(
      supabase,
      provider,
      credentials,
      lead,
      assessment,
      score,
      tierLabel,
      org_id,
    );

    if (result.success) {
      // Update last_synced_at on the integration record
      await supabase
        .from("crm_integrations")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", integration.id);
    }

    return json({
      success: result.success,
      provider,
      data: result.data ?? null,
      error: result.error ?? null,
    });
  } catch (err: any) {
    console.error("CRM sync error:", err);
    return json({ error: err.message || "CRM sync failed" }, 500);
  }
});
