import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, PrimaryButton } from "../design-system";
import { onboardingSlides } from "../data/mockData";
import { cn } from "../lib/cn";

const CX = 170;
const CY = 130;

const RESILIENCE_NODES = [
  { id: 0, cx: 113, cy: 73, label: "Experience", color: "#EC4899", lx: 113, ly: 58 },
  { id: 1, cx: 227, cy: 73, label: "Skills", color: "#60A5FA", lx: 227, ly: 58 },
  { id: 2, cx: 250, cy: 130, label: "Demand", color: "#FFD700", lx: 268, ly: 134 },
  { id: 3, cx: 227, cy: 187, label: "Adaptability", color: "#22D3EE", lx: 227, ly: 202 },
  { id: 4, cx: 113, cy: 187, label: "Network", color: "#4ADE80", lx: 113, ly: 202 },
  { id: 5, cx: 90, cy: 130, label: "Learning", color: "#FB923C", lx: 72, ly: 134 },
] as const;

function CareerPathsIllustration() {
  return (
    <svg
      viewBox="0 0 340 260"
      className="mx-auto h-auto w-full max-w-[300px]"
      aria-hidden
    >
      <defs>
        <linearGradient id="onb-role-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3498DB" />
          <stop offset="100%" stopColor="#4D47C2" />
        </linearGradient>
        <linearGradient id="onb-teal-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <linearGradient id="onb-purple-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="onb-blue-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5B8DEF" />
          <stop offset="100%" stopColor="#3498DB" />
        </linearGradient>
        <filter id="onb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="onb-current-role" filter="url(#onb-glow)">
        <ellipse cx="170" cy="214" rx="36" ry="10" fill="#FF5500" opacity="0.2" />
        <path
          d="M170 198 C155 198 148 188 148 176 C148 164 158 154 170 154 C182 154 192 164 192 176 C192 188 185 198 170 198 Z"
          fill="url(#onb-role-grad)"
          opacity="0.9"
        />
        <circle cx="170" cy="168" r="14" fill="url(#onb-role-grad)" opacity="0.95" />
        <circle cx="170" cy="168" r="5" fill="white" opacity="0.85" />
      </g>
      <text
        className="onb-label onb-label-current"
        x="170"
        y="238"
        textAnchor="middle"
        fill="#64748B"
        fontSize="11"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Current Role
      </text>

      <g className="onb-role-step">
        <path
          className="onb-path onb-path-teal"
          pathLength={100}
          d="M170 198 C130 170, 95 130, 78 98"
          fill="none"
          stroke="url(#onb-teal-grad)"
          strokeWidth="1.5"
        />
        <g className="onb-node onb-node-teal" filter="url(#onb-glow)">
          <circle className="onb-node-pulse" cx="78" cy="98" r="10" fill="url(#onb-teal-grad)" opacity="0.35" />
          <circle cx="78" cy="98" r="6" fill="url(#onb-teal-grad)" />
          <circle cx="78" cy="98" r="2.5" fill="white" opacity="0.95" />
        </g>
        <text
          className="onb-label onb-label-teal"
          x="78"
          y="72"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="11"
          fontFamily="Inter, system-ui, sans-serif"
        >
          Product Manager
        </text>
      </g>

      <g className="onb-role-step">
        <path
          className="onb-path onb-path-purple"
          pathLength={100}
          d="M170 198 C170 160, 170 120, 170 88"
          fill="none"
          stroke="url(#onb-purple-grad)"
          strokeWidth="1.5"
        />
        <g className="onb-node onb-node-purple" filter="url(#onb-glow)">
          <circle className="onb-node-pulse" cx="170" cy="88" r="10" fill="url(#onb-purple-grad)" opacity="0.35" />
          <circle cx="170" cy="88" r="6" fill="url(#onb-purple-grad)" />
          <circle cx="170" cy="88" r="2.5" fill="white" opacity="0.95" />
        </g>
        <text
          className="onb-label onb-label-purple"
          x="170"
          y="62"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="11"
          fontFamily="Inter, system-ui, sans-serif"
        >
          Tech Lead
        </text>
      </g>

      <g className="onb-role-step">
        <path
          className="onb-path onb-path-blue"
          pathLength={100}
          d="M170 198 C210 170, 245 130, 262 98"
          fill="none"
          stroke="url(#onb-blue-grad)"
          strokeWidth="1.5"
        />
        <g className="onb-node onb-node-blue" filter="url(#onb-glow)">
          <circle className="onb-node-pulse" cx="262" cy="98" r="10" fill="url(#onb-blue-grad)" opacity="0.35" />
          <circle cx="262" cy="98" r="6" fill="url(#onb-blue-grad)" />
          <circle cx="262" cy="98" r="2.5" fill="white" opacity="0.95" />
        </g>
        <text
          className="onb-label onb-label-blue"
          x="262"
          y="72"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="11"
          fontFamily="Inter, system-ui, sans-serif"
        >
          AI Specialist
        </text>
      </g>
    </svg>
  );
}

function ResilienceScoreIllustration() {
  const hexPoints = RESILIENCE_NODES.map((n) => `${n.cx},${n.cy}`).join(" ");

  return (
    <svg
      viewBox="0 0 340 260"
      className="mx-auto h-auto w-full max-w-[320px]"
      aria-hidden
    >
      <defs>
        <filter id="onb-res-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="onb-res-ring-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Faint radar rings */}
      <g className="onb-resilience-orbit">
        {[80, 58, 36].map((r) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={hexPoints}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      </g>

      {/* Spokes */}
      {RESILIENCE_NODES.map((node) => (
        <line
          key={`spoke-${node.id}`}
          className={`onb-resilience-spoke onb-resilience-spoke-${node.id}`}
          pathLength={100}
          x1={CX}
          y1={CY}
          x2={node.cx}
          y2={node.cy}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      ))}

      {/* Center score */}
      <g className="onb-resilience-center" filter="url(#onb-res-ring-glow)">
        <circle cx={CX} cy={CY} r="54" fill="#000000" />
        <circle
          cx={CX}
          cy={CY}
          r="54"
          fill="none"
          stroke="#22D3EE"
          strokeWidth="2.5"
          opacity="0.85"
        />
        <circle cx={CX} cy={CY} r="48" fill="none" stroke="#22D3EE" strokeWidth="1" opacity="0.25" />
      </g>
      <text
        className="onb-resilience-center"
        x={CX}
        y={CY + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="36"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        79
      </text>
      <text
        className="onb-resilience-center"
        x={CX}
        y={CY + 28}
        textAnchor="middle"
        fill="#64748B"
        fontSize="10"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Resilience Score
      </text>

      {/* Outer nodes + labels */}
      {RESILIENCE_NODES.map((node) => (
        <g
          key={node.id}
          className={`onb-resilience-node onb-resilience-node-${node.id}`}
          filter="url(#onb-res-glow)"
        >
          <circle cx={node.cx} cy={node.cy} r="9" fill={node.color} opacity="0.3" />
          <circle cx={node.cx} cy={node.cy} r="5.5" fill={node.color} />
          <circle cx={node.cx} cy={node.cy} r="2" fill="white" opacity="0.95" />
          <text
            x={node.lx}
            y={node.ly}
            textAnchor="middle"
            fill={node.color}
            fontSize="10"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B8DEF" strokeWidth="1.8">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
      <path d="M3 12h4l2-7 4 14 2-7h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FACC15">
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  );
}

function DemandBars() {
  return (
    <div className="flex items-end gap-0.5" aria-hidden>
      {[10, 14, 8].map((h) => (
        <span key={h} className="w-1 rounded-sm bg-accent-purple/80" style={{ height: h }} />
      ))}
    </div>
  );
}

const TRENDING_SKILLS = [
  { label: "Prompt Engineering", value: 92, barClass: "bg-gradient-to-r from-accent to-accent-soft" },
  { label: "AI Integration", value: 85, barClass: "bg-gradient-to-r from-accent-purple to-accent-gold" },
  { label: "Data Analysis", value: 78, barClass: "bg-gradient-to-r from-teal-400 to-cyan-400" },
] as const;

const ROLE_DEMAND = [
  { title: "AI Product Manager", growth: "+24%" },
  { title: "ML Engineer", growth: "+18%" },
  { title: "AI Strategy Lead", growth: "+31%" },
] as const;

function AnimatedTrendBar({
  label,
  value,
  barClass,
  index,
}: {
  label: string;
  value: number;
  barClass: string;
  index: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs text-white/90">{label}</span>
        <span className="flex items-center gap-0.5 text-xs tabular-nums text-emerald-400">
          {value}%
          <span aria-hidden>↑</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={cn("onb-trend-bar h-full rounded-full", barClass, `onb-trend-bar-${index}`)}
          style={{ ["--onb-bar-target" as string]: `${value}%` }}
        />
      </div>
    </div>
  );
}

function MarketRadarPreviewCard() {
  return (
    <Card
      className="onb-market-card border border-white/10 bg-[#161B30]/95 p-4 shadow-none"
      padding="none"
    >
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-white/8 bg-navy-light/70 p-3">
        <BellIcon />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">New opportunity match</p>
          <p className="mt-0.5 text-xs text-muted">3 roles aligned with your profile</p>
        </div>
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(52,152,219,0.8)]" />
      </div>

      <section className="mb-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendUpIcon />
          <h3 className="text-sm font-semibold text-white">Trending Skills</h3>
        </div>
        <div className="space-y-3">
          {TRENDING_SKILLS.map((skill, index) => (
            <AnimatedTrendBar
              key={skill.label}
              label={skill.label}
              value={skill.value}
              barClass={skill.barClass}
              index={index}
            />
          ))}
        </div>
      </section>

      <section className="mb-3">
        <div className="mb-3 flex items-center gap-2">
          <PulseIcon />
          <h3 className="text-sm font-semibold text-white">Role Demand</h3>
        </div>
        <div className="space-y-2">
          {ROLE_DEMAND.map((role, index) => (
            <div
              key={role.title}
              className={cn(
                "onb-role-row flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2.5",
                `onb-role-row-${index}`
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <LightningIcon />
                <span className="truncate text-xs font-medium text-white">{role.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <DemandBars />
                <span className="text-xs font-semibold tabular-nums text-emerald-400">
                  {role.growth}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-white/8 pt-3 text-xs">
        <span className="text-muted">Market pulse</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          High activity
        </span>
      </div>
    </Card>
  );
}

function OnboardingBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/8 hover:text-white ft-focus-ring"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function PaginationDots({ step }: { step: number }) {
  return (
    <div className="mb-8 flex justify-center gap-2">
      {onboardingSlides.map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors duration-300",
            i === step ? "bg-accent-purple" : "bg-white/15"
          )}
        />
      ))}
    </div>
  );
}

function OnboardingVisualSlide({
  illustration,
  title,
  body,
  step,
  onNext,
  onBack,
  ctaLabel = "Next →",
}: {
  illustration: React.ReactNode;
  title: string;
  body: string;
  step: number;
  onNext: () => void;
  onBack: () => void;
  ctaLabel?: string;
}) {
  return (
    <div className="ft-display-page flex min-h-[calc(100svh-2rem)] w-full flex-col px-3 pb-4">
      <OnboardingBackButton onClick={onBack} />

      <div className="flex flex-1 flex-col justify-center">
        {illustration}

        <div className="mt-8 text-center">
          <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-white">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-[300px] text-sm leading-relaxed text-muted">{body}</p>
        </div>
      </div>

      <PaginationDots step={step} />

      <PrimaryButton fullWidth onClick={onNext}>
        {ctaLabel}
      </PrimaryButton>
    </div>
  );
}

function renderOnboardingIllustration(variant: (typeof onboardingSlides)[number]["variant"]) {
  switch (variant) {
    case "career-paths":
      return <CareerPathsIllustration />;
    case "resilience-score":
      return <ResilienceScoreIllustration />;
    case "market-radar":
      return <MarketRadarPreviewCard />;
    default:
      return null;
  }
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const slide = onboardingSlides[step];
  const isLast = step === onboardingSlides.length - 1;

  function handleNext() {
    if (isLast) {
      navigate("/login");
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      navigate("/");
    }
  }

  return (
    <OnboardingVisualSlide
      illustration={renderOnboardingIllustration(slide.variant)}
      title={slide.title}
      body={slide.body}
      step={step}
      onNext={handleNext}
      onBack={handleBack}
      ctaLabel={isLast ? "Get Started →" : "Next →"}
    />
  );
}
