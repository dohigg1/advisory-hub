import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Gift, Users, UserCheck, Link2 } from "lucide-react";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const Referrals = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: codes }, { data: convs }] = await Promise.all([
        supabase.from("referral_codes").select("*").eq("user_id", user.id).limit(1),
        supabase.from("referral_conversions").select("*, referral_codes!inner(user_id)").order("created_at", { ascending: false }),
      ]);
      if (codes && codes.length > 0) setReferralCode(codes[0].code);
      setConversions(convs || []);
      setLoading(false);
    })();
  }, [user]);

  const referralUrl = referralCode ? `${window.location.origin}/auth?ref=${referralCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied!");
  };

  const signedUp = conversions.filter(c => c.status === "signed_up").length;
  const converted = conversions.filter(c => c.status === "subscribed").length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-xl font-bold tracking-tight">Referrals</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Invite others and earn rewards</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-soft-xs border-border/60">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Total Clicks</p>
              <p className="text-xl font-bold tracking-tight">{conversions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft-xs border-border/60">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Sign-ups</p>
              <p className="text-xl font-bold tracking-tight">{signedUp}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft-xs border-border/60">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium">Converted</p>
              <p className="text-xl font-bold tracking-tight">{converted}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral link */}
      <motion.div variants={item}>
        <Card className="shadow-soft-xs border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
              <Gift className="h-4 w-4 text-accent" /> Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {referralCode ? (
              <div className="flex gap-2">
                <Input value={referralUrl} readOnly className="text-[12px] font-mono bg-muted/40" />
                <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5 shrink-0">
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Your referral code will be generated when you set up your organisation.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversions table */}
      {conversions.length > 0 && (
        <motion.div variants={item}>
          <Card className="shadow-soft-xs border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold">Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conversions.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                    <span className="text-[12px] font-medium">{c.referred_email}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                      <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Referrals;
