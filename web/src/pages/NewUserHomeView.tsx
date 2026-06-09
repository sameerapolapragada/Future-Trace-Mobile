import { Link } from "react-router-dom";
import { LogoMark } from "../design-system";
import { products } from "../data/mockData";
import { cn } from "../lib/cn";

type NewUserHomeViewProps = {
  displayName: string;
  scanTo: string;
};

const POPULAR_TRANSITIONS = [
  {
    from: "Salesforce Admin",
    to: "AI Operations Analyst",
    tag: "High Demand",
    tagTone: "bg-accent-purple/20 text-accent-purple",
  },
  {
    from: "Business Analyst",
    to: "AI Product Manager",
    tag: "High Growth",
    tagTone: "bg-success/20 text-success",
  },
  {
    from: "Project Manager",
    to: "AI Governance Analyst",
    tag: "High Opportunity",
    tagTone: "bg-accent-gold/20 text-accent-gold",
  },
];

export function NewUserHomeView({ displayName, scanTo }: NewUserHomeViewProps) {
  const { freeScan, xray, radar } = products;

  return (
    <div className="space-y-5 pb-6">
      <header className="flex min-w-0 items-center gap-2.5">
        <LogoMark size={36} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">Future Trace</p>
          <p className="text-[10px] text-muted">Your AI Career Intelligence</p>
        </div>
      </header>

      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Welcome, {displayName} <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Let&apos;s discover your next career move.
          </p>
        </div>
        <img
          src="/images/home-hero.png"
          alt=""
          className="h-20 w-24 shrink-0 rounded-xl object-cover object-center opacity-90"
        />
      </section>

      <FreeScanCard scanTo={scanTo} />

      <UnlockSection freeScan={freeScan} xray={xray} radar={radar} scanTo={scanTo} />

      <PopularTransitionsSection />

      <MotivationBanner scanTo={scanTo} />
    </div>
  );
}

function FreeScanCard({ scanTo }: { scanTo: string }) {
  const features = [
    { icon: <ShieldIcon />, label: "AI Exposure Score" },
    { icon: <ChartIcon />, label: "Career Resilience" },
    { icon: <RocketIcon />, label: "Future Opportunities" },
  ];

  return (
    <section className="rounded-2xl border border-accent-purple/30 bg-gradient-to-br from-accent-purple/12 via-navy-card to-navy-card p-4 shadow-lg shadow-accent-purple/5">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">
            Free
          </span>
          <h2 className="mt-2 text-base font-bold leading-snug text-white">Start Your Free Career Scan</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Get a personalized snapshot of your AI exposure, strengths, and future opportunities.
          </p>

          <div className="mt-3 space-y-1.5">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-[11px] text-muted">
                <span className="text-accent-purple">{f.icon}</span>
                {f.label}
              </div>
            ))}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
            <ClockIcon />
            Takes 2 minutes
          </p>
        </div>

        <Link
          to={scanTo}
          className="flex shrink-0 flex-col items-center justify-center gap-1.5 ft-focus-ring"
          aria-label="Start free career scan"
        >
          <span className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-accent-purple to-accent-gold shadow-lg shadow-accent-purple/40 transition hover:scale-[1.03] active:scale-[0.98]">
            <span className="absolute inset-0 rounded-full bg-accent-purple/20 blur-md" />
            <ScanFrameIcon className="relative text-white" />
          </span>
          <span className="text-[10px] font-semibold text-accent-purple">Start Scan</span>
        </Link>
      </div>
    </section>
  );
}

function UnlockSection({
  scanTo,
  freeScan,
  xray,
  radar,
}: {
  scanTo: string;
  freeScan: (typeof products)["freeScan"];
  xray: (typeof products)["xray"];
  radar: (typeof products)["radar"];
}) {
  const items = [
    {
      title: "Career Scan",
      desc: "Discover where you stand today.",
      price: freeScan.price,
      priceTone: "bg-accent-purple/20 text-accent-purple",
      icon: <ScanIcon />,
      iconTone: "text-accent-purple",
      to: scanTo,
    },
    {
      title: "Career X-Ray",
      desc: "Deep dive into a specific career transition.",
      price: xray.price,
      priceTone: "bg-accent-gold/20 text-accent-gold",
      icon: <TargetIcon />,
      iconTone: "text-accent-gold",
      to: scanTo,
    },
    {
      title: "AI Career Transition",
      desc: "Get a weekly roadmap to reach your goal.",
      price: `${radar.price} / month`,
      priceTone: "bg-accent/20 text-accent",
      icon: <FlagIcon />,
      iconTone: "text-accent",
      to: "/upgrade?product=transition",
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white">What you&apos;ll unlock</h2>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="flex flex-col rounded-xl border border-white/8 bg-navy-card p-2.5 transition hover:border-white/15 ft-focus-ring"
          >
            <span className={cn("mb-2", item.iconTone)}>{item.icon}</span>
            <p className="text-[10px] font-bold leading-tight text-white">{item.title}</p>
            <p className="mt-1 flex-1 text-[9px] leading-snug text-muted">{item.desc}</p>
            <span className={cn("mt-2 inline-block self-start rounded px-1.5 py-0.5 text-[8px] font-bold uppercase", item.priceTone)}>
              {item.price}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PopularTransitionsSection() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-white">Popular career transitions</h2>
        <Link to="/scan" className="text-[11px] font-medium text-accent">
          View all →
        </Link>
      </div>
      <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
        {POPULAR_TRANSITIONS.map((t) => (
          <Link
            key={t.from}
            to="/scan"
            className="w-[75%] shrink-0 rounded-2xl border border-white/8 bg-navy-card p-4 transition hover:border-accent-purple/30 ft-focus-ring sm:w-[240px]"
          >
            <div className="flex items-center gap-2">
              <RoleIcon variant="from" />
              <ArrowIcon />
              <RoleIcon variant="to" />
            </div>
            <p className="mt-3 text-xs font-semibold leading-snug text-white">
              {t.from} → {t.to}
            </p>
            <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase", t.tagTone)}>
              {t.tag}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MotivationBanner({ scanTo }: { scanTo: string }) {
  return (
    <Link
      to={scanTo}
      className="flex items-center gap-3 rounded-xl border border-accent-purple/20 bg-accent-purple/8 px-4 py-3 transition hover:border-accent-purple/35 ft-focus-ring"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple">
        <StarIcon />
      </span>
      <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-muted">
        Your future is built one smart step at a time. Start your scan and unlock your possibilities.
      </p>
      <ChevronIcon />
    </Link>
  );
}

function RoleIcon({ variant }: { variant: "from" | "to" }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg",
        variant === "from" ? "bg-accent/15 text-accent" : "bg-accent-purple/15 text-accent-purple"
      )}
    >
      {variant === "from" ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 4a4 4 0 0 0-4 4v1a3 3 0 0 0-3 3 3 3 0 0 0 3 3h1v2h6v-2h1a3 3 0 0 0 3-3 3 3 0 0 0-3-3V8a4 4 0 0 0-4-4z" />
        </svg>
      )}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScanFrameIcon({ className }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="7" y="7" width="10" height="10" rx="1" strokeOpacity="0.6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l8 4v6c0 4.5-3.5 7.5-8 8-4.5-.5-8-3.5-8-8V7l8-4z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14l4-4 4 4 8-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c0 4-2 6-4 8v4l4 2 4-2v-4c-2-2-4-4-4-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 4v16M5 4h12l-3 4 3 4H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6L12 2z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
