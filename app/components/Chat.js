"use client";

import { useEffect, useRef, useState } from "react";
import { api, formatTime } from "@/lib/client.js";

// Pool chat for members. Polls every 2 s instead of a socket, so it works on Vercel with no extra service.
export default function Chat({ poolId, active, myId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false); // set on 403: no longer a member
  const listRef = useRef(null);

  // Applies a GET result. Returns false when polling should stop: logged out or not a member any more.
  function handle(r) {
    if (r.ok) {
      setMessages(r.data.messages);
      setError("");
      return true;
    }
    if (r.status === 403) setHidden(true);
    else if (r.status !== 401) setError(r.data.error || "Couldn't load messages, retrying");
    return r.status !== 401 && r.status !== 403;
  }
  const url = `/api/pools/${poolId}/messages`;

  useEffect(() => {
    let timer;
    let stopped = false; // set on unmount, so a first load that finishes late doesn't start a poller
    api(url).then(handle).then((keepGoing) => {
      // An ended pool gets this one load and no polling.
      if (stopped || !keepGoing || !active) return;
      timer = setInterval(async () => {
        if (document.visibilityState !== "visible") return; // skip polls while the tab is in the background
        if (!(await api(url).then(handle))) clearInterval(timer);
      }, 2000);
    });
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [url, active]);

  // Keep the newest message in view; keyed on the last id so polls that bring nothing new don't jump the list.
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [lastId]);

  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const r = await api(url, { method: "POST", body: { text } });
    if (r.ok) {
      setText("");
      handle(await api(url)); // reload rather than append, so a poll landing at the same time can't duplicate it
    } else setError(r.data.error || "Couldn't send that, try again");
    setBusy(false);
  }

  if (hidden) return null;

  return (
    <section aria-labelledby="chat-heading" className="mt-8 lg:sticky lg:top-6 lg:mt-0">
      <h2 id="chat-heading" className="font-display text-2xl font-bold">Pool chat</h2>
      <ol ref={listRef} aria-live="polite"
        className="mt-2 flex max-h-[360px] flex-col lg:max-h-[60vh] gap-2 overflow-y-auto rounded-[10px] border border-line bg-white p-3">
        {messages.length === 0 && (
          <li className="py-6 text-center text-[15px] text-muted">No messages yet. Say hi and sort out where to meet.</li>
        )}
        {messages.map((m) => {
          const mine = m.author.id === myId;
          return (
            <li key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 ${mine ? "self-end bg-yellow" : "self-start border border-line bg-ground"}`}>
              <p className="flex items-baseline gap-2 text-[13px]">
                <span className="font-semibold">{mine ? "You" : m.author.name}</span>
                <span className="font-mono tracking-[-0.03em] text-muted">{formatTime(m.createdAt)}</span>
              </p>
              <p className="mt-0.5 text-[15px] whitespace-pre-wrap break-words">{m.text}</p>
            </li>
          );
        })}
      </ol>

      {error && <p role="alert" className="mt-3 font-semibold text-bad">{error}</p>}

      {active ? (
        <form onSubmit={send} className="mt-3 flex gap-2">
          <label htmlFor="chat-text" className="sr-only">Message</label>
          <input id="chat-text" className="field mt-0" value={text} maxLength={500} autoComplete="off"
            placeholder="Type a message" onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn w-auto shrink-0" disabled={busy}>
            {busy ? "Sending…" : "Send"}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">This pool has ended, so the chat is read-only.</p>
      )}
    </section>
  );
}
