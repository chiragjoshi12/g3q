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
import { unlockQuizSounds } from "@/lib/quiz-sounds";
import { QUIZ_PHASE, useQuizStore } from "@/store/quiz.store";

const QUIZ_PLAY_BG = "/quiz/play-bg.png";
const QUIZ_QUESTION_BGS = [
  QUIZ_PLAY_BG,
  "/quiz-bg/q2.jpeg",
  "/quiz-bg/q3.jpeg",
  "/quiz-bg/q4.jpeg",
  "/quiz-bg/q5.jpeg",
  "/quiz-bg/q6.jpeg",
];

function quizPlayBackground(index) {
  const src = QUIZ_QUESTION_BGS[index] ?? QUIZ_PLAY_BG;
  return { src, faded: index > 0 };
}

/**
 * Quiz runner — glass header, illustrated backdrop, one question at a time.
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
  const answered = Boolean(question) && isAnswered(question, value);

  useEffect(() => {
    const reset = (revealed) => {
      setVerdictRevealed(revealed);
      setExplanationOpen(false);
    };
    reset(reviewing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  const handleSubmit = () => {
    unlockQuizSounds();
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

  const { src: playBg, faded: playBgFaded } = quizPlayBackground(currentIndex);

  return (
    <AppShell className="font-canva">
      {/* Full-bleed play backdrop — question 1 keeps the original art; 2–6 use quiz-bg at 50%. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#EEF2F6]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${playBg}')`,
          opacity: playBgFaded ? 0.5 : 1,
        }}
      />
      {playBgFaded ? null : (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-white/35 to-white/65"
        />
      )}

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <QuizHeader
          index={currentIndex}
          total={questions.length}
          elapsedMs={elapsedMs}
          paused={!answering}
          onExit={() => setConfirmExit(true)}
        />

        <main className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ContentWidth size="phone" className="px-5 py-5 sm:px-6 sm:py-6 md:max-w-none md:px-6">
            {loading && !question ? <LoadingState label="ક્વિઝ તૈયાર થઈ રહી છે…" /> : null}
            {error ? (
              <ErrorState message={error} onRetry={() => loadQuiz(quizId, { restart: true })} />
            ) : null}

            {question ? (
              <div key={question.id} className="animate-screen-in mx-auto max-w-[26.5rem] md:max-w-none">
                <h2 className="font-canva text-[1.08rem] leading-[1.55] font-bold text-[#111] drop-shadow-[0_1px_0_rgb(255_255_255/0.65)] sm:text-[1.18rem]">
                  {question.prompt}
                </h2>

                <div className="mt-7 sm:mt-8">
                  <QuestionRenderer
                    question={question}
                    value={value}
                    onChange={setAnswer}
                    disabled={!answering}
                    revealed={reviewing && verdictRevealed}
                  />
                </div>

                <div className="mt-6 hidden pt-1 md:block">
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
          <footer className="relative z-20 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-white/50 to-transparent" />
            <ContentWidth size="play" className="relative px-5 py-3 sm:px-6">
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
      </div>

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
        <AppButton
          className={ACTION_BUTTON_CLASS}
          onClick={onSubmit}
          disabled={!answered}
        >
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
