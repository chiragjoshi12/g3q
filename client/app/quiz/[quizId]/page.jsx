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
import { QUESTION_TYPE } from "@/config/question-types";
import { ROUTES } from "@/config/routes";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { usePracticeMode } from "@/hooks/usePracticeMode";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { isAnswered, isCorrect } from "@/lib/domain/grading";
import { useI18n } from "@/lib/i18n";
import { unlockQuizSounds } from "@/lib/quiz-sounds";
import { QUIZ_PHASE, useQuizStore } from "@/store/quiz.store";

const QUIZ_PLAY_BG_FALLBACK = "/quiz/play-bg.png";

/**
 * Quiz runner — glass header, illustrated backdrop, one question at a time.
 */
export default function QuizPage({ params }) {
  return (
    <Suspense
      fallback={
        <AppShell fullOnDesktop>
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
  const { language, t } = useI18n();
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
    if (ready) loadQuiz(quizId, { practice, language });
  }, [ready, quizId, practice, language, loadQuiz]);

  const question = questions[currentIndex] ?? null;
  const inlinePromptQuestion =
    question?.type === QUESTION_TYPE.DRAG_INTO_BLANKS;
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
    const attemptId = await finishQuiz(user, { practice });
    if (attemptId) router.replace(ROUTES.result(attemptId, { practice }));
  };

  const handleLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    const attemptId = await finishQuiz(user, { abandoned: true, practice });
    if (attemptId) {
      router.replace(ROUTES.result(attemptId, { practice }));
      return;
    }
    setLeaving(false);
    router.replace(practice && !user ? ROUTES.welcome : ROUTES.home);
  };

  if (!ready) {
    return (
      <AppShell fullOnDesktop>
        <LoadingState className="flex-1" />
      </AppShell>
    );
  }

  const playBg = question?.backgroundImageUrl || QUIZ_PLAY_BG_FALLBACK;

  return (
    <AppShell fullOnDesktop className="font-canva">
      {/* Full-bleed play backdrop — 30% opacity on every question. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#EEF2F6]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45"
        style={{ backgroundImage: `url('${playBg}')` }}
      />
      {/* Soft top wash for prompt readability only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-white/25 to-transparent"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <QuizHeader
          index={currentIndex}
          total={questions.length}
          elapsedMs={elapsedMs}
          paused={!answering}
          onExit={() => setConfirmExit(true)}
        />

        {/*
          Mobile: scroll pane + Submit as siblings (not an overlay).
          Overlay footers clipped match chips into a fake “box” behind Submit.
        */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <ContentWidth size="phone" className="px-5 py-5 sm:px-6 sm:py-6 md:max-w-none md:px-6 lg:max-w-[56rem] lg:px-10 lg:py-8">
              {loading && !question ? <LoadingState label={t("quizPreparing")} /> : null}
              {error ? (
                <ErrorState
                  message={error}
                  onRetry={() => loadQuiz(quizId, { restart: true, practice, language })}
                />
              ) : null}

              {question ? (
                <div
                  key={question.id}
                  data-quiz-question-card
                  className="animate-screen-in mx-auto max-w-[28.5rem] md:max-w-none lg:flex lg:min-h-[min(36rem,calc(100dvh-11rem))] lg:w-full lg:flex-col lg:rounded-[1.85rem] lg:bg-white/88 lg:px-14 lg:py-12 lg:shadow-[0_18px_50px_rgb(15_23_42/0.08)]"
                >
                  {!inlinePromptQuestion ? (
                    <h2 className="font-canva text-[1.08rem] leading-[1.55] font-bold text-[#111] drop-shadow-[0_1px_0_rgb(255_255_255/0.65)] sm:text-[1.18rem] lg:text-[1.35rem] lg:leading-[1.5] lg:drop-shadow-none">
                      {question.prompt}
                    </h2>
                  ) : null}

                  <div className={inlinePromptQuestion ? "mt-1 sm:mt-2" : "mt-7 sm:mt-8"}>
                    <QuestionRenderer
                      question={question}
                      value={value}
                      onChange={setAnswer}
                      disabled={!answering}
                      revealed={reviewing && verdictRevealed}
                    />
                  </div>

                  <div className="mt-6 hidden pt-1 md:block lg:mt-auto lg:pt-10">
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
          </div>

          {question ? (
            <div className="shrink-0 px-5 pt-1 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-6 md:hidden">
              <QuizAction
                answering={answering}
                answered={answered}
                isLast={isLast}
                loading={loading}
                onSubmit={handleSubmit}
                onNext={handleNext}
              />
            </div>
          ) : null}
        </div>
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
        title={t("leaveQuizTitle")}
        description={t("leaveQuizDescription")}
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
  const { t } = useI18n();

  if (answering) {
    return (
      <ActionButtonRow>
        <AppButton
          className={`${ACTION_BUTTON_CLASS} disabled:bg-[#e5ebf8] disabled:text-[#595858]`}
          onClick={onSubmit}
          disabled={!answered}
        >
          {t("submit")}
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
        {isLast ? t("viewResult") : t("next")}
      </AppButton>
    </ActionButtonRow>
  );
}
