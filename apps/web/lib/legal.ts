// Canal de contato citado nos Termos, na Política de Privacidade e nos rodapés.
export const CONTACT_EMAIL = "contato@lughapp.com.br";

// Data da última alteração dos Termos e da Política. Atualizar junto com o texto.
export const LEGAL_UPDATED_AT = "26 de novembro de 2026";

// Nome do campo do aceite nos formulários de onboarding. Checkbox marcado chega como "on".
export const TERMS_FIELD = "acceptTerms";

export const TERMS_REQUIRED_MESSAGE =
  "Para continuar, marque que você leu e aceita os Termos de Uso e a Política de Privacidade.";

export function hasAcceptedTermsField(formData: FormData): boolean {
  return formData.get(TERMS_FIELD) === "on";
}
