"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { candidateProfileSchema } from "@/lib/candidate-profile-schema";
import { profileStep1Schema } from "@/lib/profile-step1-schema";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(
  _prevState: { error: string | null; success: boolean } | null,
  formData: FormData,
) {
  const parsed = candidateProfileSchema.safeParse({
    name: formData.get("name"),
    preferredName: formData.get("preferredName") ?? "",
    experienceYears: formData.get("experienceYears") ?? "",
    areas: formData.getAll("areas"),
    targetRole: formData.get("targetRole") ?? "",
    bio: formData.get("bio") ?? "",
    linkedin: formData.get("linkedin") ?? "",
    github: formData.get("github") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false };
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
      experience_years: parsed.data.experienceYears,
      areas: parsed.data.areas.length > 0 ? parsed.data.areas : null,
      target_role: parsed.data.targetRole,
      bio: parsed.data.bio,
      linkedin_url: parsed.data.linkedin,
      github_url: parsed.data.github,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Não deu para salvar agora. Tente de novo.", success: false };
  }

  revalidatePath("/perfil");
  return { error: null, success: true };
}

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
