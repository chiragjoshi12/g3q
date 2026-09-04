"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/** Compact markdown styles for G3Q AI bubbles. */
export function ChatMarkdown({ children, className }) {
  const text = typeof children === "string" ? children : "";

  return (
    <div
      className={cn(
        "chat-md text-[14px] leading-relaxed text-[#111] break-words",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-0.5",
        "[&_strong]:font-semibold",
        "[&_em]:italic",
        "[&_a]:text-[#2d689d] [&_a]:underline",
        "[&_code]:rounded [&_code]:bg-[#F3F4F6] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12.5px]",
        "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-[#F3F4F6] [&_pre]:p-3",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-[1.05rem] [&_h1]:font-bold",
        "[&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:text-[0.98rem] [&_h2]:font-bold",
        "[&_h3]:mb-1 [&_h3]:mt-2.5 [&_h3]:text-[0.95rem] [&_h3]:font-semibold",
        "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[#D1D5DB] [&_blockquote]:pl-3 [&_blockquote]:text-[#4B5563]",
        "[&_hr]:my-3 [&_hr]:border-[#E5E7EB]",
        "[&_table]:my-2 [&_table]:w-full [&_table]:text-left [&_table]:text-[13px]",
        "[&_th]:border-b [&_th]:border-[#E5E7EB] [&_th]:py-1 [&_th]:pr-2 [&_th]:font-semibold",
        "[&_td]:border-b [&_td]:border-[#F3F4F6] [&_td]:py-1 [&_td]:pr-2",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
