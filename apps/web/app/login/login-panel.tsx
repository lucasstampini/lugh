"use client";

import { CircleAlert, Mail } from "lucide-react";
import { useState } from "react";
import { Eyebrow } from "@/components/eyebrow";
import { GoogleLoginButton } from "./google-login-button";
import { MagicLinkForm } from "./magic-link-form";

const H1 =
  "font-heading text-[clamp(30px,3.2vw,40px)] leading-[1.08] font-extrabold tracking-[-0.02em]";

// Troca o painel inteiro entre "entrar" e "confira seu e-mail". O envio do
// link continua no MagicLinkForm, que avisa aqui quando o e-mail saiu.
export function LoginPanel({
  next,
  callbackError,
}: {
  next?: string;
  callbackError: { title: string; body: string } | null;
}) {
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (sentTo) {
    return (
      <>
        <div className="edge bg-primary text-ink flex size-14 items-center justify-center self-start rounded-[14px]">
          <Mail aria-hidden="true" size={26} />
        </div>
        <div className="flex flex-col gap-2">
          <Eyebrow>link enviado</Eyebrow>
          <h1 role="status" className={H1}>
            Confira seu e-mail
          </h1>
          <p className="text-muted-foreground">
            Enviamos um link de acesso para{" "}
            <strong className="text-foreground break-all">{sentTo}</strong>. Abra o e-mail e
            clique no link para entrar. Se não achar, olhe a caixa de spam.
          </p>
        </div>
        <MagicLinkForm next={next} sentTo={sentTo} onSentChange={setSentTo} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <Eyebrow>entrar</Eyebrow>
        <h1 className={H1}>Entre na sua conta</h1>
        <p className="text-muted-foreground">
          Sem senha. Use o Google ou receba um link de acesso por e-mail.
        </p>
      </div>

      {callbackError ? (
        <div
          role="alert"
          className="edge bg-destructive-soft flex items-start gap-3 rounded-xl px-3.5 py-3"
        >
          <CircleAlert
            aria-hidden="true"
            size={20}
            strokeWidth={2.4}
            className="text-destructive mt-0.5 shrink-0"
          />
          <div>
            <p className="font-extrabold">{callbackError.title}</p>
            <p className="text-muted-foreground text-sm">{callbackError.body}</p>
          </div>
        </div>
      ) : null}

      <GoogleLoginButton next={next} />

      <div className="text-muted-foreground flex items-center gap-3 font-mono text-xs">
        <span className="border-border-dashed flex-1 border-t-[1.5px] border-dashed" />
        ou
        <span className="border-border-dashed flex-1 border-t-[1.5px] border-dashed" />
      </div>

      <MagicLinkForm next={next} sentTo={null} onSentChange={setSentTo} />
    </>
  );
}
