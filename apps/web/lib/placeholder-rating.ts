// Reviews ainda não existe no banco (só planejada no PROJETO.md, backlog P1:
// "Candidato avalia o entrevistador"). Até a tabela existir, o card do
// marketplace mostra uma nota ilustrativa e estável por perfil, coerente com
// o aviso "avaliações ilustrativas" que já tem na página. Nunca aleatória a
// cada render: deriva de um hash do profileId, então o mesmo entrevistador
// sempre mostra a mesma nota.
export function getPlaceholderRating(profileId: string) {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) {
    hash = (hash * 31 + profileId.charCodeAt(i)) >>> 0;
  }

  const rating = 4.6 + (hash % 5) / 10;
  const reviewCount = 8 + (hash % 33);

  return {
    rating: rating.toFixed(1).replace(".", ","),
    reviewCount,
  };
}
