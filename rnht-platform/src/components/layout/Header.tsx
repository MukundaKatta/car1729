"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Menu,
  X,
  User,
  Globe,
  Heart,
  Calendar,
  ShieldCheck,
} from "lucide-react";
import { useLanguageStore } from "@/store/language";
import { useAuthStore } from "@/store/auth";
import { useIsAdmin } from "@/lib/admin";
import { localeNames, t, type Locale } from "@/lib/i18n/translations";
import { pushOverlay } from "@/lib/overlay-stack";

/* ─── Hanging Temple Bell SVG ─── */
function TempleBell({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dims = { sm: { w: 16, h: 28 }, md: { w: 20, h: 36 }, lg: { w: 24, h: 42 } };
  const { w, h } = dims[size];
  return (
    <svg width={w} height={h} viewBox="0 0 24 42" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Chain / rope */}
      <line x1="12" y1="0" x2="12" y2="10" stroke="url(#chainGrad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="10" r="1.5" fill="#C5972C" />
      {/* Bell dome */}
      <path d="M4 24C4 17 6 12 12 12C18 12 20 17 20 24L22 28H2L4 24Z" fill="url(#bellGold)" stroke="#A67C10" strokeWidth="0.5" />
      {/* Bell rim */}
      <rect x="1" y="28" width="22" height="3" rx="1.5" fill="url(#rimGold)" />
      {/* Clapper */}
      <line x1="12" y1="25" x2="12" y2="33" stroke="#8B6914" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="34" r="2" fill="url(#clapperGold)" />
      {/* Shine highlight */}
      <ellipse cx="9" cy="19" rx="2.5" ry="4" fill="white" opacity="0.18" />
      {/* Decorative bands on bell */}
      <path d="M6 20H18" stroke="#A67C10" strokeWidth="0.4" opacity="0.5" />
      <path d="M5 23H19" stroke="#A67C10" strokeWidth="0.4" opacity="0.5" />
      {/* Top ornament */}
      <circle cx="12" cy="11.5" r="2.5" fill="url(#bellGold)" stroke="#A67C10" strokeWidth="0.4" />
      <defs>
        <linearGradient id="chainGrad" x1="12" y1="0" x2="12" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#B8912A" />
        </linearGradient>
        <linearGradient id="bellGold" x1="4" y1="12" x2="20" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0D060" />
          <stop offset="30%" stopColor="#D4A843" />
          <stop offset="70%" stopColor="#C5972C" />
          <stop offset="100%" stopColor="#A67C10" />
        </linearGradient>
        <linearGradient id="rimGold" x1="1" y1="28" x2="23" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C5972C" />
          <stop offset="50%" stopColor="#E8C34A" />
          <stop offset="100%" stopColor="#C5972C" />
        </linearGradient>
        <radialGradient id="clapperGold" cx="12" cy="34" r="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8C34A" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ─── South Indian Hanging Bell + Pancha Deepam ─── */
/* Chain → ornate bell → chain → multi-wick oil lamp with flames UP */
export function HangingLamp({ id = "hl", size = "md", className = "" }: { id?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const dims = { sm: { w: 40, h: 160 }, md: { w: 52, h: 200 }, lg: { w: 64, h: 240 } };
  const { w, h } = dims[size];
  return (
    <svg width={w} height={h} viewBox="0 0 50 130" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">

      {/* ══════ CHAIN FROM CEILING ══════ */}
      {[0, 4.5, 9, 13.5, 18].map((y) => (
        <g key={y}>
          <ellipse cx="25" cy={y + 2.2} rx="1.6" ry="2" stroke={`url(#${id}ch)`} strokeWidth="0.9" fill="none" />
        </g>
      ))}

      {/* ══════ ORNATE BRASS BELL ══════ */}
      {/* Top hook / crown */}
      <path d="M22 22C22 20.5 23.5 19 25 19C26.5 19 28 20.5 28 22" stroke={`url(#${id}ch)`} strokeWidth="1" fill="none" />
      <circle cx="25" cy="22.5" r="1.8" fill={`url(#${id}br)`} stroke="#8B6914" strokeWidth="0.3" />
      {/* Bell dome */}
      <path d="M18 36C18 28 20 25 25 24C30 25 32 28 32 36L34 39H16L18 36Z" fill={`url(#${id}bell)`} stroke="#8B6914" strokeWidth="0.4" />
      {/* Bell rim band */}
      <rect x="15.5" y="39" width="19" height="2.5" rx="1.2" fill={`url(#${id}rim)`} stroke="#8B6914" strokeWidth="0.3" />
      {/* Bell decorative rings */}
      <ellipse cx="25" cy="30" rx="5" ry="0.3" fill="#F5E17D" opacity="0.4" />
      <ellipse cx="25" cy="34" rx="6.5" ry="0.3" fill="#F5E17D" opacity="0.3" />
      {/* Bell shine */}
      <ellipse cx="22" cy="31" rx="2" ry="4.5" fill="white" opacity="0.12" />
      {/* Clapper */}
      <line x1="25" y1="35" x2="25" y2="44" stroke="#8B6914" strokeWidth="1" strokeLinecap="round" />
      <circle cx="25" cy="45" r="1.8" fill={`url(#${id}br)`} stroke="#8B6914" strokeWidth="0.3" />

      {/* ══════ CHAIN FROM BELL TO LAMP ══════ */}
      {[48, 52.5, 57, 61.5, 66].map((y) => (
        <g key={y}>
          <ellipse cx="25" cy={y + 2.2} rx="1.6" ry="2" stroke={`url(#${id}ch)`} strokeWidth="0.9" fill="none" />
        </g>
      ))}

      {/* ══════ PANCHA DEEPAM (multi-wick oil lamp) ══════ */}
      {/* Central ornamental top piece / yali figure */}
      <path d="M22 71C22 70 23.5 69 25 69C26.5 69 28 70 28 71L28.5 72H21.5L22 71Z" fill={`url(#${id}br)`} stroke="#8B6914" strokeWidth="0.3" />

      {/* Three support chains to lamp bowl */}
      <line x1="22" y1="72" x2="17" y2="82" stroke={`url(#${id}ch)`} strokeWidth="0.6" />
      <line x1="25" y1="72" x2="25" y2="81" stroke={`url(#${id}ch)`} strokeWidth="0.6" />
      <line x1="28" y1="72" x2="33" y2="82" stroke={`url(#${id}ch)`} strokeWidth="0.6" />

      {/* Lamp bowl — wide brass dish */}
      <ellipse cx="25" cy="83" rx="14" ry="3" fill={`url(#${id}rim)`} stroke="#8B6914" strokeWidth="0.4" />
      <path d="M11 83C11 83 12 90 16 93C19 95 22 96 25 96C28 96 31 95 34 93C38 90 39 83 39 83" fill={`url(#${id}br)`} stroke="#8B6914" strokeWidth="0.4" />
      {/* Inner oil surface */}
      <ellipse cx="25" cy="83.5" rx="11" ry="2" fill="#C5972C" opacity="0.25" />
      {/* Decorative band */}
      <path d="M13 87Q25 92 37 87" stroke={`url(#${id}rim)`} strokeWidth="0.7" fill="none" />
      {/* Decorative dots */}
      {[17, 21, 25, 29, 33].map((x) => (
        <circle key={x} cx={x} cy="86" r="0.5" fill="#F5E17D" opacity="0.7" />
      ))}
      {/* Bowl shine */}
      <ellipse cx="21" cy="88" rx="3" ry="3.5" fill="white" opacity="0.06" />

      {/* Bottom finial / pendant */}
      <ellipse cx="25" cy="97" rx="2.5" ry="1.5" fill={`url(#${id}rim)`} stroke="#8B6914" strokeWidth="0.3" />
      <ellipse cx="25" cy="99" rx="1.5" ry="1.2" fill={`url(#${id}br)`} stroke="#8B6914" strokeWidth="0.2" />
      <circle cx="25" cy="101" r="1" fill={`url(#${id}br)`} />

      {/* ══════ WICKS + FLAMES (5 wicks — pancha deepam) ══════ */}
      {/* Center wick + flame */}
      <line x1="25" y1="79" x2="25" y2="82.5" stroke="#5D4037" strokeWidth="0.6" />
      <path d="M25 72C25 72 22.5 75 22.5 77C22.5 78.4 23.6 79.5 25 79.5C26.4 79.5 27.5 78.4 27.5 77C27.5 75 25 72 25 72Z" fill={`url(#${id}fl)`} />
      <path d="M25 74.5C25 74.5 23.8 76 23.8 77C23.8 77.7 24.3 78.2 25 78.2C25.7 78.2 26.2 77.7 26.2 77C26.2 76 25 74.5 25 74.5Z" fill="#FFFDE7" opacity="0.9" />

      {/* Left wick + flame */}
      <line x1="17" y1="79.5" x2="17.5" y2="82.5" stroke="#5D4037" strokeWidth="0.5" />
      <path d="M17 73.5C17 73.5 15 76 15 77.5C15 78.6 15.9 79.5 17 79.5C18.1 79.5 19 78.6 19 77.5C19 76 17 73.5 17 73.5Z" fill={`url(#${id}fl)`} />
      <path d="M17 75.5C17 75.5 16 76.8 16 77.5C16 78 16.5 78.3 17 78.3C17.5 78.3 18 78 18 77.5C18 76.8 17 75.5 17 75.5Z" fill="#FFFDE7" opacity="0.85" />

      {/* Right wick + flame */}
      <line x1="33" y1="79.5" x2="32.5" y2="82.5" stroke="#5D4037" strokeWidth="0.5" />
      <path d="M33 73.5C33 73.5 31 76 31 77.5C31 78.6 31.9 79.5 33 79.5C34.1 79.5 35 78.6 35 77.5C35 76 33 73.5 33 73.5Z" fill={`url(#${id}fl)`} />
      <path d="M33 75.5C33 75.5 32 76.8 32 77.5C32 78 32.5 78.3 33 78.3C33.5 78.3 34 78 34 77.5C34 76.8 33 75.5 33 75.5Z" fill="#FFFDE7" opacity="0.85" />

      {/* Far left wick + flame (smaller) */}
      <line x1="13" y1="80.5" x2="13.5" y2="83" stroke="#5D4037" strokeWidth="0.4" />
      <path d="M13 76C13 76 11.5 78 11.5 79C11.5 79.8 12.2 80.5 13 80.5C13.8 80.5 14.5 79.8 14.5 79C14.5 78 13 76 13 76Z" fill={`url(#${id}fl)`} />
      <path d="M13 77.5C13 77.5 12.3 78.5 12.3 79C12.3 79.4 12.6 79.6 13 79.6C13.4 79.6 13.7 79.4 13.7 79C13.7 78.5 13 77.5 13 77.5Z" fill="#FFFDE7" opacity="0.8" />

      {/* Far right wick + flame (smaller) */}
      <line x1="37" y1="80.5" x2="36.5" y2="83" stroke="#5D4037" strokeWidth="0.4" />
      <path d="M37 76C37 76 35.5 78 35.5 79C35.5 79.8 36.2 80.5 37 80.5C37.8 80.5 38.5 79.8 38.5 79C38.5 78 37 76 37 76Z" fill={`url(#${id}fl)`} />
      <path d="M37 77.5C37 77.5 36.3 78.5 36.3 79C36.3 79.4 36.6 79.6 37 79.6C37.4 79.6 37.7 79.4 37.7 79C37.7 78.5 37 77.5 37 77.5Z" fill="#FFFDE7" opacity="0.8" />

      {/* ══════ FLAME GLOW ══════ */}
      <circle cx="25" cy="77" r="14" fill={`url(#${id}gl)`} opacity="0.25" />
      <circle cx="25" cy="77" r="8" fill={`url(#${id}gli)`} opacity="0.35" />

      <defs>
        <linearGradient id={`${id}ch`} x1="25" y1="0" x2="25" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id={`${id}bell`} x1="16" y1="24" x2="34" y2="41" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5E17D" />
          <stop offset="25%" stopColor="#E8C34A" />
          <stop offset="50%" stopColor="#D4A843" />
          <stop offset="75%" stopColor="#C5972C" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id={`${id}br`} x1="11" y1="83" x2="39" y2="101" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5E17D" />
          <stop offset="30%" stopColor="#D4A843" />
          <stop offset="60%" stopColor="#C5972C" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id={`${id}rim`} x1="11" y1="83" x2="39" y2="83" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B6914" />
          <stop offset="25%" stopColor="#D4A843" />
          <stop offset="50%" stopColor="#F5E17D" />
          <stop offset="75%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id={`${id}fl`} x1="25" y1="72" x2="25" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="25%" stopColor="#FFD54F" />
          <stop offset="55%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
        <radialGradient id={`${id}gl`} cx="25" cy="77" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="50%" stopColor="#FF8F00" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FF6F00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}gli`} cx="25" cy="77" r="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF9C4" />
          <stop offset="100%" stopColor="#FFB300" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ─── Mango Leaf Toran (garland) SVG ─── */
function MangoLeafToran() {
  return (
    <svg className="absolute -bottom-[6px] left-0 right-0 w-full h-[8px]" viewBox="0 0 1200 8" preserveAspectRatio="none" fill="none" aria-hidden="true">
      <path d="M0 0 Q150 8 300 0 Q450 8 600 0 Q750 8 900 0 Q1050 8 1200 0" stroke="url(#toranGrad)" strokeWidth="1.5" fill="none" />
      {/* Small marigold dots at the peaks */}
      {[150, 450, 750, 1050].map((x) => (
        <circle key={x} cx={x} cy="7" r="2.5" fill="#E8A020" opacity="0.6" />
      ))}
      <defs>
        <linearGradient id="toranGrad" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C5973E" stopOpacity="0.2" />
          <stop offset="20%" stopColor="#2D8B3A" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#C5973E" stopOpacity="0.5" />
          <stop offset="80%" stopColor="#2D8B3A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C5973E" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Hanging Bells Row ─── */
function HangingBells() {
  // Bell config: position (%), size, animation class
  const bells: { pct: number; size: "sm" | "md" | "lg"; anim: string }[] = [
    { pct: 2, size: "sm", anim: "bell-swing" },
    { pct: 6, size: "md", anim: "bell-swing-delayed" },
    { pct: 11, size: "sm", anim: "bell-swing-slow" },
    { pct: 16, size: "md", anim: "bell-swing" },
    { pct: 21, size: "sm", anim: "bell-swing-delayed" },
    { pct: 26, size: "md", anim: "bell-swing-slow" },
    { pct: 31, size: "sm", anim: "bell-swing" },
    { pct: 36, size: "md", anim: "bell-swing-delayed" },
    { pct: 41, size: "sm", anim: "bell-swing-slow" },
    { pct: 45, size: "md", anim: "bell-swing" },
    { pct: 50, size: "lg", anim: "bell-swing-delayed" },
    { pct: 55, size: "md", anim: "bell-swing-slow" },
    { pct: 59, size: "sm", anim: "bell-swing" },
    { pct: 64, size: "md", anim: "bell-swing-delayed" },
    { pct: 69, size: "sm", anim: "bell-swing-slow" },
    { pct: 74, size: "md", anim: "bell-swing" },
    { pct: 79, size: "sm", anim: "bell-swing-delayed" },
    { pct: 84, size: "md", anim: "bell-swing-slow" },
    { pct: 89, size: "sm", anim: "bell-swing" },
    { pct: 94, size: "md", anim: "bell-swing-delayed" },
    { pct: 98, size: "sm", anim: "bell-swing-slow" },
  ];

  return (
    <div className="hidden lg:block absolute -bottom-[2px] left-0 right-0 pointer-events-none z-10 overflow-visible" aria-hidden="true">
      {/* Decorative toran garland thread */}
      <MangoLeafToran />

      {/* Bells positioned absolutely across full width, hugging the header */}
      {bells.map((b, i) => (
        <div
          key={i}
          className={`absolute top-0 ${b.anim}`}
          style={{ left: `${b.pct}%` }}
        >
          <TempleBell size={b.size} />
        </div>
      ))}
    </div>
  );
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const langButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const { locale, setLocale } = useLanguageStore();
  const { isAuthenticated, user } = useAuthStore();
  const { isAdmin } = useIsAdmin();
  const pathname = usePathname();

  // Measure header height and set CSS variable on root for fixed elements.
  // Re-measure when the mobile menu opens and shortly after mount: in the
  // native apps the safe-area inset (notch padding) is injected asynchronously
  // after load, so an early-only measurement leaves --header-h too small and
  // the open menu panel covers the header (hiding the X close button).
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    update();
    const raf = requestAnimationFrame(update);
    const settle = window.setTimeout(update, 350);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [mobileMenuOpen]);

  const navigation = [
    { name: t("nav.home", locale), href: "/", external: false },
    { name: t("nav.gallery", locale), href: "/gallery", external: false },
    { name: t("nav.services", locale), href: "/services", external: false },
    { name: t("nav.priests", locale), href: "/priests", external: false },
    { name: t("nav.aboutUs", locale), href: "/about", external: false },
    // Contact Us page removed — link now opens the temple WhatsApp chat.
    {
      name: t("nav.contactUs", locale),
      href: "https://wa.me/message/P3YRA2XY3GI7F1",
      external: true,
    },
  ];

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close the mobile menu (which releases the body scroll-lock below) when the
  // viewport grows past the lg breakpoint. Otherwise `lg:hidden` hides the drawer
  // AND its close button/backdrop while `mobileMenuOpen` stays true, leaving the
  // page permanently scroll-locked with no visible control to recover.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    // Only react to an actual resize/orientation change crossing into desktop.
    // (No eager call: the hamburger is lg:hidden, so the menu can't be opened at
    // >=1024 in a real browser; an eager check would also mis-fire in jsdom where
    // innerWidth defaults to 1024.)
    const closeIfDesktop = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", closeIfDesktop);
    window.visualViewport?.addEventListener("resize", closeIfDesktop);
    return () => {
      window.removeEventListener("resize", closeIfDesktop);
      window.visualViewport?.removeEventListener("resize", closeIfDesktop);
    };
  }, [mobileMenuOpen]);

  // Close language picker on outside click or Escape (return focus to toggle).
  useEffect(() => {
    if (!showLangPicker) return;
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangPicker(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowLangPicker(false);
        langButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showLangPicker]);

  // Android back button: close the open language dropdown instead of leaving the
  // page. The toggle is `hidden sm:flex`, so the dropdown is reachable at >=640px
  // including tablet-width native builds; register it with the overlay stack so the
  // hardware back button dismisses it first (mirrors the mobile-menu registration).
  useEffect(() => {
    if (!showLangPicker) return;
    return pushOverlay(() => setShowLangPicker(false));
  }, [showLangPicker]);

  // Prevent body scroll when mobile menu is open.
  // overflow:hidden alone does not reliably stop background scroll/rubber-banding
  // on iOS Safari and the iOS Capacitor WKWebView, so pin the body with
  // position:fixed (capturing scrollY) and restore the scroll position on close.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

  // Android back button: close the menu instead of leaving the page.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    return pushOverlay(() => setMobileMenuOpen(false));
  }, [mobileMenuOpen]);

  // Dialog semantics for the mobile drawer: move focus into the panel on open,
  // trap Tab within it, close on Escape, and restore focus to the hamburger
  // button on close. Mirrors the focus-trap in ServiceDetailModal.tsx.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // The hamburger button is always mounted; capture it for focus restoration.
    const triggerButton = mobileMenuButtonRef.current;
    const focusables = () =>
      Array.from(
        mobileMenuRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      // Restore focus to the hamburger button (it returns to "Open menu" state).
      (triggerButton ?? previouslyFocused)?.focus?.();
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-gradient-to-b from-[#FFF8E7] via-[#FFF3D6] to-[#FDEDC4] backdrop-blur-md shadow-[0_2px_20px_rgba(191,155,48,0.15)] border-b border-temple-gold/30 relative pt-[env(safe-area-inset-top)]">
      {/* Premium gold accent line at top */}
      <div className="h-1 bg-gradient-to-r from-temple-gold via-yellow-400 to-temple-gold" />

      <nav className="flex items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* ── Left: Logo + Name ── */}
        {/* min-w-0 (not flex-shrink-0): on narrow phones the name must be allowed
            to shrink/ellipsize so it can NEVER push the right-side action cluster
            (esp. the hamburger menu) off-screen — the client reported the menu
            was invisible on mobile because the non-shrinking name overflowed. */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 lg:flex-shrink-0">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1.5 rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-500" style={{
              background: "radial-gradient(circle, rgba(197,151,62,0.4) 0%, rgba(232,195,74,0.12) 55%, transparent 80%)",
            }} />
            <Image
              src="/cropped-RNHT_Logo_512x512_transparent-150x150.png"
              alt="RNHT Logo"
              width={44}
              height={44}
              className="relative rounded-full ring-2 ring-temple-gold/50 shadow-[0_0_12px_rgba(197,151,62,0.25)] transition-all duration-300 group-hover:scale-105"
            />
          </div>
          <div className="block min-w-0">
            {/* Brand wordmark — a <div>, not an <h1>: the logo must NOT be the page's
                top-level heading (it would make every page's h1 the non-descriptive
                "Rudra Narayana" and demote/duplicate the real content heading).
                Visible at ALL widths (client 07-08: the temple name was invisible on
                phones in portrait because this block was hidden below sm) — just
                smaller on narrow screens. `truncate` ellipsizes it only in the rare
                case a phone is too narrow to fit the whole name alongside the menu,
                so the menu is never pushed off. */}
            <div className="text-[15px] sm:text-[20px] lg:text-[24px] font-heading font-black leading-[1.1] tracking-[0.01em] truncate lg:overflow-visible" style={{
              background: "linear-gradient(90deg, #8B6914 0%, #C5973E 20%, #D4A843 50%, #C5973E 80%, #8B6914 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Rudra Narayana
            </div>
            <p className="text-[9px] sm:text-[11px] lg:text-[12px] font-accent font-bold tracking-[0.3em] uppercase leading-none mt-0.5 truncate lg:overflow-visible" style={{
              background: "linear-gradient(90deg, #9B7730 0%, #C5973E 30%, #D4A843 50%, #C5973E 70%, #9B7730 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Hindu Temple
            </p>
          </div>
        </Link>

        {/* ── Center: Navigation ── */}
        <div className="hidden lg:flex items-center gap-1 mx-4">
          {navigation.map((item) =>
            item.external ? (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative rounded-lg px-4 py-2.5 text-[15px] font-semibold text-gray-700 transition-all duration-200 hover:bg-temple-gold/10 hover:text-temple-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2"
              >
                {item.name}
              </a>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`relative rounded-lg px-4 py-2.5 text-[15px] font-semibold transition-all duration-200 hover:text-temple-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2 ${
                  isActive(item.href)
                    ? "text-temple-maroon"
                    : "text-gray-700 hover:bg-temple-gold/10"
                }`}
              >
                {item.name}
                {isActive(item.href) && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full bg-gradient-to-r from-temple-gold via-temple-red to-temple-gold" />
                )}
              </Link>
            )
          )}
        </div>

        {/* ── Right: Action Buttons ── */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Panchangam */}
          <Link
            href="/panchangam"
            className="hidden sm:flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, rgba(197,151,62,0.12) 0%, rgba(232,195,74,0.18) 50%, rgba(197,151,62,0.12) 100%)",
              border: "1.5px solid rgba(197,151,62,0.35)",
              color: "#6B4E1A",
            }}
          >
            <Calendar className="h-4 w-4" style={{ color: "#C5973E" }} />
            <span>{t("nav.panchangam", locale)}</span>
          </Link>
          {/* Panchangam icon — shown from 400px up to sm (full button takes over at
              sm). Hidden below 400px so the tightest phones keep the full temple
              name without truncation; on wider phones it fills the header so there
              isn't a large empty gap between the name and the Donate button
              (client 07-14). The menu button stays visible regardless because the
              name block is min-w-0 / truncate. */}
          <Link
            href="/panchangam"
            className="hidden min-[400px]:flex sm:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(197,151,62,0.12) 0%, rgba(232,195,74,0.18) 100%)",
              border: "1.5px solid rgba(197,151,62,0.35)",
            }}
            aria-label="Panchangam"
          >
            <Calendar className="h-4 w-4" style={{ color: "#C5973E" }} />
          </Link>

          {/* Donate */}
          <Link
            href="/donate"
            className="hidden sm:flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-[0_2px_16px_rgba(197,151,62,0.45)] transition-all duration-300 hover:shadow-[0_4px_24px_rgba(197,151,62,0.65)] hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #B8862D 0%, #D4A843 30%, #E8C34A 50%, #D4A843 70%, #B8862D 100%)",
            }}
          >
            <Heart className="h-4 w-4 fill-white" />
            <span>{t("nav.donate", locale)}</span>
          </Link>
          <Link
            href="/donate"
            className="sm:hidden flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full shadow-[0_2px_12px_rgba(197,151,62,0.4)]"
            style={{
              background: "linear-gradient(135deg, #B8862D 0%, #D4A843 25%, #F0D060 50%, #D4A843 75%, #B8862D 100%)",
            }}
            aria-label="Donate"
          >
            <Heart className="h-4 w-4 fill-white text-white" />
          </Link>

          {/* Language Picker */}
          <div className="relative" ref={langRef}>
            <button
              ref={langButtonRef}
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="hidden sm:flex items-center gap-1 rounded-full p-2.5 text-temple-maroon/60 transition-colors hover:bg-temple-gold/15 hover:text-temple-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2"
              title="Language"
              aria-label="Select language"
              aria-haspopup="true"
              aria-expanded={showLangPicker}
              aria-controls="language-picker-menu"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">{locale}</span>
            </button>
            {showLangPicker && (
              <div
                id="language-picker-menu"
                role="menu"
                aria-label="Select language"
                className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-temple-gold/20 bg-white py-1 shadow-premium animate-slide-down"
              >
                {(Object.entries(localeNames) as [Locale, string][]).map(
                  ([code, name]) => (
                    <button
                      key={code}
                      role="menuitemradio"
                      aria-checked={locale === code}
                      onClick={() => {
                        setLocale(code);
                        setShowLangPicker(false);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-temple-cream ${
                        locale === code
                          ? "font-semibold text-temple-red bg-temple-cream/50"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="w-8 text-xs text-gray-400 uppercase">
                        {code}
                      </span>
                      {name}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Admin panel — only shown to temple administrators (is_admin). */}
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-temple-maroon ring-1 ring-temple-gold/40 transition-colors hover:bg-temple-gold/15 sm:flex"
              aria-label="Admin panel"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}

          {/* Profile / Dashboard */}
          <Link
            href="/dashboard"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full text-temple-maroon/60 transition-colors hover:bg-temple-gold/15 hover:text-temple-maroon"
            aria-label={isAuthenticated ? "Dashboard" : "Sign in"}
          >
            {isAuthenticated ? (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-temple-gold/20 text-[11px] font-bold uppercase text-temple-gold ring-1 ring-temple-gold/30">
                {(user?.name?.charAt(0) || "U").toUpperCase()}
              </div>
            ) : (
              <User className="h-[18px] w-[18px]" />
            )}
          </Link>

          {/* Mobile menu button */}
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-temple-maroon/70 transition-colors hover:bg-temple-gold/15 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-temple-red focus-visible:ring-offset-2"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-haspopup="dialog"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu-dialog"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Hanging temple bells */}
      <HangingBells />

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[var(--header-h)] z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={mobileMenuRef}
            id="mobile-menu-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-x-0 top-[var(--header-h)] z-50 border-t border-temple-gold/10 bg-white lg:hidden max-h-[calc(100dvh-var(--header-h))] overflow-y-auto animate-slide-down"
          >
            <div className="px-4 py-2">
              {/* Prominent mobile donate button */}
              <Link
                href="/donate"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#C5973E] via-[#E8C34A] to-[#C5973E] px-4 py-3 mb-2 text-base font-bold text-white shadow-md"
              >
                <Heart className="h-5 w-5 fill-white" />
                {t("nav.donateNow", locale)}
              </Link>
              <Link
                href="/panchangam"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg border-2 border-temple-gold/30 bg-temple-gold/10 px-4 py-3 mb-2 text-base font-bold text-temple-maroon"
              >
                <Calendar className="h-5 w-5 text-temple-gold" />
                {t("nav.panchangam", locale)}
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg border border-temple-gold/20 bg-temple-cream/30 px-4 py-3 mb-2 text-base font-medium text-temple-maroon"
              >
                <User className="h-5 w-5 text-temple-maroon/60" />
                {isAuthenticated ? (user?.name || "My Account") : t("nav.login", locale)}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-temple-gold/30 bg-temple-gold/10 px-4 py-3 mb-2 text-base font-semibold text-temple-maroon"
                >
                  <ShieldCheck className="h-5 w-5 text-temple-gold" />
                  Admin Panel
                </Link>
              )}
              {navigation.map((item) =>
                item.external ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-temple-cream"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`block rounded-lg px-4 py-3 text-base font-medium transition-colors hover:bg-temple-cream ${
                      isActive(item.href)
                        ? "text-temple-red bg-temple-cream/50"
                        : "text-gray-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
            {/* Mobile language picker */}
            <div className="border-t border-temple-gold/10 px-4 py-4">
              <p className="text-xs text-gray-500 font-medium mb-3 flex items-center gap-1">
                <Globe className="h-3 w-3" /> {t("nav.language", locale)}
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(localeNames) as [Locale, string][]).map(
                  ([code, name]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLocale(code);
                        setMobileMenuOpen(false);
                      }}
                      className={`min-h-[44px] rounded-full px-4 text-xs font-medium transition-colors ${
                        locale === code
                          ? "bg-temple-red text-white"
                          : "bg-temple-cream text-gray-600 hover:bg-temple-cream-dark"
                      }`}
                    >
                      {name}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
