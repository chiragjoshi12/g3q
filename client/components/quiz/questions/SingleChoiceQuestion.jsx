"use client";

import { ChoiceOption } from "@/components/quiz/questions/ChoiceOption";

export function SingleChoiceQuestion({ question, value, onChange, disabled, revealed, celebrate }) {
  const selected = value ?? [];

  return (
    <div className="mx-auto w-full space-y-2.5">
      {question.options.map((option, index) => (
        <ChoiceOption
          key={option.id}
          index={index}
          label={option.label}
          selected={selected.includes(option.id)}
          isCorrectOption={question.answer.includes(option.id)}
          revealed={revealed}
          celebrate={celebrate}
          disabled={disabled}
          onToggle={() => onChange([option.id])}
        />
      ))}
    </div>
  );
}
