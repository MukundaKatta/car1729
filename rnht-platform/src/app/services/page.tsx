"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, FileText } from "lucide-react";
import { sampleServices, sampleCategories } from "@/lib/sample-data";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceAreas } from "@/components/home/ServiceAreas";
import { ServicePdfDownloads } from "@/components/services/ServicePdfDownloads";
import { useLanguageStore } from "@/store/language";
import { t } from "@/lib/i18n/translations";
import { supabase } from "@/lib/supabase";
import type { Service, ServiceCategory } from "@/types/database";

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [services, setServices] = useState<Service[]>(sampleServices);
  const [categories, setCategories] = useState<ServiceCategory[]>(sampleCategories);
  const locale = useLanguageStore((s) => s.locale);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveCatalog() {
      if (!supabase) return;

      const [servicesResp, categoriesResp] = await Promise.all([
        supabase.from("services").select("*").eq("is_active", true).order("sort_order").order("name"),
        supabase.from("service_categories").select("*").order("sort_order"),
      ]);

      if (cancelled) return;

      // Swap services AND categories together, atomically: live services
      // reference live category ids, so mixing live categories with sample
      // services (or vice-versa) breaks the category filter. Only adopt the
      // live catalog when BOTH queries succeed with data; otherwise keep the
      // bundled sample catalog as a consistent fallback. (Previously a
      // `>= sample length` guard silently discarded smaller live catalogs.)
      const servicesOk = !servicesResp.error && (servicesResp.data?.length ?? 0) > 0;
      const categoriesOk = !categoriesResp.error && (categoriesResp.data?.length ?? 0) > 0;

      if (servicesOk && categoriesOk) {
        setServices(servicesResp.data as Service[]);
        setCategories(categoriesResp.data as ServiceCategory[]);
      }
    }

    loadLiveCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (!service.is_active) return false;

      if (
        searchQuery &&
        // Guard against null/undefined live-catalog fields — a single row with a
        // missing name or short_description would otherwise throw inside the
        // filter and blank the whole page.
        !(service.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(service.short_description ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (
        selectedCategory !== "all" &&
        service.category_id !== selectedCategory
      ) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, services]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="section-heading">{t("services.title", locale)}</h1>
        <p className="mt-3 text-gray-600">
          Current catalog offerings include shanti pujas, sacred parayanams,
          ancestral rites, divine kalyanams, and elaborate Rudrabhishekam
          services from Pandit Aditya Sharma.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Service areas: Kyle, Manor, Austin, Dallas, Houston, Lakeway, Bee Cave,
          Georgetown, Round Rock, San Antonio, Leander, Dripping Springs, and more.
        </p>
      </div>

      {/* Downloadable services PDFs */}
      <div className="mt-8">
        <ServicePdfDownloads />
      </div>

      {/* Search */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t("services.search", locale)}
            className="input-field pl-10"
            aria-label="Search services"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select
            className="input-field"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon ?? "•"} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Quick Links */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selectedCategory === "all"
              ? "bg-temple-red text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === cat.id
                ? "bg-temple-red text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.icon ?? "•"} {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mt-8">
        <p className="text-sm text-gray-500">
          {filteredServices.length} service
          {filteredServices.length !== 1 ? "s" : ""} found
        </p>
        {filteredServices.length > 0 ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-600">
              No services match your search. Try a different keyword or category.
            </p>
          </div>
        )}
      </div>

      {/* Service Areas */}
      <div className="-mx-4 mt-16 sm:-mx-6 lg:-mx-8">
        <ServiceAreas />
      </div>
    </div>
  );
}
