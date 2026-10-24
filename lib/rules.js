const ALLOWED_DOMAINS = ["vitapstudent.ac.in", "vitap.ac.in"];

export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function isCollegeEmail(email) {
  const e = normalizeEmail(email);
  const at = e.lastIndexOf("@");
  if (at < 1) return false;
  return ALLOWED_DOMAINS.includes(e.slice(at + 1));
}

// Google must vouch for the email, and it must be a college address.
export function googleAccountError(claims) {
  if (claims?.email_verified !== true) return "unverified";
  if (!isCollegeEmail(claims.email)) return "not_college";
  return null;
}

export function farePerPerson(totalFare, memberCount) {
  return Math.ceil(totalFare / memberCount);
}

export function isActive(pool, now) {
  return pool.status === "open" && new Date(pool.departEnd) > now;
}

const idOf = (m) => String(m._id ?? m);

// Membership first, so outsiders never learn whether a pool has ended.
export function chatBlockReason(pool, userId, now) {
  if (!pool.members.some((m) => idOf(m) === String(userId))) return "not_member";
  if (!isActive(pool, now)) return "ended";
  return null;
}

export function isFull(pool) {
  return pool.members.length >= pool.capacity;
}

// Order matters: the first matching reason is the one shown to the user.
export function joinBlockReason(pool, userId, hasActivePool, now) {
  if (pool.status === "cancelled") return "cancelled";
  if (new Date(pool.departEnd) <= now) return "expired";
  if (pool.members.some((m) => idOf(m) === String(userId))) return "already_member";
  if (isFull(pool)) return "full";
  if (hasActivePool) return "has_active_pool";
  return null;
}

// College emails look like name.regno@vitapstudent.ac.in, so the part before the dot is the student's name.
export function nicknameFromEmail(email) {
  const local = email.split("@")[0];
  const first = local.split(".")[0] || local;
  return (first.charAt(0).toUpperCase() + first.slice(1)).slice(0, 20);
}

// What other students see: the saved nickname, else one from the email, else the full name.
export function displayName(user) {
  return user.nickname || (user.email ? nicknameFromEmail(user.email) : "") || user.name;
}

export function visibleMembers(pool, viewerId) {
  const isMember = pool.members.some((m) => idOf(m) === String(viewerId));
  const shared = (pool.sharedPhones ?? []).map(String);
  return pool.members.map((m) => {
    const out = { id: idOf(m), name: displayName(m) };
    if (isMember && shared.includes(out.id) && m.phone) out.phone = m.phone;
    return out;
  });
}

// IST is a fixed +05:30 offset (no DST), so a literal offset is safe.
export function istDayRange(dateStr) {
  const start = new Date(`${dateStr}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

// Women-only pools are hidden from everyone whose gender is not "female" (unset included),
// except current members, so changing gender never locks someone out of their own pool.
export function canSeePool(pool, user) {
  return !pool.womenOnly || user.gender === "female" || pool.members.some((m) => idOf(m) === String(user._id));
}
