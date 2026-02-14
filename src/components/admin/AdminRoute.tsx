import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading || !session) return;

    const checkSuperAdmin = async () => {
      const { data, error } = await supabase
        .from("super_admins")
        .select("id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();

      setIsSuperAdmin(!error && !!data);
      setChecking(false);
    };

    checkSuperAdmin();
  }, [session, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm text-slate-400">Verifying admin access...</span>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
