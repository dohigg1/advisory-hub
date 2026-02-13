import { useEffect, useState, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Download, ExternalLink, Mail, Linkedin, Code, MousePointerClick, Monitor, QrCode } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Assessment } from "@/types/assessment";

interface Props {
  assessment: Assessment;
}

export function ShareTab({ assessment }: Props) {
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // UTM state
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // Popup config
  const [btnText, setBtnText] = useState("Take the Assessment");
  const [btnColor, setBtnColor] = useState("#1B3A5C");
  const [btnPosition, setBtnPosition] = useState<"inline" | "bottom-right" | "bottom-left">("inline");

  // QR size
  const [qrSize, setQrSize] = useState<256 | 512 | 1024>(256);

  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("landing_pages")
      .select("slug")
      .eq("assessment_id", assessment.id)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setSlug(data.slug);
      });
  }, [assessment.id]);

  const baseUrl = window.location.origin;
  const landingUrl = slug ? `${baseUrl}/a/${slug}` : null;

  const utmParams = [
    utmSource && `utm_source=${encodeURIComponent(utmSource)}`,
    utmMedium && `utm_medium=${encodeURIComponent(utmMedium)}`,
    utmCampaign && `utm_campaign=${encodeURIComponent(utmCampaign)}`,
    utmTerm && `utm_term=${encodeURIComponent(utmTerm)}`,
    utmContent && `utm_content=${encodeURIComponent(utmContent)}`,
  ].filter(Boolean).join("&");

  const taggedUrl = landingUrl ? (utmParams ? `${landingUrl}?${utmParams}` : landingUrl) : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const inlineEmbedCode = `<!-- AdvisoryScore Inline Embed -->
<div id="advisoryscore-embed"></div>
<script>
(function(){
  var d=document,f=d.createElement('iframe');
  f.src='${taggedUrl || "{landing_page_url}"}' + (location.search ? '&' : '?') + 'embed=inline&source=' + encodeURIComponent(location.href);
  f.style.cssText='width:100%;border:none;min-height:600px;';
  f.setAttribute('allowfullscreen','true');
  d.getElementById('advisoryscore-embed').appendChild(f);
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='advisoryscore-resize')f.style.height=e.data.height+'px';
  });
})();
</script>`;

  const popupEmbedCode = `<!-- AdvisoryScore Popup Embed -->
<script>
(function(){
  var btn=document.createElement('button');
  btn.textContent=${JSON.stringify(btnText)};
  btn.style.cssText='background:${btnColor};color:#fff;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:16px;font-family:inherit;${btnPosition === "bottom-right" ? "position:fixed;bottom:24px;right:24px;z-index:9999;" : btnPosition === "bottom-left" ? "position:fixed;bottom:24px;left:24px;z-index:9999;" : ""}';
  ${btnPosition === "inline" ? "document.currentScript.parentNode.insertBefore(btn,document.currentScript);" : "document.body.appendChild(btn);"}
  btn.onclick=function(){
    var overlay=document.createElement('div');
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;';
    var frame=document.createElement('iframe');
    frame.src='${taggedUrl || "{landing_page_url}"}' + (location.search ? '&' : '?') + 'embed=popup&source=' + encodeURIComponent(location.href);
    frame.style.cssText='width:90vw;max-width:720px;height:85vh;border:none;border-radius:8px;background:#fff;';
    frame.setAttribute('allowfullscreen','true');
    overlay.appendChild(frame);
    overlay.onclick=function(e){if(e.target===overlay){overlay.remove();}};
    document.body.appendChild(overlay);
  };
})();
</script>`;

  const downloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = qrSize;
    canvas.height = qrSize;
    const ctx = canvas.getContext("2d")!;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, qrSize, qrSize);
      ctx.drawImage(img, 0, 0, qrSize, qrSize);
      const a = document.createElement("a");
      a.download = `qr-${slug ?? "assessment"}-${qrSize}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!slug) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold">Share & Embed</h2>
          <p className="text-sm text-muted-foreground">Create a landing page first to enable sharing.</p>
        </div>
        <Card className="border shadow-sm">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Go to the Landing Page tab to create and publish your assessment landing page.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">Share & Embed</h2>
        <p className="text-sm text-muted-foreground">Distribute your assessment via links, embeds, QR codes, and social sharing</p>
      </div>

      {/* Full Page Link */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Full Page Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={taggedUrl} readOnly className="font-mono text-xs" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(taggedUrl, "link")}
            >
              {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={taggedUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Embed Codes */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Code className="h-4 w-4" /> Embed Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inline">
            <TabsList>
              <TabsTrigger value="inline" className="text-xs">
                <Monitor className="h-3 w-3 mr-1" /> Inline
              </TabsTrigger>
              <TabsTrigger value="popup" className="text-xs">
                <MousePointerClick className="h-3 w-3 mr-1" /> Popup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inline" className="space-y-3 mt-4">
              <p className="text-xs text-muted-foreground">
                Paste this code where you want the assessment to appear on your page.
              </p>
              <div className="relative">
                <Textarea value={inlineEmbedCode} readOnly className="font-mono text-xs h-40" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(inlineEmbedCode, "inline")}
                >
                  {copied === "inline" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="popup" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Button text</Label>
                  <Input value={btnText} onChange={(e) => setBtnText(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Button colour</Label>
                  <div className="flex gap-2">
                    <input type="color" value={btnColor} onChange={(e) => setBtnColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                    <Input value={btnColor} onChange={(e) => setBtnColor(e.target.value)} className="text-sm font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Position</Label>
                  <Select value={btnPosition} onValueChange={(v: any) => setBtnPosition(v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inline">Inline</SelectItem>
                      <SelectItem value="bottom-right">Bottom right</SelectItem>
                      <SelectItem value="bottom-left">Bottom left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative">
                <Textarea value={popupEmbedCode} readOnly className="font-mono text-xs h-48" />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(popupEmbedCode, "popup")}
                >
                  {copied === "popup" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <QrCode className="h-4 w-4" /> QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            <div ref={qrRef} className="border rounded p-3 bg-card">
              <QRCodeSVG value={taggedUrl} size={160} level="M" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Download size</Label>
                <Select value={String(qrSize)} onValueChange={(v) => setQrSize(Number(v) as 256 | 512 | 1024)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256 × 256</SelectItem>
                    <SelectItem value="512">512 × 512</SelectItem>
                    <SelectItem value="1024">1024 × 1024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={downloadQR}>
                <Download className="h-3.5 w-3.5 mr-1" /> Download PNG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Options */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Share</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(taggedUrl, "share")}
            >
              {copied === "share" ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              Copy Link
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`mailto:?subject=${encodeURIComponent(assessment.title)}&body=${encodeURIComponent(`Check out this assessment: ${taggedUrl}`)}`}
              >
                <Mail className="h-3.5 w-3.5 mr-1" /> Email
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(taggedUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-3.5 w-3.5 mr-1" /> LinkedIn
              </a>
            </Button>
          </div>

          {/* OG Preview */}
          <div className="border rounded p-4 bg-muted/30 space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Social preview</p>
            <div className="border rounded bg-card p-3 max-w-sm">
              <p className="text-sm font-semibold">{assessment.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{assessment.description ?? "Take this assessment to discover your score."}</p>
              <p className="text-xs text-accent mt-1 truncate">{taggedUrl}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* UTM Builder */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">UTM Builder</CardTitle>
          <p className="text-xs text-muted-foreground">Add tracking parameters to your distribution links</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Source</Label>
              <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="e.g. linkedin, newsletter" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Medium</Label>
              <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="e.g. social, email, cpc" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Campaign</Label>
              <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="e.g. spring-launch" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Term</Label>
              <Input value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} placeholder="e.g. keyword" className="text-sm" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">Content</Label>
              <Input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="e.g. hero-cta" className="text-sm" />
            </div>
          </div>

          {utmParams && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tagged URL</Label>
              <div className="flex gap-2">
                <Input value={taggedUrl} readOnly className="font-mono text-xs" />
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(taggedUrl, "utm")}>
                  {copied === "utm" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
