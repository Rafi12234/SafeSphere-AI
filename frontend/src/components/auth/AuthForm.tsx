"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { apiClient, ApiError } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";

const authSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type AuthFormData = z.infer<typeof authSchema>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isRegister = mode === "register";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: AuthFormData) {
    setServerError(null);

    if (isRegister) {
      if (!data.displayName || data.displayName.trim().length < 2) {
        setServerError("Display name must be at least 2 characters.");
        return;
      }
      if (data.password.length < 12) {
        setServerError("Password must be at least 12 characters for registration.");
        return;
      }
    }

    try {
      if (isRegister) {
        await apiClient("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            display_name: data.displayName?.trim(),
          }),
        });
      } else {
        await apiClient("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md border border-border shadow-xs">
        <CardHeader className="p-6 sm:p-8 pb-4 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4 mx-auto group">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldAlert className="size-4.5" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
              SafeSphere AI
            </span>
          </Link>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isRegister ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1.5">
            {isRegister
              ? "Start monitoring comment safety on your Facebook Pages."
              : "Sign in to access your safety workspace."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-2">
          {serverError && (
            <div
              role="alert"
              className="mb-5 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive leading-relaxed"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Display Name</label>
                <Input
                  {...register("displayName")}
                  placeholder="Your Name or Team Name"
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email Address</label>
              <Input
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="size-3" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="size-3" /> Show
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder={isRegister ? "Minimum 12 characters" : "••••••••••••"}
                  disabled={isSubmitting}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Strict Button Rule: w-auto, sm/default only */}
            <div className="pt-2 flex flex-col items-start gap-3">
              <Button type="submit" size="default" variant="default" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Please wait...
                  </>
                ) : isRegister ? (
                  "Create account"
                ) : (
                  "Log in"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t text-center text-xs text-muted-foreground">
            {isRegister ? (
              <p>
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Log in
                </Link>
              </p>
            ) : (
              <p>
                New to SafeSphere AI?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create an account
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
