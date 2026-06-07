import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoMarkWithGlow } from "../design-system";

export default function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/onboarding"), 2400);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-8 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,255,0.12),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(255,85,0,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <svg className="h-full w-full" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
          <path
            d="M -20 180 Q 80 120, 160 200 T 340 160"
            stroke="rgba(0,180,255,0.14)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2 10"
          />
          <path
            d="M 40 320 Q 140 260, 220 340 T 420 300"
            stroke="rgba(255,85,0,0.1)"
            strokeWidth="1"
            fill="none"
            strokeDasharray="2 10"
          />
        </svg>
      </div>

      <LogoMarkWithGlow size={96} className="relative mb-5" />

      <h1 className="relative text-3xl font-bold tracking-wide text-white">Future Trace</h1>
      <p className="relative mt-3 max-w-[260px] text-sm leading-relaxed text-white/75">
        Navigate your career through the AI era
      </p>

      <div className="relative mt-10 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
