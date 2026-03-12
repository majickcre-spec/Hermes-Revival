import Layout from "@/components/layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  calculateTotalXP,
  getCurrentRank,
  getUnlockedAchievements,
  type Achievement,
} from "@/lib/gamification";
import { Brain, Sparkles, Globe, BookOpen, Flame, Trophy, Lock, ArrowLeft } from "lucide-react";

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

const categoryIcons: Record<string, React.ReactNode> = {
  "Memory Master": <Brain className="w-5 h-5" />,
  "Regeneration": <Sparkles className="w-5 h-5" />,
  "Planetary Ascent": <Globe className="w-5 h-5" />,
  "Mind & Wisdom": <BookOpen className="w-5 h-5" />,
  "Dedication": <Flame className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  "Memory Master": "#87CEEB",
  "Regeneration": "#b088f9",
  "Planetary Ascent": "#70c896",
  "Mind & Wisdom": "#d4af37",
  "Dedication": "#ff6b35",
};

const CATEGORIES = ["Memory Master", "Regeneration", "Planetary Ascent", "Mind & Wisdom", "Dedication"];

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [xp, setXP] = useState(0);

  useEffect(() => {
    setAchievements(getUnlockedAchievements());
    setXP(calculateTotalXP());
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);
  const rank = getCurrentRank(xp);

  // Group by category
  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    achievements: achievements.filter(a => a.category === cat),
  }));

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
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" style={{ color: celestial.textMuted }} className="mb-4 -ml-2 hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl mb-2" style={{ color: celestial.heading, textShadow: "0 0 30px rgba(212,175,55,0.2)" }}>
              Achievement Gallery
            </h1>
            <p className="text-lg font-body" style={{ color: celestial.textMuted }}>
              Milestones of your sacred journey. {unlocked.length} of {achievements.length} unlocked.
            </p>

            {/* Summary bar */}
            <div className="mt-5 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" style={{ color: celestial.gold }} />
                <span className="font-serif text-xl" style={{ color: celestial.gold }}>{unlocked.length}</span>
                <span className="text-sm" style={{ color: celestial.textMuted }}>Unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg" style={{ color: rank.color }}>{rank.badge}</span>
                <span className="text-sm" style={{ color: celestial.textMuted }}>Rank: <span style={{ color: rank.color }}>{rank.name}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: celestial.textMuted }}>
                  XP from achievements: <span className="font-mono" style={{ color: celestial.gold }}>{unlocked.reduce((s, a) => s + a.xp, 0)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Categories */}
        <div className="container mx-auto px-4 py-10 space-y-10">
          {grouped.map(group => {
            const catColor = categoryColors[group.category] || celestial.gold;
            const catIcon = categoryIcons[group.category];
            const catUnlocked = group.achievements.filter(a => a.unlocked).length;

            return (
              <div key={group.category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                    background: `${catColor}15`,
                    border: `1px solid ${catColor}33`,
                    color: catColor,
                  }}>
                    {catIcon}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl" style={{ color: catColor }}>{group.category}</h2>
                    <span className="text-xs" style={{ color: celestial.textFaint }}>
                      {catUnlocked} / {group.achievements.length} unlocked
                    </span>
                  </div>
                </div>

                {/* Achievement Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {group.achievements.map(ach => (
                    <div
                      key={ach.id}
                      className="rounded-xl p-5 transition-all duration-300"
                      style={{
                        background: ach.unlocked ? `${catColor}08` : "rgba(255,255,255,0.02)",
                        border: `1px solid ${ach.unlocked ? `${catColor}44` : "rgba(255,255,255,0.06)"}`,
                        boxShadow: ach.unlocked ? `0 0 12px ${catColor}15` : "none",
                        opacity: ach.unlocked ? 1 : 0.5,
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                          background: ach.unlocked ? `${catColor}20` : "rgba(255,255,255,0.05)",
                          border: `1.5px solid ${ach.unlocked ? catColor : "rgba(255,255,255,0.1)"}`,
                        }}>
                          {ach.unlocked ? (
                            <Trophy className="w-5 h-5" style={{ color: catColor }} />
                          ) : (
                            <Lock className="w-4 h-4" style={{ color: celestial.textFaint }} />
                          )}
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
                          background: ach.unlocked ? `${celestial.gold}20` : "rgba(255,255,255,0.05)",
                          color: ach.unlocked ? celestial.gold : celestial.textFaint,
                        }}>
                          {ach.xp} XP
                        </span>
                      </div>
                      <h3 className="font-serif text-base mb-1" style={{
                        color: ach.unlocked ? celestial.text : celestial.textFaint,
                      }}>
                        {ach.title}
                      </h3>
                      <p className="text-xs leading-relaxed" style={{
                        color: ach.unlocked ? celestial.textMuted : celestial.textFaint,
                      }}>
                        {ach.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Links */}
        <div className="container mx-auto px-4 pb-12 flex flex-wrap gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="outline" style={{ borderColor: celestial.borderGold, color: celestial.gold }} className="hover:bg-white/5">
              Dashboard
            </Button>
          </Link>
          <Link href="/journey">
            <Button variant="outline" style={{ borderColor: celestial.borderGold, color: celestial.gold }} className="hover:bg-white/5">
              Sacred Path
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
