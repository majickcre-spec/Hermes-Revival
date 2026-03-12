// Hermetic Gamification System
// Reads from existing localStorage keys to calculate XP, ranks, achievements, and streaks

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Rank {
  level: number;
  name: string;
  title: string;
  badge: string;
  color: string;
  minXP: number;
  maxXP: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  xp: number;
  unlocked: boolean;
}

export interface ModuleProgress {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  totalItems: number;
  completedItems: number;
  xpEarned: number;
  maxXP: number;
  status: "not_started" | "in_progress" | "mastered";
}

export interface ActivityEntry {
  label: string;
  timestamp: number;
  module: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: string; // YYYY-MM-DD
  visitDates: string[];
}

// ─── Ranks ────────────────────────────────────────────────────────────────────

export const RANKS: Rank[] = [
  { level: 1, name: "Neophyte",    title: "Seeker of Truth",                    badge: "○", color: "#C0C0C0", minXP: 0,    maxXP: 100  },
  { level: 2, name: "Student",     title: "Student of the Mysteries",           badge: "☽", color: "#87CEEB", minXP: 100,  maxXP: 300  },
  { level: 3, name: "Adept",       title: "Adept of the Hermetic Art",          badge: "☿", color: "#4682B4", minXP: 300,  maxXP: 600  },
  { level: 4, name: "Philosopher", title: "Philosopher of Nature",              badge: "☉", color: "#DAA520", minXP: 600,  maxXP: 1000 },
  { level: 5, name: "Initiate",    title: "Initiate of the Sacred Mysteries",   badge: "⚕", color: "#FFD700", minXP: 1000, maxXP: 1500 },
  { level: 6, name: "Sage",        title: "Sage of Divine Wisdom",              badge: "◉", color: "#FFA500", minXP: 1500, maxXP: 2500 },
  { level: 7, name: "Hermetist",   title: "Keeper of the Hermetic Tradition",   badge: "⬡", color: "#50C878", minXP: 2500, maxXP: Infinity },
];

// ─── Achievement Definitions ──────────────────────────────────────────────────

const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked">[] = [
  // Memory Master (Heads of Things)
  { id: "heads-1",    title: "First Step",          description: "Memorize 1 aphorism",           category: "Memory Master",     icon: "brain",    xp: 10  },
  { id: "heads-25",   title: "Scholar",             description: "Memorize 25 aphorisms",         category: "Memory Master",     icon: "brain",    xp: 50  },
  { id: "heads-50",   title: "Adept of Memory",     description: "Memorize 50 aphorisms",         category: "Memory Master",     icon: "brain",    xp: 100 },
  { id: "heads-82",   title: "Master of the Heads", description: "Memorize all 82 aphorisms",     category: "Memory Master",     icon: "brain",    xp: 200 },

  // Regeneration Journey
  { id: "regen-torments", title: "Self-Aware",      description: "Identify all 12 Torments",      category: "Regeneration",      icon: "sparkles", xp: 50  },
  { id: "regen-powers",   title: "Light Bearer",    description: "Cultivate all 10 Powers",       category: "Regeneration",      icon: "sparkles", xp: 100 },
  { id: "regen-reflect",  title: "Reborn",          description: "Complete all Regeneration reflections", category: "Regeneration", icon: "sparkles", xp: 150 },
  { id: "regen-song",     title: "Singer of Hymns", description: "Read The Secret Song",          category: "Regeneration",      icon: "sparkles", xp: 25  },

  // Planetary Ascent
  { id: "gov-moon",    title: "Lunar Traveler",      description: "Reflect on Moon sphere",       category: "Planetary Ascent",  icon: "orbit",    xp: 15  },
  { id: "gov-sun",     title: "Solar Initiate",      description: "Reflect on Sun sphere",        category: "Planetary Ascent",  icon: "orbit",    xp: 15  },
  { id: "gov-all",     title: "Celestial Navigator",  description: "Reflect on all 7 spheres",    category: "Planetary Ascent",  icon: "orbit",    xp: 100 },

  // Mind & Wisdom
  { id: "mind-10",    title: "Student of Nous",       description: "Complete The Mind Book X",     category: "Mind & Wisdom",     icon: "book-open", xp: 50  },
  { id: "mind-11",    title: "Philosopher of Mind",   description: "Complete The Mind Book XI",    category: "Mind & Wisdom",     icon: "book-open", xp: 50  },
  { id: "mind-all",   title: "Master of Intelligence", description: "Complete both books + reflections", category: "Mind & Wisdom", icon: "book-open", xp: 150 },

  // Dedication
  { id: "streak-7",   title: "Daily Seeker",          description: "7-day practice streak",        category: "Dedication",        icon: "flame",    xp: 50  },
  { id: "streak-30",  title: "Devoted Student",       description: "30-day practice streak",       category: "Dedication",        icon: "flame",    xp: 150 },
  { id: "streak-100", title: "Hermetic Discipline",   description: "100-day practice streak",      category: "Dedication",        icon: "flame",    xp: 500 },

  // Deep Learning (Flashcard System)
  { id: "learn-perspectives", title: "Multi-Perspectival Thinker", description: "View all perspectives for 5 aphorisms",     category: "Deep Learning", icon: "search",  xp: 100 },
  { id: "learn-contemplator", title: "Deep Contemplator",          description: "Spend 30+ min in Deep Questions mode",       category: "Deep Learning", icon: "message", xp: 150 },
  { id: "learn-matcher",      title: "Wisdom in Action",           description: "Perfect score on 5 Example Matcher scenarios", category: "Deep Learning", icon: "globe",   xp: 100 },
  { id: "learn-connections",   title: "Pattern Recognition",       description: "Explore all Concept Connection clusters",     category: "Deep Learning", icon: "link",    xp: 150 },
  { id: "learn-master",       title: "Master of Aphorisms",        description: "Understand 10 aphorisms across all modes",   category: "Deep Learning", icon: "star",    xp: 500 },
];

// ─── localStorage Readers ─────────────────────────────────────────────────────

function getHeadsMemorized(): number[] {
  try {
    const raw = localStorage.getItem("heads-memorized");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function getRegenSet(key: string): Set<number> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function hasContent(key: string): boolean {
  const val = localStorage.getItem(key);
  return !!val && val.trim().length > 0;
}

const PLANETS = ["moon", "mercury", "venus", "sun", "mars", "jupiter", "saturn"];

function getGovernorReflections(): string[] {
  return PLANETS.filter(p => hasContent(`seven-governors-notes-${p}`));
}

const MIND_SECTIONS = [
  "book10-intro", "book10-sec1", "book10-sec2", "book10-sec3", "book10-sec4",
  "book10-sec5", "book10-sec6", "book10-sec7", "book10-sec8",
  "book11-intro", "book11-sec1", "book11-sec2", "book11-sec3", "book11-sec4",
  "book11-sec5", "book11-sec6", "book11-sec7", "book11-sec8",
];

function getMindReflections(): string[] {
  return MIND_SECTIONS.filter(k => hasContent(`the-mind-notes-${k}`));
}

// ─── Achievement Checking ─────────────────────────────────────────────────────

function checkAchievement(id: string): boolean {
  const heads = getHeadsMemorized();
  const torments = getRegenSet("regeneration-torments-working");
  const powers = getRegenSet("regeneration-powers-working");
  const govReflections = getGovernorReflections();
  const mindReflections = getMindReflections();

  switch (id) {
    // Heads
    case "heads-1":  return heads.length >= 1;
    case "heads-25": return heads.length >= 25;
    case "heads-50": return heads.length >= 50;
    case "heads-82": return heads.length >= 82;

    // Regeneration
    case "regen-torments": return torments.size >= 12;
    case "regen-powers":   return powers.size >= 10;
    case "regen-reflect": {
      for (let i = 1; i <= 12; i++) { if (!hasContent(`regeneration-torment-${i}-reflection`)) return false; }
      for (let i = 1; i <= 10; i++) { if (!hasContent(`regeneration-power-${i}-reflection`)) return false; }
      return true;
    }
    case "regen-song": return hasContent("regeneration-overall-reflection") || powers.size > 0;

    // Governors
    case "gov-moon": return govReflections.includes("moon");
    case "gov-sun":  return govReflections.includes("sun");
    case "gov-all":  return govReflections.length >= 7;

    // Mind
    case "mind-10": {
      const book10keys = MIND_SECTIONS.filter(k => k.startsWith("book10"));
      return book10keys.some(k => hasContent(`the-mind-notes-${k}`));
    }
    case "mind-11": {
      const book11keys = MIND_SECTIONS.filter(k => k.startsWith("book11"));
      return book11keys.some(k => hasContent(`the-mind-notes-${k}`));
    }
    case "mind-all": return mindReflections.length >= 10;

    // Streaks
    case "streak-7":   return getStreakData().longestStreak >= 7;
    case "streak-30":  return getStreakData().longestStreak >= 30;
    case "streak-100": return getStreakData().longestStreak >= 100;

    // Deep Learning
    case "learn-perspectives": {
      try {
        const raw = localStorage.getItem("learning-perspectives-viewed");
        if (!raw) return false;
        const viewed = JSON.parse(raw) as string[];
        // Count unique aphorism IDs that have all 4 perspectives viewed
        const byAphorism: Record<string, number> = {};
        for (const v of viewed) {
          const aId = v.split("-")[0];
          byAphorism[aId] = (byAphorism[aId] || 0) + 1;
        }
        return Object.values(byAphorism).filter(c => c >= 4).length >= 5;
      } catch { return false; }
    }
    case "learn-contemplator": {
      try {
        const totalTime = parseInt(localStorage.getItem("learning-questions-total-time") || "0", 10);
        return totalTime >= 1800; // 30 minutes in seconds
      } catch { return false; }
    }
    case "learn-matcher": {
      try {
        const perfect = parseInt(localStorage.getItem("learning-examples-perfect") || "0", 10);
        return perfect >= 5;
      } catch { return false; }
    }
    case "learn-connections": {
      try {
        const raw = localStorage.getItem("learning-connections-explored");
        if (!raw) return false;
        const explored = JSON.parse(raw) as string[];
        return explored.length >= 5;
      } catch { return false; }
    }
    case "learn-master": {
      try {
        const raw = localStorage.getItem("learning-perspectives-understood");
        if (!raw) return false;
        const understood = JSON.parse(raw) as string[];
        return understood.length >= 10;
      } catch { return false; }
    }

    default: return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getUnlockedAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: checkAchievement(def.id),
  }));
}

export function calculateTotalXP(): number {
  const achievements = getUnlockedAchievements();
  return achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
}

export function getCurrentRank(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(xp: number): Rank | null {
  const current = getCurrentRank(xp);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function getXPProgress(xp: number): { current: number; needed: number; percent: number } {
  const rank = getCurrentRank(xp);
  const next = getNextRank(xp);
  if (!next) return { current: xp - rank.minXP, needed: 0, percent: 100 };
  const current = xp - rank.minXP;
  const needed = next.minXP - rank.minXP;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}

export function getModuleProgress(): ModuleProgress[] {
  const heads = getHeadsMemorized();
  const torments = getRegenSet("regeneration-torments-working");
  const powers = getRegenSet("regeneration-powers-working");
  const govReflections = getGovernorReflections();
  const mindReflections = getMindReflections();

  function status(done: number, total: number): "not_started" | "in_progress" | "mastered" {
    if (done === 0) return "not_started";
    if (done >= total) return "mastered";
    return "in_progress";
  }

  const headsDone = heads.length;
  const regenDone = torments.size + powers.size;
  const govDone = govReflections.length;
  const mindBook10 = MIND_SECTIONS.filter(k => k.startsWith("book10") && hasContent(`the-mind-notes-${k}`)).length;
  const mindBook11 = MIND_SECTIONS.filter(k => k.startsWith("book11") && hasContent(`the-mind-notes-${k}`)).length;
  const mindDone = mindBook10 + mindBook11;

  return [
    {
      id: "heads-of-things",
      name: "The Heads of Things",
      description: "Memorize the 82 aphorisms of Divine knowledge",
      route: "/reader/heads-of-things",
      icon: "lightbulb",
      totalItems: 82,
      completedItems: headsDone,
      xpEarned: (headsDone >= 1 ? 10 : 0) + (headsDone >= 25 ? 50 : 0) + (headsDone >= 50 ? 100 : 0) + (headsDone >= 82 ? 200 : 0),
      maxXP: 360,
      status: status(headsDone, 82),
    },
    {
      id: "regeneration",
      name: "The Secret of Regeneration",
      description: "Transform the 12 Torments into 10 Powers",
      route: "/reader/regeneration",
      icon: "sunrise",
      totalItems: 22,
      completedItems: regenDone,
      xpEarned: (torments.size >= 12 ? 50 : 0) + (powers.size >= 10 ? 100 : 0),
      maxXP: 325,
      status: status(regenDone, 22),
    },
    {
      id: "seven-governors",
      name: "The Seven Governors",
      description: "Ascend through the seven planetary spheres",
      route: "/reader/seven-governors",
      icon: "orbit",
      totalItems: 7,
      completedItems: govDone,
      xpEarned: (govReflections.includes("moon") ? 15 : 0) + (govReflections.includes("sun") ? 15 : 0) + (govDone >= 7 ? 100 : 0),
      maxXP: 130,
      status: status(govDone, 7),
    },
    {
      id: "the-mind",
      name: "The Mind",
      description: "Explore divine intelligence through Books X & XI",
      route: "/reader/the-mind",
      icon: "brain",
      totalItems: 18,
      completedItems: mindDone,
      xpEarned: (mindBook10 > 0 ? 50 : 0) + (mindBook11 > 0 ? 50 : 0) + (mindDone >= 10 ? 150 : 0),
      maxXP: 250,
      status: status(mindDone, 18),
    },
  ];
}

// ─── Streak Tracking ──────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getStreakData(): StreakData {
  try {
    const raw = localStorage.getItem("hermetic-streak-data");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { currentStreak: 0, longestStreak: 0, lastVisitDate: "", visitDates: [] };
}

export function updateStreak(): StreakData {
  const data = getStreakData();
  const today = todayStr();

  if (data.lastVisitDate === today) return data; // Already tracked today

  const yesterday = yesterdayStr();
  if (data.lastVisitDate === yesterday) {
    data.currentStreak += 1;
  } else if (data.lastVisitDate !== today) {
    data.currentStreak = 1;
  }

  data.lastVisitDate = today;
  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak;
  }

  if (!data.visitDates.includes(today)) {
    data.visitDates.push(today);
    // Keep last 120 days only
    if (data.visitDates.length > 120) {
      data.visitDates = data.visitDates.slice(-120);
    }
  }

  localStorage.setItem("hermetic-streak-data", JSON.stringify(data));
  return data;
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

export function getRecentActivity(): ActivityEntry[] {
  const activities: ActivityEntry[] = [];

  // Check heads memorized count
  const heads = getHeadsMemorized();
  if (heads.length > 0) {
    activities.push({
      label: `${heads.length} aphorism${heads.length !== 1 ? "s" : ""} memorized`,
      timestamp: Date.now(),
      module: "Heads of Things",
    });
  }

  // Check regeneration progress
  const torments = getRegenSet("regeneration-torments-working");
  const powers = getRegenSet("regeneration-powers-working");
  if (torments.size > 0 || powers.size > 0) {
    activities.push({
      label: `${torments.size} Torment${torments.size !== 1 ? "s" : ""} identified, ${powers.size} Power${powers.size !== 1 ? "s" : ""} cultivated`,
      timestamp: Date.now() - 3600000,
      module: "Regeneration",
    });
  }

  // Check governor reflections
  const govCount = getGovernorReflections().length;
  if (govCount > 0) {
    activities.push({
      label: `${govCount} of 7 planetary sphere${govCount !== 1 ? "s" : ""} reflected upon`,
      timestamp: Date.now() - 7200000,
      module: "Seven Governors",
    });
  }

  // Check mind reflections
  const mindCount = getMindReflections().length;
  if (mindCount > 0) {
    activities.push({
      label: `${mindCount} of 18 section${mindCount !== 1 ? "s" : ""} studied`,
      timestamp: Date.now() - 10800000,
      module: "The Mind",
    });
  }

  return activities;
}

// ─── Summary Stats ────────────────────────────────────────────────────────────

export function getSummaryStats() {
  const xp = calculateTotalXP();
  const rank = getCurrentRank(xp);
  const progress = getXPProgress(xp);
  const streak = getStreakData();
  const achievements = getUnlockedAchievements();
  const unlocked = achievements.filter(a => a.unlocked).length;

  return {
    xp,
    rank,
    progress,
    streak,
    achievementsUnlocked: unlocked,
    achievementsTotal: achievements.length,
  };
}
