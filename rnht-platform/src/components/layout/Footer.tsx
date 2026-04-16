import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-temple-maroon-deep via-[#1F030A] to-[#150207] text-white overflow-hidden" role="contentinfo">
      {/* Premium double gold line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-temple-gold to-transparent" />
      <div className="h-px bg-gradient-to-r from-transparent via-temple-gold/30 to-transparent" />

      {/* Decorative gold corner ornaments */}
      <div className="absolute top-8 left-8 w-20 h-20 border-t-2 border-l-2 border-temple-gold/15 rounded-tl-xl hidden lg:block" />
      <div className="absolute top-8 right-8 w-20 h-20 border-t-2 border-r-2 border-temple-gold/15 rounded-tr-xl hidden lg:block" />

      {/* Subtle gold radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-radial-gradient opacity-[0.04]" style={{ background: "radial-gradient(ellipse, rgba(197,151,62,0.15), transparent 70%)" }} />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            {/* Om Symbol + Temple Name */}
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl text-temple-gold/60">&#x0950;</span>
              <h3 className="font-heading text-xl font-bold text-gold-gradient">
                Rudra Narayana Hindu Temple
              </h3>
            </div>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed font-accent">
              A sacred haven for devotees seeking spiritual growth, peace, and
              connection with the divine. Serving the Austin, Texas area with
              traditional weddings, pujas, and other rituals.
            </p>
            <div className="mt-5 space-y-2 text-sm text-gray-400">
              <p className="font-semibold text-white">2025 Rushing Ranch Path, Georgetown, TX 78628</p>
              <a
                href="https://wa.me/message/P3YRA2XY3GI7F1"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-green-400 hover:text-green-300 transition-colors"
              >
                Pt. Aditya Sharma: (512) 545-0473 (WhatsApp)
              </a>
              <a href="tel:+15129980112" className="block hover:text-gray-200 transition-colors">
                Pt. Raghurama Sharma: (512) 998-0112
              </a>
              <a href="mailto:femtomax.inc@gmail.com" className="block hover:text-gray-200 transition-colors">
                femtomax.inc@gmail.com
              </a>
            </div>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-temple-gold/10 border border-temple-gold/20 px-3 py-1.5 text-xs font-medium text-temple-gold-light">
              501(c)(3) Registered Nonprofit
            </p>
            {/* Social Media Links */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://www.facebook.com/people/Rudra-Narayana-Hindu-Temple/61572697872055/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-temple-gold/10 border border-temple-gold/20 text-temple-gold-light transition-all hover:bg-temple-gold/20 hover:border-temple-gold/40"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href="https://www.instagram.com/rudranarayanahindutemple"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-temple-gold/10 border border-temple-gold/20 text-temple-gold-light transition-all hover:bg-temple-gold/20 hover:border-temple-gold/40"
                aria-label="Instagram - Temple"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a
                href="https://www.instagram.com/hindupriest_aditya_sharma"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-temple-gold/10 border border-temple-gold/20 text-temple-gold-light transition-all hover:bg-temple-gold/20 hover:border-temple-gold/40"
                aria-label="Instagram - Pandit Aditya Sharma"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-heading font-semibold text-temple-gold-light tracking-wide uppercase flex items-center gap-2"><span className="inline-block w-6 h-px bg-gradient-to-r from-temple-gold/50 to-transparent" />Services</h4>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/services" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">
                  Book a Pooja
                </Link>
              </li>
              <li>
                <Link href="/services?category=homam-havan" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">
                  Homam / Havan
                </Link>
              </li>
              <li>
                <Link href="/sponsorship" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">
                  Sponsorship &amp; Packages
                </Link>
              </li>
              <li>
                <Link href="/priests" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">
                  Our Priests
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-heading font-semibold text-temple-gold-light tracking-wide uppercase flex items-center gap-2"><span className="inline-block w-6 h-px bg-gradient-to-r from-temple-gold/50 to-transparent" />Temple</h4>
            <ul className="mt-4 space-y-3">
              <li><Link href="/panchangam" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Daily Panchangam</Link></li>
              <li><Link href="/calendar" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Events Calendar</Link></li>
              <li><Link href="/streaming" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Live Darshan</Link></li>
              <li><Link href="/gallery" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Gallery</Link></li>
              <li><Link href="/donate" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Donate</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-heading font-semibold text-temple-gold-light tracking-wide uppercase flex items-center gap-2"><span className="inline-block w-6 h-px bg-gradient-to-r from-temple-gold/50 to-transparent" />Community</h4>
            <ul className="mt-4 space-y-3">
              <li><Link href="/community" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Volunteer</Link></li>
              <li><Link href="/education" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Education &amp; Classes</Link></li>
              <li><Link href="/transparency" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Financial Transparency</Link></li>
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Contact Us</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-temple-gold-light transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Sanskrit Shloka */}
        <div className="mt-12 text-center">
          <p className="font-accent text-sm italic text-temple-gold/40 tracking-wide">
            &ldquo;Dharmo Rakshati Rakshitaha&rdquo;
          </p>
          <p className="text-xs text-gray-600 mt-1 font-accent">Dharma protects those who protect Dharma</p>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-temple-gold/10 pt-8 flex flex-col items-center gap-4">
          {/* Social icons row */}
          <div className="flex items-center gap-4">
            <a href="https://www.facebook.com/people/Rudra-Narayana-Hindu-Temple/61572697872055/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-temple-gold-light transition-colors" aria-label="Facebook">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/rudranarayanahindutemple" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-temple-gold-light transition-colors" aria-label="Instagram">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
            <a href="https://wa.me/message/P3YRA2XY3GI7F1" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-400 transition-colors" aria-label="WhatsApp">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
          </div>
          <span className="text-xl text-temple-gold/20">&#x0950;</span>
          <p className="text-sm text-gray-500 font-accent">
            &copy; 2026 Rudra Narayana Hindu Temple. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 font-accent">
            A 501(c)(3) nonprofit organization &middot; Tax ID available upon request
          </p>
        </div>
      </div>

      {/* Bottom gold line */}
      <div className="h-px bg-gradient-to-r from-transparent via-temple-gold/20 to-transparent" />
    </footer>
  );
}
