import { Sun, Moon, AlertTriangle, Star, Clock } from "lucide-react";

type PanchangamData = {
  date: string;
  location: string;
  sunrise: string;
  sunset: string;
  tithi: { name: string; start: string; end: string; paksha: string };
  nakshatra: { name: string; start: string; end: string };
  yoga: { name: string; start: string; end: string };
  karana: { name: string; start: string; end: string };
  rahu_kalam: { start: string; end: string; warning: boolean };
  yama_gandam: { start: string; end: string };
  gulika_kalam: { start: string; end: string };
  muhurtham: { name: string; start: string; end: string };
  festival: { name: string; description: string } | null;
  vaara: string;
  masa: string;
  samvatsara: string;
};

export function PanchangamWidget({
  panchangam,
  compact = false,
}: {
  panchangam: PanchangamData;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-xl border border-temple-gold/30 bg-gradient-to-r from-temple-cream to-white p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-temple-maroon">
              <Sun className="h-5 w-5 text-temple-gold" />
              Daily Panchangam
            </h3>
            <p className="text-sm text-gray-500">
              {panchangam.vaara}, {panchangam.masa} | {panchangam.samvatsara}{" "}
              Samvatsara
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-600" />
              <span>
                <strong>Tithi:</strong> {panchangam.tithi.paksha}{" "}
                {panchangam.tithi.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-purple-600" />
              <span>
                <strong>Nakshatra:</strong> {panchangam.nakshatra.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>
                <strong>Rahu Kalam:</strong> {panchangam.rahu_kalam.start} -{" "}
                {panchangam.rahu_kalam.end}
              </span>
            </div>
            <div className="flex items-center gap-2 text-green-700">
              <Clock className="h-4 w-4" />
              <span>
                <strong>Amrut Kalam:</strong> {panchangam.muhurtham.start} -{" "}
                {panchangam.muhurtham.end}
              </span>
            </div>
          </div>
        </div>
        {panchangam.festival && (
          <div className="mt-3 rounded-lg bg-temple-gold/10 p-3">
            <p className="text-sm font-semibold text-temple-maroon">
              Festival: {panchangam.festival.name}
            </p>
            <p className="text-xs text-gray-600">
              {panchangam.festival.description}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-temple-gold/30 bg-white shadow-sm">
      <div className="border-b border-temple-gold/20 bg-gradient-to-r from-temple-cream to-white p-6">
        <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-temple-maroon">
          <Sun className="h-6 w-6 text-temple-gold" />
          Daily Panchangam
        </h2>
        <p className="mt-1 text-gray-600">
          {panchangam.vaara} | {panchangam.masa} Masa |{" "}
          {panchangam.samvatsara} Samvatsara
        </p>
        <p className="text-sm text-gray-500">{panchangam.location}</p>
      </div>

      <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3">
        <PanchangamItem
          icon={<Sun className="h-5 w-5 text-orange-500" />}
          label="Sunrise / Sunset"
          value={`${panchangam.sunrise} / ${panchangam.sunset}`}
        />
        <PanchangamItem
          icon={<Moon className="h-5 w-5 text-blue-600" />}
          label="Tithi"
          value={`${panchangam.tithi.paksha} ${panchangam.tithi.name}`}
          detail={`${panchangam.tithi.start} - ${panchangam.tithi.end}`}
        />
        <PanchangamItem
          icon={<Star className="h-5 w-5 text-purple-600" />}
          label="Nakshatra"
          value={panchangam.nakshatra.name}
          detail={`${panchangam.nakshatra.start} - ${panchangam.nakshatra.end}`}
        />
        <PanchangamItem
          icon={<span className="text-lg">🧘</span>}
          label="Yoga"
          value={panchangam.yoga.name}
          detail={`${panchangam.yoga.start} - ${panchangam.yoga.end}`}
        />
        <PanchangamItem
          icon={<span className="text-lg">📿</span>}
          label="Karana"
          value={panchangam.karana.name}
          detail={`${panchangam.karana.start} - ${panchangam.karana.end}`}
        />
        {/* Abhijit Muhurtham intentionally removed from the expanded view
            per product direction. The compact widget still surfaces it. */}
        <PanchangamItem
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Rahu Kalam"
          value={`${panchangam.rahu_kalam.start} - ${panchangam.rahu_kalam.end}`}
          highlight="red"
        />
        <PanchangamItem
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          label="Yama Gandam"
          value={`${panchangam.yama_gandam.start} - ${panchangam.yama_gandam.end}`}
          highlight="orange"
        />
        <PanchangamItem
          icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
          label="Gulika Kalam"
          value={`${panchangam.gulika_kalam.start} - ${panchangam.gulika_kalam.end}`}
          highlight="yellow"
        />
      </div>

      {panchangam.festival && (
        <div className="border-t border-temple-gold/20 bg-temple-gold/5 p-4">
          <p className="font-semibold text-temple-maroon">
            Festival: {panchangam.festival.name}
          </p>
          <p className="text-sm text-gray-600">
            {panchangam.festival.description}
          </p>
        </div>
      )}
    </div>
  );
}

function PanchangamItem({
  icon,
  label,
  value,
  detail,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  highlight?: "red" | "orange" | "yellow" | "green";
}) {
  const highlightClass = highlight
    ? {
        red: "bg-red-50",
        orange: "bg-orange-50",
        yellow: "bg-yellow-50",
        green: "bg-green-50",
      }[highlight]
    : "bg-white";

  return (
    <div className={`p-4 ${highlightClass}`}>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
      {detail && <p className="text-xs text-gray-500">{detail}</p>}
    </div>
  );
}
