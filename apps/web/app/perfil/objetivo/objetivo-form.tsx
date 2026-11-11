import Link from "next/link";
import { ChoicePill, Field, LABEL_CLASS, SELECT_CLASS } from "@/components/form-field";
import { buttonVariants } from "@/components/ui/button";
import { AREA_OPTIONS } from "@/lib/interviewer-options";
import { NotSavedNote, OptionRow, WizardFooter } from "../wizard-parts";

// Etapa 2 é só visual por enquanto: não existe coluna no banco pra tipo de
// vaga, área de interesse ou prazo. "Continuar" só navega pra próxima etapa.
export function ObjetivoForm() {
  return (
    <div className="flex flex-col gap-6">
      <NotSavedNote />

      <fieldset className="flex flex-col gap-2">
        <legend className={`${LABEL_CLASS} mb-2`}>Que vaga você busca?</legend>
        <OptionRow type="radio" name="vaga">
          Estágio
        </OptionRow>
        <OptionRow type="radio" name="vaga" defaultChecked>
          Primeira vaga júnior
        </OptionRow>
      </fieldset>

      <fieldset>
        <legend className={`${LABEL_CLASS} mb-2`}>Em que área?</legend>
        <div className="flex flex-wrap gap-2">
          {AREA_OPTIONS.map((option, index) => (
            <ChoicePill
              key={option.value}
              name="area"
              value={option.value}
              defaultChecked={index === 0}
            >
              {option.label}
            </ChoicePill>
          ))}
        </div>
      </fieldset>

      <Field label="Quando são suas entrevistas?" htmlFor="quando" className="max-w-[420px]">
        <select id="quando" name="quando" className={SELECT_CLASS}>
          <option>Estou em processo seletivo agora</option>
          <option>Nos próximos três meses</option>
          <option>Ainda não tenho data</option>
        </select>
      </Field>

      <WizardFooter backHref="/perfil">
        <Link href="/perfil/experiencia" className={buttonVariants({ size: "lg" })}>
          Continuar
        </Link>
      </WizardFooter>
    </div>
  );
}
