import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../supabase/server";
import {
  InfoIcon,
  UserCircle,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Welcome Header */}
          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome back,{" "}
                {user.user_metadata?.full_name || user.email?.split("@")[0]}!
              </h1>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800"
              >
                <CheckCircle size={14} className="mr-1" />
                Active Subscriber
              </Badge>
            </div>
            <p className="text-gray-600">
              Here's your account overview and recent activity.
            </p>
          </header>

          {/* User Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserCircle size={20} className="text-blue-600" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-gray-900">
                    {user.user_metadata?.full_name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail size={14} />
                    {user.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-xs text-gray-600 font-mono">{user.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Account Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield size={20} className="text-green-600" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      user.email_confirmed_at ? "default" : "destructive"
                    }
                  >
                    {user.email_confirmed_at
                      ? "Email Verified"
                      : "Email Pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <p className="text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <p className="text-gray-900 capitalize">
                    {user.app_metadata?.provider}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar size={20} className="text-purple-600" />
                  Account Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Account Created
                  </p>
                  <p className="text-gray-900 text-sm">
                    {formatDate(user.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Last Sign In
                  </p>
                  <p className="text-gray-900 text-sm">
                    {formatDate(user.last_sign_in_at!)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Email Confirmed
                  </p>
                  <p className="text-gray-900 text-sm">
                    {user.email_confirmed_at
                      ? formatDate(user.email_confirmed_at)
                      : "Not confirmed"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <InfoIcon size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Urban Stylist AI
                  </span>
                </div>
                <p className="text-blue-800 text-sm mb-3">
                  You now have access to our AI-powered fashion assistant!
                  Generate trendy outfit ideas and discover affordable
                  alternatives.
                </p>
                <div className="flex gap-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    Start Styling
                  </button>
                  <button className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors">
                    View Features
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Debug Info (Collapsible) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <details className="cursor-pointer">
                <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  View Raw User Data
                </summary>
                <div className="bg-gray-100 rounded-lg p-4 mt-3 overflow-hidden">
                  <pre className="text-xs font-mono max-h-48 overflow-auto text-gray-700">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      </main>
    </SubscriptionCheck>
  );
}
