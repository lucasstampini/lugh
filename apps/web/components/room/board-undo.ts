import type * as Y from "yjs";

// Desfazer/refazer do quadro colaborativo (fase 1, bullet 5).
//
// O histórico nativo do Excalidraw não sabe o que veio do outro participante: Ctrl+Z
// poderia apagar o desenho do outro. Por isso o desfazer passa a ser do Yjs: um
// Y.UndoManager que só rastreia as transações do nosso binding (as nossas ações).
//
// O y-excalidraw tem isso pronto (`undoConfig`), mas procura os botões por
// aria-label="Undo"/"Redo", que com a interface em português viram "Desfazer"/"Refazer";
// ele não acha os botões e quebra. Aqui usamos as classes dos contêineres, que não
// dependem do idioma, e delegação de eventos (funciona mesmo se o Excalidraw recriar os botões).

const UNDO_BUTTON = ".undo-button-container";
const REDO_BUTTON = ".redo-button-container";

export function attachBoardUndo(container: HTMLElement, undoManager: Y.UndoManager): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    // Editando o texto de uma caixa do quadro: o Ctrl+Z é do campo de texto.
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
    if (!(event.ctrlKey || event.metaKey)) return;

    const key = event.key.toLowerCase();
    const isRedo = (key === "z" && event.shiftKey) || key === "y";
    const isUndo = key === "z" && !event.shiftKey;
    if (!isRedo && !isUndo) return;

    event.preventDefault();
    event.stopPropagation();
    if (isRedo) undoManager.redo();
    else undoManager.undo();
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const isUndo = target?.closest(UNDO_BUTTON);
    const isRedo = target?.closest(REDO_BUTTON);
    if (!isUndo && !isRedo) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (isRedo) undoManager.redo();
    else undoManager.undo();
  };

  // Fase de captura: chegamos antes dos handlers do próprio Excalidraw.
  container.addEventListener("keydown", onKeyDown, { capture: true });
  container.addEventListener("click", onClick, { capture: true });
  return () => {
    container.removeEventListener("keydown", onKeyDown, { capture: true });
    container.removeEventListener("click", onClick, { capture: true });
  };
}
