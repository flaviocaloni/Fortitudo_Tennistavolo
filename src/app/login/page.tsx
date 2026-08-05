import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isGoogleOAuthEnabled } from "@/lib/settings";
import LoginForm from "@/components/login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const googleOAuthEnabled = await isGoogleOAuthEnabled(supabase);

  return <LoginForm googleOAuthEnabled={googleOAuthEnabled} />;
}
