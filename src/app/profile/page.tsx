"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, AtSign, Save } from "lucide-react";
import { SnakeLoader } from "@/components/ui/snake-loader";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<{
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  }>({
    username: null,
    full_name: null,
    avatar_url: null,
  });

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, full_name, avatar_url`)
        .eq("id", user?.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile({
          username: data.username,
          full_name: data.full_name,
          avatar_url: data.avatar_url,
        });
      }
    } catch (error) {
      console.log("Error loading user data!", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setUpdating(true);

      const updates = {
        id: user?.id,
        username: profile.username,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;
      
      // Dispatch custom event to notify navbar of profile update
      window.dispatchEvent(new Event('profile-updated'));
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <SnakeLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-bold">Please log in to view your profile</h1>
        <Button onClick={() => window.location.href = "/"}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-24 px-4 sm:px-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Update your personal information and profile picture.
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-border/50 pb-8">
            <AvatarUpload
              url={profile.avatar_url}
              onUpload={(url) => setProfile({ ...profile, avatar_url: url })}
            />
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 opacity-70" /> Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted/50 border-border/50"
              />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-2">
                <User className="w-4 h-4 opacity-70" /> Full Name
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <AtSign className="w-4 h-4 opacity-70" /> Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a unique username"
                value={profile.username || ""}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>

            <Button 
              className="w-full mt-4 h-12 text-base font-semibold shadow-lg shadow-primary/20"
              onClick={updateProfile}
              disabled={updating}
            >
              {updating ? (
                <SnakeLoader size="sm" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
