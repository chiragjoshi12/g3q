"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { createAttemptId, quizController } from "@/controllers/quiz.controller";
import { toMessage } from "@/lib/core/errors";
import { emptyAnswerFor, isAnswered } from "@/lib/domain/grading";
import { STORAGE_KEYS, zustandStorage } from "@/lib/storage/storage";

/**
 * The quiz session state machine.
 *
 * ANSWERING  → timer running, Next is blocked, Submit appears once answered
 * REVIEWING  → timer paused, correctness + AI explanation shown, Next unlocked
 * COMPLETED  → attempt graded and persisted
 *
 * Note on selectors: nothing here returns a freshly-allocated object or a
 * time-dependent value, because Zustand v5 reads through useSyncExternalStore
 * and an unstable snapshot causes a render loop. Live elapsed time is read
 * imperatively via `useQuestionTimer`, not selected.
 */
export const QUIZ_PHASE = {
  ANSWERING: "answering",
  REVIEWING: "reviewing",
  COMPLETED: "completed",
};

const blankSession = {
  attemptId: null,
  startedAt: null,
  currentIndex: 0,
  answers: {},
  timings: {},
  phase: QUIZ_PHASE.ANSWERING,
  accumulatedMs: 0,
  runningSince: null,
  completedAttemptId: null,
};

/**
 * Guarantees `answers[questionId]` exists before the user touches anything.
 * Types like drag-to-order start from a meaningful default, and grading always
 * reads the same value the UI rendered.
 */
function withSeededAnswer(answers, question) {
  if (!question || answers[question.id] !== undefined) return answers;
  return { ...answers, [question.id]: emptyAnswerFor(question) };
}

export const useQuizStore = create()(
  persist(
    (set, get) => ({
      // Content — always refetched from the data source, never persisted.
      quiz: null,
      questions: [],
      explanations: {},
      loading: false,
      error: null,

      // Progress — persisted so a reload resumes mid-quiz.
      quizId: null,
      ...blankSession,

      /* ----------------------------- selectors ----------------------------- */

      currentQuestion: () => {
        const { questions, currentIndex } = get();
        return questions[currentIndex] ?? null;
      },

      canSubmit: () => {
        const state = get();
        const question = state.currentQuestion();
        if (!question || state.phase !== QUIZ_PHASE.ANSWERING) return false;
        return isAnswered(question, state.answers[question.id]);
      },

      isLastQuestion: () => {
        const { questions, currentIndex } = get();
        return questions.length > 0 && currentIndex === questions.length - 1;
      },

      /** Imperative only — never use as a Zustand selector. */
      readElapsedMs: () => {
        const { accumulatedMs, runningSince } = get();
        return accumulatedMs + (runningSince ? Date.now() - runningSince : 0);
      },

      /* ------------------------------ actions ------------------------------ */

      /**
       * Loads quiz content and either resumes persisted progress for the same
       * quiz or starts a fresh attempt.
       */
      loadQuiz: async (quizId, { restart = false } = {}) => {
        set({ loading: true, error: null });
        try {
          const { quiz, questions, explanations } =
            await quizController.loadBundle(quizId);
          const state = get();
          const resumable =
            !restart &&
            state.quizId === quizId &&
            Boolean(state.attemptId) &&
            state.phase !== QUIZ_PHASE.COMPLETED &&
            state.currentIndex < questions.length;

          if (resumable) {
            set({
              quiz,
              questions,
              explanations,
              loading: false,
              answers: withSeededAnswer(state.answers, questions[state.currentIndex]),
              // Restart the running span now so time spent with the app closed
              // is never billed to the question.
              runningSince: state.phase === QUIZ_PHASE.ANSWERING ? Date.now() : null,
            });
            return;
          }

          set({
            quiz,
            questions,
            explanations,
            loading: false,
            quizId,
            ...blankSession,
            answers: withSeededAnswer({}, questions[0]),
            attemptId: createAttemptId(quizId),
            startedAt: Date.now(),
            runningSince: Date.now(),
          });
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
        }
      },

      setAnswer: (value) => {
        const state = get();
        const question = state.currentQuestion();
        if (!question || state.phase !== QUIZ_PHASE.ANSWERING) return;
        set({ answers: { ...state.answers, [question.id]: value } });
      },

      /** Locks the answer, freezes the timer, and reveals the explanation. */
      submitAnswer: () => {
        const state = get();
        const question = state.currentQuestion();
        if (!question || !state.canSubmit()) return false;

        const elapsed = state.readElapsedMs();
        set({
          phase: QUIZ_PHASE.REVIEWING,
          runningSince: null,
          accumulatedMs: elapsed,
          timings: { ...state.timings, [question.id]: elapsed },
        });
        return true;
      },

      /** Advances to the next question and restarts the timer. */
      nextQuestion: () => {
        const state = get();
        if (state.phase !== QUIZ_PHASE.REVIEWING || state.isLastQuestion()) return false;
        const nextIndex = state.currentIndex + 1;
        set({
          currentIndex: nextIndex,
          phase: QUIZ_PHASE.ANSWERING,
          answers: withSeededAnswer(state.answers, state.questions[nextIndex]),
          accumulatedMs: 0,
          runningSince: Date.now(),
        });
        return true;
      },

      /** Grades and persists the attempt. Returns the attempt id for routing. */
      finishQuiz: async (user) => {
        const state = get();
        if (state.phase !== QUIZ_PHASE.REVIEWING || !state.isLastQuestion()) return null;
        set({ loading: true });
        try {
          const attempt = await quizController.finalizeAttempt({
            attemptId: state.attemptId,
            quiz: state.quiz,
            questions: state.questions,
            answers: state.answers,
            timings: state.timings,
            startedAt: state.startedAt,
            user,
          });
          set({
            loading: false,
            phase: QUIZ_PHASE.COMPLETED,
            runningSince: null,
            completedAttemptId: attempt.attemptId,
          });
          return attempt.attemptId;
        } catch (error) {
          set({ loading: false, error: toMessage(error) });
          return null;
        }
      },

      /** Clears session progress but keeps loaded content. */
      resetSession: () => set({ quizId: null, ...blankSession }),
    }),
    {
      name: STORAGE_KEYS.quizProgress,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        quizId: state.quizId,
        attemptId: state.attemptId,
        startedAt: state.startedAt,
        currentIndex: state.currentIndex,
        answers: state.answers,
        timings: state.timings,
        phase: state.phase,
        accumulatedMs: state.accumulatedMs,
        completedAttemptId: state.completedAttemptId,
      }),
      onRehydrateStorage: () => (state) => {
        // A persisted running span is meaningless across reloads; loadQuiz
        // restarts it once content is available.
        if (state) state.runningSince = null;
      },
    }
  )
);
