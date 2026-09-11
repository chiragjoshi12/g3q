"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { ChatMarkdown, decodeAiLineBreaks } from "@/components/g3q-ai/ChatMarkdown";
import { BrandGlyph, BrandIcon } from "@/components/common/BrandIcon";
import { DesktopAppShell } from "@/components/layout/DesktopAppShell";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useSmoothStream } from "@/hooks/useSmoothStream";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { streamG3qAiChat } from "@/lib/g3q-ai-api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TITLE_G3Q = "linear-gradient(90deg, #8c52ff 0%, #ff914d 100%)";
const BOTTOM_THRESHOLD_PX = 72;
const AI_ICON_SIZE = "size-4";
const AI_ICON_SIZE_MATCH = "size-4";
const RESPONSE_ICON_SIZE = "size-4";

/**
 * G3Q AI chat — Canva mock layout, markdown replies, smooth streamed text.
 */
export default function G3qAiPage() {
  const router = useRouter();
  const { meta, t } = useI18n();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [feedback, setFeedback] = useState({});
  const copiedTimerRef = useRef(0);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const nearBottomRef = useRef(true);
  const draftBaseRef = useRef("");

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

  const speech = useSpeechToText({
    lang: meta.speechLocale,
    onText: (spoken) => {
      const base = draftBaseRef.current;
      setDraft(base ? `${base}${spoken}` : spoken);
    },
    onError: (code) => {
      if (code === "unsupported") {
        setError(t("speechUnavailable"));
        return;
      }
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError(t("microphoneNeeded"));
        return;
      }
      setError(t("couldntHear"));
    },
  });

  const updateNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    // Empty / short threads always count as "at bottom".
    if (el.scrollHeight <= el.clientHeight + 4) {
      nearBottomRef.current = true;
      return true;
    }
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance <= BOTTOM_THRESHOLD_PX;
    nearBottomRef.current = atBottom;
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
    speech.stop();
    smooth.reset();
    setMessages([]);
    setDraft("");
    setError(null);
    setSending(false);
    setCopiedIndex(null);
    setFeedback({});
    nearBottomRef.current = true;
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
      setError(t("copyFailed"));
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

    speech.stop();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    smooth.reset();
    nearBottomRef.current = true;
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
      setError(err?.message || t("somethingWentWrong"));
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

  const onMicClick = () => {
    if (sending) return;
    if (!speech.listening) {
      const cur = draft.trim();
      draftBaseRef.current = cur ? `${cur} ` : "";
      setError(null);
    }
    speech.toggle();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showEmpty = messages.length === 0 && !sending;

  return (
    <DesktopAppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F2F2F2]">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col overflow-hidden bg-[#F7F9FC] md:max-w-none">
        <Image
          src="/g3q-ai-bg.jpeg"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 26.5rem, 100vw"
          className="pointer-events-none object-cover object-top opacity-90"
        />

        <header className="relative z-10 flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))] lg:px-8 lg:pt-5 lg:pb-3">
            <RoundIconButton label={t("close")} onClick={() => router.back()} className="lg:invisible">
            <CloseIcon className={AI_ICON_SIZE} />
          </RoundIconButton>

          <h1 className="flex select-none items-baseline gap-[0.22em] font-canva text-[1.4rem] font-bold tracking-tight lg:text-[1.65rem]">
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
            aria-label={t("newChat")}
            onClick={resetChat}
            className="grid size-10 place-items-center rounded-full bg-[#ffffff] active:opacity-80"
          >
            <BrandIcon src={BRAND_ICONS.aiNewChat} alt="" className={AI_ICON_SIZE_MATCH} />
          </button>
        </header>

        <main
          ref={listRef}
          onScroll={onListScroll}
          className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-1 pb-[11.5rem] transition-[padding] duration-300 lg:px-8"
        >
          {showEmpty ? (
            <EmptyWelcome onPick={send} />
          ) : (
            <div className="lg:mx-auto lg:max-w-[44rem]">
              <WelcomeHero />
              <ul className="mt-6 flex flex-col gap-3 pb-2">
                {messages.map((m, i) => {
                  const isStreamingAssistant =
                    sending && i === messages.length - 1 && m.role === "assistant";
                  const showActions =
                    m.role === "assistant" && Boolean(m.content) && !isStreamingAssistant;

                  return (
                    <li
                      key={`${m.role}-${i}`}
                      className={cn(
                        "max-w-[72%] text-[16px] leading-relaxed",
                        m.role === "user"
                          ? "mt-4 ml-auto rounded-[1.25rem] bg-[#eef7ff] px-3.5 py-2.5 text-[#000000] text-[16px]"
                          : "mt-2 mr-auto w-full max-w-[92%] px-0.5 py-1 text-[#111]"
                      )}
                      style={
                        m.role === "assistant"
                          ? {
                              fontFamily:
                                'var(--font-noto), "Noto Sans", sans-serif',
                              fontSize: 20,
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
                            aria-label={copiedIndex === i ? t("copied") : t("copyResponse")}
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
                            aria-label={t("likeResponse")}
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
                            aria-label={t("dislikeResponse")}
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
            </div>
          )}
          {error ? (
            <p className="mt-2 rounded-xl bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#B91C1C] lg:mx-auto lg:max-w-[44rem]">
              {error}
            </p>
          ) : null}
        </main>

        <div
          className="absolute inset-x-0 bottom-0 z-20 px-3.5 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 transition-transform duration-300 ease-out lg:px-8"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-[#f4e9ff]/55 to-transparent blur-xl"
          />
          <div className="relative mx-auto w-full max-w-[44rem] rounded-[2rem] bg-[#ffffff] px-5 pt-4 pb-3">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder={speech.listening ? t("listening") : t("askHere")}
              disabled={sending}
              className="w-full resize-none bg-transparent font-canva text-[16px] leading-snug text-[#111] outline-none placeholder:text-[#000000] disabled:opacity-60"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label={t("chatHistory")}
                  onClick={resetChat}
                  // move slide on left side of the screen
                  className="grid size-10 place-items-center rounded-full bg-[#f5f5f5] text-[#4B5563] active:opacity-80 ml-[-10px]"
                >
                  <BrandIcon src={BRAND_ICONS.aiHistory} alt="" className={AI_ICON_SIZE} />
                </button>
                <button
                  type="button"
                  aria-label={speech.listening ? t("stopListening") : t("speakPrompt")}
                  aria-pressed={speech.listening}
                  onClick={onMicClick}
                  disabled={sending}
                  className={cn(
                    "grid size-10 place-items-center rounded-full active:opacity-80 disabled:opacity-50",
                    speech.listening
                      ? "bg-[#2d689d] text-white"
                      : "bg-[#f5f5f5] text-[#4B5563]"
                  )}
                >
                  {speech.listening ? (
                    <BrandGlyph
                      src={BRAND_ICONS.aiSpeech}
                      className={cn(AI_ICON_SIZE, "animate-pulse")}
                      color="#ffffff"
                    />
                  ) : (
                    <BrandIcon src={BRAND_ICONS.aiSpeech} alt="" className={AI_ICON_SIZE} />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => send()}
                disabled={sending || !draft.trim()}
                aria-label={t("send")}
                className="grid size-10 place-items-center rounded-full bg-[#2d689d] text-white disabled:opacity-100 active:scale-[0.97]"
              >
                <BrandIcon src={BRAND_ICONS.aiSend} alt="" className={AI_ICON_SIZE_MATCH} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DesktopAppShell>
  );
}

function EmptyWelcome({ onPick }) {
  return (
    <div className="flex min-h-full flex-col lg:mx-auto lg:max-w-[44rem] lg:justify-center lg:gap-10">
      <WelcomeHero />
      <SuggestionList onPick={onPick} className="mt-auto pb-2 lg:mt-0 lg:max-w-[28rem] lg:self-center lg:w-full" />
    </div>
  );
}

function WelcomeHero() {
  const { appName, t } = useI18n();
  return (
    <div className="flex flex-col items-center px-4 pt-2 text-center">
      <BrandIcon
        src={BRAND_ICONS.logo}
        alt="G3Q 3.0"
        priority
        className="size-[5.25rem] lg:size-[6.25rem]"
      />
      {/* <h2 className="mt-2 font-heading text-[1.5rem] font-bold leading-none tracking-tight text-[#2d689d] lg:mt-4 lg:text-[2rem]">
        {appName}
      </h2> */}
      <p className="mt-[-10px] max-w-[20rem] font-heading text-[14px] leading-[1.75] text-[#000000] lg:max-w-[28rem] lg:text-[15px]">
        {t("aiWelcomeBody")}
      </p>
    </div>
  );
}

function SuggestionList({ onPick, className }) {
  const { t } = useI18n();
  const suggestions = [
    { id: "semiconductor", text: t("aiSuggestion1"), Icon: ShieldSuggestionIcon },
    { id: "prize", text: t("aiSuggestion2"), Icon: TrophySuggestionIcon },
    { id: "join", text: t("aiSuggestion3"), Icon: AwardSuggestionIcon },
  ];
  return (
    <ul className={cn("space-y-[1.15rem] pb-[0px]", className)}>
      {suggestions.map(({ id, text, Icon }) => (
        <li key={id}>
          <button
            type="button"
            onClick={() => onPick(text)}
            className="flex w-full items-start gap-3 text-left active:opacity-70"
          >
            <Icon className="mt-[-4px] ml-[-6px] size-[1.4rem] shrink-0 text-[#737373]" />
            <span className="mt-[-5px] ml-[-6px] font-heading text-[16px] leading-snug text-[#737373]">{text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function RoundIconButton({ label, onClick, children, className }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-[#ffffff] text-[#000000] active:scale-95",
        className
      )}
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
