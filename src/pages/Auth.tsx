import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart3, ArrowLeft } from "lucide-react";

type AuthMode = "login" | "register" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-soft-md">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">AdvisoryScore</h1>
          <p className="mt-1 text-sm text-muted-foreground">Professional advisory performance platform</p>
        </div>

        <Card className="shadow-soft-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold tracking-tight">
              {mode === "login" && "Sign in"}
              {mode === "register" && "Create account"}
              {mode === "forgot" && "Reset password"}
            </CardTitle>
            <CardDescription className="text-sm">
              {mode === "login" && "Enter your credentials to continue"}
              {mode === "register" && "Get started with AdvisoryScore"}
              {mode === "forgot" && "We'll send you a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleForgot} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Smith" required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
              )}
              <Button type="submit" className="w-full shadow-soft-sm" disabled={loading}>
                {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
              </Button>
            </form>

            <div className="mt-5 space-y-2 text-center text-sm">
              {mode === "login" && (
                <>
                  <button onClick={() => setMode("forgot")} className="text-muted-foreground hover:text-foreground transition-colors">
                    Forgot password?
                  </button>
                  <div>
                    <span className="text-muted-foreground">No account? </span>
                    <button onClick={() => setMode("register")} className="text-accent hover:underline font-semibold">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
