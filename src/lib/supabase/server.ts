import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // chiamato da un Server Component: il middleware rinfresca la sessione
          }
        },
      },
    }
  );
}

/** Utente corrente + profilo (null se non autenticato). */
export async function getSessionProfile() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("[getSessionProfile] User:", user?.id || "no user");

    if (!user) return { supabase, user: null, profile: null };

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("[getSessionProfile] Profile error:", error?.message || "none");
    console.log("[getSessionProfile] Profile role:", profile?.role || "none");

    if (error) {
      console.error("Error fetching profile:", error);
      return { supabase, user, profile: null };
    }

    return { supabase, user, profile };
  } catch (e: any) {
    console.error("[getSessionProfile] Caught exception:", e);
    throw e;
  }
}
