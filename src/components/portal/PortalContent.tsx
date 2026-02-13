import { usePortal } from "@/contexts/PortalContext";
import { PortalLogin } from "./PortalLogin";
import { PortalDashboard } from "./PortalDashboard";

interface Props {
  orgSlug: string;
}

export function PortalContent({ orgSlug }: Props) {
  const { session, loading } = usePortal();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <PortalLogin orgSlug={orgSlug} />;
  }

  return <PortalDashboard />;
}
