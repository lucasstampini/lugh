"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
import { uploadAvatar } from "@/app/onboarding/actions";
import { FieldError } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/initials";

export function AvatarUpload({
  initialUrl,
  name,
  size = 64,
  rounded = "rounded-full",
  children,
  secondaryLabel,
  onUploaded,
  help = "Opcional. JPG, PNG ou WEBP de até 4 MB.",
}: {
  initialUrl: string | null;
  name: string;
  // Tamanho em px. O avatar padrão é circular.
  size?: number;
  rounded?: string;
  // Conteúdo ao lado do avatar, acima do botão de enviar (rótulo ou título).
  children?: ReactNode;
  // Texto do botão de enviar ao lado do avatar. Sem isso, fica só o ícone
  // de câmera sobre a foto.
  secondaryLabel?: string;
  // Avisa quem usa o componente quando a foto nova foi salva (para prévias).
  onUploaded?: (url: string | null) => void;
  // Texto de ajuda abaixo do botão.
  help?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.set("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.error) {
        setError(result.error);
        setPreview(null);
        return;
      }
      setUrl(result.url ?? null);
      onUploaded?.(result.url ?? null);
      setPreview(null);
    });
  }

  const shownUrl = preview ?? url;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {shownUrl ? (
          <Image
            src={shownUrl}
            alt=""
            width={size}
            height={size}
            unoptimized
            className={`edge size-full object-cover ${rounded}`}
          />
        ) : (
          <div
            className={`edge bg-accent flex size-full items-center justify-center font-mono font-bold ${rounded}`}
            style={{ fontSize: size * 0.3 }}
          >
            {initials(name || "?")}
          </div>
        )}

        {secondaryLabel ? null : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            aria-label="Trocar foto de perfil"
            className="edge bg-primary text-ink absolute -right-2 -bottom-2 flex size-11 items-center justify-center rounded-full disabled:opacity-60"
          >
            <Camera aria-hidden="true" size={16} />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        {children}
        {secondaryLabel ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="rounded-[10px] px-4"
          >
            {pending ? "Enviando..." : secondaryLabel}
          </Button>
        ) : null}
        {error ? (
          <FieldError message={error} />
        ) : (
          <p className="text-muted-foreground text-[13px]">{help}</p>
        )}
      </div>
    </div>
  );
}
