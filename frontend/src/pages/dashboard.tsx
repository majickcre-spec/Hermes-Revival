import Layout from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  calculateTotalXP,
  getCurrentRank,
  getNextRank,
  getXPProgress,
  updateStreak,
  getStreakData,
  getUnlockedAchievements,
  getRecentActivity,
  getModuleProgress,
  type Rank,
  type StreakData,
  type Achievement,
  type ActivityEntry,
  type ModuleProgress,
} from "@/lib/gamification";
import { BookOpen, Trophy, Map, Flame, Star, ArrowRight } from "lucide-react";

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

export default function Dashboard() {
  const [xp, setXP] = useState(0);
  const [rank, setRank] = useState<Rank | null>(null);
  const [nextRank, setNextRank] = useState<Rank | null>(null);
  const [progress, setProgress] = useState({ current: 0, needed: 0, percent: 0 });
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastVisitDate: "", visitDates: [] });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [modules, setModules] = useState<ModuleProgress[]>([]);

  useEffect(() => {
    const streakData = updateStreak();
    const totalXP = calculateTotalXP();
    setXP(totalXP);
    setRank(getCurrentRank(totalXP));
    setNextRank(getNextRank(totalXP));
    setProgress(getXPProgress(totalXP));
    setStreak(streakData);
    setAchievements(getUnlockedAchievements());
    setActivities(getRecentActivity());
    setModules(getModuleProgress());
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const recommendedModule = modules.find(m => m.status === "in_progress") || modules.find(m => m.status === "not_started");

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
              Your Hermetic Journey
            </h1>
            <p style={{ color: celestial.textMuted }} className="text-lg font-body">
              Track your progress along the sacred path of understanding.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10 space-y-8">
          {/* Rank & XP Card */}
          {rank && (
            <div style={{ background: celestial.bgLight, border: `1px solid ${celestial.borderGold}`, borderRadius: "1rem", boxShadow: celestial.goldGlow }} className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Badge */}
                <div className="flex-shrink-0 w-24 h-24 rounded-full flex items-center justify-center" style={{
                  background: `radial-gradient(circle, ${rank.color}22, transparent)`,
                  border: `2px solid ${rank.color}`,
                  boxShadow: `0 0 20px ${rank.color}33`,
                }}>
                  <span className="text-4xl" style={{ color: rank.color, textShadow: `0 0 12px ${rank.color}66` }}>{rank.badge}</span>
                </div>

                {/* Info */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                    <h2 className="font-serif text-3xl" style={{ color: rank.color }}>{rank.name}</h2>
                    <span className="text-sm font-body italic" style={{ color: celestial.textMuted }}>{rank.title}</span>
                  </div>
                  <div className="text-sm mb-3" style={{ color: celestial.textMuted }}>
                    {nextRank
                      ? `${xp} XP — ${nextRank.minXP - xp} XP to ${nextRank.name}`
                      : `${xp} XP — Maximum rank achieved`
                    }
                  </div>
                  {/* XP Bar */}
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: celestial.surface }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${progress.percent}%`,
                        background: `linear-gradient(90deg, ${rank.color}, ${celestial.gold})`,
                        boxShadow: `0 0 8px ${rank.color}55`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl p-5 text-center" style={{ background: celestial.surface, border: `1px solid ${celestial.border}` }}>
              <Flame className="w-6 h-6 mx-auto mb-2" style={{ color: "#ff6b35" }} />
              <div className="text-2xl font-serif" style={{ color: celestial.text }}>{streak.currentStreak}</div>
              <div className="text-sm" style={{ color: celestial.textMuted }}>Day Streak</div>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: celestial.surface, border: `1px solid ${celestial.border}` }}>
              <Star className="w-6 h-6 mx-auto mb-2" style={{ color: celestial.gold }} />
              <div className="text-2xl font-serif" style={{ color: celestial.text }}>{xp}</div>
              <div className="text-sm" style={{ color: celestial.textMuted }}>Total XP</div>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: celestial.surface, border: `1px solid ${celestial.border}` }}>
              <Trophy className="w-6 h-6 mx-auto mb-2" style={{ color: celestial.gold }} />
              <div className="text-2xl font-serif" style={{ color: celestial.text }}>{unlockedCount} / {achievements.length}</div>
              <div className="text-sm" style={{ color: celestial.textMuted }}>Achievements</div>
            </div>
          </div>

          {/* Module Progress */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl" style={{ color: celestial.heading }}>Module Progress</h2>
              <Link href="/journey">
                <Button variant="ghost" className="text-sm" style={{ color: celestial.gold }}>
                  View Journey <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {modules.map(mod => {
                const pct = mod.totalItems > 0 ? Math.round((mod.completedItems / mod.totalItems) * 100) : 0;
                return (
                  <Link key={mod.id} href={mod.route}>
                    <div className="rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-0.5" style={{
                      background: celestial.surface,
                      border: `1px solid ${mod.status === "mastered" ? celestial.borderGold : celestial.border}`,
                      boxShadow: mod.status === "mastered" ? celestial.goldGlow : "none",
                    }}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif text-lg" style={{ color: celestial.text }}>{mod.name}</h3>
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                          background: mod.status === "mastered" ? `${celestial.gold}22` : mod.status === "in_progress" ? "#4682B422" : "#ffffff08",
                          color: mod.status === "mastered" ? celestial.gold : mod.status === "in_progress" ? "#87CEEB" : celestial.textFaint,
                        }}>
                          {mod.status === "mastered" ? "Mastered" : mod.status === "in_progress" ? "In Progress" : "Not Started"}
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: celestial.textMuted }}>{mod.description}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: celestial.bgLight }}>
                          <div className="h-full rounded-full transition-all" style={{
                            width: `${pct}%`,
                            background: mod.status === "mastered" ? celestial.gold : "#4682B4",
                          }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: celestial.textMuted }}>
                          {mod.completedItems}/{mod.totalItems}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Activity & Recommended */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div>
              <h2 className="font-serif text-2xl mb-4" style={{ color: celestial.heading }}>Recent Activity</h2>
              <div className="rounded-xl overflow-hidden" style={{ background: celestial.surface, border: `1px solid ${celestial.border}` }}>
                {activities.length > 0 ? activities.map((act, i) => (
                  <div key={i} className="px-5 py-4 flex items-start gap-3" style={{ borderBottom: i < activities.length - 1 ? `1px solid ${celestial.border}` : "none" }}>
                    <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: celestial.gold }} />
                    <div>
                      <div className="text-sm" style={{ color: celestial.text }}>{act.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: celestial.textFaint }}>{act.module}</div>
                    </div>
                  </div>
                )) : (
                  <div className="px-5 py-8 text-center" style={{ color: celestial.textMuted }}>
                    <p className="font-body italic">Begin your studies to see activity here.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Next Step */}
            <div>
              <h2 className="font-serif text-2xl mb-4" style={{ color: celestial.heading }}>Continue Your Journey</h2>
              {recommendedModule ? (
                <Link href={recommendedModule.route}>
                  <div className="rounded-xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1" style={{
                    background: `linear-gradient(135deg, ${celestial.surface}, ${celestial.bgLight})`,
                    border: `1px solid ${celestial.borderGold}`,
                    boxShadow: celestial.goldGlow,
                  }}>
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: celestial.goldDim }}>Recommended</span>
                    <h3 className="font-serif text-xl mt-2 mb-2" style={{ color: celestial.text }}>{recommendedModule.name}</h3>
                    <p className="text-sm mb-4" style={{ color: celestial.textMuted }}>{recommendedModule.description}</p>
                    <div className="flex items-center gap-2" style={{ color: celestial.gold }}>
                      <span className="text-sm font-medium">
                        {recommendedModule.status === "in_progress" ? "Continue Study" : "Begin Study"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="rounded-xl p-6" style={{ background: celestial.surface, border: `1px solid ${celestial.borderGold}` }}>
                  <p className="font-body italic text-center" style={{ color: celestial.textMuted }}>
                    All modules completed. Continue to deepen your practice.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-3 pt-4 pb-8">
            <Link href="/journey">
              <Button variant="outline" style={{ borderColor: celestial.borderGold, color: celestial.gold }} className="hover:bg-white/5">
                <Map className="w-4 h-4 mr-2" /> Sacred Path
              </Button>
            </Link>
            <Link href="/achievements">
              <Button variant="outline" style={{ borderColor: celestial.borderGold, color: celestial.gold }} className="hover:bg-white/5">
                <Trophy className="w-4 h-4 mr-2" /> Achievements
              </Button>
            </Link>
            <Link href="/modules">
              <Button variant="outline" style={{ borderColor: celestial.borderGold, color: celestial.gold }} className="hover:bg-white/5">
                <BookOpen className="w-4 h-4 mr-2" /> Teachings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
