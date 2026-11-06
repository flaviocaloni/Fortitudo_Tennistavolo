import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/supabase/server";
import { getFaqForRole } from "@/lib/faq";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  agonista: "Agonista",
  amatore: "Amatore",
};

export default async function FaqPage() {
  const { profile } = await getSessionProfile();
  if (!profile) redirect("/login");

  const items = getFaqForRole(profile.role);
  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">❓ FAQ</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">
        Risposte alle domande più frequenti, in base al tuo profilo ({ROLE_LABEL[profile.role] ?? profile.role}).
      </p>

      {categories.map((category) => (
        <section key={category} className="mb-6">
          <h2 className="mb-2 font-semibold text-navy-800">{category}</h2>
          <div className="flex flex-col gap-2">
            {items
              .filter((item) => item.category === category)
              .map((item) => (
                <details key={item.id} className="card group">
                  <summary className="cursor-pointer list-none font-medium text-slate-800 marker:hidden">
                    {item.question}
                  </summary>
                  <p className="mt-2 text-sm text-slate-600">{item.answer}</p>
                </details>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
