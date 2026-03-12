import Layout from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  calculateTotalXP,
  getCurrentRank,
  getModuleProgress,
  getUnlockedAchievements,
  type ModuleProgress,
} from "@/lib/gamification";
import { ArrowRight, CheckCircle, Lock, BookOpen, Brain, Lightbulb, Sunrise, Orbit } from "lucide-react";

const celestial = {
  bg: "#0a1628",
  bgLight: "#0f1d32",
  surface: "#1a2942",
  surfaceLight: "#1e3050",
  text: "#e8e4d9",
  textMuted: "#8a9bb8",
  textFaint: "#5a6f8c",
  heading: "#d4af37",
  gold: "#d4af37",
  goldDim: "#a68a2a",
  goldGlow: "0 0 12px rgba(212,175,55,0.25)",
  border: "rgba(212,175,55,0.15)",
  borderGold: "rgba(212,175,55,0.3)",
};

const starField = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Ccircle cx='50' cy='80' r='0.6' fill='white' opacity='0.3'/%3E%3Ccircle cx='150' cy='30' r='0.4' fill='white' opacity='0.2'/%3E%3Ccircle cx='250' cy='120' r='0.8' fill='white' opacity='0.15'/%3E%3Ccircle cx='350' cy='60' r='0.5' fill='white' opacity='0.25'/%3E%3Ccircle cx='80' cy='200' r='0.7' fill='white' opacity='0.2'/%3E%3Ccircle cx='200' cy='250' r='0.4' fill='white' opacity='0.35'/%3E%3Ccircle cx='320' cy='180' r='0.6' fill='white' opacity='0.18'/%3E%3Ccircle cx='100' cy='320' r='0.5' fill='white' opacity='0.22'/%3E%3Ccircle cx='280' cy='350' r='0.8' fill='white' opacity='0.12'/%3E%3Ccircle cx='380' cy='280' r='0.4' fill='white' opacity='0.3'/%3E%3Ccircle cx='30' cy='380' r='0.6' fill='white' opacity='0.2'/%3E%3Ccircle cx='170' cy='150' r='1' fill='white' opacity='0.6'/%3E%3Ccircle cx='60' cy='140' r='0.5' fill='white' opacity='0.4'/%3E%3Ccircle cx='300' cy='300' r='0.7' fill='white' opacity='0.15'/%3E%3Ccircle cx='220' cy='380' r='0.4' fill='white' opacity='0.25'/%3E%3C/svg%3E")`;

const moduleIcons: Record<string, React.ReactNode> = {
  "heads-of-things": <Lightbulb className="w-6 h-6" />,
  "regeneration": <Sunrise className="w-6 h-6" />,
  "seven-governors": <Orbit className="w-6 h-6" />,
  "the-mind": <Brain className="w-6 h-6" />,
};

const moduleOrder = ["heads-of-things", "regeneration", "seven-governors", "the-mind"];

const statusColors = {
  mastered: { bg: "rgba(212,175,55,0.08)", border: "rgba(212,175,55,0.4)", icon: "#d4af37", label: "Mastered" },
  in_progress: { bg: "rgba(70,130,180,0.08)", border: "rgba(70,130,180,0.4)", icon: "#87CEEB", label: "In Progress" },
  not_started: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.08)", icon: "#5a6f8c", label: "Not Started" },
};

export default function Journey() {
  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [xp, setXP] = useState(0);

  useEffect(() => {
    const allModules = getModuleProgress();
    // Sort by preferred order
    const sorted = moduleOrder
      .map(id => allModules.find(m => m.id === id))
      .filter(Boolean) as ModuleProgress[];
    setModules(sorted);
    setXP(calculateTotalXP());
  }, []);

  const rank = getCurrentRank(xp);
  const totalMaxXP = modules.reduce((s, m) => s + m.maxXP, 0);
  const totalEarnedXP = modules.reduce((s, m) => s + m.xpEarned, 0);
  const overallPct = totalMaxXP > 0 ? Math.round((totalEarnedXP / totalMaxXP) * 100) : 0;

  return (
    <Layout>
      <div style={{
        background: celestial.bg,
        backgroundImage: starField,
        backgroundRepeat: "repeat",
        color: celestial.text,
        minHeight: "100vh",
      }}>
        {/* Header */}
        <div style={{ borderBottom: `1px solid ${celestial.border}`, padding: "3rem 0 2.5rem" }}>
          <div className="container mx-auto px-4">
            <h1 className="font-serif text-4xl md:text-5xl mb-2" style={{ color: celestial.heading, textShadow: "0 0 30px rgba(212,175,55,0.2)" }}>
              The Path of Initiation
            </h1>
            <p className="text-lg font-body mb-6" style={{ color: celestial.textMuted }}>
              Your sacred journey through the Hermetic teachings.
            </p>

            {/* Overall Progress */}
            <div className="max-w-xl">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm" style={{ color: celestial.textMuted }}>Overall Progress</span>
                <span className="text-sm font-mono" style={{ color: celestial.gold }}>{totalEarnedXP} / {totalMaxXP} XP</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: celestial.surface }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${overallPct}%`,
                    background: `linear-gradient(90deg, #4682B4, ${celestial.gold})`,
                    boxShadow: `0 0 8px ${celestial.gold}44`,
                  }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: celestial.textFaint }}>{overallPct}% complete</div>
            </div>
          </div>
        </div>

        {/* Journey Path */}
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-3xl mx-auto space-y-0">
            {modules.map((mod, idx) => {
              const pct = mod.totalItems > 0 ? Math.round((mod.completedItems / mod.totalItems) * 100) : 0;
              const sc = statusColors[mod.status];
              const isLast = idx === modules.length - 1;

              return (
                <div key={mod.id} className="relative">
                  {/* Vertical connecting line */}
                  {!isLast && (
                    <div className="absolute left-8 top-full w-0.5 h-8 z-0" style={{
                      background: `linear-gradient(to bottom, ${celestial.borderGold}, transparent)`,
                    }} />
                  )}

                  {/* Module Card */}
                  <div className="relative z-10 rounded-xl p-6 md:p-8 mb-8 transition-all duration-300 hover:-translate-y-0.5" style={{
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                    boxShadow: mod.status === "mastered" ? celestial.goldGlow : "none",
                  }}>
                    <div className="flex items-start gap-5">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center" style={{
                        background: `${sc.icon}15`,
                        border: `1.5px solid ${sc.icon}44`,
                      }}>
                        <span style={{ color: sc.icon }}>{moduleIcons[mod.id]}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                          <h3 className="font-serif text-xl md:text-2xl" style={{ color: celestial.text }}>{mod.name}</h3>
                          <div className="flex items-center gap-1.5">
                            {mod.status === "mastered" ? (
                              <CheckCircle className="w-4 h-4" style={{ color: celestial.gold }} />
                            ) : mod.status === "not_started" ? (
                              <Lock className="w-4 h-4" style={{ color: celestial.textFaint }} />
                            ) : null}
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: sc.icon }}>
                              {sc.label}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm mb-4" style={{ color: celestial.textMuted }}>{mod.description}</p>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: celestial.bgLight }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{
                              width: `${pct}%`,
                              background: mod.status === "mastered"
                                ? `linear-gradient(90deg, ${celestial.goldDim}, ${celestial.gold})`
                                : `linear-gradient(90deg, #4682B4, #87CEEB)`,
                              boxShadow: mod.status === "mastered" ? `0 0 6px ${celestial.gold}44` : "none",
                            }} />
                          </div>
                          <span className="text-sm font-mono whitespace-nowrap" style={{ color: celestial.textMuted }}>
                            {mod.completedItems} / {mod.totalItems}
                          </span>
                        </div>

                        {/* Stats & CTA */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-sm" style={{ color: celestial.textFaint }}>
                            XP Earned: <span style={{ color: celestial.gold }}>{mod.xpEarned}</span> / {mod.maxXP}
                          </div>
                          <Link href={mod.route}>
                            <Button size="sm" className="font-serif" style={{
                              background: mod.status === "mastered" ? `${celestial.gold}22` : celestial.gold,
                              color: mod.status === "mastered" ? celestial.gold : celestial.bg,
                              border: `1px solid ${celestial.gold}66`,
                            }}>
                              <BookOpen className="w-4 h-4 mr-2" />
                              {mod.status === "mastered" ? "Continue Practice" : mod.status === "in_progress" ? "Continue Study" : "Begin Study"}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Links */}
          <div className="max-w-3xl mx-auto pt-4 pb-12 flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard">
              <Button variant="outline" style={{ borderColor: celestial.borderGold, color: celestial.gold }} className="hover:bg-white/5">
                Dashboard
              </Button>
            </Link>
            <Link href="/achievements">
              <Button variant="outline" style={{ borderColor: celestial.borderGold, color: celestial.gold }} className="hover:bg-white/5">
                Achievements
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
