import { OptionRow } from "../wizard-parts";

// Não existe coluna de preferência no banco ainda: as opções são só visuais
// e não ficam salvas.
export function PreferenceToggles() {
  return (
    <>
      <OptionRow type="checkbox" name="lembrete" defaultChecked>
        Receber lembrete por e-mail antes da sessão
      </OptionRow>
      <OptionRow type="checkbox" name="github">
        Mostrar meu GitHub para o entrevistador
      </OptionRow>
      <p className="text-muted-foreground font-mono text-xs">
        preferências ainda não são salvas
      </p>
    </>
  );
}
