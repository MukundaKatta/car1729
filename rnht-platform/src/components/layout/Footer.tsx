import Link from "next/link";

function SocialIconLink({
  href,
  label,
  hoverClassName,
  children,
}: {
  href: string;
  label: string;
  hoverClassName: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={`flex h-12 w-12 items-center justify-center rounded-full border border-temple-gold/20 bg-white/[0.04] text-temple-gold-light transition-all duration-300 hover:-translate-y-0.5 hover:border-temple-gold/45 hover:bg-white/[0.08] ${hoverClassName}`}
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden bg-[linear-gradient(180deg,#1b0208_0%,#130106_52%,#0b0104_100%)] text-white"
      role="contentinfo"
    >
      <div className="h-[2px] bg-gradient-to-r from-transparent via-temple-gold/90 to-transparent" />

      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(197,151,62,0.14), transparent 28%), radial-gradient(circle at 18% 100%, rgba(196,30,58,0.08), transparent 22%), radial-gradient(circle at 82% 100%, rgba(196,30,58,0.08), transparent 22%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-temple-gold/15 bg-white/[0.03] px-6 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-sm sm:px-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-temple-gold/30 bg-temple-gold/10 text-2xl text-temple-gold-light shadow-[0_0_24px_rgba(197,151,62,0.14)]">
            &#x0950;
          </div>

          <p className="mt-5 font-accent text-xs font-semibold uppercase tracking-[0.34em] text-temple-gold-light/90">
            Stay Connected
          </p>

          <h3 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Follow RNHT
          </h3>

          <p className="mx-auto mt-4 max-w-xl font-accent text-base leading-relaxed text-gray-300 sm:text-lg">
            Temple updates, booking support, and important links in one calm,
            simple place.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://wa.me/message/P3YRA2XY3GI7F1"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-temple-gold/20 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-200 transition-all duration-300 hover:border-temple-gold/45 hover:bg-white/[0.08] hover:text-white"
            >
              Contact Us
            </a>
            <Link
              href="/terms"
              className="rounded-full border border-temple-gold/20 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-200 transition-all duration-300 hover:border-temple-gold/45 hover:bg-white/[0.08] hover:text-white"
            >
              Terms of Use
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-temple-gold/20 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-200 transition-all duration-300 hover:border-temple-gold/45 hover:bg-white/[0.08] hover:text-white"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Devotional blessing + tax-deductible note (client request) */}
          <p className="mt-8 font-accent text-lg italic tracking-wide text-temple-gold-light sm:text-xl">
            &#x201C;Dharmo Rakshati Rakshitah&#x201D;
          </p>
          <p className="mt-2 text-sm text-gray-300">
            All donations are tax deductible.
          </p>

          <h4 className="mt-8 font-heading text-xl font-bold tracking-tight text-white">
            Follow Us
          </h4>

          <div className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-temple-gold/45 to-transparent" />

          <div className="mt-6 flex items-center justify-center gap-4">
            <SocialIconLink
              href="https://www.facebook.com/people/Rudra-Narayana-Hindu-Temple/61572697872055/"
              label="Facebook"
              hoverClassName="hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </SocialIconLink>

            <SocialIconLink
              href="https://www.instagram.com/rudranarayanahindutemple"
              label="Instagram"
              hoverClassName="hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </SocialIconLink>

            <SocialIconLink
              href="https://wa.me/message/P3YRA2XY3GI7F1"
              label="WhatsApp"
              hoverClassName="hover:text-green-300"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </SocialIconLink>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-temple-gold/20 to-transparent" />
    </footer>
  );
}
