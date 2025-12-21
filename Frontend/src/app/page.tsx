"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/src/components/auth/login-form";
import { SignupForm } from "@/src/components/auth/signup-form";
import { authApi } from "@/src/lib/api";
import type { Role } from "@/src/lib/types";
import { Heart } from "lucide-react";
import { useToast } from "@/src/hooks/use-toast";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();
  const [showLogin, setShowLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = authApi.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const user = await authApi.getMe();
        if (user) {
          navigateByRole(user.role);
        }
      } catch (error) {
        // Not logged in or invalid token, stay on landing page
        console.error("Auth check failed:", error);
        authApi.removeToken();
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const navigateByRole = (role: Role) => {
    switch (role) {
      case "VOLUNTEER":
        router.push("/volunteer/dashboard");
        break;
      case "EVENT_MANAGER":
        router.push("/manager/dashboard");
        break;
      case "ADMIN":
        router.push("/admin/dashboard");
        break;
      default:
        router.push("/");
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      authApi.saveToken(response.token);

      toast({
        title: "Login Successful",
        description: `Welcome ${response.user.name}!`,
      });

      navigateByRole(response.user.role);
    } catch (error: any) {
      throw error;
    }
  };

  const handleSignup = async (
    name: string,
    email: string,
    password: string,
    role: Role
  ) => {
    try {
      await authApi.register(name, email, password, role);
      const loginResponse = await authApi.login(email, password);
      authApi.saveToken(loginResponse.token);

      toast({
        title: "Registration Successful",
        description: `Welcome ${name} to VolunteerHub!`,
      });

      navigateByRole(role);
    } catch (error: any) {
      throw error;
    }
  };

  const handleGoogleLogin = async (token: string, role?: Role) => {
    try {
      const response = await authApi.googleLogin(token, role);
      authApi.saveToken(response.token);

      toast({
        title: "Login Successful",
        description: `Welcome ${response.user.name}!`,
      });

      navigateByRole(response.user.role);
    } catch (error: any) {
      toast({
        title: "Google Login Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-8">
        <Heart className="h-10 w-10 text-emerald-600" />
        <h1 className="text-3xl font-bold text-emerald-900">VolunteerHub</h1>
      </div>
      {showLogin ? (
        <LoginForm
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          onSwitchToSignup={() => setShowLogin(false)}
        />
      ) : (
        <SignupForm
          onSignup={handleSignup}
          onGoogleLogin={handleGoogleLogin}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      )}
    </div>
  );
}
