"use client";

import { useActionState } from "react";
import { Field, FormAlert } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerPayoutAccount } from "./actions";

export function PayoutForm() {
  const [state, formAction, pending] = useActionState(registerPayoutAccount, null);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3.5">
      {state?.error ? <FormAlert title="Não deu para cadastrar">{state.error}</FormAlert> : null}

      <div className="flex flex-wrap items-start gap-3">
        <Field
          label="CPF ou CNPJ"
          htmlFor="taxId"
          help="O repasse cai na chave PIX desse documento. Não guardamos o número: ele vai direto para a AbacatePay."
          error={state?.fieldError}
          className="flex-[1_1_260px] md:max-w-[360px]"
        >
          <Input
            id="taxId"
            name="taxId"
            inputMode="numeric"
            autoComplete="off"
            maxLength={18}
            placeholder="000.000.000-00"
            aria-invalid={state?.fieldError ? true : undefined}
            aria-describedby={state?.fieldError ? "taxId-error" : undefined}
            className="font-mono"
          />
        </Field>
        {/* mt = altura do rótulo + gap do Field, para o botão alinhar com o campo. */}
        <Button type="submit" variant="ink" disabled={pending} className="mt-7 h-[50px] px-5">
          {pending ? "Cadastrando..." : "Cadastrar documento"}
        </Button>
      </div>
    </form>
  );
}
