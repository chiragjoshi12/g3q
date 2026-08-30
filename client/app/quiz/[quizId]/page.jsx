"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "@/components/icons";
import { ACTION_BUTTON_CLASS, ActionButtonRow, AppButton } from "@/components/common/AppButton";
import { ConfirmSheet } from "@/components/common/ConfirmSheet";
import { ErrorState, LoadingState } from "@/components/common/StateViews";
import { AppShell } from "@/components/layout/AppShell";
import { ContentWidth } from "@/components/layout/ContentWidth";
import { AiExplanationSheet } from "@/components/quiz/AiExplanationSheet";
import { QuestionRenderer } from "@/components/quiz/QuestionRenderer";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { ROUTES } from "@/config/routes";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { isAnswered, isCorrect } from "@/lib/domain/grading";
import { QUIZ_PHASE, useQuizStore } from "@/store/quiz.store";

/**
 * Quiz runner.
 *
 * One question at a time. The timer runs while answering and freezes on submit;
 * Next stays locked until an answer is submitted, so a question can never be
 * skipped.
 */
export default function QuizPage({ params }) {
  return (
    <Suspense
      fallback={
        <AppShell>
          <LoadingState className="flex-1" />
        </AppShell>
      }
    >
      <QuizScreen params={params} />
    </Suspense>
  );
}

function QuizScreen({ params }) {
  const { quizId } = use(params);
  const router = useRouter();
  const practice = usePracticeMode();
  const { ready, user } = useAuthGuard({ optional: practice });
  const [confirmExit, setConfirmExit] = useState(false);
  const [leaving, setLeaving] = useState(false);
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
    if (attemptId) router.replace(ROUTES.result(attemptId, { practice }));
  };

  const handleLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    const attemptId = await finishQuiz(user, { abandoned: true });
    if (attemptId) {
      router.replace(ROUTES.result(attemptId, { practice }));
      return;
    }
    setLeaving(false);
    router.replace(practice && !user ? ROUTES.root : ROUTES.home);
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
            <div key={question.id} className="animate-screen-in">
              <h2 className="font-canva text-lg leading-snug font-bold text-[#111] sm:text-xl">
                {question.prompt}
              </h2>

              <div className="mt-8 sm:mt-9">
                <QuestionRenderer
                  question={question}
                  value={value}
                  onChange={setAnswer}
                  disabled={!answering}
                  revealed={reviewing && verdictRevealed}
                />
              </div>

              <div className="mt-5 hidden pt-2 md:block">
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

      <ConfirmSheet
        open={confirmExit}
        icon={LogOut}
        title="ક્વિઝ છોડો"
        description="અત્યાર સુધીના સાચા અને ખોટા જવાબ પર પરિણામ બતાવવામાં આવશે. શું તમે ક્વિઝ છોડવા માંગો છો?"
        busy={leaving}
        onCancel={() => {
          if (!leaving) setConfirmExit(false);
        }}
        onConfirm={handleLeave}
      />
    </AppShell>
  );
}

function QuizAction({ answering, answered, isLast, loading, onSubmit, onNext }) {
  if (answering) {
    return (
      <ActionButtonRow>
        <AppButton className={ACTION_BUTTON_CLASS} onClick={onSubmit} disabled={!answered}>
          Submit
        </AppButton>
      </ActionButtonRow>
    );
  }

  return (
    <ActionButtonRow>
      <AppButton
        className={ACTION_BUTTON_CLASS}
        onClick={onNext}
        loading={loading}
      >
        {isLast ? "પરિણામ જુઓ" : "Next"}
      </AppButton>
    </ActionButtonRow>
  );
}
