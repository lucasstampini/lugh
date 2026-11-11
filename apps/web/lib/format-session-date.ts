// "qua, 18 nov" e "19h" (ou "19h30"), no horário de Brasília.
export function formatSessionDate(iso: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  const weekday = parts.weekday.replace(".", "");
  const month = parts.month.replace(".", "");
  const hour = Number(parts.hour);
  return {
    day: `${weekday}, ${parts.day} ${month}`,
    time: parts.minute === "00" ? `${hour}h` : `${hour}h${parts.minute}`,
  };
}
