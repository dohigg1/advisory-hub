import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PortalSession {
  email: string;
  sessionToken: string;
  orgSlug: string;
}

interface PortalOrg {
  name: string;
  logo_url: string | null;
  primary_colour: string | null;
  slug: string;
}

interface CompletedAssessment {
  lead_id: string;
  assessment_id: string;
  assessment_title: string;
  assessment_type: string;
  score_percentage: number | null;
  completed_at: string | null;
  iteration_count: number;
}

interface AvailableAssessment {
  id: string;
  title: string;
  description: string | null;
  type: string;
  slug: string | null;
}

interface PortalData {
  organisation: PortalOrg;
  portal_settings: any;
  client_name: string;
  completed_assessments: CompletedAssessment[];
  available_assessments: AvailableAssessment[];
  iterations: any[];
}

interface PortalContextType {
  session: PortalSession | null;
  data: PortalData | null;
  loading: boolean;
  error: string | null;
  requestMagicLink: (email: string, orgSlug: string) => Promise<boolean>;
  validateToken: (token: string, email: string, orgSlug: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

const STORAGE_KEY = "portal_session";

function getStoredSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function storeSession(session: PortalSession | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export function PortalProvider({ orgSlug, children }: { orgSlug: string; children: ReactNode }) {
  const [session, setSession] = useState<PortalSession | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const functionsUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-auth`;

  const fetchPortalData = useCallback(async (sess: PortalSession) => {
    try {
      const res = await fetch(functionsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          action: "get-portal-data",
          email: sess.email,
          org_slug: sess.orgSlug,
          session_token: sess.sessionToken,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setSession(null);
        storeSession(null);
        setData(null);
        return;
      }
      setData(result);
    } catch (e: any) {
      setError(e.message);
    }
  }, [functionsUrl]);

  // Restore session on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored && stored.orgSlug === orgSlug) {
      // Verify session is still valid
      fetch(functionsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          action: "verify-session",
          session_token: stored.sessionToken,
          email: stored.email,
          org_slug: orgSlug,
        }),
      })
        .then(r => r.json())
        .then(async (result) => {
          if (result.valid) {
            setSession(stored);
            await fetchPortalData(stored);
          } else {
            storeSession(null);
          }
          setLoading(false);
        })
        .catch(() => {
          storeSession(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orgSlug, functionsUrl, fetchPortalData]);

  const requestMagicLink = async (email: string, slug: string): Promise<boolean> => {
    try {
      const res = await fetch(functionsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          action: "request-magic-link",
          email,
          org_slug: slug,
          portal_base_url: window.location.origin,
        }),
      });
      const result = await res.json();
      return result.success === true;
    } catch { return false; }
  };

  const validateToken = async (token: string, email: string, slug: string): Promise<boolean> => {
    try {
      const res = await fetch(functionsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          action: "validate-token",
          token,
          email,
          org_slug: slug,
        }),
      });
      const result = await res.json();
      if (result.success && result.session_token) {
        const sess: PortalSession = { email: result.email, sessionToken: result.session_token, orgSlug: slug };
        setSession(sess);
        storeSession(sess);
        await fetchPortalData(sess);
        return true;
      }
      return false;
    } catch { return false; }
  };

  const logout = () => {
    setSession(null);
    setData(null);
    storeSession(null);
  };

  const refreshData = async () => {
    if (session) await fetchPortalData(session);
  };

  return (
    <PortalContext.Provider value={{ session, data, loading, error, requestMagicLink, validateToken, logout, refreshData }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}
