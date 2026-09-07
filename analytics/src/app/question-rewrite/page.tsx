import type { Metadata } from "next";
import { Noto_Sans_Gujarati } from "next/font/google";

import { QuestionRewriteDemo } from "@/components/question-rewrite-demo";

const gujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "G3Q Analytics · Before / After",
  description: "Question rewrite before-and-after showcase for G3Q.",
};

export default function QuestionRewritePage() {
  return (
    <div className={gujarati.className}>
      <QuestionRewriteDemo />
    </div>
  );
}
