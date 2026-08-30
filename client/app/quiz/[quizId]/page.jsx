"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@/components/icons";

import { AppButton } from "@/components/common/AppButton";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { AppShell } from "@/components/layout/AppShell";
import { ContentWidth } from "@/components/layout/ContentWidth";
import { AiExplanationSheet } from "@/components/quiz/AiExplanationSheet";
import { AnswerVerdict } from "@/components/quiz/AnswerVerdict";
import { QuestionRenderer } from "@/components/quiz/QuestionRenderer";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { ROUTES } from "@/config/routes";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { isAnswered, isCorrect } from "@/lib/domain/grading";
import { cn } from "@/lib/utils";
import { QUIZ_PHASE, useQuizStore } from "@/store/quiz.store";

/**
 * Quiz runner.
 *
 * One question at a time. The timer runs while answering and freezes on submit;
 * Next stays locked until an answer is submitted, so a question can never be
 * skipped.
 */
export default function QuizPage({ params }) {
  const { quizId } = use(params);
  const router = useRouter();
  const { ready, user } = useAuthGuard();
  const [confirmExit, setConfirmExit] = useState(false);
  // The color-coded right/wrong styling on the answer itself waits for this,
  // so scanning ahead to green/red can't spoil the "why" you're meant to
  // read first — it flips true once the AI explanation finishes writing (or
  // immediately, if resuming a session that was already past that point).
  const [verdictRevealed, setVerdictRevealed] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const loadQuiz = useQuizStore((state) => state.loadQuiz);
  const setAnswer = useQuizStore((state) => state.setAnswer);
  const submitAnswer = useQuizStore((state) => state.submitAnswer);
  const nextQuestion = useQuizStore((state) => state.nextQuestion);
  const finishQuiz = useQuizStore((state) => state.finishQuiz);

  const questions = useQuizStore((state) => state.questions);
  const explanations = useQuizStore((state) => state.explanations);
  const answers = useQuizStore((state) => state.answers);
  const timings = useQuizStore((state) => state.timings);
  const currentIndex = useQuizStore((state) => state.currentIndex);
  const phase = useQuizStore((state) => state.phase);
  const loading = useQuizStore((state) => state.loading);
  const error = useQuizStore((state) => state.error);

  useEffect(() => {
    if (ready) loadQuiz(quizId);
  }, [ready, quizId, loadQuiz]);

  const question = questions[currentIndex] ?? null;
  const answering = phase === QUIZ_PHASE.ANSWERING;
  const reviewing = phase === QUIZ_PHASE.REVIEWING;
  const isLast = questions.length > 0 && currentIndex === questions.length - 1;

  const elapsedMs = useQuestionTimer({
    running: answering && Boolean(question),
    questionId: question?.id,
  });

  const value = question ? answers[question.id] : null;
  // Derived from subscribed state, not store.getState(), so Submit appears the
  // moment the answer becomes valid.
  const answered = Boolean(question) && isAnswered(question, value);

  // Resets for each new question. If a session resumes straight into review
  // (app closed right after submitting), skip the reveal ceremony rather
  // than replaying it — but never re-open a popup for something already
  // answered in a past session.
  useEffect(() => {
    const reset = (revealed) => {
      setVerdictRevealed(revealed);
      setExplanationOpen(false);
    };
    reset(reviewing);
    // Deliberately only re-runs when the question itself changes; `reviewing`
    // is read for its value at that moment, not tracked afterwards — the
    // in-session submit → review transition is handled by handleSubmit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const handleSubmit = () => {
    if (submitAnswer()) setExplanationOpen(true);
  };

  const handleNext = async () => {
    if (!isLast) {
      nextQuestion();
      return;
    }
    const attemptId = await finishQuiz(user);
    if (attemptId) router.replace(ROUTES.result(attemptId));
  };

  if (!ready) {
    return (
      <AppShell>
        <LoadingState className="flex-1" />
      </AppShell>
    );
  }

  return (
    <AppShell className="bg-[#F2F2F2] font-canva">
      <QuizHeader
        index={currentIndex}
        total={questions.length}
        elapsedMs={elapsedMs}
        paused={!answering}
        onExit={() => setConfirmExit(true)}
      />

      <main className="no-scrollbar flex-1 overflow-y-auto overscroll-contain bg-[#F2F2F2]">
        <ContentWidth size="phone" className="px-4 py-4 sm:px-6 sm:py-5 md:max-w-none md:px-5 md:py-5">
          {loading && !question ? <LoadingState label="ક્વિઝ તૈયાર થઈ રહી છે…" /> : null}
          {error ? (
            <ErrorState message={error} onRetry={() => loadQuiz(quizId, { restart: true })} />
          ) : null}

          {question ? (
            <div
              key={question.id}
              className="animate-screen-in space-y-5"
            >
              <h2 className="font-canva text-lg leading-snug font-bold text-[#111] sm:text-xl">
                {question.prompt}
              </h2>

              <QuestionRenderer
                question={question}
                value={value}
                onChange={setAnswer}
                disabled={!answering}
                revealed={reviewing && verdictRevealed}
                celebrate={reviewing && verdictRevealed && !explanationOpen}
              />

              {verdictRevealed && !explanationOpen ? (
                <AnswerVerdict
                  correct={isCorrect(question, value)}
                  timeSpentMs={timings[question.id] ?? 0}
                />
              ) : null}

              <div className="hidden pt-2 md:block">
                {!explanationOpen ? (
                  <QuizAction
                    answering={answering}
                    answered={answered}
                    isLast={isLast}
                    loading={loading}
                    onSubmit={handleSubmit}
                    onNext={handleNext}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </ContentWidth>
      </main>

      {question ? (
        <footer className="shrink-0 bg-[#F2F2F2] pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
          <ContentWidth size="play" className="px-5 py-4 sm:px-6">
            <QuizAction
              answering={answering}
              answered={answered}
              isLast={isLast}
              loading={loading}
              onSubmit={handleSubmit}
              onNext={handleNext}
            />
          </ContentWidth>
        </footer>
      ) : null}

      {reviewing && explanationOpen && question ? (
        <AiExplanationSheet
          explanation={explanations[question.id]}
          correct={isCorrect(question, value)}
          isLast={isLast}
          onDone={() => setVerdictRevealed(true)}
          onDismiss={() => {
            setVerdictRevealed(true);
            setExplanationOpen(false);
          }}
          onContinue={() => {
            setExplanationOpen(false);
            handleNext();
          }}
        />
      ) : null}

      {confirmExit ? (
        <ExitDialog
          onCancel={() => setConfirmExit(false)}
          onConfirm={() => router.replace(ROUTES.home)}
        />
      ) : null}
    </AppShell>
  );
}

function QuizAction({ answering, answered, isLast, loading, onSubmit, onNext }) {
  const pill =
    "h-14 w-[86%] bg-[#2d689d] font-canva text-[1.05rem] font-bold text-white hover:bg-[#255a88]";
  const canvaFace = {
    fontFamily: '"Canva Sans", ui-sans-serif, system-ui, sans-serif',
  };

  if (answering) {
    return (
      <div className="flex justify-center">
        <AppButton className={pill} style={canvaFace} onClick={onSubmit} disabled={!answered}>
          Submit
        </AppButton>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <AppButton
        variant={isLast ? "success" : "filled"}
        className={cn(pill, isLast && "bg-success hover:brightness-95")}
        style={canvaFace}
        onClick={onNext}
        loading={loading}
      >
        {isLast ? "પરિણામ જુઓ" : "Next"}
        {!isLast ? <ArrowLeft className="size-4 rotate-180" /> : null}
      </AppButton>
    </div>
  );
}

function ExitDialog({ onCancel, onConfirm }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/40 p-6 backdrop-blur-[2px]">
      <div className="animate-pop-in w-full max-w-sm space-y-4 rounded-3xl bg-surface p-5 shadow-m3 sm:p-6">
        <div className="space-y-1.5">
          <h3 className="font-heading text-lg font-bold">ક્વિઝ છોડવી છે?</h3>
          <p className="text-sm text-muted-foreground">
            તમારી પ્રગતિ સાચવેલી રહેશે અને તમે પછીથી ત્યાંથી જ ચાલુ કરી શકશો.
          </p>
        </div>
        <div className="space-y-2">
          <AppButton block size="md" variant="outline" onClick={onCancel}>
            ચાલુ રાખો
          </AppButton>
          <AppButton block size="md" variant="text" onClick={onConfirm}>
            હા, છોડો
          </AppButton>
        </div>
      </div>
    </div>
  );
}
