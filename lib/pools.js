import Pool from "./models/Pool.js";
import { placeLabel } from "./places.js";
import { farePerPerson, isActive, isFull, visibleMembers } from "./rules.js";

export function hasActivePool(userId, now) {
  return Pool.exists({ members: userId, status: "open", departEnd: { $gt: now } }).then(Boolean);
}

// Members are populated with name and phone only; phones are filtered by visibleMembers.
export const withMembers = (query) => query.populate("members", "name phone");

export function toPoolJSON(pool, viewerId, now) {
  const viewer = String(viewerId);
  const memberCount = pool.members.length;
  return {
    id: String(pool._id),
    from: pool.from,
    to: pool.to,
    fromLabel: placeLabel(pool.from),
    toLabel: placeLabel(pool.to),
    departStart: pool.departStart.toISOString(),
    departEnd: pool.departEnd.toISOString(),
    capacity: pool.capacity,
    totalFare: pool.totalFare,
    memberCount,
    seatsLeft: pool.capacity - memberCount,
    farePerPerson: memberCount ? farePerPerson(pool.totalFare, memberCount) : pool.totalFare,
    isMember: pool.members.some((m) => String(m._id) === viewer),
    isCreator: String(pool.creator._id ?? pool.creator) === viewer,
    iShared: pool.sharedPhones.some((id) => String(id) === viewer),
    womenOnly: Boolean(pool.womenOnly),
    status: pool.status,
    isActive: isActive(pool, now),
    isFull: isFull(pool),
    members: visibleMembers(pool, viewerId),
  };
}

// author must be populated with name only.
export function toMessageJSON(message) {
  return {
    id: String(message._id),
    author: { id: String(message.author._id), name: message.author.name },
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
}
