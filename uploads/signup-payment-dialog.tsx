"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { createClient } from "../../supabase/client";
import { usePrompt } from "@/contexts/PromptContext";

interface SignupPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SignupPaymentDialog({
  open,
  onOpenChange,
}: SignupPaymentDialogProps) {
  const [step, setStep] = useState<"signup" | "confirmation">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const { promptCount } = usePrompt();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        setError("All fields are required");
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters long");
        return;
      }

      // Use Supabase client directly
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
            email: email,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/pricing`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        setConfirmationMessage(
          "We've sent a confirmation email to your inbox. Click the link in the email to activate your account and choose your plan.",
        );
        setStep("confirmation");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Allow closing the dialog if on confirmation step
  const handleOpenChange = (newOpen: boolean) => {
    if (step === "confirmation" || !newOpen) {
      onOpenChange(newOpen);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep("signup");
      setEmail("");
      setPassword("");
      setFullName("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Sparkles className="w-5 h-5 text-slate-600" />
            {step === "signup" && "Unlock Your Style Potential!"}
            {step === "confirmation" && "Check Your Email"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "signup" &&
              `You've used ${promptCount}/7 free prompts. Sign up to continue your style journey!`}
            {step === "confirmation" &&
              "We've sent you a confirmation email. Click the link to activate your account and choose your plan."}
          </DialogDescription>
        </DialogHeader>

        {step === "signup" ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating Account..." : "Sign Up & Continue"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">{confirmationMessage}</p>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                Didn't receive the email? Check your spam folder or contact
                support.
              </p>
              <p className="mt-2">
                After confirming your email, you'll be redirected to choose your
                plan.
              </p>
            </div>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
