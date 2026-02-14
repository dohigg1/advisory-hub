import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandTheme {
  colours_json: Record<string, string>;
  fonts_json: Record<string, string>;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  footer_text: string | null;
  privacy_url: string | null;
  terms_url: string | null;
}

interface Props {
  orgId: string | null;
  children: ReactNode;
}

export function BrandThemeProvider({ orgId, children }: Props) {
  const [theme, setTheme] = useState<BrandTheme | null>(null);

  useEffect(() => {
    if (!orgId) return;
    loadTheme(orgId);
  }, [orgId]);

  const loadTheme = async (id: string) => {
    const { data } = await supabase
      .from("brand_themes" as any)
      .select("*")
      .eq("org_id", id)
      .maybeSingle();

    if (data) {
      setTheme(data as any);
    }
  };

  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    const colours = theme.colours_json || {};

    if (colours.primary) {
      root.style.setProperty("--brand-primary", colours.primary);
    }
    if (colours.secondary) {
      root.style.setProperty("--brand-secondary", colours.secondary);
    }
    if (colours.background) {
      root.style.setProperty("--brand-background", colours.background);
    }
    if (colours.text) {
      root.style.setProperty("--brand-text", colours.text);
    }

    // Load custom fonts
    const fonts = theme.fonts_json || {};
    if (fonts.heading || fonts.body) {
      const fontFamilies = new Set<string>();
      if (fonts.heading) fontFamilies.add(fonts.heading);
      if (fonts.body) fontFamilies.add(fonts.body);

      const families = Array.from(fontFamilies).map(f => f.replace(/\s+/g, "+")).join("&family=");
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);

      if (fonts.heading) {
        root.style.setProperty("--brand-heading-font", `'${fonts.heading}', sans-serif`);
      }
      if (fonts.body) {
        root.style.setProperty("--brand-body-font", `'${fonts.body}', sans-serif`);
      }
    }

    // Set favicon
    if (theme.favicon_url) {
      const existingFavicon = document.querySelector("link[rel='icon']");
      if (existingFavicon) {
        (existingFavicon as HTMLLinkElement).href = theme.favicon_url;
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = theme.favicon_url;
        document.head.appendChild(link);
      }
    }

    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-secondary");
      root.style.removeProperty("--brand-background");
      root.style.removeProperty("--brand-text");
      root.style.removeProperty("--brand-heading-font");
      root.style.removeProperty("--brand-body-font");
    };
  }, [theme]);

  return <>{children}</>;
}

export function useBrandTheme(orgId: string | null) {
  const [theme, setTheme] = useState<BrandTheme | null>(null);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("brand_themes" as any)
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTheme(data as any);
      });
  }, [orgId]);

  return theme;
}
