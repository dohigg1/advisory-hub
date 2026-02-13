import { useParams } from "react-router-dom";
import { PortalProvider } from "@/contexts/PortalContext";
import { PortalContent } from "@/components/portal/PortalContent";

export default function Portal() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  if (!orgSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Invalid portal URL</p>
      </div>
    );
  }

  return (
    <PortalProvider orgSlug={orgSlug}>
      <PortalContent orgSlug={orgSlug} />
    </PortalProvider>
  );
}
