<p align="center">
  <img src="assets/lugh-banner.png" alt="Lugh" width="640">
</p>

<p align="center"><strong>Treine. Prove. Entre.</strong></p>

---

## O problema

Nunca tanta gente tentou entrar em tecnologia, e a porta de entrada nunca esteve tão estreita.

| Dado | Fonte |
|---|---|
| **+70,4%** de matrículas em graduações de TIC no Brasil entre 2019 e 2023 | Brasscom [1] |
| **89,7 mil** formados em cursos superiores de tecnologia em 2023, mais 16 mil em cursos técnicos | Brasscom [1] |
| **Menos de 5%** das 1,8 milhão de vagas ofertadas nesses cursos em 2023 terminaram em diploma | Brasscom [1] |
| **Quase 20%** de queda no emprego de desenvolvedores de 22 a 25 anos desde o fim de 2022 (EUA) | Stanford Digital Economy Lab [2] |
| No Brasil, o efeito da IA generativa sobre ocupação e renda se concentra em **jovens de 18 a 29 anos** | FGV IBRE [3] |

O mercado continua dizendo que falta gente: em cinco anos pediu 665 mil profissionais e a formação entregou 465 mil [1]. Só que a falta é de profissional pronto. Quem está começando disputa poucas vagas com muita gente, passa por várias etapas e quase nunca recebe retorno sobre o que errou.

O resultado: o candidato treina sozinho, com listas de perguntas genéricas, e só descobre como uma entrevista funciona quando já está nela, valendo a vaga.

## O que é o Lugh

Uma plataforma web de **entrevistas simuladas ao vivo**. Ela conecta quem está começando a profissionais mais experientes da mesma área.

Não é um processo seletivo e não vale vaga. Quem entrevista não precisa ser recrutador: é alguém que já passou por aquela porta e conduz a sessão como ela acontece de verdade, para os dois trocarem experiência.

1. O candidato escolhe a área, o tipo de entrevista e um profissional disponível.
2. Agenda um horário e paga por PIX.
3. Os dois entram numa sala própria do Lugh, com vídeo, editor de código compartilhado e quadro de system design. Nada para instalar.
4. No fim, o candidato recebe um feedback estruturado, junto com o código e o quadro da sessão.

Cada sessão custa em torno de R$ 100, variando com a senioridade de quem entrevista.

**Para o candidato:** chegar na entrevista de verdade já tendo passado por ela, e conhecer alguém de dentro do mercado.

**Para o entrevistador:** renda extra, prática de entrevistar e contato com talentos antes de todo mundo.

## Visão técnica

O Lugh tem duas metades: um **marketplace** (perfis, busca, agenda, pagamento, feedback) e uma **sala em tempo real** (vídeo, editor, quadro, execução de código).

```
                    ┌──────────────────────────────┐
                    │   Navegador (Next.js)        │
                    │   candidato / entrevistador  │
                    └──────┬───────────────┬───────┘
                           │               │
          ┌────────────────▼───┐     ┌─────▼──────────────────────┐
          │ MARKETPLACE        │     │ SALA DA SESSÃO             │
          │ perfis e busca     │     │ vídeo ........ LiveKit     │
          │ agenda             │     │ editor ....... Monaco+Yjs  │
          │ pagamento          │     │ quadro ....... Excalidraw  │
          │ feedback           │     │ executar ..... Judge0      │
          └────────┬───────────┘     └─────┬──────────────┬───────┘
                   │                       │              │
          ┌────────▼───────────────────────▼──┐   ┌───────▼────────┐
          │ Next.js API (Vercel) + Supabase   │   │ Hocuspocus     │
          │ auth, sessões, tokens, webhooks   │◄──┤ (Render)       │
          └──────┬──────────┬──────────┬──────┘   └────────────────┘
                 │          │          │
            AbacatePay    Resend   Judge0 (AWS)
```

### Stack

| Camada | Tecnologia | Onde roda |
|---|---|---|
| Frontend e rotas de API | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, shadcn/ui | Vercel |
| Banco e autenticação | Supabase (Postgres, Auth, RLS em todas as tabelas) | Supabase Cloud |
| Colaboração em tempo real | Yjs, com Hocuspocus como servidor (`apps/collab`) | Render |
| Editor de código | Monaco, sincronizado por `y-monaco` | navegador |
| Quadro | Excalidraw, sincronizado por `y-excalidraw` | navegador |
| Validação | zod, o mesmo schema no cliente e no servidor | |
| Testes | Vitest (unidade e integração) e Playwright (E2E) | |

### Integrações

| Serviço | Para quê | Como |
|---|---|---|
| **LiveKit Cloud** | Áudio e vídeo da sala (WebRTC) | O servidor emite um token por participante, só na janela de horário da sessão |
| **Judge0 na AWS** | Executar o código do editor (JavaScript, Python e Java) | Instância própria numa EC2. Só o servidor fala com ela, com limite de tempo e de frequência |
| **AbacatePay** | Pagamento por PIX | Cobrança criada no servidor. Webhook com assinatura validada e idempotente |
| **Resend** | E-mails de confirmação, lembrete e feedback | Enviados pelo servidor |
| **Hocuspocus** | Sincronizar editor e quadro entre os participantes | Autentica com JWT assinado pelo Next.js e persiste o documento no Supabase |

### Segurança

- Toda rota valida login e participação na sessão no servidor. Nada confia no que o navegador manda.
- Chaves de LiveKit, Judge0, AbacatePay e a service role do Supabase existem só no servidor.
- Status de sessão e pagamento são gravados só pelo backend.

### Estrutura

```
apps/web       Next.js: telas, rotas de API e regras de negócio
apps/collab    Servidor Hocuspocus da sala
supabase       Migrations, seed e templates de e-mail
```

### Rodando localmente

```bash
# app web
cd apps/web
cp .env.example .env.local   # preencha as chaves
npm install
npm run dev                  # http://localhost:3000

# servidor de colaboração (outro terminal)
cd apps/collab
cp .env.example .env
npm install
npm run dev
```

Em desenvolvimento, a documentação interativa da API (Swagger UI) fica em `http://localhost:3000/api/docs`. Ela não existe em produção.

```bash
npm run build      # build de produção
npm run lint       # lint
npm test           # Vitest
npm run test:e2e   # Playwright
```

## Por que "Lugh"

Na mitologia irlandesa, Lugh chega aos portões de Tara e o porteiro avisa que só entra quem domina um ofício. Ele responde com todos, e a porta se abre. O Lugh prepara você para a pergunta da porta.

## Equipe

Lucas e Moacir. Projeto do Hack Brasil 2026.

## Fontes

1. Brasscom, em reportagem da Agência O Globo de 01/04/2025: [Déficit de profissionais de tecnologia reduz, mas setor enfrenta fuga das universidades](https://www.folhape.com.br/economia/deficit-de-profissionais-de-tecnologia-reduz-mas-setor-enfrenta-fuga/401535/)
2. Brynjolfsson, Chandar e Chen (Stanford Digital Economy Lab, 2025): [Canaries in the Coal Mine? Six Facts about the Recent Employment Effects of Artificial Intelligence](https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine)
3. Daniel Duque (FGV IBRE, 27/04/2026): [Inteligência artificial generativa e mercado de trabalho no Brasil](https://blogdoibre.fgv.br/posts/inteligencia-artificial-generativa-e-mercado-de-trabalho-no-brasil-evidencias-iniciais-sobre)
