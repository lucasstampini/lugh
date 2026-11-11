"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
import { uploadAvatar } from "@/app/onboarding/actions";
import { initials } from "@/lib/initials";

export function AvatarUpload({
  initialUrl,
  name,
  size = 64,
  rounded = "rounded-full",
  children,
  secondaryLabel,
}: {
  initialUrl: string | null;
  name: string;
  // Tamanho em px. Avatar padrão é circular; o do Figma node 47:2 usa
  // rounded-[20px] em vez de círculo.
  size?: number;
  rounded?: string;
  // Conteúdo entre o avatar e o botão "Adicionar foto" (título/descrição).
  children?: ReactNode;
  // Botão de texto extra, do lado do avatar, além do ícone de câmera (Figma
  // node 47:2, "Adicionar foto"). Sem isso, mantém só o ícone.
  secondaryLabel?: string;
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
      setPreview(null);
    });
  }

  const shownUrl = preview ?? url;

  return (
    <div className="flex items-center gap-[18px]">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {shownUrl ? (
          <Image
            src={shownUrl}
            alt=""
            width={size}
            height={size}
            unoptimized
            className={`size-full object-cover ${rounded}`}
          />
        ) : (
          <div
            className={`bg-secondary text-primary font-heading flex size-full items-center justify-center font-extrabold ${rounded}`}
            style={{ fontSize: size * 0.36 }}
          >
            {initials(name || "?")}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          aria-label="Trocar foto de perfil"
          className="bg-primary text-primary-foreground absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full disabled:opacity-60"
        >
          <Camera aria-hidden="true" size={13} />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="sr-only"
        />

        {error ? (
          <p className="text-destructive absolute top-full mt-2 w-40 text-center text-xs">
            {error}
          </p>
        ) : null}
      </div>

      {children}

      {secondaryLabel ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="border-primary text-primary bg-card ml-auto flex h-11 shrink-0 items-center rounded-md border px-3.5 text-sm font-bold disabled:opacity-60"
        >
          {pending ? "Enviando..." : secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
