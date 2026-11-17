import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Create an Account",
  description: "Register a new SafeSphere AI workspace.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
