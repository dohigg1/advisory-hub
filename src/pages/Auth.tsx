import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart3, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

type AuthMode = "login" | "register" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("referral_code", ref);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      // Track referral conversion
      const refCode = localStorage.getItem("referral_code");
      if (refCode) {
        try {
          const { data: codeData } = await supabase
            .from("referral_codes")
            .select("id")
            .eq("code", refCode)
            .single();
          if (codeData) {
            await supabase.from("referral_conversions").insert({
              referral_code_id: codeData.id,
              referred_email: email,
              status: "signed_up",
            });
          }
          localStorage.removeItem("referral_code");
        } catch {} // Silent fail for referral tracking
      }
      toast.success("Check your email for a verification link.");
      setMode("login");
    }
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent.");
      setMode("login");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden items-end p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-primary/60" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-y-1/3 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 ring-1 ring-accent/30">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">AdvisoryScore</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-3">
            Build assessments<br />that convert.
          </h2>
          <p className="text-sm text-white/40 max-w-sm leading-relaxed">
            Create professional scorecards and diagnostics. Capture qualified leads. Deliver instant insights.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-8 lg:hidden text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-soft-md">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">AdvisoryScore</h1>
          </div>

          <div className="mb-6 lg:mb-8">
            <h1 className="text-xl font-bold tracking-tight">
              {mode === "login" && "Welcome back"}
              {mode === "register" && "Create your account"}
              {mode === "forgot" && "Reset password"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" && "Sign in to continue to your dashboard"}
              {mode === "register" && "Get started with AdvisoryScore"}
              {mode === "forgot" && "We'll send you a reset link"}
            </p>
          </div>

          <form onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgot} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-[12px] font-medium text-muted-foreground">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" required className="h-10" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-medium text-muted-foreground">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className="h-10" />
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px] font-medium text-muted-foreground">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-10" />
              </div>
            )}
            <Button type="submit" className="w-full h-10 shadow-soft-sm font-semibold" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-[13px]">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </button>
                <div>
                  <span className="text-muted-foreground">No account? </span>
                  <button onClick={() => setMode("register")} className="text-accent hover:text-accent/80 font-semibold transition-colors">
                    Sign up
                  </button>
                </div>
              </>
            )}
            {(mode === "register" || mode === "forgot") && (
              <button onClick={() => setMode("login")} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
