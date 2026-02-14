import { BarChart3 } from "lucide-react";

interface Props {
  referralCode?: string;
  className?: string;
}

export function PoweredByBadge({ referralCode, className = "" }: Props) {
  const href = referralCode
    ? `https://advisoryscore.com/?ref=${referralCode}`
    : "https://advisoryscore.com";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors ${className}`}
    >
      <BarChart3 className="h-3 w-3" />
      Powered by AdvisoryScore
    </a>
  );
}
