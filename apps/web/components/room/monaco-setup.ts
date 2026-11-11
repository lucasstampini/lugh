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

// Tema do editor (DESIGN.md, seção 8). Os hex ficam aqui porque o Monaco não lê
// variáveis CSS: precisam ser os mesmos valores dos tokens `.dark` do globals.css.
export const LUGH_THEME = "lugh-dark";

monaco.editor.defineTheme(LUGH_THEME, {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.background": "#0C1F17",
    "editor.foreground": "#FFFFFF",
    "editorCursor.foreground": "#FFFFFF",
    "editor.lineHighlightBackground": "#17382A",
    "editorLineNumber.foreground": "#6F8A7B",
    "editorLineNumber.activeForeground": "#A9BDB2",
    "editor.selectionBackground": "#2EF58A40",
    "editorIndentGuide.background1": "#23402F",
  },
});

loader.config({ monaco });

export { monaco };
