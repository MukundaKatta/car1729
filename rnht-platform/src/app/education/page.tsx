"use client";

import { useState, useEffect } from "react";
import { pushOverlay } from "@/lib/overlay-stack";
import {
  BookOpen,
  Clock,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
} from "lucide-react";

type Program = {
  id: string;
  name: string;
  category: string;
  description: string;
  instructor: string;
  schedule: string;
  duration: string;
  location: string;
  ageGroup: string;
  fee: number | null;
  feeLabel: string;
  capacity: number;
  enrolled: number;
  topics: string[];
};

const programs: Program[] = [
  {
    id: "edu-1",
    name: "Vedic Chanting (Sri Rudram)",
    category: "vedic",
    description: "Learn the sacred Sri Rudram chanting from the Yajur Veda. This structured course covers proper pronunciation (swara), meaning, and meditative aspects of Rudra Prashna and Chamaka Prashna.",
    instructor: "Pandit Venkata Sharma",
    schedule: "Saturdays, 10:00 AM - 11:30 AM",
    duration: "12 weeks",
    location: "RNHT Prayer Hall",
    ageGroup: "16+",
    fee: 50,
    feeLabel: "$50 / semester",
    capacity: 20,
    enrolled: 14,
    topics: ["Pronunciation & Swaras", "Rudra Prashna", "Chamaka Prashna", "Meditative Chanting"],
  },
  {
    id: "edu-2",
    name: "Sanskrit for Beginners",
    category: "vedic",
    description: "Introduction to the ancient language of the gods. Learn Devanagari script, basic grammar, common shlokas, and conversational Sanskrit through interactive sessions.",
    instructor: "Dr. Lakshmi Narasimhan",
    schedule: "Sundays, 11:00 AM - 12:00 PM",
    duration: "16 weeks",
    location: "RNHT Community Hall",
    ageGroup: "12+",
    fee: 75,
    feeLabel: "$75 / semester",
    capacity: 25,
    enrolled: 18,
    topics: ["Devanagari Script", "Basic Grammar", "Common Shlokas", "Conversational Practice"],
  },
  {
    id: "edu-3",
    name: "Bhagavad Gita Study Circle",
    category: "vedic",
    description: "Weekly study of the Bhagavad Gita with verse-by-verse analysis, philosophical discussions, and practical application of Gita teachings in daily life.",
    instructor: "Swami Krishnananda",
    schedule: "Wednesdays, 7:00 PM - 8:30 PM",
    duration: "Ongoing",
    location: "RNHT Prayer Hall + Online",
    ageGroup: "18+",
    fee: null,
    feeLabel: "Free (Donations welcome)",
    capacity: 40,
    enrolled: 32,
    topics: ["Karma Yoga", "Bhakti Yoga", "Jnana Yoga", "Practical Application"],
  },
  {
    id: "edu-4",
    name: "Bala Vihar (Children's Sunday School)",
    category: "children",
    description: "Fun and interactive classes teaching Hindu values, stories from epics, shloka chanting, and cultural activities. Inspired by the Chinmaya Mission Bala Vihar model.",
    instructor: "Smt. Radha Iyer & Volunteer Teachers",
    schedule: "Sundays, 10:00 AM - 11:30 AM",
    duration: "Full Year (Sep - May)",
    location: "RNHT Community Hall",
    ageGroup: "5-12 years",
    fee: 30,
    feeLabel: "$30 / semester",
    capacity: 30,
    enrolled: 22,
    topics: ["Shloka Learning", "Ramayana & Mahabharata Stories", "Hindu Festivals", "Arts & Crafts"],
  },
  {
    id: "edu-5",
    name: "Shloka Learning for Kids",
    category: "children",
    description: "Age-appropriate shloka memorization with meaning explanation. Children learn popular prayers like Ganesh Vandana, Saraswati Vandana, and daily prayers.",
    instructor: "Smt. Annapurna Devi",
    schedule: "Saturdays, 9:00 AM - 9:45 AM",
    duration: "8 weeks per level",
    location: "RNHT Prayer Hall",
    ageGroup: "4-10 years",
    fee: 20,
    feeLabel: "$20 / session",
    capacity: 15,
    enrolled: 12,
    topics: ["Daily Prayers", "Ganesh Vandana", "Saraswati Vandana", "Hanuman Chalisa"],
  },
  {
    id: "edu-6",
    name: "Bharatanatyam Dance",
    category: "cultural",
    description: "Classical Indian dance training from a professional Bharatanatyam instructor. Students learn Adavus, Jathis, Varnam, and full repertoire over multiple years.",
    instructor: "Smt. Priya Rangan",
    schedule: "Saturdays, 2:00 PM - 3:30 PM",
    duration: "Ongoing (graded levels)",
    location: "RNHT Community Hall",
    ageGroup: "6+",
    fee: 60,
    feeLabel: "$60 / month",
    capacity: 20,
    enrolled: 16,
    topics: ["Adavus & Basics", "Jathis", "Expressive Dance (Abhinaya)", "Full Repertoire"],
  },
  {
    id: "edu-7",
    name: "Carnatic Music Vocal",
    category: "cultural",
    description: "Learn Carnatic music from fundamental swaras to complex ragas and compositions. Individual and group sessions with emphasis on proper voice training.",
    instructor: "Sri Venkat Raman",
    schedule: "Sundays, 3:00 PM - 4:30 PM",
    duration: "Ongoing (graded levels)",
    location: "RNHT Prayer Hall",
    ageGroup: "8+",
    fee: 50,
    feeLabel: "$50 / month",
    capacity: 15,
    enrolled: 10,
    topics: ["Swaras & Sarali Varisai", "Ragas", "Keerthanas", "Concert Repertoire"],
  },
  {
    id: "edu-8",
    name: "Telugu Language Class",
    category: "cultural",
    description: "Learn Telugu reading, writing, and conversational skills. Classes designed for NRI children and adults who want to connect with their linguistic heritage.",
    instructor: "Sri Ravi Kumar",
    schedule: "Sundays, 1:00 PM - 2:00 PM",
    duration: "16 weeks",
    location: "RNHT Community Hall",
    ageGroup: "6+",
    fee: 40,
    feeLabel: "$40 / semester",
    capacity: 20,
    enrolled: 8,
    topics: ["Telugu Script", "Reading & Writing", "Conversational Telugu", "Telugu Literature"],
  },
  {
    id: "edu-9",
    name: "Yoga & Pranayama",
    category: "wellness",
    description: "Traditional yoga classes combining asanas, pranayama, and meditation. Certified instructor guides sessions suitable for all experience levels.",
    instructor: "Yoga Acharya Suresh",
    schedule: "Mon, Wed, Fri - 6:30 AM - 7:30 AM",
    duration: "Ongoing (drop-in welcome)",
    location: "RNHT Community Hall",
    ageGroup: "16+",
    fee: 40,
    feeLabel: "$40 / month",
    capacity: 30,
    enrolled: 24,
    topics: ["Hatha Yoga Asanas", "Pranayama", "Surya Namaskar", "Guided Meditation"],
  },
  {
    id: "edu-10",
    name: "Meditation & Mindfulness",
    category: "wellness",
    description: "Weekly guided meditation sessions incorporating Vedic meditation techniques, mindfulness practices, and stress management for modern life.",
    instructor: "Swami Krishnananda",
    schedule: "Thursdays, 7:00 PM - 8:00 PM",
    duration: "Ongoing (drop-in welcome)",
    location: "RNHT Prayer Hall",
    ageGroup: "14+",
    fee: null,
    feeLabel: "Free (Donations welcome)",
    capacity: 25,
    enrolled: 18,
    topics: ["Vedic Meditation", "Mindfulness Practice", "Stress Management", "Deep Relaxation"],
  },
];

const categories = [
  { id: "all", label: "All Programs", count: programs.length },
  { id: "vedic", label: "Vedic School", count: programs.filter((p) => p.category === "vedic").length },
  { id: "children", label: "Children's Programs", count: programs.filter((p) => p.category === "children").length },
  { id: "cultural", label: "Cultural Classes", count: programs.filter((p) => p.category === "cultural").length },
  { id: "wellness", label: "Yoga & Wellness", count: programs.filter((p) => p.category === "wellness").length },
];

export default function EducationPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");

  // Escape key handler and body scroll lock for registration modal
  useEffect(() => {
    if (!selectedProgram) return;
    document.body.style.overflow = "hidden";
    const close = () => {
      setSelectedProgram(null);
      setRegName("");
      setRegEmail("");
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    // Android hardware back closes the modal (instead of navigating away).
    const unregister = pushOverlay(close);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
      unregister();
    };
  }, [selectedProgram]);

  const filtered = selectedCategory === "all"
    ? programs
    : programs.filter((p) => p.category === selectedCategory);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center">
        <BookOpen className="mx-auto h-10 w-10 text-temple-red" />
        <h1 className="mt-4 section-heading">Education & Classes</h1>
        <p className="mt-3 mx-auto max-w-2xl text-gray-600">
          Deepen your spiritual knowledge, learn traditional arts, and nurture your
          children&apos;s connection to Hindu culture through our comprehensive programs.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-temple-red ${
              selectedCategory === cat.id
                ? "bg-temple-red text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Program Grid */}
      <h2 className="sr-only">Programs &amp; Classes</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((program) => (
          <div key={program.id} className="card overflow-hidden">
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
              program.category === "vedic" ? "bg-amber-50 text-amber-800" :
              program.category === "children" ? "bg-blue-50 text-blue-800" :
              program.category === "cultural" ? "bg-purple-50 text-purple-800" :
              "bg-green-50 text-green-800"
            }`}>
              {program.category === "vedic" ? "Vedic School" :
               program.category === "children" ? "Children's Program" :
               program.category === "cultural" ? "Cultural Class" : "Wellness"}
            </div>
            <div className="p-5">
              <h3 className="font-heading text-lg font-bold text-gray-900">
                {program.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {program.description}
              </p>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> {program.schedule}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {program.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Ages {program.ageGroup} | {program.enrolled}/{program.capacity} enrolled
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> {program.feeLabel}
                </div>
              </div>
              {/* Capacity bar */}
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${
                      program.enrolled / program.capacity > 0.8
                        ? "bg-red-400"
                        : "bg-green-400"
                    }`}
                    style={{ width: `${(program.enrolled / program.capacity) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {program.capacity - program.enrolled} spots remaining
                </p>
              </div>
              <button
                className="btn-primary mt-4 w-full text-sm"
                onClick={() => setSelectedProgram(program)}
              >
                Register Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" onClick={() => { setSelectedProgram(null); setRegName(""); setRegEmail(""); }}>
          <div className="max-h-[85vh] sm:max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Register: {selectedProgram.name}
            </h2>
            <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              <p><strong>Schedule:</strong> {selectedProgram.schedule}</p>
              <p><strong>Duration:</strong> {selectedProgram.duration}</p>
              <p><strong>Instructor:</strong> {selectedProgram.instructor}</p>
              <p><strong>Fee:</strong> {selectedProgram.feeLabel}</p>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700">Topics Covered</h3>
              <div className="mt-2 space-y-1">
                {selectedProgram.topics.map((topic) => (
                  <div key={topic} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" /> {topic}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Student Information</h3>
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700">Student Full Name *</label>
                <input id="reg-name" type="text" className="input-field mt-1" placeholder="Student Full Name *" value={regName} onChange={(e) => setRegName(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">Email *</label>
                  <input id="reg-email" type="email" className="input-field mt-1" placeholder="Email *" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input id="reg-phone" type="tel" className="input-field mt-1" placeholder="Phone" />
                </div>
              </div>
              <div>
                <label htmlFor="reg-guardian" className="block text-sm font-medium text-gray-700">Parent/Guardian Name (for children)</label>
                <input id="reg-guardian" type="text" className="input-field mt-1" placeholder="Parent/Guardian Name (for children)" />
              </div>
              <div>
                <label htmlFor="reg-notes" className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="reg-notes" className="input-field mt-1" rows={2} placeholder="Any special requirements or notes..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-outline" onClick={() => { setSelectedProgram(null); setRegName(""); setRegEmail(""); }}>Cancel</button>
              <button className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" disabled={!regName.trim() || !regEmail.trim()} onClick={() => {
                // Online class registration isn't wired to a backend yet — be
                // honest rather than claiming a submission that never happens.
                alert("Online registration is coming soon. To enroll now, please contact the temple at (512) 545-0473 or on WhatsApp and we'll get you signed up.");
                setSelectedProgram(null);
                setRegName("");
                setRegEmail("");
              }}>
                {selectedProgram.fee ? `Enquire about ${selectedProgram.feeLabel}` : "Enquire (Free)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
