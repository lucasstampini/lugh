const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const SAO_PAULO_TZ = "America/Sao_Paulo";

type Block = { weekday: number; start_time: string };

function nowInSaoPaulo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SAO_PAULO_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekdayName,
  );

  return { weekday: weekdayIndex, minutesOfDay: hour * 60 + minute };
}

function formatTime(time: string) {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  return minute === 0 ? `${hour}h` : `${hour}h${minuteStr}`;
}

function formatBlock(daysAhead: number, block: Block) {
  const time = formatTime(block.start_time);
  if (daysAhead === 0) {
    return `Hoje, ${time}`;
  }
  if (daysAhead === 1) {
    return `Amanhã, ${time}`;
  }
  return `${WEEKDAY_SHORT[block.weekday]}, ${time}`;
}

// Ordena os blocos a partir de agora, em horário de Brasília. Entre dois
// blocos no mesmo dia, o mais próximo no relógio vem primeiro; "hoje" só
// conta se o horário ainda não passou.
function sortByUpcoming(blocks: Block[]) {
  const { weekday: todayWeekday, minutesOfDay: nowMinutes } = nowInSaoPaulo();

  return blocks
    .map((block) => {
      const [hourStr, minuteStr] = block.start_time.split(":");
      const startMinutes = Number(hourStr) * 60 + Number(minuteStr);

      let daysAhead = (block.weekday - todayWeekday + 7) % 7;
      if (daysAhead === 0 && startMinutes <= nowMinutes) {
        daysAhead = 7;
      }

      return { daysAhead, startMinutes, block };
    })
    .sort(
      (a, b) => a.daysAhead - b.daysAhead || a.startMinutes - b.startMinutes,
    );
}

export function nextAvailableSlot(blocks: Block[]): string | null {
  const [next] = sortByUpcoming(blocks);
  return next ? formatBlock(next.daysAhead, next.block) : null;
}

// Os próximos N horários, em ordem.
export function upcomingSlots(blocks: Block[], count: number): string[] {
  return sortByUpcoming(blocks)
    .slice(0, count)
    .map(({ daysAhead, block }) => formatBlock(daysAhead, block));
}
