import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Log in",
  description: "Sign in to your SafeSphere AI workspace.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
