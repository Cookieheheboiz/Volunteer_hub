"use client";

import type React from "react";
import { useState } from "react";
import { Mail, Lock, User, UserCircle, AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import type { Role } from "@/src/lib/types";

interface SignupFormProps {
  onSignup: (
    name: string,
    email: string,
    password: string,
    role: Role
  ) => Promise<void>;
  onSwitchToLogin: () => void;
}

export function SignupForm({ onSignup, onSwitchToLogin }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("VOLUNTEER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onSignup(name, email, password, role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Join VolunteerHub and make a difference
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>I want to join as</Label>
            <RadioGroup
              value={role}
              onValueChange={(value) => setRole(value as Role)}
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VOLUNTEER" id="volunteer" />
                <Label
                  htmlFor="volunteer"
                  className="font-normal cursor-pointer"
                >
                  Volunteer - Join and participate in events
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EVENT_MANAGER" id="manager" />
                <Label htmlFor="manager" className="font-normal cursor-pointer">
                  Event Manager - Create and manage volunteer events
                </Label>
              </div>
            </RadioGroup>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Creating account...
              </>
            ) : (
              <>
                <UserCircle className="mr-2 h-4 w-4" />
                Create Account
              </>
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-primary underline-offset-4 hover:underline font-medium"
            disabled={isLoading}
          >
            Sign in
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
