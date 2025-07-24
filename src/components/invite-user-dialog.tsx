"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Mail, AlertCircle, CheckCircle, Info } from "lucide-react";

interface InviteUserDialogProps {
  trigger?: React.ReactNode;
}

export function InviteUserDialog({ trigger }: InviteUserDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
    details?: any;
  } | null>(null);
  const [existingUser, setExistingUser] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const checkUserExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes("@")) return;

    setIsCheckingUser(true);
    setExistingUser(null);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/invite-user?email=${encodeURIComponent(emailToCheck)}`,
      );
      const data = await response.json();

      if (response.ok) {
        if (data.exists) {
          setExistingUser(data.user);
          setMessage({
            type: "info",
            text: `User with email ${emailToCheck} already exists`,
            details: data.user,
          });
        } else {
          setMessage({
            type: "success",
            text: "Email is available for invitation",
          });
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to check user existence",
        });
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setMessage({
        type: "error",
        text: "Failed to check if user exists",
      });
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Debounce the user check
    const timeoutId = setTimeout(() => {
      if (newEmail && newEmail.includes("@")) {
        checkUserExists(newEmail);
      } else {
        setMessage(null);
        setExistingUser(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleInvite = async () => {
    if (!email || !email.includes("@")) {
      setMessage({
        type: "error",
        text: "Please enter a valid email address",
      });
      return;
    }

    if (existingUser) {
      setMessage({
        type: "error",
        text: "Cannot invite user - email already registered",
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/invite-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          redirectTo: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: data.message || "Invitation sent successfully!",
          details: data.invitedUser,
        });
        setEmail("");
        setExistingUser(null);

        // Close dialog after successful invitation
        setTimeout(() => {
          setOpen(false);
          setMessage(null);
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: data.message || data.error || "Failed to send invitation",
          details: data.details,
        });
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      setMessage({
        type: "error",
        text: "Failed to send invitation. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <UserPlus size={16} />
            Invite User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={20} />
            Invite New User
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to a new user. They'll receive a link to
            join your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
            />
            {isCheckingUser && (
              <p className="text-sm text-gray-500">
                Checking if user exists...
              </p>
            )}
          </div>

          {/* User Status Display */}
          {existingUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-blue-600" />
                <span className="font-medium text-blue-900">
                  User Already Exists
                </span>
              </div>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <strong>Email:</strong> {existingUser.email}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {formatDate(existingUser.created_at)}
                </p>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <Badge
                    variant={
                      existingUser.email_confirmed_at ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {existingUser.email_confirmed_at
                      ? "Verified"
                      : "Pending Verification"}
                  </Badge>
                </div>
                {existingUser.last_sign_in_at && (
                  <p>
                    <strong>Last Sign In:</strong>{" "}
                    {formatDate(existingUser.last_sign_in_at)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <Alert
              className={`${
                message.type === "success"
                  ? "border-green-200 bg-green-50"
                  : message.type === "error"
                    ? "border-red-200 bg-red-50"
                    : "border-blue-200 bg-blue-50"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : message.type === "error" ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Info className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription
                className={`${
                  message.type === "success"
                    ? "text-green-800"
                    : message.type === "error"
                      ? "text-red-800"
                      : "text-blue-800"
                }`}
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={isLoading || !email || !!existingUser || isCheckingUser}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
