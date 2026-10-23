// Browser helpers shared by the client pages.

export async function api(path, { method = "GET", body } = {}) {
  try {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    // `?? {}` covers an empty or literal-null body, so callers can always read data.error.
    const data = (await res.json().catch(() => null)) ?? {};
    return { ok: res.ok, status: res.status, data };
  } catch {
    // Network failure: same shape as an API error so pages handle one case.
    return { ok: false, status: 0, data: { error: "No connection. Check your network and try again." } };
  }
}

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// e.g. "Fri 24 Oct, 5:00 pm". Built from parts so browser punctuation differences don't leak in.
export function formatTime(date) {
  const p = Object.fromEntries(timeFormat.formatToParts(new Date(date)).map((x) => [x.type, x.value]));
  return `${p.weekday} ${p.day} ${p.month}, ${p.hour}:${p.minute} ${p.dayPeriod.toLowerCase()}`;
}

// "Fri 24 Oct, 4:00 pm – 4:30 pm"; the end drops its date when it's the same IST day.
export function formatWindow(start, end) {
  const [startDay, startTime] = formatTime(start).split(", ");
  const [endDay, endTime] = formatTime(end).split(", ");
  return endDay === startDay ? `${startDay}, ${startTime} – ${endTime}` : `${startDay}, ${startTime} – ${endDay}, ${endTime}`;
}

const istDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }); // en-CA gives YYYY-MM-DD

// Today plus the next 6 days in IST, for the date filter. Pools can't start more than 7 days out.
export function nextIstDays(now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    return { value: istDate.format(d), label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatTime(d).split(",")[0] };
  });
}
