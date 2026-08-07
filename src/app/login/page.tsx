import { createClient } from "@/lib/supabase/server";
import { isGoogleOAuthEnabled } from "@/lib/settings";
import LoginForm from "@/components/login-form";

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const googleOAuthEnabled = await isGoogleOAuthEnabled(supabase);

  return (
    <LoginForm
      googleOAuthEnabled={googleOAuthEnabled}
      loginError={searchParams.error}
    />
  );
}
