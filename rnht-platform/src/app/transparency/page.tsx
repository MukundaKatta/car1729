import Link from "next/link";
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const financialYears = [
  {
    year: "2025",
    totalRevenue: 285000,
    totalExpenses: 248000,
    netSurplus: 37000,
    categories: {
      income: [
        { name: "Donations & Contributions", amount: 145000 },
        { name: "Service Fees (Poojas & Ceremonies)", amount: 78000 },
        { name: "Event Sponsorships", amount: 32000 },
        { name: "Education Program Fees", amount: 18000 },
        { name: "Prasadam & Gift Shop", amount: 12000 },
      ],
      expenses: [
        { name: "Priest Services & Compensation", amount: 72000 },
        { name: "Temple Operations & Maintenance", amount: 58000 },
        { name: "Rent & Utilities", amount: 48000 },
        { name: "Community Programs (Annadanam, etc.)", amount: 28000 },
        { name: "Education & Cultural Programs", amount: 18000 },
        { name: "Insurance & Compliance", amount: 12000 },
        { name: "Marketing & Technology", amount: 8000 },
        { name: "Administrative Expenses", amount: 4000 },
      ],
    },
  },
  {
    year: "2024",
    totalRevenue: 242000,
    totalExpenses: 218000,
    netSurplus: 24000,
    categories: {
      income: [
        { name: "Donations & Contributions", amount: 128000 },
        { name: "Service Fees (Poojas & Ceremonies)", amount: 62000 },
        { name: "Event Sponsorships", amount: 28000 },
        { name: "Education Program Fees", amount: 15000 },
        { name: "Prasadam & Gift Shop", amount: 9000 },
      ],
      expenses: [
        { name: "Priest Services & Compensation", amount: 65000 },
        { name: "Temple Operations & Maintenance", amount: 52000 },
        { name: "Rent & Utilities", amount: 45000 },
        { name: "Community Programs (Annadanam, etc.)", amount: 24000 },
        { name: "Education & Cultural Programs", amount: 14000 },
        { name: "Insurance & Compliance", amount: 10000 },
        { name: "Marketing & Technology", amount: 5000 },
        { name: "Administrative Expenses", amount: 3000 },
      ],
    },
  },
];

const buildingFundProgress = {
  goal: 500000,
  raised: 187500,
  donors: 145,
  milestone: "Phase 1 — Foundation & Structure",
};

const donorWall = [
  { tier: "Platinum ($10,000+)", donors: ["The Sharma Family", "Anonymous", "The Reddy Foundation"] },
  { tier: "Gold ($5,000+)", donors: ["Sri & Smt. Venkat Rao", "The Iyer Family", "Anonymous", "Dr. Ravi & Priya Kumar"] },
  { tier: "Silver ($1,000+)", donors: ["The Nair Family", "Sri Krishna Murthy", "Smt. Lakshmi Devi", "The Gupta Family", "Anonymous", "Sri Ramesh & Anita Sharma", "The Patel Family", "Dr. Suresh Babu"] },
];

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Financial Transparency</h1>
        <p className="mt-3 mx-auto max-w-2xl text-gray-600">
          We believe in complete transparency with our community. View our annual
          financial statements and see how your donations make a difference.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          RNHT is a registered 501(c)(3) nonprofit organization. Tax ID available upon request.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="mt-10 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="card p-5 text-center">
          <DollarSign className="mx-auto h-8 w-8 text-green-600" />
          <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(285000)}</p>
          <p className="text-sm text-gray-500">2025 Revenue</p>
        </div>
        <div className="card p-5 text-center">
          <Users className="mx-auto h-8 w-8 text-blue-600" />
          <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">350+</p>
          <p className="text-sm text-gray-500">Active Donors</p>
        </div>
        <div className="card p-5 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-amber-600" />
          <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">18%</p>
          <p className="text-sm text-gray-500">YoY Growth</p>
        </div>
        <div className="card p-5 text-center">
          <Building className="mx-auto h-8 w-8 text-purple-600" />
          <p className="mt-2 text-xl sm:text-2xl font-bold text-gray-900">37.5%</p>
          <p className="text-sm text-gray-500">Building Fund Progress</p>
        </div>
      </div>

      {/* Building Fund Progress */}
      <section className="mt-12">
        <div className="card bg-gradient-to-r from-amber-50 to-temple-cream p-6">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-temple-gold" />
            <div>
              <h2 className="font-heading text-xl font-bold text-gray-900">
                Building Fund Campaign
              </h2>
              <p className="text-sm text-gray-600">{buildingFundProgress.milestone}</p>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-temple-red">
                {formatCurrency(buildingFundProgress.raised)}
              </span>
              <span className="text-sm text-gray-500">
                Goal: {formatCurrency(buildingFundProgress.goal)}
              </span>
            </div>
            <div className="h-4 w-full rounded-full bg-gray-200">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-temple-gold to-temple-red transition-all"
                style={{
                  width: `${(buildingFundProgress.raised / buildingFundProgress.goal) * 100}%`,
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-500">
              <span>{buildingFundProgress.donors} donors</span>
              <span>
                {((buildingFundProgress.raised / buildingFundProgress.goal) * 100).toFixed(1)}%
                raised
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Statements */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold text-gray-900">
          Annual Financial Statements
        </h2>
        {financialYears.map((fy) => (
          <div key={fy.year} className="mt-6 card overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-6 py-4">
              <h3 className="font-heading text-lg font-bold text-gray-900">
                Fiscal Year {fy.year}
              </h3>
              <Link href="/contact" className="btn-outline flex items-center gap-2 text-sm">
                <Download className="h-4 w-4" />
                Request PDF
              </Link>
            </div>
            <div className="p-6">
              {/* Summary Cards */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <p className="text-sm text-green-700">Total Revenue</p>
                  <p className="text-xl font-bold text-green-800">{formatCurrency(fy.totalRevenue)}</p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 text-center">
                  <p className="text-sm text-red-700">Total Expenses</p>
                  <p className="text-xl font-bold text-red-800">{formatCurrency(fy.totalExpenses)}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <p className="text-sm text-blue-700">Net Surplus</p>
                  <p className="text-xl font-bold text-blue-800">{formatCurrency(fy.netSurplus)}</p>
                </div>
              </div>

              <div className="grid gap-6 sm:gap-8 sm:grid-cols-2">
                {/* Income Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Income Breakdown
                  </h4>
                  <div className="mt-3 space-y-3">
                    {fy.categories.income.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-green-400"
                            style={{ width: `${(item.amount / fy.totalRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Expense Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Expense Breakdown
                  </h4>
                  <div className="mt-3 space-y-3">
                    {fy.categories.expenses.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-red-400"
                            style={{ width: `${(item.amount / fy.totalExpenses) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Donor Recognition Wall */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold text-gray-900">
          Donor Recognition Wall
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          We gratefully acknowledge our generous supporters (opt-in only).
        </p>
        <div className="mt-6 space-y-6">
          {donorWall.map((tier) => (
            <div key={tier.tier} className="card p-5">
              <h3 className="font-heading text-lg font-bold text-temple-maroon flex items-center gap-2">
                <Crown className="h-5 w-5 text-temple-gold" />
                {tier.tier}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {tier.donors.map((donor) => (
                  <span
                    key={donor}
                    className="rounded-lg bg-temple-cream px-4 py-2 text-sm font-medium text-temple-maroon"
                  >
                    {donor}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* IRS Compliance */}
      <section className="mt-12 card p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-4">
          <FileText className="h-8 w-8 text-green-700 flex-shrink-0" />
          <div>
            <h3 className="font-heading text-lg font-bold text-green-900">
              IRS Compliance & Tax Information
            </h3>
            <p className="mt-2 text-sm text-green-800">
              Rudra Narayana Hindu Temple is a registered 501(c)(3) tax-exempt
              nonprofit organization. All donations are tax-deductible to the full
              extent of the law.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-green-700">
              <li>EIN available upon request</li>
              <li>State of Incorporation: Nevada</li>
              <li>Annual Form 990 filed with the IRS</li>
              <li>Tax receipts issued for all donations over $10</li>
            </ul>
            <Link href="/contact" className="btn-outline mt-4 flex items-center gap-2 text-sm border-green-300 text-green-800">
              <Download className="h-4 w-4" />
              Request IRS Determination Letter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
