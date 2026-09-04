"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ChatMarkdown } from "@/components/g3q-ai/ChatMarkdown";
import { BrandIcon } from "@/components/common/BrandIcon";
import { AppShell } from "@/components/layout/AppShell";
import { useSmoothStream } from "@/hooks/useSmoothStream";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { streamG3qAiChat } from "@/lib/g3q-ai-api";
import { cn } from "@/lib/utils";

const TITLE_GRADIENT = "linear-gradient(90deg, #8c52ff 0%, #ff914d 100%)";
const BOTTOM_THRESHOLD_PX = 72;

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
      next[next.length - 1] = { ...last, content };
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
    nearBottomRef.current = true;
    setInputVisible(true);
    inputRef.current?.focus();
  };

  const getPrecedingQuestion = (assistantIndex) => {
    let userIndex = assistantIndex - 1;
    while (userIndex >= 0 && messages[userIndex]?.role !== "user") userIndex -= 1;
    return userIndex >= 0 ? messages[userIndex].content : "";
  };

  const copyResponse = async (text, index) => {
    if (!text?.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopiedIndex(null), 1600);
    } catch {
      setError("Copy failed. Try again.");
    }
  };

  const shareExchange = async (assistantIndex) => {
    const response = messages[assistantIndex]?.content?.trim();
    if (!response) return;
    const question = getPrecedingQuestion(assistantIndex).trim() || "—";
    const text = `Questions : ${question}\nResponse : ${response}`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopiedIndex(assistantIndex);
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => setCopiedIndex(null), 1600);
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError("Share failed. Try again.");
    }
  };

  const send = async () => {
    const text = draft.trim();
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
            <CloseIcon className="size-[1.05rem]" />
          </RoundIconButton>

          <h1
            className="select-none font-canva text-[1.4rem] font-bold tracking-tight"
            style={{
              backgroundImage: TITLE_GRADIENT,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            G3Q AI
          </h1>

          <RoundIconButton label="New chat" onClick={resetChat}>
            <NewChatIcon className="size-[1.05rem]" />
          </RoundIconButton>
        </header>

        <main
          ref={listRef}
          onScroll={onListScroll}
          className={cn(
            "relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1 transition-[padding] duration-300",
            inputVisible ? "pb-[11.5rem]" : "pb-6"
          )}
        >
          {showEmpty ? null : (
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
                      "max-w-[92%] text-[18px] leading-relaxed",
                      m.role === "user"
                        ? "ml-auto rounded-[1.25rem] bg-[#2d689d] px-3.5 py-2.5 text-white"
                        : "mr-auto w-full max-w-[92%] px-0.5 py-1 text-[#111]"
                    )}
                    style={
                      m.role === "assistant"
                        ? {
                            fontFamily: 'var(--font-gujarati), "Noto Sans Gujarati", sans-serif',
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
                          className="grid size-8 place-items-center active:opacity-60"
                        >
                          {copiedIndex === i ? (
                            <CopiedCheckIcon className="size-[1.15rem] text-[#111]" />
                          ) : (
                            <BrandIcon
                              src={BRAND_ICONS.copyResponse}
                              alt=""
                              className="size-[1.2rem]"
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label="Share question and response"
                          onClick={() => shareExchange(i)}
                          className="grid size-8 place-items-center active:opacity-60"
                        >
                          <BrandIcon
                            src={BRAND_ICONS.shareQuiz}
                            alt=""
                            className="size-[1.2rem]"
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
            "absolute inset-x-0 bottom-0 z-20 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3.5 shadow-[0_-8px_28px_rgb(15_23_42/0.06)] transition-transform duration-300 ease-out [border-top-left-radius:1.75rem] [border-top-right-radius:1.75rem]",
            inputVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
          )}
          aria-hidden={!inputVisible}
        >
          <div className="px-5">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={3}
              placeholder="Ask here..."
              disabled={sending || !inputVisible}
              tabIndex={inputVisible ? 0 : -1}
              className="w-full resize-none bg-transparent text-[15px] leading-snug text-[#111] outline-none placeholder:text-[#B0B5BD] disabled:opacity-60"
            />
            <div className="mt-1 flex items-center justify-between">
              <button
                type="button"
                aria-label="Chat history"
                onClick={resetChat}
                className="grid size-10 place-items-center rounded-full bg-[#ECEFF3] text-[#374151] active:opacity-80"
              >
                <HistoryIcon className="size-[1.1rem]" />
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending || !draft.trim()}
                aria-label="Send"
                className="grid size-10 place-items-center rounded-full bg-black text-white disabled:opacity-35 active:scale-[0.97]"
              >
                <SendIcon className="size-[1.15rem]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function RoundIconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full bg-white text-[#111] shadow-[0_4px_14px_rgb(15_23_42/0.10)] active:scale-95"
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

function NewChatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M5 19h4.5L19 9.5 14.5 5 5 14.5V19z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12.5 7.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M4.5 5.5V9h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M12 8v4.5l3 1.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
