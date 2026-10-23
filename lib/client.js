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
