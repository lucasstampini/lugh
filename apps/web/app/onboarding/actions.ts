"use server";

import { redirect } from "next/navigation";
import { candidateQuizSchema } from "@/lib/candidate-preferences";
import { candidateProfileSchema } from "@/lib/candidate-profile-schema";
import { hasAcceptedTermsField, TERMS_REQUIRED_MESSAGE } from "@/lib/legal";
import { createClient } from "@/lib/supabase/server";
import { interviewerFormSchema } from "./entrevistador/schema";

const POSTGRES_UNIQUE_VIOLATION = "23505";

const SAVE_ERROR = "Não deu para salvar agora. Tente de novo.";

// Quem ainda não aceitou os Termos e a Política só passa com o checkbox marcado: a
// conferência é aqui no servidor, o `required` do formulário é só conveniência. O aceite
// é gravado pela função accept_terms, com o horário do banco. Devolve a mensagem de erro,
// ou null quando o aceite já existia ou acabou de ser registrado.
async function ensureTermsAccepted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  formData: FormData,
): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", userId)
    .single();

  if (error) return SAVE_ERROR;
  if (profile.terms_accepted_at) return null;
  if (!hasAcceptedTermsField(formData)) return TERMS_REQUIRED_MESSAGE;

  const { error: acceptError } = await supabase.rpc("accept_terms");
  return acceptError ? SAVE_ERROR : null;
}

// O mesmo limite vale no bucket (migration avatar_storage) e no
// serverActions.bodySizeLimit do next.config.ts.
const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Escolha uma imagem." };
  }

  const extension = AVATAR_EXTENSIONS[file.type];
  if (!extension) {
    return { error: "Use uma imagem JPG, PNG ou WEBP." };
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: "A imagem precisa ter até 4 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const path = `${user.id}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: "Não deu para enviar a imagem agora. Tente de novo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);
  // Sem isso, trocar a foto duas vezes mostrava a mesma imagem em cache
  // (a URL pública não muda, só o conteúdo do arquivo).
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Não deu para salvar a foto agora. Tente de novo." };
  }

  return { url };
}

// Fim do questionário do candidato: grava o papel, o nome e as respostas, e leva para os
// entrevistadores com melhor match. Pergunta pulada vira null (não apaga nada além dela).
export async function saveCandidateQuiz(
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const parsed = candidateQuizSchema.safeParse({
    name: formData.get("name"),
    areas: formData.getAll("areas"),
    interviewTypes: formData.getAll("interviewTypes"),
    urgency: formData.get("urgency") ?? "",
    careerStage: formData.get("careerStage") ?? "",
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

  const termsError = await ensureTermsAccepted(supabase, user.id, formData);
  if (termsError) {
    return { error: termsError };
  }

  const { areas, interviewTypes } = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      role: "candidate",
      name: parsed.data.name,
      areas: areas.length > 0 ? areas : null,
      interview_types: interviewTypes.length > 0 ? interviewTypes : null,
      training_urgency: parsed.data.urgency,
      career_stage: parsed.data.careerStage,
    })
    .eq("id", user.id);

  if (error) {
    return { error: SAVE_ERROR };
  }

  redirect("/onboarding/candidato/matches");
}

export async function confirmCandidate(
  _prevState: { error?: string } | null,
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
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const termsError = await ensureTermsAccepted(supabase, user.id, formData);
  if (termsError) {
    return { error: termsError };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      role: "candidate",
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
    return { error: "Não deu para salvar agora. Tente de novo." };
  }

  redirect("/entrevistadores");
}

export async function createInterviewerProfile(
  _prevState: { error?: string; fieldErrors?: Record<string, string> } | null,
  formData: FormData,
) {
  const parsed = interviewerFormSchema.safeParse({
    headline: formData.get("headline"),
    company: formData.get("company"),
    seniority: formData.get("seniority"),
    areas: formData.getAll("areas"),
    price: formData.get("price"),
    bio: formData.get("bio"),
    linkedin: formData.get("linkedin"),
    github: formData.get("github") ?? "",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const termsError = await ensureTermsAccepted(supabase, user.id, formData);
  if (termsError) {
    return { error: termsError };
  }

  const values = {
    headline: parsed.data.headline,
    company: parsed.data.company,
    seniority: parsed.data.seniority,
    areas: parsed.data.areas,
    price_cents: parsed.data.price,
    bio: parsed.data.bio || null,
    linkedin_url: parsed.data.linkedin,
    github_url: parsed.data.github,
  };

  // Insert ou update explícito em vez de upsert: o "ON CONFLICT DO UPDATE" do
  // upsert reescreve profile_id, e o grant de update em interviewers é por
  // coluna (profile_id e active ficam de fora), então o banco recusaria.
  const { error: insertError } = await supabase
    .from("interviewers")
    .insert({ profile_id: user.id, ...values });

  // 23505 = a linha já existe: é edição do perfil, ou reenvio do formulário
  // (duplo clique, ou o update do role abaixo falhou na tentativa anterior).
  const { error: interviewerError } =
    insertError?.code === POSTGRES_UNIQUE_VIOLATION
      ? await supabase
          .from("interviewers")
          .update(values)
          .eq("profile_id", user.id)
      : { error: insertError };

  if (interviewerError) {
    return { error: "Não deu para salvar agora. Tente de novo." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "interviewer" })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Não deu para salvar agora. Tente de novo." };
  }

  redirect("/painel");
}
