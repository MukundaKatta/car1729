import Link from "next/link";
import { DEFAULT_LOCATION, computePanchangam } from "@/lib/panchangam";

function formatHeaderDate(date: string, timeZone: string) {
  const value = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone,
  })
    .format(value)
    .toUpperCase();
}

export function HomePanchangamScroll() {
  const p = computePanchangam(DEFAULT_LOCATION);
  const formattedDate = formatHeaderDate(p.date, DEFAULT_LOCATION.timeZone);

  return (
    <section className="relative overflow-hidden bg-[#06203A] py-20">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at center, rgba(21,114,182,0.28) 0%, rgba(6,32,58,0.92) 52%, rgba(2,11,23,1) 100%)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(circle, rgba(71,177,255,0.18) 0%, rgba(71,177,255,0.06) 42%, transparent 68%)",
          boxShadow: "0 0 140px rgba(47,150,255,0.18)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[31rem] w-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/20 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, transparent 0 56%, rgba(64,164,255,0.22) 56.5%, transparent 57%), radial-gradient(circle at center, transparent 0 72%, rgba(64,164,255,0.18) 72.5%, transparent 73%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-accent text-xs font-semibold uppercase tracking-[0.32em] text-[#d5b15f]">
            Daily Guidance
          </p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Panchangam
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200/85 sm:text-base">
            Daily tithi, nakshatra, yoga, karana, and sacred timings presented
            in an ornate scroll inspired by traditional almanac art.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-[46rem] px-3 sm:px-8">
          <Link
            href="/panchangam"
            className="group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c56e] focus-visible:ring-offset-4 focus-visible:ring-offset-[#06203A]"
            aria-label="Open Panchangam page"
          >
            <div className="pointer-events-none absolute inset-x-[6%] top-[4.5rem] bottom-[4.5rem] rounded-[2rem] bg-black/20 blur-2xl" />

            <div className="relative">
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-1 sm:px-2">
                {[-1, 1].map((side) => (
                  <div
                    key={side}
                    className="relative h-12 w-12 rounded-full sm:h-14 sm:w-14"
                    style={{
                      background:
                        "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                      boxShadow:
                        "0 10px 20px rgba(0,0,0,0.35), inset 0 2px 5px rgba(255,255,255,0.35)",
                    }}
                  >
                    <div className="absolute inset-[16%] rounded-full border border-[#f8e09d]/70" />
                    <div className="absolute inset-y-[18%] left-[38%] w-[24%] rounded-full bg-white/20 blur-[1px]" />
                    <div
                      className={`absolute top-1/2 h-4 w-7 -translate-y-1/2 sm:h-5 sm:w-9 ${
                        side < 0 ? "left-[75%]" : "right-[75%]"
                      }`}
                      style={{
                        background:
                          "linear-gradient(180deg, #ff6f3a 0%, #d51709 40%, #9e0f08 100%)",
                        borderRadius: side < 0 ? "0 999px 999px 0" : "999px 0 0 999px",
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.25)",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div
                className="relative mx-7 rounded-[999px] border border-[#8c2008] px-10 py-3 text-center sm:mx-10 sm:py-4"
                style={{
                  background:
                    "linear-gradient(180deg, #ff4d1d 0%, #de1f09 26%, #bc1407 65%, #8f0e07 100%)",
                  boxShadow:
                    "0 12px 24px rgba(0,0,0,0.28), inset 0 2px 6px rgba(255,255,255,0.16), inset 0 -4px 10px rgba(77,0,0,0.35)",
                }}
              >
                <div className="absolute inset-x-4 top-1/2 h-[1px] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              <div className="absolute left-5 top-[4.3rem] z-10 hidden sm:block">
                <div className="flex flex-col items-center">
                  <div
                    className="h-8 w-8 rotate-45 rounded-[0.35rem]"
                    style={{
                      background:
                        "linear-gradient(135deg, #ffe39b 0%, #cc8f11 45%, #7d5007 100%)",
                      boxShadow: "0 8px 14px rgba(0,0,0,0.28)",
                    }}
                  />
                  <div className="h-12 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                  <div
                    className="h-10 w-10 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                      boxShadow:
                        "0 10px 18px rgba(0,0,0,0.32), inset 0 2px 5px rgba(255,255,255,0.3)",
                    }}
                  />
                  <div className="h-16 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                  <div
                    className="h-24 w-8 rounded-b-full"
                    style={{
                      background:
                        "linear-gradient(180deg, #ff8d48 0%, #ef4612 26%, #b40f09 78%, #880706 100%)",
                      clipPath:
                        "polygon(30% 0%, 70% 0%, 100% 12%, 78% 100%, 22% 100%, 0% 12%)",
                      boxShadow: "0 14px 20px rgba(0,0,0,0.26)",
                    }}
                  />
                </div>
              </div>

              <div className="absolute right-5 top-[4.3rem] z-10 hidden sm:block">
                <div className="flex flex-col items-center">
                  <div
                    className="h-8 w-8 rotate-45 rounded-[0.35rem]"
                    style={{
                      background:
                        "linear-gradient(135deg, #ffe39b 0%, #cc8f11 45%, #7d5007 100%)",
                      boxShadow: "0 8px 14px rgba(0,0,0,0.28)",
                    }}
                  />
                  <div className="h-12 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                  <div
                    className="h-10 w-10 rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                      boxShadow:
                        "0 10px 18px rgba(0,0,0,0.32), inset 0 2px 5px rgba(255,255,255,0.3)",
                    }}
                  />
                  <div className="h-16 w-[3px] bg-gradient-to-b from-[#e6b839] to-[#9a6508]" />
                  <div
                    className="h-24 w-8 rounded-b-full"
                    style={{
                      background:
                        "linear-gradient(180deg, #ff8d48 0%, #ef4612 26%, #b40f09 78%, #880706 100%)",
                      clipPath:
                        "polygon(30% 0%, 70% 0%, 100% 12%, 78% 100%, 22% 100%, 0% 12%)",
                      boxShadow: "0 14px 20px rgba(0,0,0,0.26)",
                    }}
                  />
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-[2rem] border-x-[10px] border-[#d98f11] px-6 pb-12 pt-10 sm:border-x-[14px] sm:px-12 sm:pb-14 sm:pt-12"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,47,15,0.97) 0%, rgba(203,18,8,0.98) 24%, rgba(148,8,6,0.98) 100%)",
                  boxShadow:
                    "0 26px 50px rgba(0,0,0,0.34), inset 0 3px 10px rgba(255,255,255,0.12), inset 0 -12px 18px rgba(72,0,0,0.22)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-[0.09]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 0 0, rgba(255,255,255,0.32) 0, transparent 18px), radial-gradient(circle at 24px 24px, rgba(255,255,255,0.22) 0, transparent 18px)",
                    backgroundSize: "48px 48px",
                  }}
                />
                <div className="absolute inset-x-5 top-5 h-px bg-gradient-to-r from-transparent via-[#ffd978]/60 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 h-px bg-gradient-to-r from-transparent via-[#ffd978]/40 to-transparent" />

                <div className="relative mx-auto max-w-[28rem] text-center text-[#fff6df]">
                  <div
                    className="mx-auto inline-flex max-w-full items-center gap-3 rounded-[1rem] border border-[#b8842b] px-5 py-3 shadow-[0_10px_24px_rgba(45,14,4,0.34)] sm:px-7"
                    style={{
                      background:
                        "linear-gradient(180deg, #fff7df 0%, #f2ddae 52%, #e1c17b 100%)",
                    }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b32112] shadow-[0_0_10px_rgba(179,33,18,0.45)]" />
                    <span className="font-heading text-lg font-black uppercase tracking-[0.12em] text-[#931c12] sm:text-2xl">
                      Panchangam
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#b32112] shadow-[0_0_10px_rgba(179,33,18,0.45)]" />
                  </div>

                  <p className="mt-7 text-lg font-semibold leading-snug text-[#ffecc3] sm:text-[1.45rem]">
                    {p.masa} Masa, {p.samvatsara} Samvatsara
                  </p>

                  <p className="mt-5 font-heading text-2xl font-black uppercase tracking-[0.07em] text-white sm:text-[2.15rem]">
                    {formattedDate}
                  </p>

                  <div className="mt-6 space-y-2 text-base leading-snug sm:text-lg">
                    {p.festival && (
                      <p className="font-semibold text-[#ffe4a5]">
                        Festival &amp; Vrata: {p.festival.name}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-[#ffe4a5]">Tithi:</span>{" "}
                      {p.tithi.name}{" "}
                      <span className="text-[#ffd58d]">|</span>{" "}
                      <span className="font-semibold text-[#ffe4a5]">Paksha:</span>{" "}
                      {p.tithi.paksha}
                    </p>
                    <p>
                      <span className="font-semibold text-[#ffe4a5]">
                        Nakshatra:
                      </span>{" "}
                      {p.nakshatra.name}
                    </p>
                    <p className="text-sm text-[#ffe8b7] sm:text-base">
                      {p.nakshatra.start} - {p.nakshatra.end}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-2 text-sm leading-snug text-[#fff0c9] sm:text-base">
                    <p>
                      <span className="font-semibold text-[#ffe4a5]">Yoga:</span>{" "}
                      {p.yoga.name}{" "}
                      <span className="text-[#ffd58d]">|</span>{" "}
                      <span className="font-semibold text-[#ffe4a5]">Karana:</span>{" "}
                      {p.karana.name}
                    </p>
                    <p>
                      <span className="font-semibold text-[#ffe4a5]">Rahu:</span>{" "}
                      {p.rahu_kalam.start} - {p.rahu_kalam.end}
                    </p>
                    <p>
                      <span className="font-semibold text-[#ffe4a5]">Gulika:</span>{" "}
                      {p.gulika_kalam.start} - {p.gulika_kalam.end}
                    </p>
                    <p>
                      <span className="font-semibold text-[#ffe4a5]">
                        Yamaganda:
                      </span>{" "}
                      {p.yama_gandam.start} - {p.yama_gandam.end}
                    </p>
                    <p>
                      <span className="font-semibold text-[#ffe4a5]">
                        Muhurtham:
                      </span>{" "}
                      {p.muhurtham.start} - {p.muhurtham.end}
                    </p>
                  </div>

                  <p className="mt-7 text-xs uppercase tracking-[0.3em] text-[#ffd978] sm:text-sm">
                    Based on {p.location}
                  </p>

                  <div className="mt-6">
                    <span className="inline-flex items-center rounded-full border border-[#ffdb87]/30 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#fff4d8] transition-transform duration-300 group-hover:scale-[1.03]">
                      View Full Panchangam
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-1 sm:px-2">
                {[-1, 1].map((side) => (
                  <div
                    key={side}
                    className="relative h-12 w-12 rounded-full sm:h-14 sm:w-14"
                    style={{
                      background:
                        "radial-gradient(circle at 32% 28%, #fff6c7 0%, #f4d36b 18%, #d59b16 45%, #8a5e08 82%, #5d3b05 100%)",
                      boxShadow:
                        "0 10px 20px rgba(0,0,0,0.35), inset 0 2px 5px rgba(255,255,255,0.35)",
                    }}
                  >
                    <div className="absolute inset-[16%] rounded-full border border-[#f8e09d]/70" />
                    <div className="absolute inset-y-[18%] left-[38%] w-[24%] rounded-full bg-white/20 blur-[1px]" />
                    <div
                      className={`absolute bottom-1/2 h-4 w-7 translate-y-1/2 sm:h-5 sm:w-9 ${
                        side < 0 ? "left-[75%]" : "right-[75%]"
                      }`}
                      style={{
                        background:
                          "linear-gradient(180deg, #ff6f3a 0%, #d51709 40%, #9e0f08 100%)",
                        borderRadius: side < 0 ? "0 999px 999px 0" : "999px 0 0 999px",
                        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.25)",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
