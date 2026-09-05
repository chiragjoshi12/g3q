"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LineArrowRight, LogOut } from "@/components/icons";

import { ConfirmSheet } from "@/components/common/ConfirmSheet";
import { HelplineSheet } from "@/components/common/HelplineSheet";
import { BrandIcon } from "@/components/common/BrandIcon";
import { AuroraWash } from "@/components/layout/AuroraWash";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { ROUTES } from "@/config/routes";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useQuizStore } from "@/store/quiz.store";

const COLUMN = "mx-auto w-full max-w-[26.5rem] md:max-w-[32rem]";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const resetSession = useQuizStore((state) => state.resetSession);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [helplineOpen, setHelplineOpen] = useState(false);

  const handleLogout = () => {
    resetSession();
    logout();
    router.replace(ROUTES.auth);
  };

  return (
    <>
    <main className="no-scrollbar animate-screen-in relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#F5F7F9] pb-32">
      <div className="relative overflow-hidden pb-[3.75rem]">
        <AuroraWash
          src="/new-gradient-bg.png"
          className="inset-0 h-full"
          imageClassName="object-cover object-top"
        />
        <div className="relative">
          <BrandHeader
            plain
            trailing={
              <button
                type="button"
                onClick={() => setConfirmLogout(true)}
                aria-label="લોગ આઉટ"
                className="grid size-10 place-items-center rounded-full border border-[#E8ECF0] bg-white transition-transform active:scale-95"
              >
                <LogOut className="size-4.5 text-[#111]" strokeWidth={2} />
              </button>
            }
          />
          <div className={cn(COLUMN)}>
            <div className="h-10" />
          </div>
        </div>
      </div>

      <div className={cn("relative -mt-[3.75rem] px-5 pb-8 sm:px-6", COLUMN)}>
        <div className="flex flex-col items-center text-center">
          <div className="relative z-10 size-[7.5rem] overflow-hidden rounded-full bg-[#d8dde3] ring-[3px] ring-white">
            <Image
              src={BRAND_ICONS.profilePhoto}
              alt={user?.name ?? ""}
              width={240}
              height={240}
              priority
              className="size-full object-cover object-[center_18%]"
            />
          </div>
          <h2 className="mt-6 font-heading text-[18px] leading-tight font-bold text-[#000000]">
            {user?.name}
          </h2>
          {user?.institute ? (
            <p className="mt-2.5 max-w-sm font-heading text-[14px] leading-snug text-[#000000]">
              {user.institute}
            </p>
          ) : null}
          {user?.grade ? (
            <p className="mt-1.5 font-heading text-[14px] text-[#000000]">{user.grade}</p>
          ) : null}
        </div>

        <section className="mt-9 overflow-hidden rounded-[2rem] bg-white shadow-[0_12px_32px_rgb(15_23_42/0.06)]">
          <nav>
            <MenuRow
              iconSrc={BRAND_ICONS.quizAttempts}
              iconBg="bg-[#f4e5f8]"
              label="Quiz attempts"
              onClick={() => router.push(ROUTES.quizAttempts)}
            />
            <MenuRow
              iconSrc={BRAND_ICONS.certificates}
              iconBg="bg-[#e8f8ed]"
              label="Certificates"
              onClick={() => router.push(ROUTES.certificates)}
            />
            <MenuRow
              iconSrc={BRAND_ICONS.aboutAbhinyan}
              iconBg="bg-[#f6f8e5]"
              label="About Abhinyan"
              onClick={() => router.push(ROUTES.abhiyan)}
            />
            <MenuRow
              iconSrc={BRAND_ICONS.helpline}
              iconBg="bg-[#e5ebf8]"
              label="Helpline"
              onClick={() => setHelplineOpen(true)}
              last
            />
          </nav>
        </section>
      </div>
    </main>
      <ConfirmSheet
        open={confirmLogout}
        icon={LogOut}
        title="લોગઆઉટ કરો"
        description="શું તમે ખરેખર તમારા એકાઉન્ટમાંથી લોગ આઉટ કરવા માંગો છો?"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
      />
      <HelplineSheet open={helplineOpen} onClose={() => setHelplineOpen(false)} />
    </>
  );
}

function MenuRow({ iconSrc, iconBg, label, onClick, last = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 px-6 py-[1.2rem] text-left transition-colors hover:bg-[#FAFAFA]",
        !last && "border-b border-[#F3F4F6]"
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-full", iconBg)}>
        <BrandIcon src={iconSrc} alt="" className="size-8" />
      </span>
      <span className="min-w-0 flex-1 font-heading text-[1.05rem] font-semibold text-[#111]">
        {label}
      </span>
      <LineArrowRight className="size-4 shrink-0 text-black" />
    </button>
  );
}
