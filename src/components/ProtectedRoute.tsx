import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, user } = useAuth();
  const [legalCheck, setLegalCheck] = useState<{ checking: boolean; pendingDoc: any | null }>({ checking: true, pendingDoc: null });
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!session || !user) {
      setLegalCheck({ checking: false, pendingDoc: null });
      return;
    }

    const checkLegal = async () => {
      try {
        // Get latest published legal documents
        const { data: docs } = await (supabase as any)
          .from("legal_documents")
          .select("*")
          .not("published_at", "is", null)
          .order("version", { ascending: false });

        if (!docs || docs.length === 0) {
          setLegalCheck({ checking: false, pendingDoc: null });
          return;
        }

        // Get user's acceptances
        const { data: acceptances } = await (supabase as any)
          .from("legal_acceptances")
          .select("document_id")
          .eq("user_id", user.id);

        const acceptedIds = new Set((acceptances || []).map((a: any) => a.document_id));

        // Find latest version of each type that hasn't been accepted
        const latestByType: Record<string, any> = {};
        for (const doc of docs) {
          if (!latestByType[doc.type]) {
            latestByType[doc.type] = doc;
          }
        }

        const pending = Object.values(latestByType).find((doc: any) => !acceptedIds.has(doc.id));
        setLegalCheck({ checking: false, pendingDoc: pending || null });
      } catch {
        setLegalCheck({ checking: false, pendingDoc: null });
      }
    };

    checkLegal();
  }, [session, user]);

  const handleAccept = async () => {
    if (!user || !legalCheck.pendingDoc) return;
    setAccepting(true);
    await (supabase as any).from("legal_acceptances").insert({
      user_id: user.id,
      document_id: legalCheck.pendingDoc.id,
    });
    setLegalCheck({ checking: false, pendingDoc: null });
    setAccepting(false);
  };

  if (loading || legalCheck.checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;

  // User authenticated but no org → onboarding
  if (profile && !profile.org_id) return <Navigate to="/onboarding" replace />;

  // Legal acceptance modal
  if (legalCheck.pendingDoc) {
    return (
      <>
        {children}
        <Dialog open={true}>
          <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{legalCheck.pendingDoc.title}</DialogTitle>
              <DialogDescription>
                Please review and accept the updated {legalCheck.pendingDoc.type === "terms_of_service" ? "Terms of Service" : "Privacy Policy"} to continue.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px] rounded border p-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {legalCheck.pendingDoc.content}
            </ScrollArea>
            <DialogFooter>
              <Button onClick={handleAccept} disabled={accepting}>
                {accepting ? "Accepting..." : "I Accept"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return <>{children}</>;
}
