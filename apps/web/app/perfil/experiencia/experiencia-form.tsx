import Link from "next/link";
import { ChoicePill, Field, LABEL_CLASS } from "@/components/form-field";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NotSavedNote, OptionRow, WizardFooter } from "../wizard-parts";

const LANGUAGES = ["Python", "JavaScript", "Java", "TypeScript", "C#", "Go", "SQL"];

// Etapa 3 é só visual por enquanto: linguagens, histórico de entrevistas e
// projetos não têm coluna no banco ainda. "Continuar" só navega pra próxima.
export function ExperienciaForm() {
  return (
    <div className="flex flex-col gap-6">
      <NotSavedNote />

      <fieldset>
        <legend className={`${LABEL_CLASS} mb-2`}>Linguagens que você usa</legend>
        <div className="flex flex-wrap gap-2 font-mono">
          {LANGUAGES.map((language) => (
            <ChoicePill key={language} name="linguagens" value={language}>
              {language}
            </ChoicePill>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${LABEL_CLASS} mb-2`}>Você já fez entrevista técnica?</legend>
        <OptionRow type="radio" name="entrevistas" defaultChecked>
          Nunca fiz
        </OptionRow>
        <OptionRow type="radio" name="entrevistas">
          Fiz uma ou duas
        </OptionRow>
        <OptionRow type="radio" name="entrevistas">
          Já fiz várias
        </OptionRow>
      </fieldset>

      <Field
        label="Projetos, estágios ou trabalhos"
        htmlFor="projetos"
        help="O entrevistador pode usar isso para escolher as perguntas."
      >
        <Textarea id="projetos" name="projetos" rows={4} />
      </Field>

      <WizardFooter backHref="/perfil/objetivo">
        <Link href="/perfil/revisar" className={buttonVariants({ size: "lg" })}>
          Continuar
        </Link>
      </WizardFooter>
    </div>
  );
}
