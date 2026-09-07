import { Noto_Sans_Gujarati } from "next/font/google";

import { QuestionRewriteDemo } from "@/components/rewrite/QuestionRewriteDemo";

const gujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "પહેલાં અને પછી · G3Q પ્રશ્નો",
  description:
    "મૂળ પ્રશ્નપત્રના અઘરા પ્રશ્નો અને G3Qમાં સરળ, ચલાયમાન સ્વરૂપ.",
};

export default function QuestionRewritePage() {
  return (
    <div className={gujarati.className}>
      <QuestionRewriteDemo />
    </div>
  );
}
