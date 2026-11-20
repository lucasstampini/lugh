import type { Metadata } from "next";
import { notFound } from "next/navigation";

// /preview é a bancada de desenho: explorações de tela sem sessão e com paleta
// própria. Continua aberta no desenvolvimento local e nos previews da Vercel,
// mas não existe no site de produção nem entra em buscador.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PreviewLayout({ children }: LayoutProps<"/preview">) {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return children;
}
