"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type Props = {
  sessionId: string;
  otherParticipantName: string;
  // Chamado depois que o servidor confirmou o encerramento.
  onEnded: () => void;
};

// "Encerrar sessão": só o entrevistador vê. Fecha a sala para os dois e não tem volta,
// por isso pede confirmação (DESIGN.md) e fica longe dos controles de mic e câmera.
export function EndSessionButton({ sessionId, otherParticipantName, onEnded }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function endSession() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
      if (!response.ok) {
        const body: { error?: string } = await response.json().catch(() => ({}));
        setError(body.error ?? "Não deu para encerrar a sessão. Tente de novo.");
        return;
      }
      setOpen(false);
      onEnded();
    } catch {
      setError("Falha de rede ao encerrar a sessão. Tente de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Não fecha no meio do pedido: o resultado ainda vai chegar.
        if (pending) return;
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        Encerrar sessão
      </AlertDialogTrigger>
      {/* `dark`: o diálogo é renderizado fora da árvore da sala (portal), então precisa
          repetir a classe para usar a paleta escura. */}
      <AlertDialogContent className="dark">
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar a sessão?</AlertDialogTitle>
          <AlertDialogDescription>
            A sala fecha para você e para {otherParticipantName}, e não dá para voltar. O código
            e o quadro ficam salvos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm font-semibold">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Continuar na sala</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={endSession}>
            {pending ? "Encerrando..." : "Encerrar sessão"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
