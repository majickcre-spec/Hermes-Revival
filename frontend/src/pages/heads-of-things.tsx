import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, ChevronDown, ChevronUp, PenLine, Trash2, Type,
  Check, Shuffle, List, Eye, EyeOff, RotateCcw
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ──────────────────────────────────────────────────────
// THEME
// ──────────────────────────────────────────────────────

const celestial = {
  bg: "#0a1628",
  bgLight: "#0f1d32",
  sidebar: "#0d1a2e",
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
  memorized: "#d4af37",
  unmemorized: "#5a6f8c",
};

const starFieldBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Ccircle cx='50' cy='30' r='1' fill='%23ffffff' opacity='.4'/%3E%3Ccircle cx='180' cy='60' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='320' cy='20' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='90' cy='120' r='.5' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='250' cy='100' r='1' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='370' cy='90' r='.6' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='30' cy='200' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='150' cy='180' r='.5' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='280' cy='210' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='390' cy='170' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='70' cy='290' r='.6' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='200' cy='270' r='.8' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='340' cy='300' r='.5' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='120' cy='350' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='260' cy='370' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='380' cy='340' r='.6' fill='%23ffffff' opacity='.2'/%3E%3C/svg%3E")`;

// ──────────────────────────────────────────────────────
// CONTENT — The 82 Heads (Dr. John Everard, 1650)
// ──────────────────────────────────────────────────────

interface Aphorism {
  verse: number;
  text: string;
}

interface Category {
  name: string;
  description: string;
  aphorisms: Aphorism[];
}

const introVerses = `HERMES. All things that are moved, O Tat, are they not moved in something, and by something? And must not that in which a thing is moved, be greater than the thing that is moved? Of necessity greater, and a more strong and powerful thing.

2. That in which a thing is moved, is it not of a nature contrary to that thing that is moved? It is exceedingly.

3. And is not this great World a Body, than which there is no greater?

4. It is confessedly so.

5. And is it not solid, as filled with many great bodies, and indeed with all the bodies that are?

6. It is so.

7. And is not the World a body, and a body that is moved?

8. It is.

9. Then what kind of a place must it be, wherein it is moved, and of what nature? Must it not be far greater, that it may receive the continuity of Motion, lest that which is moved should for want of room be stayed, and hindered in the motion?

10. It must needs be an immense thing, O Trismegistus: but of what nature?

11. Of a contrary nature, O Tat. But is not the nature of things unbodily, contrary to a Body?

12. It is confessedly so.

13. Therefore the place is unbodily. But that which is unbodily, is either some Divine thing, or God himself. And by some Divine thing, I do not mean that which was made, but that which was not made.`;

const closingVerses = `82. If thou perfectly remember these Heads, thou canst not forget those things which in more words I have largely expounded unto thee; for these are the Contents or Abridgment of them.

83. Avoid also much speech concerning these things, unto the multitude; not that I would have thee envy any, but rather because thou shalt seem ridiculous to many.

84. For by him that is like, that which is like is accepted; but he that is unlike, can never be a friend.

85. These words therefore belong to very few Hearers, and peradventure not so many as few.

86. They have moreover this peculiar thing: They stir up the Evil that is in foolish men to the worse, and therefore the Multitude is to be avoided, for they do not understand the power and efficacy of things spoken.

87. Tat. How sayest thou, O Father?

88. Herm. Thus, O Son; the whole nature and composition of those living things called men, is very prone to Wickedness, and is very familiar and as it were nourished with it, and therefore is delighted with it. Now this Wight, if it shall come to learn that the World was once made, and all things are done according to Providence and Necessity, Destiny, or Fate, bearing rule over all; will he not be much worse than himself, despising the whole, because it was made? And if he may lay the cause of Evil upon Fate or Destiny, he will never abstain from any evil work. Wherefore we must look warily to such kind of people, that being in ignorance, they may be less evil for fear of that which is hidden and secret.`;

const categories: Category[] = [
  {
    name: "Being and Non-Being",
    description: "The nature of existence, immobility, and the changeable world",
    aphorisms: [
      { verse: 14, text: "All things that are moved, only that which is not is immoveable." },
      { verse: 15, text: "Every body is changeable." },
      { verse: 16, text: "Not every body is dissolveable." },
    ]
  },
  {
    name: "Mortality and Immortality",
    description: "The nature of mortal and immortal things, and their qualities",
    aphorisms: [
      { verse: 17, text: "Some bodies are dissolveable." },
      { verse: 18, text: "Every living thing is not mortal." },
      { verse: 19, text: "Nor every living thing is immortal." },
      { verse: 20, text: "That which is dissolveable is corruptible." },
      { verse: 21, text: "That which abides always is unchangeable." },
      { verse: 22, text: "That which is unchangeable is eternal." },
      { verse: 23, text: "That which is always made is always corrupted." },
      { verse: 24, text: "That which is made but once is never corrupted, neither becomes any other thing." },
      { verse: 25, text: "First, God; Secondly, the World; Thirdly, Man." },
      { verse: 26, text: "The World for Man; Man for God." },
      { verse: 27, text: "Of the Soul; that part which is sensible is mortal, but that which is reasonable is immortal." },
      { verse: 28, text: "Every Essence is immortal." },
      { verse: 29, text: "Every Essence is unchangeable." },
    ]
  },
  {
    name: "Motion and Stillness",
    description: "The nature of motion, rest, and the soul's relationship to both",
    aphorisms: [
      { verse: 30, text: "Every thing that is moveable is not a living thing." },
      { verse: 31, text: "Every living thing is moved." },
      { verse: 32, text: "Whatsoever suffereth is sensible; whatsoever is sensible suffereth." },
      { verse: 33, text: "Whatsoever suffereth sorrow, also enjoyeth pleasure, and it is a mortal living thing." },
      { verse: 34, text: "Not everything that enjoyeth pleasure suffereth sorrow; for it is an immortal living thing." },
      { verse: 35, text: "Not every body is sick; every body that is sick is dissolveable." },
      { verse: 36, text: "The Mind is in God." },
    ]
  },
  {
    name: "Mind and Reason",
    description: "The nature of Mind, Reason, and their relationship to God and Man",
    aphorisms: [
      { verse: 37, text: "Reason is in the Mind." },
      { verse: 38, text: "The Mind is free from suffering." },
      { verse: 39, text: "No thing in a body is true." },
      { verse: 40, text: "All that is unbodily is free from lying." },
      { verse: 41, text: "Everything that is made is corruptible." },
      { verse: 42, text: "Nothing good upon Earth; nothing evil in Heaven." },
      { verse: 43, text: "God is Good; Man is Evil." },
    ]
  },
  {
    name: "Heaven and Earth",
    description: "The cosmic order, the elements, and the nature of Heaven and Earth",
    aphorisms: [
      { verse: 44, text: "Good is voluntary, or of its own accord." },
      { verse: 45, text: "Evil is involuntary, or against its will." },
      { verse: 46, text: "The Gods choose good things, as good things." },
      { verse: 47, text: "Time is a Divine thing." },
      { verse: 48, text: "Law is Humane." },
      { verse: 49, text: "Malice is the nourishment of the World." },
      { verse: 50, text: "Time is the corruption of Man." },
      { verse: 51, text: "Whatsoever is in Heaven is unalterable." },
      { verse: 52, text: "All upon Earth is alterable." },
      { verse: 53, text: "Nothing in Heaven is servanted; nothing on Earth free." },
      { verse: 54, text: "Nothing unknown in Heaven; nothing known on Earth." },
      { verse: 55, text: "The things upon Earth communicate not with those in Heaven." },
      { verse: 56, text: "All things in Heaven are unblameable." },
      { verse: 57, text: "All things upon Earth are subject to reprehension." },
      { verse: 58, text: "That which is immortal is not mortal." },
      { verse: 59, text: "That which is mortal is not immortal." },
    ]
  },
  {
    name: "Generation and Corruption",
    description: "The nature of creation, destruction, and the processes of the cosmos",
    aphorisms: [
      { verse: 60, text: "That which is sown is not always begotten; but that which is begotten always, is always sown." },
      { verse: 61, text: "Of a dissolveable body, there are two times, one from sowing to generation, one from generation to death." },
      { verse: 62, text: "Of an everlasting Body, the time is only from the Generation." },
      { verse: 63, text: "Dissolveable Bodies are increased and diminished." },
      { verse: 64, text: "Dissolveable Matter is altered into contraries; to wit, Corruption and Generation, but Eternal matter into itself, and its like." },
      { verse: 65, text: "The Generation of Man is corruption; the Corruption of Man is the beginning of Generation." },
      { verse: 66, text: "That which offsprings or begetteth another, is itself a creature; that which begets from itself alone, is never corrupted by another." },
      { verse: 67, text: "Whatsoever is begotten is begotten of another." },
      { verse: 68, text: "Of things that are, those that are in bodies are in generation and corruption." },
      { verse: 69, text: "There is nothing that stirs or moves which first is not stirred and moved." },
      { verse: 70, text: "The Soul is in the Body; the Mind is in the Soul." },
      { verse: 71, text: "The Word or Reason is in the Mind." },
      { verse: 72, text: "God is the Father of the Word or Reason." },
    ]
  },
  {
    name: "Divine Order",
    description: "The order of God, Heaven, and the unity of all things",
    aphorisms: [
      { verse: 73, text: "The Sum of all is One." },
      { verse: 74, text: "The Mind doth not make the Soul; but the Soul that already is, the Mind preserveth." },
      { verse: 75, text: "The Sun preserveth and nourishes all living Creatures; and as the intelligible World governing the sensible World, bestows upon it subsistence." },
      { verse: 76, text: "For concerning the Sun; that he is the Artist or Maker, Illumination, and Accomplisher of all Living Natures in the World." },
      { verse: 77, text: "That is to say, the good Daemon or Spirit having begun to serve and minister to one part, illuminates and shines upon the World." },
      { verse: 78, text: "Even so does the Sun illumine the other parts of the Universe." },
      { verse: 79, text: "For there are about him Seven Worlds, to whom he distributes and dispenses immortal perpetuity." },
      { verse: 80, text: "Night follows the Day, and Day the Night." },
      { verse: 81, text: "And there is another Nature of the Soul, which is intelligent; joined in peace with the Mind." },
    ]
  },
];

const ALL_VERSES = categories.flatMap(c => c.aphorisms.map(a => a.verse));

// ──────────────────────────────────────────────────────
// STORAGE
// ──────────────────────────────────────────────────────

function loadMemorized(): Set<number> {
  try {
    const raw = localStorage.getItem("heads-memorized");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveMemorized(s: Set<number>) {
  localStorage.setItem("heads-memorized", JSON.stringify([...s]));
}

function loadMnemonic(verse: number): string {
  return localStorage.getItem(`heads-mnemonics-${verse}`) || "";
}

function saveMnemonic(verse: number, text: string) {
  localStorage.setItem(`heads-mnemonics-${verse}`, text);
}

function loadReflection(key: string): string {
  return localStorage.getItem(key) || "";
}

function saveReflection(key: string, text: string) {
  localStorage.setItem(key, text);
}

// ──────────────────────────────────────────────────────
// COMPONENTS
// ──────────────────────────────────────────────────────

type StudyMode = "sequential" | "random" | "category" | "quiz";

function ProgressBar({ memorized, total }: { memorized: number; total: number }) {
  const pct = total > 0 ? (memorized / total) * 100 : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-2" style={{ color: celestial.textMuted }}>
        <span>{memorized} of {total} memorized</span>
        <span style={{ color: pct === 100 ? celestial.gold : celestial.textFaint }}>{Math.round(pct)}%</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: celestial.surface }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct === 100
              ? `linear-gradient(to right, ${celestial.gold}, #f0d060)`
              : `linear-gradient(to right, ${celestial.goldDim}, ${celestial.gold})`,
            boxShadow: pct > 0 ? celestial.goldGlow : "none",
          }}
        />
      </div>
    </div>
  );
}

function AphorismCard({
  aphorism,
  isMemorized,
  onToggleMemorized,
  quizMode,
  mnemonic,
  onMnemonicChange,
}: {
  aphorism: Aphorism;
  isMemorized: boolean;
  onToggleMemorized: () => void;
  quizMode: boolean;
  mnemonic: string;
  onMnemonicChange: (val: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const hidden = quizMode && !revealed;

  return (
    <div
      className="rounded-lg p-4 transition-all duration-300"
      style={{
        backgroundColor: isMemorized ? `rgba(212,175,55,0.06)` : celestial.surface,
        border: `1px solid ${isMemorized ? celestial.borderGold : celestial.border}`,
        boxShadow: isMemorized ? `0 0 8px rgba(212,175,55,0.1)` : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggleMemorized}
          className="mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
          style={{
            border: `2px solid ${isMemorized ? celestial.gold : celestial.unmemorized}`,
            backgroundColor: isMemorized ? celestial.gold : "transparent",
          }}
        >
          {isMemorized && <Check className="w-3 h-3" style={{ color: celestial.bg }} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold" style={{ color: isMemorized ? celestial.gold : celestial.textFaint }}>
              {aphorism.verse}.
            </span>
            {quizMode && (
              <button
                onClick={() => setRevealed(!revealed)}
                className="text-xs flex items-center gap-1"
                style={{ color: celestial.textMuted }}
              >
                {hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {hidden ? "Reveal" : "Hide"}
              </button>
            )}
          </div>

          <p
            className="font-serif leading-relaxed text-sm transition-all"
            style={{
              color: hidden ? "transparent" : celestial.text,
              backgroundColor: hidden ? celestial.surfaceLight : "transparent",
              borderRadius: hidden ? "4px" : "0",
              userSelect: hidden ? "none" : "auto",
            }}
          >
            {aphorism.text}
          </p>

          {/* Mnemonic toggle */}
          <button
            onClick={() => setShowMnemonic(!showMnemonic)}
            className="text-xs mt-2 flex items-center gap-1 transition-colors"
            style={{ color: celestial.textFaint }}
          >
            <PenLine className="w-3 h-3" />
            {mnemonic ? "Edit mnemonic" : "Add mnemonic"}
          </button>

          {showMnemonic && (
            <input
              type="text"
              value={mnemonic}
              onChange={(e) => onMnemonicChange(e.target.value)}
              placeholder="Your memory aid for this aphorism..."
              className="mt-2 w-full rounded px-3 py-1.5 text-xs focus:outline-none"
              style={{
                backgroundColor: celestial.bgLight,
                border: `1px solid ${celestial.border}`,
                color: celestial.text,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `${celestial.gold}60`; }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `rgba(212,175,55,0.15)`;
                saveMnemonic(aphorism.verse, e.currentTarget.value);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ReflectionArea({
  storageKey,
  prompt,
  label,
}: {
  storageKey: string;
  prompt: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => loadReflection(storageKey));
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((val: string) => {
    saveReflection(storageKey, val);
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 1500);
  }, [storageKey]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm"
        style={{ background: `linear-gradient(to right, rgba(212,175,55,0.06), transparent)`, border: `1px solid ${celestial.gold}30`, color: celestial.textMuted }}
      >
        <span className="flex items-center gap-2">
          <PenLine className="w-4 h-4" /> {label}
          {text && !open && <span className="text-xs ml-1" style={{ color: celestial.gold }}>(has notes)</span>}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="mt-3 relative">
          <p className="text-xs italic mb-2" style={{ color: celestial.textFaint }}>{prompt}</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => save(text)}
            rows={5}
            className="w-full rounded-lg p-4 font-body text-sm leading-relaxed resize-y focus:outline-none"
            style={{ backgroundColor: celestial.sidebar, border: `1px solid ${celestial.border}`, color: celestial.text }}
            onFocus={(e) => { e.currentTarget.style.borderColor = `${celestial.gold}60`; e.currentTarget.style.boxShadow = `0 0 12px rgba(212,175,55,0.15)`; }}
            onBlurCapture={(e) => { e.currentTarget.style.borderColor = `rgba(212,175,55,0.15)`; e.currentTarget.style.boxShadow = "none"; }}
          />
          {saved && <span className="absolute top-8 right-3 text-xs" style={{ color: celestial.gold }}>✓ Saved</span>}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────

export default function HeadsOfThings() {
  const [fontSize, setFontSize] = useState(16);
  const [memorized, setMemorized] = useState<Set<number>>(loadMemorized);
  const [mnemonics, setMnemonics] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    ALL_VERSES.forEach(v => { m[v] = loadMnemonic(v); });
    return m;
  });
  const [mode, setMode] = useState<StudyMode>("sequential");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [shuffled, setShuffled] = useState<Aphorism[]>([]);
  const [showFullText, setShowFullText] = useState(false);

  const toggleMemorized = useCallback((verse: number) => {
    setMemorized(prev => {
      const next = new Set(prev);
      if (next.has(verse)) next.delete(verse); else next.add(verse);
      saveMemorized(next);
      return next;
    });
  }, []);

  const updateMnemonic = useCallback((verse: number, val: string) => {
    setMnemonics(prev => ({ ...prev, [verse]: val }));
  }, []);

  const doShuffle = useCallback(() => {
    const all = categories.flatMap(c => c.aphorisms);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    setShuffled(all);
  }, []);

  useEffect(() => { if (mode === "random") doShuffle(); }, [mode, doShuffle]);

  const resetProgress = () => {
    if (confirm("Clear all memorization progress? This cannot be undone.")) {
      setMemorized(new Set());
      saveMemorized(new Set());
    }
  };

  const displayAphorisms = useMemo(() => {
    if (mode === "random") return shuffled;
    if (mode === "category" && activeCategory !== null) return categories[activeCategory].aphorisms;
    return categories.flatMap(c => c.aphorisms);
  }, [mode, activeCategory, shuffled]);

  return (
    <Layout>
      <div
        className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]"
        style={{ backgroundColor: celestial.bg, backgroundImage: starFieldBg, backgroundRepeat: "repeat" }}
      >
        {/* Sidebar */}
        <aside
          className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r p-6 hidden md:block overflow-y-auto"
          style={{ backgroundColor: celestial.sidebar, borderColor: celestial.border, maxHeight: "calc(100vh - 4rem)" }}
        >
          <div className="mb-6">
            <Link href="/modules">
              <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent" style={{ color: celestial.textMuted }}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Modules
              </Button>
            </Link>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <ProgressBar memorized={memorized.size} total={ALL_VERSES.length} />
          </div>

          <Separator className="my-4" style={{ backgroundColor: `rgba(212,175,55,0.12)` }} />

          {/* Study Mode */}
          <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: celestial.textFaint }}>Study Mode</h4>
          <div className="space-y-1 mb-6">
            {([
              { m: "sequential" as const, icon: List, label: "Sequential" },
              { m: "random" as const, icon: Shuffle, label: "Random" },
              { m: "category" as const, icon: List, label: "By Category" },
              { m: "quiz" as const, icon: EyeOff, label: "Quiz Mode" },
            ]).map(({ m, icon: Icon, label }) => (
              <button
                key={m}
                onClick={() => { setMode(m); if (m !== "category") setActiveCategory(null); }}
                className="w-full text-left text-xs px-3 py-2 rounded flex items-center gap-2 transition-colors"
                style={{
                  color: mode === m ? celestial.gold : celestial.textMuted,
                  backgroundColor: mode === m ? `rgba(212,175,55,0.08)` : "transparent",
                }}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          {/* Category filter (when in category mode) */}
          {mode === "category" && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: celestial.textFaint }}>Categories</h4>
              <nav className="space-y-1">
                {categories.map((cat, i) => {
                  const catMemorized = cat.aphorisms.filter(a => memorized.has(a.verse)).length;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveCategory(i)}
                      className="w-full text-left text-xs px-3 py-2 rounded flex items-center justify-between transition-colors"
                      style={{
                        color: activeCategory === i ? celestial.gold : celestial.textMuted,
                        backgroundColor: activeCategory === i ? `rgba(212,175,55,0.08)` : "transparent",
                      }}
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs" style={{ color: celestial.textFaint }}>{catMemorized}/{cat.aphorisms.length}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {mode === "random" && (
            <Button size="sm" variant="ghost" onClick={doShuffle} className="w-full text-xs mb-4" style={{ color: celestial.textMuted }}>
              <Shuffle className="w-3 h-3 mr-1" /> Reshuffle
            </Button>
          )}

          <Separator className="my-4" style={{ backgroundColor: `rgba(212,175,55,0.12)` }} />

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: celestial.textFaint }}>Reading Settings</h4>
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" style={{ color: celestial.textFaint }} />
              <input type="range" min="14" max="22" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full" style={{ accentColor: celestial.gold }} />
            </div>
            <Button size="sm" variant="ghost" onClick={resetProgress} className="w-full text-xs" style={{ color: celestial.textFaint }}>
              <RotateCcw className="w-3 h-3 mr-1" /> Reset Progress
            </Button>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 relative" style={{ backgroundColor: "transparent" }}>
          <ScrollArea className="h-[calc(100vh-4rem)] w-full">
            <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
              {/* Mobile back */}
              <div className="md:hidden mb-8">
                <Link href="/modules"><Button variant="ghost" size="sm" className="pl-0" style={{ color: celestial.textMuted }}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
              </div>

              {/* Header */}
              <div className="text-center mb-12 space-y-4 animate-in fade-in duration-700">
                <div className="inline-block pb-1 mb-2" style={{ borderBottom: `2px solid ${celestial.gold}50` }}>
                  <span className="font-serif text-lg" style={{ color: celestial.gold }}>Study Module</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: celestial.gold, textShadow: "0 0 30px rgba(212,175,55,0.2)" }}>
                  The Heads of Things
                </h1>
                <p className="font-serif italic text-xl" style={{ color: celestial.textMuted }}>The Way to Remember All Knowledge</p>
                <p className="text-sm" style={{ color: celestial.textFaint }}>Hermes Trismegistus, His First Book</p>
                <p className="text-xs" style={{ color: celestial.goldDim }}>Dr. John Everard Translation (1650) — From The Divine Pymander</p>
              </div>

              {/* Mobile progress */}
              <div className="md:hidden mb-8">
                <ProgressBar memorized={memorized.size} total={ALL_VERSES.length} />
              </div>

              {/* Introduction */}
              <div className="mb-12">
                <div className="rounded-lg p-6" style={{ border: `1px solid ${celestial.border}`, backgroundColor: celestial.bgLight }}>
                  <p className="font-body leading-loose text-justify" style={{ fontSize: `${fontSize}px`, color: celestial.text }}>
                    Hermes instructs his son Tat to commit to memory eighty-two condensed truths — the "Heads" or summaries of all the Divine teachings. To master these is to hold the entire system of sacred knowledge in the mind at once. Each aphorism is a seed that, when contemplated, unfolds into the fullness of the teaching it represents.
                  </p>
                  <p className="font-body leading-loose text-justify mt-4" style={{ fontSize: `${fontSize}px`, color: `${celestial.text}cc` }}>
                    "If thou perfectly remember these Heads, thou canst not forget those things which in more words I have largely expounded unto thee; for these are the Contents or Abridgment of them."
                  </p>
                </div>
              </div>

              {/* Full Text Toggle */}
              <div className="mb-12">
                <button
                  onClick={() => setShowFullText(!showFullText)}
                  className="w-full flex items-center justify-between px-6 py-4 rounded-lg text-sm font-semibold"
                  style={{ background: celestial.surface, border: `1px solid ${celestial.borderGold}`, color: celestial.gold }}
                >
                  <span className="font-serif text-lg">Full Authentic Text (Verses 1–88)</span>
                  {showFullText ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showFullText && (
                  <div className="mt-4 rounded-lg p-6 font-serif leading-loose whitespace-pre-line" style={{ backgroundColor: celestial.surface, border: `1px solid ${celestial.border}`, borderLeft: `3px solid ${celestial.gold}50`, color: celestial.text, fontSize: `${fontSize}px` }}>
                    <p className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: celestial.goldDim }}>From The Divine Pymander — Dr. John Everard Translation (1650)</p>
                    <div className="mb-8">{introVerses}</div>
                    <Separator className="my-6" style={{ backgroundColor: `rgba(212,175,55,0.12)` }} />
                    <p className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: celestial.goldDim }}>The 82 Heads (Verses 14–81)</p>
                    {categories.flatMap(c => c.aphorisms).map(a => (
                      <p key={a.verse} className="mb-2"><span style={{ color: celestial.goldDim }}>{a.verse}.</span> {a.text}</p>
                    ))}
                    <Separator className="my-6" style={{ backgroundColor: `rgba(212,175,55,0.12)` }} />
                    <p className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: celestial.goldDim }}>The Closing Warning (Verses 82–88)</p>
                    <div>{closingVerses}</div>
                  </div>
                )}
              </div>

              {/* Mobile mode selector */}
              <div className="md:hidden mb-6 flex gap-2 flex-wrap">
                {(["sequential", "random", "category", "quiz"] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} className="text-xs px-3 py-1.5 rounded-full capitalize" style={{ color: mode === m ? celestial.bg : celestial.textMuted, backgroundColor: mode === m ? celestial.gold : celestial.surface }}>
                    {m}
                  </button>
                ))}
              </div>

              {/* Aphorism Cards */}
              <div className="mb-12">
                <h2 className="font-serif text-2xl font-bold mb-6" style={{ color: celestial.gold }}>
                  {mode === "quiz" ? "Quiz Mode — Test Your Recall" :
                   mode === "random" ? "Random Order" :
                   mode === "category" && activeCategory !== null ? categories[activeCategory].name :
                   "The 82 Heads"}
                </h2>

                {mode === "category" && activeCategory !== null && (
                  <p className="text-sm mb-6" style={{ color: celestial.textMuted }}>{categories[activeCategory].description}</p>
                )}

                {mode === "sequential" && (
                  <div className="space-y-8">
                    {categories.map((cat, ci) => (
                      <div key={ci}>
                        <h3 className="font-serif text-lg font-semibold mb-1" style={{ color: celestial.gold }}>{cat.name}</h3>
                        <p className="text-xs mb-4" style={{ color: celestial.textFaint }}>{cat.description}</p>
                        <div className="space-y-3" style={{ fontSize: `${fontSize}px` }}>
                          {cat.aphorisms.map(a => (
                            <AphorismCard
                              key={a.verse}
                              aphorism={a}
                              isMemorized={memorized.has(a.verse)}
                              onToggleMemorized={() => toggleMemorized(a.verse)}
                              quizMode={false}
                              mnemonic={mnemonics[a.verse] || ""}
                              onMnemonicChange={(val) => updateMnemonic(a.verse, val)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(mode === "random" || mode === "quiz" || (mode === "category" && activeCategory !== null)) && (
                  <div className="space-y-3" style={{ fontSize: `${fontSize}px` }}>
                    {displayAphorisms.map(a => (
                      <AphorismCard
                        key={`${mode}-${a.verse}`}
                        aphorism={a}
                        isMemorized={memorized.has(a.verse)}
                        onToggleMemorized={() => toggleMemorized(a.verse)}
                        quizMode={mode === "quiz"}
                        mnemonic={mnemonics[a.verse] || ""}
                        onMnemonicChange={(val) => updateMnemonic(a.verse, val)}
                      />
                    ))}
                  </div>
                )}

                {mode === "category" && activeCategory === null && (
                  <div className="space-y-3">
                    {categories.map((cat, i) => {
                      const catMem = cat.aphorisms.filter(a => memorized.has(a.verse)).length;
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveCategory(i)}
                          className="w-full text-left rounded-lg p-5 transition-all"
                          style={{ backgroundColor: celestial.surface, border: `1px solid ${celestial.border}` }}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-serif text-lg" style={{ color: celestial.gold }}>{cat.name}</h3>
                              <p className="text-xs mt-1" style={{ color: celestial.textFaint }}>{cat.description}</p>
                            </div>
                            <span className="text-sm font-bold" style={{ color: catMem === cat.aphorisms.length ? celestial.gold : celestial.textFaint }}>
                              {catMem}/{cat.aphorisms.length}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Closing Warning */}
              <div className="mb-12 rounded-lg p-6" style={{ backgroundColor: celestial.bgLight, border: `1px solid ${celestial.border}` }}>
                <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: celestial.gold }}>Hermes' Closing Warning</h3>
                <div className="font-serif leading-loose whitespace-pre-line" style={{ color: `${celestial.text}cc`, fontSize: `${fontSize}px` }}>
                  {closingVerses}
                </div>
              </div>

              {/* Reflections */}
              <ReflectionArea
                storageKey="heads-overall-reflection"
                label="Overall Reflection"
                prompt="As you work to memorize these Heads, what patterns or connections do you see emerging? How does this memory practice change your understanding?"
              />
              <ReflectionArea
                storageKey="heads-application"
                label="Application Notes"
                prompt="How are you applying these principles in your daily life? Which Heads resonate most strongly with your current experiences?"
              />

              {/* Footer Nav */}
              <div className="mt-16 pt-12 flex items-center justify-between" style={{ borderTop: `1px solid ${celestial.border}` }}>
                <Link href="/modules">
                  <Button variant="outline" style={{ borderColor: `${celestial.gold}30`, color: celestial.textMuted }}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Modules
                  </Button>
                </Link>
                <Link href="/reader/the-mind">
                  <Button style={{ backgroundColor: celestial.gold, color: celestial.bg }}>The Mind →</Button>
                </Link>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}
