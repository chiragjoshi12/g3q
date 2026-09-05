"use client";

import { QUESTION_TYPE } from "@/config/question-types";
import { DragDropQuestion } from "@/components/quiz/questions/DragDropQuestion";
import { DragIntoBlanksQuestion } from "@/components/quiz/questions/DragIntoBlanksQuestion";
import { ImageChoiceQuestion } from "@/components/quiz/questions/ImageChoiceQuestion";
import { MatchFollowingQuestion } from "@/components/quiz/questions/MatchFollowingQuestion";
import { SingleChoiceQuestion } from "@/components/quiz/questions/SingleChoiceQuestion";
import { TrueFalseQuestion } from "@/components/quiz/questions/TrueFalseQuestion";

/**
 * Type → renderer registry.
 *
 * Every renderer takes the same props ({ question, value, onChange, disabled,
 * revealed }), so supporting a new question type is one import plus one entry —
 * the quiz screen itself never changes.
 */
const RENDERERS = {
  [QUESTION_TYPE.SINGLE_CHOICE]: SingleChoiceQuestion,
  [QUESTION_TYPE.TRUE_FALSE]: TrueFalseQuestion,
  [QUESTION_TYPE.MATCH_FOLLOWING]: MatchFollowingQuestion,
  [QUESTION_TYPE.IMAGE_CHOICE]: ImageChoiceQuestion,
  [QUESTION_TYPE.DRAG_DROP]: DragDropQuestion,
  [QUESTION_TYPE.DRAG_INTO_BLANKS]: DragIntoBlanksQuestion,
};

export function QuestionRenderer({ question, ...props }) {
  const Renderer = RENDERERS[question?.type];

  if (!Renderer) {
    return (
      <p className="rounded-2xl bg-warning/10 px-3 py-2.5 text-sm text-[#8a5a04]">
        આ પ્રકારનો પ્રશ્ન હાલ સપોર્ટેડ નથી.
      </p>
    );
  }

  return <Renderer question={question} {...props} />;
}
