"use server";

import { redirect } from "next/navigation";
import { profileStep1Schema } from "@/lib/profile-step1-schema";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileStep1(
  _prevState: { error: string | null } | null,
  formData: FormData,
) {
  const parsed = profileStep1Schema.safeParse({
    name: formData.get("name"),
    preferredName: formData.get("preferredName") ?? "",
    bio: formData.get("bio") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      preferred_name: parsed.data.preferredName,
      bio: parsed.data.bio,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Não deu para salvar agora. Tente de novo." };
  }

  redirect("/entrevistadores");
}
