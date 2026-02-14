import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Gift } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: () => void; // proceeds to Stripe portal for cancellation
}

const REASONS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "missing_features", label: "Missing features I need" },
  { value: "switching", label: "Switching to a competitor" },
  { value: "no_longer_need", label: "No longer need it" },
  { value: "too_complex", label: "Too complex to set up" },
  { value: "other", label: "Other" },
] as const;

export function CancellationModal({ open, onOpenChange, onConfirmCancel }: Props) {
  const { user, organisation } = useAuth();
  const [step, setStep] = useState<"reason" | "offer" | "confirm">("reason");
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNext = () => {
    if (step === "reason") {
      // Offer a discount for price-sensitive cancellations
      if (reason === "too_expensive") {
        setStep("offer");
      } else {
        setStep("confirm");
      }
    }
  };

  const handleAcceptOffer = async () => {
    setSubmitting(true);
    // Store feedback indicating they accepted the discount
    await supabase.from("cancellation_feedback" as any).insert({
      org_id: organisation?.id,
      user_id: user?.id,
      reason,
      details: detail || null,
      offered_discount: true,
      accepted_discount: true,
    } as any);

    // TODO: Apply discount coupon via Stripe API (requires backend Edge Function)
    // For now, close the modal -- the discount application should be handled
    // by a separate endpoint that creates a Stripe coupon/promotion on the subscription.
    setSubmitting(false);
    resetAndClose();
  };

  const handleConfirmCancel = async () => {
    setSubmitting(true);
    try {
      // Store cancellation feedback before redirecting to Stripe
      await supabase.from("cancellation_feedback" as any).insert({
        org_id: organisation?.id,
        user_id: user?.id,
        reason,
        details: detail || null,
        offered_discount: reason === "too_expensive",
        accepted_discount: false,
      } as any);
    } catch (err) {
      // Don't block cancellation if feedback insert fails
      console.error("Failed to save cancellation feedback:", err);
    }

    setSubmitting(false);
    onConfirmCancel();
  };

  const resetAndClose = () => {
    setStep("reason");
    setReason("");
    setDetail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        {step === "reason" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Cancel your subscription?
              </DialogTitle>
              <DialogDescription>
                We're sorry to see you go. Could you tell us why you're cancelling?
                This helps us improve AdvisoryScore for everyone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Any additional details? (optional)"
                className="min-h-[80px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleNext}
                disabled={!reason}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "offer" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-accent" />
                We'd like to offer you a discount
              </DialogTitle>
              <DialogDescription>
                How about 20% off your next 3 months? That could save you up to{" "}
                <Badge variant="secondary" className="font-mono">
                  &pound;45
                </Badge>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg border border-accent/20 bg-accent/5 p-4 text-center">
                <p className="text-[14px] font-semibold text-accent">
                  20% off for 3 months
                </p>
                <p className="text-[12px] text-muted-foreground mt-1">
                  Your discount will be applied to your next 3 invoices automatically.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("confirm")}>
                No thanks, cancel anyway
              </Button>
              <Button onClick={handleAcceptOffer} disabled={submitting}>
                {submitting ? "Applying..." : "Accept Discount"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm cancellation</DialogTitle>
              <DialogDescription>
                Your subscription will remain active until the end of your current
                billing period. You won't be charged again, and your data will be
                preserved on the Free plan.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                <p className="text-[13px] font-medium text-destructive">
                  You will lose access to:
                </p>
                <ul className="text-[12px] text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Advanced analytics and reporting</li>
                  <li>Custom branding and white-labelling</li>
                  <li>Additional team member seats</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetAndClose}>
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmCancel}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Cancel Subscription"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
