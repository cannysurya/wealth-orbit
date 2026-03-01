"use client";

import { useState, useEffect } from "react";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
    const { data: session } = useSession();
    const [apiKey, setApiKey] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Load API key from local storage on mount
        const storedKey = localStorage.getItem("google_gemini_api_key");
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleSaveAiSettings = () => {
        setIsSaving(true);
        localStorage.setItem("google_gemini_api_key", apiKey);
        setTimeout(() => {
            setIsSaving(false);
        }, 500); // give a tiny bit of feedback
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Manage your public profile information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                                <AvatarFallback className="text-lg">{session?.user?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline">Change Avatar</Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input id="name" defaultValue={session?.user?.name || ""} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" defaultValue={session?.user?.email || ""} disabled />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button>Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>Customize your dashboard experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Currency</Label>
                                <p className="text-sm text-muted-foreground">Select your preferred currency for display.</p>
                            </div>
                            <Button variant="outline" disabled>INR (₹)</Button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Dark Mode</Label>
                                <p className="text-sm text-muted-foreground">Toggle application theme.</p>
                            </div>
                            <Button variant="outline">System Default</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Preferences</CardTitle>
                        <CardDescription>Configure settings for the AI Assistant.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Google Gemini API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="AIzaSy..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Your API key is stored securely in your browser&apos;s local storage and is never sent to our servers.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSaveAiSettings} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save AI Settings"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
