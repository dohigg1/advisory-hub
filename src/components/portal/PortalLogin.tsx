import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePortal } from "@/contexts/PortalContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  orgSlug: string;
}

export function PortalLogin({ orgSlug }: Props) {
  const { requestMagicLink, validateToken } = usePortal();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [orgInfo, setOrgInfo] = useState<{ name: string; logo_url: string | null; primary_colour: string | null } | null>(null);

  // Load org branding
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("organisations" as any)
        .select("name, logo_url, primary_colour, slug")
        .eq("slug", orgSlug)
        .single();
      if (data) setOrgInfo(data as any);
    })();
  }, [orgSlug]);

  // Handle magic link token from URL
  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");
    if (token && emailParam) {
      setValidating(true);
      validateToken(token, emailParam, orgSlug).then(success => {
        if (!success) {
          toast.error("Invalid or expired link. Please request a new one.");
        }
        setValidating(false);
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      });
    }
  }, [searchParams, orgSlug, validateToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await requestMagicLink(email, orgSlug);
    if (success) {
      setSent(true);
    } else {
      toast.error("Failed to send login link. Please try again.");
    }
    setLoading(false);
  };

  const brandColour = orgInfo?.primary_colour || "#1B3A5C";

  if (validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" style={{ color: brandColour }} />
          <p className="text-sm text-muted-foreground">Verifying your login link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px]"
      >
        {/* Branding */}
        <div className="text-center mb-8">
          {orgInfo?.logo_url ? (
            <img src={orgInfo.logo_url} alt={orgInfo.name} className="h-12 object-contain mx-auto mb-4" />
          ) : (
            <div
              className="h-12 w-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: brandColour }}
            >
              {orgInfo?.name?.charAt(0) || "P"}
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight">{orgInfo?.name || "Client Portal"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Access your assessment results</p>
        </div>

        <Card className="shadow-soft-md border-border/60">
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
                <h3 className="text-base font-semibold">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a login link to <strong>{email}</strong>. Click the link to access your portal.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="portal-email" className="text-xs font-medium text-muted-foreground">
                    Email address
                  </Label>
                  <Input
                    id="portal-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="h-10"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-10 font-semibold"
                  style={{ backgroundColor: brandColour }}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Sending…" : "Send login link"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  We'll email you a magic link to sign in. No password needed.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
