import type { Metadata } from "next";

import { ContactLink, LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Política de Privacidade · Lugh",
  description: "Quais dados o Lugh coleta, para que usa, com quem compartilha e quais são os seus direitos.",
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      eyebrow="privacidade"
      title="Política de Privacidade"
      intro="Esta página explica quais dados pessoais o Lugh trata, para que, com quem compartilha e como você exerce os direitos que a Lei Geral de Proteção de Dados (Lei 13.709/2018) garante."
    >
      <LegalSection title="1. Quem é responsável pelos seus dados">
        <p>
          O Lugh é um projeto mantido por Lucas e Moacir, que respondem como controladores dos
          dados tratados na plataforma. Para qualquer assunto de privacidade, inclusive para falar
          com o encarregado pelo tratamento de dados, escreva para <ContactLink />.
        </p>
      </LegalSection>

      <LegalSection title="2. Quais dados tratamos">
        <LegalList>
          <li>
            <strong>Conta:</strong> nome, e-mail e foto. Vêm do Google, quando você entra com o
            Google, ou do e-mail que você informa para receber o link de acesso.
          </li>
          <li>
            <strong>Perfil:</strong> o que você decide preencher, como nome preferido, anos de
            experiência, áreas de interesse, cargo que busca, bio, LinkedIn e GitHub. Para
            entrevistadores, também cargo, empresa, senioridade e preço da sessão.
          </li>
          <li>
            <strong>Sessões:</strong> data e horário, tipo de entrevista, o que você escreveu ao
            agendar, o código e o quadro produzidos na sala, o feedback do entrevistador e a
            avaliação do candidato.
          </li>
          <li>
            <strong>Pagamentos:</strong> valor, situação e código do PIX de cada cobrança, e a
            identificação da conta de recebimento do entrevistador na AbacatePay.
          </li>
          <li>
            <strong>CPF ou CNPJ do entrevistador:</strong> é pedido para criar a conta de
            recebimento e enviado direto à AbacatePay. O Lugh não guarda esse número.
          </li>
          <li>
            <strong>Dados técnicos:</strong> cookies de sessão para manter você conectado e
            registros de acesso dos servidores.
          </li>
        </LegalList>
        <p>
          A chamada de vídeo e áudio da sala não é gravada. Ela é transmitida em tempo real entre
          os participantes e não fica armazenada.
        </p>
      </LegalSection>

      <LegalSection title="3. Para que usamos e com qual base legal">
        <LegalList>
          <li>
            <strong>Prestar o serviço</strong> (criar a conta, mostrar perfis, agendar, abrir a
            sala, registrar o feedback): execução do contrato com você.
          </li>
          <li>
            <strong>Cobrar e repassar pagamentos:</strong> execução do contrato e cumprimento de
            obrigações legais e fiscais.
          </li>
          <li>
            <strong>Enviar e-mails da sessão</strong> (confirmação, lembrete, feedback e repasse):
            execução do contrato.
          </li>
          <li>
            <strong>Manter a plataforma segura</strong> e investigar abuso ou fraude: legítimo
            interesse.
          </li>
        </LegalList>
        <p>Não vendemos seus dados e não usamos seus dados para publicidade de terceiros.</p>
      </LegalSection>

      <LegalSection title="4. O que fica visível para outras pessoas">
        <LegalList>
          <li>
            O perfil de entrevistador ativo é público: nome, foto, cargo, empresa, senioridade,
            áreas, preço, bio, links e avaliações recebidas.
          </li>
          <li>
            Entrevistador e candidato de uma mesma sessão veem o nome e o perfil um do outro, o
            que foi escrito no agendamento, o código, o quadro e o feedback daquela sessão.
          </li>
          <li>Seu e-mail não aparece para outros usuários.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Com quem compartilhamos">
        <p>
          Usamos fornecedores que tratam dados em nosso nome, só o necessário para cada função:
        </p>
        <LegalList>
          <li>
            <strong>Supabase:</strong> banco de dados, autenticação e armazenamento das fotos.
          </li>
          <li>
            <strong>Google:</strong> login com a conta Google.
          </li>
          <li>
            <strong>Vercel</strong> e <strong>Render:</strong> hospedagem do site e do servidor de
            colaboração da sala.
          </li>
          <li>
            <strong>LiveKit:</strong> transmissão do vídeo e do áudio da sala.
          </li>
          <li>
            <strong>AbacatePay:</strong> cobrança por PIX e repasse ao entrevistador.
          </li>
          <li>
            <strong>Resend:</strong> envio dos e-mails.
          </li>
          <li>
            <strong>Amazon Web Services:</strong> servidor que executa o código escrito na sala.
            Ele recebe só o código e a linguagem, sem identificação de quem escreveu.
          </li>
        </LegalList>
        <p>
          Também podemos compartilhar dados quando a lei ou uma ordem de autoridade competente
          exigir.
        </p>
      </LegalSection>

      <LegalSection title="6. Transferência internacional">
        <p>
          Parte desses fornecedores mantém servidores fora do Brasil, principalmente nos Estados
          Unidos. Ao usar o Lugh, seus dados podem ser tratados nesses países, com as garantias
          contratuais oferecidas por cada fornecedor.
        </p>
      </LegalSection>

      <LegalSection title="7. Por quanto tempo guardamos">
        <p>
          Guardamos seus dados enquanto sua conta existir. Quando você pede a exclusão, apagamos a
          conta e os dados ligados a ela, menos o que precisamos manter por obrigação legal, como
          registros de pagamento, pelo prazo que a lei determinar.
        </p>
      </LegalSection>

      <LegalSection title="8. Seus direitos">
        <p>Você pode, a qualquer momento:</p>
        <LegalList>
          <li>confirmar se tratamos seus dados e pedir uma cópia deles;</li>
          <li>corrigir dados incompletos, errados ou desatualizados;</li>
          <li>pedir a exclusão da conta e dos seus dados;</li>
          <li>pedir a portabilidade dos seus dados;</li>
          <li>saber com quem compartilhamos seus dados;</li>
          <li>se opor a um tratamento ou revogar um consentimento.</li>
        </LegalList>
        <p>
          Boa parte do perfil você mesmo edita dentro da plataforma. Para os outros pedidos,
          escreva para <ContactLink /> usando o e-mail da sua conta. Respondemos em até 15 dias.
          Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          O Lugh usa só os cookies necessários para manter sua sessão conectada. Não usamos
          cookies de publicidade nem de rastreamento.
        </p>
      </LegalSection>

      <LegalSection title="10. Segurança">
        <p>
          O acesso é sem senha, por Google ou link enviado ao seu e-mail. As conexões são
          criptografadas e o banco de dados só libera para cada usuário o que é dele ou das
          sessões de que participa. Nenhum sistema é totalmente imune a falhas: se houver um
          incidente que possa causar risco relevante a você, avisaremos.
        </p>
      </LegalSection>

      <LegalSection title="11. Menores de idade">
        <p>O Lugh é para maiores de 18 anos. Não coletamos dados de menores de propósito.</p>
      </LegalSection>

      <LegalSection title="12. Mudanças nesta política">
        <p>
          Esta política pode mudar. A data no topo mostra a última alteração, e mudanças
          importantes serão avisadas por e-mail ou na própria plataforma.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
