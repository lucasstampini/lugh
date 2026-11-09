import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/java/java.contribution.js";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution.js";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution.js";

// Configura o Monaco uma vez, ao carregar o editor (só no navegador).
//
// - Usa o pacote `monaco-editor` instalado em vez da CDN padrão do @monaco-editor/react.
//   O y-monaco importa este mesmo módulo (editor.api); com a CDN haveria duas cópias do
//   Monaco e o binding não reconheceria o editor.
// - Importa só a API do editor e o realce das três linguagens da sala, sem os serviços de
//   linguagem (autocomplete de TypeScript etc.): o bundle fica bem menor e só precisamos
//   do worker básico do editor.
self.MonacoEnvironment = {
  getWorker: () =>
    new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url), { type: "module" }),
};

loader.config({ monaco });

export { monaco };
