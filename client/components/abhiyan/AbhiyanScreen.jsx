"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ACTION_BUTTON_CLASS,
  AppButton,
} from "@/components/common/AppButton";
import { BrandIcon } from "@/components/common/BrandIcon";
import { SegmentedToggle } from "@/components/common/SegmentedToggle";
import { AppShell } from "@/components/layout/AppShell";
import {
  ArrowRight,
  Award,
  Building2,
  CalendarDays,
  Clock,
  GraduationCap,
  ShieldCheck,
  Trophy,
  User,
} from "@/components/icons";
import { ROUTES, setPostAuthPath } from "@/config/routes";
import {
  ABHIYAN,
  BUDGET,
  LEVELS,
  PARTICIPANTS,
  PRIZES,
  RULES,
} from "@/data/abhiyan";
import { useStoreHydrated } from "@/hooks/useStoreHydrated";
import { BRAND_ICONS } from "@/lib/brand-icons";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const PARTICIPANT_ICONS = {
  school: GraduationCap,
  college: Building2,
  citizen: User,
};

const PRIZE_TABS = [
  { id: "taluka", label: PRIZES.taluka.label },
  { id: "district", label: PRIZES.district.label },
  { id: "state", label: PRIZES.state.label },
];

export function AbhiyanScreen() {
  const router = useRouter();
  const hydrated = useStoreHydrated(useAuthStore);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [prizeLevel, setPrizeLevel] = useState("taluka");

  const prize = PRIZES[prizeLevel];

  return (
    <AppShell className="items-center bg-[#E8E8E8] md:items-stretch md:bg-[#F3F3F3]">
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[26.5rem] flex-col bg-[#F3F3F3] md:max-w-none">
        <header className="relative z-20 shrink-0 bg-white px-3 py-3 shadow-[0_1px_0_rgb(15_23_42/0.08)]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  try {
                    const ref = document.referrer;
                    if (ref && new URL(ref).origin === window.location.origin) {
                      router.back();
                      return;
                    }
                  } catch {
                    /* stay on a known in-app route */
                  }
                }
                router.push(ROUTES.root);
              }}
              aria-label="પાછળ જાઓ"
              className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-[#F3F3F3] active:scale-95"
            >
              <ArrowRight className="size-5 rotate-180 text-[#111]" />
            </button>
            <BrandIcon
              src={BRAND_ICONS.logo}
              alt="G3Q 2.0"
              priority
              className="size-10 shrink-0"
            />
            <div className="min-w-0 flex-1 pl-1">
              <p className="truncate font-heading text-[1.05rem] leading-tight font-bold text-primary-600">
                G3Q અભિયાન
              </p>
              <p className="truncate text-[11px] text-[#6B7280]">{ABHIYAN.english}</p>
            </div>
          </div>
        </header>

        <main className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-4 px-4 pt-4 pb-10">
            <div className="overflow-hidden rounded-[1.6rem] bg-primary-600 px-5 py-6 text-white">
              <p className="text-[12px] font-semibold tracking-[0.18em] text-white/70 uppercase">
                {ABHIYAN.kicker}
              </p>
              <h1 className="font-heading mt-2 text-[1.7rem] leading-tight font-bold">
                {ABHIYAN.title}
              </h1>
              <p className="mt-3 text-[14px] leading-relaxed text-white/85">{ABHIYAN.lead}</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {ABHIYAN.heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/12 px-2 py-3 text-center"
                  >
                    <p className="font-[family-name:var(--font-archivo)] text-[1.35rem] leading-none">
                      {stat.value}
                    </p>
                    <p className="mt-1.5 text-[11px] leading-tight text-white/75">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <section className="rounded-[1.6rem] bg-white px-5 py-6">
              <SectionTitle icon={Award} title="આ અભિયાન શું છે?" />
              <p className="mt-4 text-[15px] leading-[1.7] text-[#4B5563]">{ABHIYAN.purpose}</p>
              <div className="mt-4 rounded-[1.2rem] bg-[#FFF7ED] px-4 py-4">
                <p className="text-[12px] font-semibold tracking-wide text-[#9A4F00]">
                  G3Q 2026 નો મુખ્ય વિષય
                </p>
                <p className="mt-1.5 text-[15px] leading-relaxed font-semibold text-[#7C2D12]">
                  {ABHIYAN.theme}
                </p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {LEVELS.map((level) => (
                  <div
                    key={level.id}
                    className="rounded-2xl bg-[#F5F7F9] px-2 py-3 text-center"
                  >
                    <p className="text-[11px] font-semibold text-primary-600">{level.step}</p>
                    <p className="mt-1 text-[13px] leading-tight font-bold text-[#111]">
                      {level.title}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.6rem] bg-white px-5 py-6">
              <SectionTitle icon={GraduationCap} title="કોણ ભાગ લઈ શકે?" />
              <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
                ત્રણ કેટેગરીમાં સ્પર્ધા ચાલે છે. દરેકની અલગ લીડરબોર્ડ અને અલગ વિજેતા યાદી.
              </p>
              <ul className="mt-4 space-y-3">
                {PARTICIPANTS.map((item) => {
                  const Icon = PARTICIPANT_ICONS[item.id];
                  return (
                    <li
                      key={item.id}
                      className="flex gap-3 rounded-[1.2rem] bg-[#F5F7F9] px-3.5 py-3.5"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-primary-700">
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-heading text-[15px] font-bold text-[#111]">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-[13px] leading-relaxed text-[#4B5563]">
                          {item.body}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-[1.6rem] bg-white px-5 py-6">
              <SectionTitle icon={ShieldCheck} title="નિયમો" />
              <div className="mt-4 overflow-hidden rounded-[1.2rem] bg-[#EEF4FA]">
                <div className="flex items-center gap-3 px-4 py-3">
                  <Clock className="size-5 text-primary-700" />
                  <div>
                    <p className="text-[13px] font-bold text-[#111]">રવિવાર — શુક્રવાર</p>
                    <p className="text-[12px] text-[#4B5563]">સવારે ૮:૦૦ થી રાત્રે ૧૦:૦૦</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t border-white/70 px-4 py-3">
                  <CalendarDays className="size-5 text-primary-700" />
                  <div>
                    <p className="text-[13px] font-bold text-[#111]">શનિવાર</p>
                    <p className="text-[12px] text-[#4B5563]">વિજેતાઓ જાહેર થાય</p>
                  </div>
                </div>
              </div>
              <ol className="mt-4 space-y-3">
                {RULES.map((rule, index) => (
                  <li key={rule.title} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-50 text-[12px] font-bold text-primary-800">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-[14px] font-bold text-[#111]">{rule.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-[#4B5563]">
                        {rule.body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-[1.6rem] bg-white px-5 py-6">
              <SectionTitle icon={Trophy} title="લીડરબોર્ડ અને વિજેતા" />
              <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
                તાલુકાથી રાજ્ય સુધી — દરેક સ્તરે ટોપ રેન્ક જ આગળ વધે છે.
              </p>
              <div className="mt-5 space-y-3">
                {LEVELS.map((level, index) => (
                  <article key={level.id} className="rounded-[1.25rem] bg-[#F5F7F9] px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-600 font-[family-name:var(--font-archivo)] text-[13px] text-white">
                        {level.step}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading text-[16px] font-bold text-[#111]">
                          {level.title}
                        </h3>
                        <p className="text-[12px] text-primary-700">{level.subtitle}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-[#4B5563]">
                      {level.summary}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {level.points.map((point) => (
                        <li
                          key={point}
                          className="pl-3 text-[13px] leading-relaxed text-[#374151]"
                          style={{
                            background:
                              "linear-gradient(90deg, #2C6698 0 6px, transparent 6px) 0 0.55em / 6px 6px no-repeat",
                          }}
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {level.stats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-white px-2 py-2.5 text-center"
                        >
                          <p className="text-[15px] font-bold text-primary-700">{stat.value}</p>
                          <p className="mt-0.5 text-[10px] leading-tight text-[#6B7280]">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                    {index < LEVELS.length - 1 ? (
                      <p className="mt-3 text-center text-[11px] font-semibold tracking-wide text-[#9CA3AF]">
                        ↓ આગળનું સ્તર
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[1.6rem] bg-white px-5 py-6">
              <SectionTitle icon={Award} title="પુરસ્કાર" />
              <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
                કુલ પુરસ્કાર બજેટ {ABHIYAN.totalPrizeShort}. સ્તર પસંદ કરીને રકમ જુઓ.
              </p>
              <div className="mt-4">
                <SegmentedToggle
                  items={PRIZE_TABS}
                  value={prizeLevel}
                  onChange={setPrizeLevel}
                />
              </div>
              <p className="mt-3 text-[12px] text-[#6B7280]">{prize.note}</p>
              <div className="mt-4 space-y-4">
                {prize.groups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-[13px] font-bold text-[#111]">{group.title}</h3>
                    <ul className="mt-2 overflow-hidden rounded-[1.1rem] border border-[#EEF1F4]">
                      {group.rows.map((row, index) => (
                        <li
                          key={`${group.title}-${row.rank}`}
                          className={cn(
                            "flex items-center justify-between gap-3 px-3.5 py-3",
                            index > 0 && "border-t border-[#EEF1F4]"
                          )}
                        >
                          <span className="text-[13px] text-[#4B5563]">{row.rank}</span>
                          <span className="text-right">
                            <span className="block text-[15px] font-bold text-[#111]">
                              {row.amount}
                            </span>
                            {row.extra ? (
                              <span className="block text-[11px] font-semibold text-saffron">
                                + {row.extra}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.2rem] bg-[#FFF7ED] px-4 py-4">
                <p className="text-[12px] font-semibold tracking-wide text-[#9A4F00]">
                  કુલ પુરસ્કાર બજેટ
                </p>
                <ul className="mt-3 space-y-2">
                  {BUDGET.map((row) => (
                    <li key={row.label} className="flex items-center justify-between text-[13px]">
                      <span className="text-[#7C2D12]">{row.label}</span>
                      <span className="font-semibold text-[#111]">{row.amount}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-[#FED7AA] pt-3">
                  <span className="text-[14px] font-bold text-[#7C2D12]">કુલ</span>
                  <span className="font-heading text-[16px] font-bold text-[#111]">
                    {ABHIYAN.totalPrize}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex flex-col items-center pt-1 pb-4">
              <AppButton
                onClick={() => {
                  if (hydrated && isAuthenticated) {
                    router.push(ROUTES.home);
                    return;
                  }
                  setPostAuthPath(ROUTES.home);
                  router.push(ROUTES.auth);
                }}
                className={ACTION_BUTTON_CLASS}
              >
                ક્વિઝ રમો
              </AppButton>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">
        <Icon className="size-5" />
      </span>
      <h2 className="font-heading text-[1.25rem] leading-tight font-bold text-[#111]">
        {title}
      </h2>
    </div>
  );
}
