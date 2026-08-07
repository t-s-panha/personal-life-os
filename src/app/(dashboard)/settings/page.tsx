"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings, User, Bell, Shield, Moon, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    bio: "",
    timezone: "UTC",
    sleepTarget: "8.0",
    theme: "system",
    emailNotifications: true,
    reminderTime: "09:00",
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setForm({
          displayName: data.profile?.displayName || data.name || "",
          email: data.email || "",
          bio: data.profile?.bio || "",
          timezone: data.profile?.timezone || "UTC",
          sleepTarget: data.profile?.sleepTarget?.toString() || "8.0",
          theme: data.settings?.theme || "system",
          emailNotifications: data.settings?.emailNotifications ?? true,
          reminderTime: data.settings?.reminderTime || "09:00",
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sleepTarget: parseFloat(form.sleepTarget) || 8.0,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        fetchSettings();
      }
    } catch (err) {
      console.error("Save settings failed", err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences, goals targets, and notification settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Profile & Account
            </CardTitle>
            <CardDescription>Personal details displayed across your Life OS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Display Name</label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  value={form.email}
                  disabled
                  className="mt-1 bg-muted text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Bio / Motto</label>
              <Input
                placeholder="Geospatial analyst & lifelong learner..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-500" /> Preferences & Targets
            </CardTitle>
            <CardDescription>Customize target schedules and UI themes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Theme</label>
                <Select
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  className="mt-1"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Timezone</label>
                <Input
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Daily Sleep Target (hrs)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.sleepTarget}
                  onChange={(e) => setForm({ ...form, sleepTarget: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Backup & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" /> Data Backup & Privacy
            </CardTitle>
            <CardDescription>Export personal records or restore from JSON backup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open("/api/settings/export", "_blank")}
                className="text-xs flex items-center gap-1.5"
              >
                <span>Export Full Backup (JSON)</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open("/api/settings/export?format=csv&module=tasks", "_blank")}
                className="text-xs flex items-center gap-1.5"
              >
                <span>Export Tasks (CSV)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
            </span>
          ) : (
            <span />
          )}

          <Button type="submit" className="flex items-center gap-2">
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
