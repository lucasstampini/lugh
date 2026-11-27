import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useState } from "react";

// O Excalidraw entrega a API antes de terminar de montar a cena: a inicialização é assíncrona e,
// no fim, troca todos os elementos pelo `initialData`. Quem mexe na cena antes disso tem o
// trabalho desfeito, então a espera é até `isLoading` virar false.
export function useSceneReady(api: ExcalidrawImperativeAPI | null): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!api) return;
    return api.onChange((_elements, appState) => {
      if (!appState.isLoading) setLoaded(true);
    });
  }, [api]);

  // Se a cena já terminou de carregar antes de nos inscrevermos, o onChange não avisa de novo.
  return Boolean(api) && (loaded || !api?.getAppState().isLoading);
}
