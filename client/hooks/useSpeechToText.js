"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function recognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * Browser SpeechRecognition (Chrome / Edge / Safari). Fills a prompt as the
 * user talks. `onText` receives only the spoken chunk (finals + current
 * interim); the caller prefixes any existing draft.
 */
export function useSpeechToText({ lang = "gu-IN", onText, onError } = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef(null);
  const finalsRef = useRef("");
  const onTextRef = useRef(onText);
  const onErrorRef = useRef(onError);
  onTextRef.current = onText;
  onErrorRef.current = onError;

  useEffect(() => {
    setSupported(Boolean(recognitionCtor()));
  }, []);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) {
      onErrorRef.current?.("unsupported");
      return;
    }

    stop();
    finalsRef.current = "";

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript ?? "";
        if (event.results[i].isFinal) {
          finalsRef.current += `${piece} `;
        } else {
          interim += piece;
        }
      }
      onTextRef.current?.(`${finalsRef.current}${interim}`.replace(/\s+/g, " ").trim());
    };

    rec.onerror = (event) => {
      const code = event?.error || "error";
      if (code === "aborted" || code === "no-speech") return;
      onErrorRef.current?.(code);
      setListening(false);
    };

    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
      onErrorRef.current?.("error");
    }
  }, [lang, stop]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => stop(), [stop]);

  return { supported, listening, start, stop, toggle };
}
