import { Link } from "react-router-dom";

type LegalDocumentPageProps = {
  title: string;
  html: string;
};

export default function LegalDocumentPage({ title, html }: LegalDocumentPageProps) {
  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center">
        <Link
          to="/profile"
          aria-label="Go back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/8 hover:text-white ft-focus-ring"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="pointer-events-none absolute inset-x-0 text-center text-base font-semibold text-white">
          {title}
        </h1>
      </div>

      <iframe
        title={title}
        srcDoc={html}
        className="min-h-[70svh] w-full rounded-2xl border border-white/8 bg-black"
        sandbox=""
      />
    </div>
  );
}
