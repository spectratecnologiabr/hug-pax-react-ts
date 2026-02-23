export const APP_TIME_ZONE = "America/Sao_Paulo";

type DateParts = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
};

function getParts(date: Date): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23"
  });

  const map = formatter
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return {
    year: map.year ?? "0000",
    month: map.month ?? "01",
    day: map.day ?? "01",
    hour: map.hour ?? "00",
    minute: map.minute ?? "00",
    second: map.second ?? "00"
  };
}

export function formatDateInAppTimeZone(date = new Date()) {
  const { year, month, day } = getParts(date);
  return `${year}-${month}-${day}`;
}
