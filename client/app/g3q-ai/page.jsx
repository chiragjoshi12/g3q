"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ChatMarkdown, decodeAiLineBreaks } from "@/components/g3q-ai/ChatMarkdown";
import { BrandGlyph, BrandIcon } from "@/components/common/BrandIcon";
import { AppShell } from "@/components/layout/AppShell";
import { useSmoothStream } from "@/hooks/useSmoothStream";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { streamG3qAiChat } from "@/lib/g3q-ai-api";
import { cn } from "@/lib/utils";

const TITLE_G3Q = "linear-gradient(90deg, #8c52ff 0%, #ff914d 100%)";
const BOTTOM_THRESHOLD_PX = 72;
const AI_ICON_SIZE = "size-6";
const AI_ICON_SIZE_MATCH = "size-4";
const RESPONSE_ICON_SIZE = "size-4";

const SUGGESTIONS = [
  {
    id: "semiconductor",
    text: "સરકારની સેમી કંડક્ટર ક્ષેત્રની સિદ્ધિઓ વિશે જણાવ",
    Icon: ShieldSuggestionIcon,
  },
  {
    id: "prize",
    text: "જિલ્લા સ્તરે પહેલો નંબર લાવીશ તો શું ઈનામ મળશે?",
    Icon: TrophySuggestionIcon,
  },
  {
    id: "join",
    text: "આ ક્વિઝ સ્પર્ધામાં હું કેવી રીતે ભાગ લઈ શકું?",
    Icon: AwardSuggestionIcon,
  },
];

/**
 * G3Q AI chat — Canva mock layout, markdown replies, smooth streamed text.
 */
export default function G3qAiPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [inputVisible, setInputVisible] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedback, setFeedback] = useState({});
  const copiedTimerRef = useRef(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const nearBottomRef = useRef(true);

  const setAssistantContent = useCallback((content) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last || last.role !== "assistant") return prev;
      next[next.length - 1] = { ...last, content: decodeAiLineBreaks(content) };
      return next;
    });
  }, []);

  const smooth = useSmoothStream(setAssistantContent);

  const updateNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    // Empty / short threads always count as "at bottom".
    if (el.scrollHeight <= el.clientHeight + 4) {
      nearBottomRef.current = true;
      setInputVisible(true);
      return true;
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance <= BOTTOM_THRESHOLD_PX;
    nearBottomRef.current = atBottom;
    setInputVisible(atBottom);
    return atBottom;
  }, []);

  const onListScroll = useCallback(() => {
    updateNearBottom();
  }, [updateNearBottom]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // Only stick to the bottom while the user is already near it.
    if (!nearBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
    updateNearBottom();
  }, [messages, sending, updateNearBottom]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const resetChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    smooth.reset();
    setMessages([]);
    setDraft("");
    setError(null);
    setSending(false);
    setCopiedIndex(null);
    setFeedback({});
    nearBottomRef.current = true;
    setInputVisible(true);
    inputRef.current?.focus();
  };

  const copyResponse = async (text, index) => {
    if (!text?.trim()) return;
    try {
      await navigator.clipboard.writeText(decodeAiLineBreaks(text));
      setCopiedIndex(index);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopiedIndex(null), 1600);
    } catch {
      setError("Copy failed. Try again.");
    }
  };

  const toggleFeedback = (index, value) => {
    setFeedback((prev) => {
      if (prev[index] === value) {
        const next = { ...prev };
        delete next[index];
        return next;
      }
      return { ...prev, [index]: value };
    });
  };

  const send = async (preset) => {
    const text = (typeof preset === "string" ? preset : draft).trim();
    if (!text || sending) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    smooth.reset();
    nearBottomRef.current = true;
    setInputVisible(true);
    const history = [...messages, { role: "user", content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setError(null);
    setSending(true);

    // Jump to bottom so the new reply and input stay in view.
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

    try {
      await streamG3qAiChat(history, {
        signal: controller.signal,
        onChunk: (chunk) => smooth.push(chunk),
      });
      await smooth.drain();
    } catch (err) {
      if (err?.name === "AbortError") return;
      await smooth.drain();
      setError(err?.message || "Something went wrong. Try again.");
      setMessages((prev) => {
        const withoutEmptyAssistant =
          prev.length && prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1].content
            ? prev.slice(0, -1)
            : prev;
        if (
          withoutEmptyAssistant.length &&
          withoutEmptyAssistant[withoutEmptyAssistant.length - 1]?.role === "user" &&
          withoutEmptyAssistant[withoutEmptyAssistant.length - 1]?.content === text
        ) {
          return withoutEmptyAssistant.slice(0, -1);
        }
        return withoutEmptyAssistant;
      });
      setDraft(text);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showEmpty = messages.length === 0 && !sending;

  return (
    <AppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F2F2F2]">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col overflow-hidden bg-[#F7F9FC] md:max-w-none">
        <Image
          src="/g3q-ai-bg.jpeg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 26.5rem"
          className="pointer-events-none object-cover object-top opacity-90"
        />

        <header className="relative z-10 flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))]">
          <RoundIconButton label="Close" onClick={() => router.back()}>
            <CloseIcon className={AI_ICON_SIZE} />
          </RoundIconButton>

          <h1 className="flex select-none items-baseline gap-[0.22em] font-canva text-[1.4rem] font-bold tracking-tight">
            <span
              style={{
                backgroundImage: TITLE_G3Q,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              G3Q AI
            </span>
          </h1>

          <button
            type="button"
            aria-label="New chat"
            onClick={resetChat}
            className="grid size-10 place-items-center rounded-full bg-[#ffffff] active:opacity-80"
          >
            <BrandIcon src={BRAND_ICONS.aiNewChat} alt="" className={AI_ICON_SIZE_MATCH} />
          </button>
        </header>

        <main
          ref={listRef}
          onScroll={onListScroll}
          className={cn(
            "relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1 transition-[padding] duration-300",
            inputVisible ? "pb-[11.5rem]" : "pb-6"
          )}
        >
          {showEmpty ? (
            <EmptyWelcome onPick={send} />
          ) : (
            <ul className="flex flex-col gap-3 pb-2">
              {messages.map((m, i) => {
                const isStreamingAssistant =
                  sending && i === messages.length - 1 && m.role === "assistant";
                const showActions =
                  m.role === "assistant" && Boolean(m.content) && !isStreamingAssistant;

                return (
                  <li
                    key={`${m.role}-${i}`}
                    className={cn(
                      "max-w-[72%] text-[18px] leading-relaxed",
                      m.role === "user"
                        ? "ml-auto rounded-[1.25rem] bg-[#eef7ff] px-3.5 py-2.5 text-[#000000]"
                        : "mr-auto w-full max-w-[92%] px-0.5 py-1 text-[#111]"
                    )}
                    style={
                      m.role === "assistant"
                        ? {
                            fontFamily:
                              'var(--font-gujarati), var(--font-noto), "Noto Sans Gujarati", "Noto Sans", sans-serif',
                            fontSize: 18,
                          }
                        : undefined
                    }
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : m.content ? (
                      <div className="relative">
                        <ChatMarkdown>{m.content}</ChatMarkdown>
                        {isStreamingAssistant ? (
                          <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-[#8c52ff] align-[-0.15em]" />
                        ) : null}
                      </div>
                    ) : isStreamingAssistant ? (
                      <span className="inline-block h-[1.1em] w-[2px] animate-pulse bg-[#8c52ff]" />
                    ) : null}

                    {showActions ? (
                      <div className="mt-2.5 flex items-center gap-3.5">
                        <button
                          type="button"
                          aria-label={copiedIndex === i ? "Copied" : "Copy response"}
                          onClick={() => copyResponse(m.content, i)}
                          className="grid size-6 place-items-center active:opacity-60"
                        >
                          {copiedIndex === i ? (
                            <CopiedCheckIcon className={cn(RESPONSE_ICON_SIZE, "text-[#111]")} />
                          ) : (
                            <BrandIcon
                              src={BRAND_ICONS.aiCopyResponse}
                              alt=""
                              className={RESPONSE_ICON_SIZE}
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Like response"
                          aria-pressed={feedback[i] === "like"}
                          onClick={() => toggleFeedback(i, "like")}
                          className="grid size-6 place-items-center active:opacity-60"
                        >
                          <ResponseFeedbackIcon
                            src={BRAND_ICONS.aiLikeResponse}
                            selected={feedback[i] === "like"}
                          />
                        </button>
                        <button
                          type="button"
                          aria-label="Dislike response"
                          aria-pressed={feedback[i] === "dislike"}
                          onClick={() => toggleFeedback(i, "dislike")}
                          className="grid size-6 place-items-center active:opacity-60"
                        >
                          <ResponseFeedbackIcon
                            src={BRAND_ICONS.aiDislikeResponse}
                            selected={feedback[i] === "dislike"}
                          />
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {error ? (
            <p className="mt-2 rounded-xl bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#B91C1C]">{error}</p>
          ) : null}
        </main>

        {/* Slides away while reading older messages; returns at bottom */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-20 px-3.5 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 transition-transform duration-300 ease-out",
            inputVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
          )}
          aria-hidden={!inputVisible}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-[#f4e9ff]/55 to-transparent blur-xl"
          />
          <div className="relative rounded-[2rem] bg-[#ffffff] px-5 pt-4 pb-3">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Ask here..."
              disabled={sending || !inputVisible}
              tabIndex={inputVisible ? 0 : -1}
              className="w-full resize-none bg-transparent font-canva text-[16px] leading-snug text-[#111] outline-none placeholder:text-[#000000] disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Chat history"
                onClick={resetChat}
                className="grid size-10 place-items-center rounded-full bg-[#f5f5f5] text-[#4B5563] active:opacity-80"
              >
                <BrandIcon src={BRAND_ICONS.aiHistory} alt="" className={AI_ICON_SIZE} />
              </button>
              <button
                type="button"
                onClick={() => send()}
                disabled={sending || !draft.trim()}
                aria-label="Send"
                className="grid size-10 place-items-center rounded-full bg-[#2d689d] text-white disabled:opacity-100 active:scale-[0.97]"
              >
                <BrandIcon src={BRAND_ICONS.aiSend} alt="" className={AI_ICON_SIZE_MATCH} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyWelcome({ onPick }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col items-center px-4 pt-2 text-center">
        <BrandIcon
          src={BRAND_ICONS.logo}
          alt="G3Q 2.0"
          priority
          className="size-[5.25rem]"
        />
        <h2 className="mt-2 font-heading text-[1.5rem] font-bold leading-none tracking-tight text-[#2d689d]">
          ગુજરાત ક્વિઝ
        </h2>
        <p className="mt-3 max-w-[20rem] font-heading text-[14px] leading-[1.75] text-[#000000]">
          G3Q AI ને આ ક્વિઝ સ્પર્ધા, ઇનામો,<br></br>ગુજરાત સરકાર ની યોજનાઓ વગેરે વિશે<br></br> કોઈ પણ પ્રશ્ન પૂછી શકો છો.
        </p>
      </div>
      <ul className="mt-5 space-y-[1.15rem] pb-[0px]">
        {SUGGESTIONS.map(({ id, text, Icon }) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onPick(text)}
              className="flex w-full items-start gap-3 text-left active:opacity-70"
            >
              <Icon className="mt-[-5px] size-[1.2rem] shrink-0 text-[#737373]" />
              <span className="mt-[-5px] font-heading text-[14px] leading-snug text-[#737373]">{text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoundIconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-full bg-[#ffffff] text-[#000000] active:scale-95"
    >
      {children}
    </button>
  );
}

function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResponseFeedbackIcon({ src, selected }) {
  if (selected) {
    return <BrandGlyph src={src} className={RESPONSE_ICON_SIZE} color="#2d689d" />;
  }
  return <BrandIcon src={src} alt="" className={RESPONSE_ICON_SIZE} />;
}

function CopiedCheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M5 12.5 10 17.5 19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldSuggestionIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 3.2 5.5 5.6v5.3c0 4.3 2.8 7.4 6.5 8.7 3.7-1.3 6.5-4.4 6.5-8.7V5.6L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.1 11.1 14l3.7-4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrophySuggestionIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M8 4.5h8v3.8c0 2.6-1.8 4.7-4 4.7s-4-2.1-4-4.7V4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M8 6.2H5.6A2.1 2.1 0 0 0 7.8 8.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 6.2h2.4A2.1 2.1 0 0 1 16.2 8.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 13v2.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8.5 19.4h7M9.8 15.4h4.4v4H9.8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function AwardSuggestionIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="9.2" r="4.4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M10.1 13.1 8.4 20.2 12 17.8l3.6 2.4-1.7-7.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
