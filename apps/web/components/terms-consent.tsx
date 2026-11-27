import Link from "next/link";

import { TERMS_FIELD } from "@/lib/legal";

const LINK = "text-brand-deep font-bold underline underline-offset-2";

// Aceite dos Termos e da Política no onboarding. Os links abrem em outra aba para
// não perder o que já foi preenchido no formulário.
export function TermsConsent() {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={TERMS_FIELD}
        required
        className="accent-brand-deep mt-0.5 size-5 shrink-0 cursor-pointer"
      />
      <span>
        Li e aceito os{" "}
        <Link href="/termos" target="_blank" rel="noopener" className={LINK}>
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" target="_blank" rel="noopener" className={LINK}>
          Política de Privacidade
        </Link>
        .
      </span>
    </label>
  );
}
