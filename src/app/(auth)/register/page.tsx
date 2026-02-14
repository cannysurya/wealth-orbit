"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            if (response.ok) {
                toast.success("Account created! Please login.");
                router.push("/login"); // Redirect to login page
            } else {
                const data = await response.json();
                toast.error(data.error || "Registration failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="glass-card w-full max-w-md p-8 rounded-xl border border-white/10">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">WealthOrbit</h1>
                    <p className="text-muted-foreground mt-2">Create your account.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="mt-1"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Sign Up"}
                    </Button>
                </form>

                <div className="mt-4 text-center text-sm">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <Link href="/login" className="text-primary hover:underline">Login</Link>
                </div>
            </div>
        </div>
    );
}
