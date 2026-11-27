import type { Metadata } from "next";
import Link from "next/link";

import { ContactLink, LegalList, LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Termos de Uso · Lugh",
  description: "As regras de uso do Lugh para candidatos e entrevistadores.",
};

export default function TermosPage() {
  return (
    <LegalPage
      eyebrow="termos"
      title="Termos de Uso"
      intro="Estas são as regras para usar o Lugh. Ao criar sua conta, você concorda com elas."
    >
      <LegalSection title="1. O que é o Lugh">
        <p>
          O Lugh é uma plataforma de entrevistas simuladas (mock interviews). O candidato escolhe
          um entrevistador, agenda, paga e faz a entrevista numa sala com vídeo, editor de código
          e quadro. No fim, recebe um feedback estruturado.
        </p>
        <p>
          O Lugh aproxima candidatos e entrevistadores. Os entrevistadores são profissionais
          independentes, não funcionários do Lugh. O Lugh é mantido por Lucas e Moacir.
        </p>
      </LegalSection>

      <LegalSection title="2. Sua conta">
        <LegalList>
          <li>Você precisa ter 18 anos ou mais.</li>
          <li>O acesso é por conta Google ou por link enviado ao seu e-mail.</li>
          <li>
            As informações do perfil precisam ser verdadeiras, e você responde pelo que é feito
            com a sua conta.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Para quem é candidato">
        <LegalList>
          <li>
            A sessão é um treino. O feedback é a opinião profissional do entrevistador e não
            garante aprovação nem vaga em nenhum processo seletivo.
          </li>
          <li>Entre na sala no horário marcado. A sala abre 10 minutos antes.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Para quem é entrevistador">
        <LegalList>
          <li>
            Você define o seu preço e os seus horários, e se compromete a comparecer às sessões
            agendadas.
          </li>
          <li>
            Depois de cada sessão, você envia o feedback do candidato. O repasse só acontece
            depois desse envio.
          </li>
          <li>
            Para receber, você informa nome do titular e CPF ou CNPJ, usados para criar sua conta
            de recebimento na AbacatePay.
          </li>
          <li>Impostos sobre o que você recebe são de sua responsabilidade.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Pagamentos">
        <LegalList>
          <li>O pagamento é por PIX, processado pela AbacatePay.</li>
          <li>O horário só fica reservado depois da confirmação do pagamento.</li>
          <li>
            Uma cobrança que não é paga dentro do prazo expira, e o horário volta a ficar
            disponível.
          </li>
          <li>
            O valor pago é dividido entre o entrevistador e a taxa de serviço do Lugh. O valor
            total da sessão é sempre mostrado antes do pagamento.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="6. Cancelamento e reembolso">
        <p>
          Enquanto o Lugh está em fase inicial, pedidos de cancelamento, remarcação e reembolso
          são analisados caso a caso. Se a sua sessão não aconteceu ou você teve algum problema,
          escreva para <ContactLink /> com o e-mail da sua conta e a data da sessão.
        </p>
        <p>Os direitos previstos no Código de Defesa do Consumidor continuam valendo.</p>
      </LegalSection>

      <LegalSection title="7. Conduta">
        <p>Ao usar o Lugh, você concorda em não:</p>
        <LegalList>
          <li>assediar, ofender ou discriminar outras pessoas;</li>
          <li>gravar ou divulgar a sessão sem a autorização de quem participou;</li>
          <li>combinar pagamento por fora da plataforma para uma sessão marcada pelo Lugh;</li>
          <li>usar a plataforma para fraude, spam ou qualquer atividade ilegal;</li>
          <li>tentar acessar contas, sessões ou dados que não são seus.</li>
        </LegalList>
        <p>Podemos suspender ou encerrar contas que descumprirem estas regras.</p>
      </LegalSection>

      <LegalSection title="8. Conteúdo da sessão">
        <p>
          O código e o quadro produzidos na sala ficam salvos para que os dois participantes
          possam rever o resultado. O feedback pertence a quem escreveu e fica disponível para o
          candidato. O Lugh não grava o vídeo nem o áudio da sala.
        </p>
      </LegalSection>

      <LegalSection title="9. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para manter o Lugh no ar, mas o serviço pode ter instabilidade ou ficar
          indisponível. Se um problema técnico da plataforma impedir a sua sessão, fale com a
          gente para remarcar ou reembolsar.
        </p>
        <p>
          O Lugh não responde pelo conteúdo do feedback nem por decisões de carreira tomadas a
          partir dele, e não responde por falhas de conexão ou de equipamento dos participantes.
        </p>
      </LegalSection>

      <LegalSection title="10. Privacidade">
        <p>
          O tratamento dos seus dados está descrito na{" "}
          <Link href="/privacidade" className="text-brand-deep font-bold underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="11. Mudanças nos termos">
        <p>
          Estes termos podem mudar. A data no topo mostra a última alteração, e mudanças
          importantes serão avisadas por e-mail ou na própria plataforma.
        </p>
      </LegalSection>

      <LegalSection title="12. Lei aplicável e contato">
        <p>
          Estes termos seguem as leis do Brasil. Fica eleito o foro do domicílio do consumidor
          para resolver qualquer questão. Dúvidas: <ContactLink />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
