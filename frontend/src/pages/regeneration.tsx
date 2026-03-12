import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, ChevronDown, ChevronUp, PenLine, Type, Check, Flame, Sun
} from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";

// ──────────────────────────────────────────────────────
// THEME
// ──────────────────────────────────────────────────────

const celestial = {
  bg: "#0a1628", bgLight: "#0f1d32", sidebar: "#0d1a2e",
  surface: "#1a2942", surfaceLight: "#1e3050",
  text: "#e8e4d9", textMuted: "#8a9bb8", textFaint: "#5a6f8c",
  gold: "#d4af37", goldDim: "#a68a2a",
  goldGlow: "0 0 12px rgba(212,175,55,0.25)",
  border: "rgba(212,175,55,0.15)", borderGold: "rgba(212,175,55,0.3)",
};

const tormentColor = { bg: "rgba(120,40,60,0.08)", border: "#8a3050", glow: "0 0 8px rgba(138,48,80,0.15)", text: "#c47088" };
const powerColor = { bg: "rgba(212,175,55,0.08)", border: "#d4af37", glow: "0 0 10px rgba(212,175,55,0.2)", text: "#d4af37" };

const starFieldBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Ccircle cx='50' cy='30' r='1' fill='%23ffffff' opacity='.4'/%3E%3Ccircle cx='180' cy='60' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='320' cy='20' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='90' cy='120' r='.5' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='250' cy='100' r='1' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='370' cy='90' r='.6' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='30' cy='200' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='150' cy='180' r='.5' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='280' cy='210' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='390' cy='170' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='70' cy='290' r='.6' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='200' cy='270' r='.8' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='340' cy='300' r='.5' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='120' cy='350' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='260' cy='370' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='380' cy='340' r='.6' fill='%23ffffff' opacity='.2'/%3E%3C/svg%3E")`;

// ──────────────────────────────────────────────────────
// CONTENT
// ──────────────────────────────────────────────────────

interface Torment {
  number: number;
  name: string;
  quote: string;
  description: string;
}

interface Power {
  number: number;
  name: string;
  expels: string;
  quote: string;
  description: string;
}

const torments: Torment[] = [
  { number: 1, name: "Ignorance", quote: "The first Torment is this same Ignorance; the second is Sorrow; the third Intemperance; the fourth Concupiscence; the fifth Injustice; the sixth Covetousness; the seventh Deceit; the eighth Envy; the ninth Fraud; the tenth Wrath; the eleventh Rashness; the twelfth Maliciousness.", description: "The foundational darkness — not mere lack of knowledge, but the active refusal to know God. All other torments proceed from this root." },
  { number: 2, name: "Sorrow", quote: "These are in number Twelve, but under these there are many more, O Son; and they do through the prison of the Body, compel the inwardly placed Man, to suffer sensibly.", description: "The grief that arises from attachment to mortal things. Sorrow feeds on the illusion that what is lost was truly ours." },
  { number: 3, name: "Intemperance", quote: "But they depart, though not all at once, from him that hath obtained mercy of God; and this is the manner and reason of Regeneration.", description: "The inability to govern one's appetites — the soul enslaved to the body's demands, unable to say no to excess." },
  { number: 4, name: "Concupiscence", quote: "For this is the Birth of Regeneration: That we no longer see things in the image of the twelve places, but of the ten.", description: "Desire turned compulsive — the burning want that consumes the soul's energy and directs it away from the Divine." },
  { number: 5, name: "Injustice", quote: "Tat: I am now, O Father, settled and established in the Mind, not by that sight which is according to the ordinary course of the eyes, but by the intellectual operation through the Powers.", description: "The willingness to take what belongs to another, whether in action or in thought. The soul that refuses to give each thing its due." },
  { number: 6, name: "Covetousness", quote: "Tat: Tell me, O Father, is this Body which consists of Powers ever dissoluble?", description: "The insatiable hunger for more — possessions, status, recognition — that no amount of acquisition can satisfy." },
  { number: 7, name: "Deceit", quote: "Herm: Hush! Speak not of things impossible, for so thou shalt sin, and the eye of thy Mind be quenched.", description: "The habit of untruth — deceiving others and oneself. The soul wrapped in falsehood cannot perceive the Real." },
  { number: 8, name: "Envy", quote: "For the sensible Body of Nature is far from the Essential Generation.", description: "The corrosion of joy at another's good fortune. Envy reveals the soul's belief in scarcity, which is a lie against God's abundance." },
  { number: 9, name: "Fraud", quote: "That is dissolveable, but this is indissoluble; that is mortal, this immortal.", description: "The calculated manipulation of truth for personal gain — the weaponization of intelligence against its proper purpose." },
  { number: 10, name: "Wrath", quote: "Dost thou not know that thou art born a God, and the Son of the One, as I Am?", description: "The violent eruption of the ego when its will is thwarted. Wrath mistakes force for power and destruction for justice." },
  { number: 11, name: "Rashness", quote: "Before I delivered myself to the Body, I was in a vision of a beauteous Spectacle, very admirable.", description: "Action without wisdom — the impulse that leaps before looking, that confuses speed with progress and boldness with courage." },
  { number: 12, name: "Maliciousness", quote: "And I saw in the Mind the Light, consisting of innumerable Powers, and become an infinite Ornament.", description: "The active desire to cause harm — the deepest corruption, where the soul takes pleasure in another's suffering." },
];

const powers: Power[] = [
  { number: 1, name: "Knowledge of God", expels: "Ignorance", quote: "Be of good cheer, O Son, now thou art purged and cleansed; the Knowledge of God is come to thee.", description: "The direct experiential knowing of the Divine — not belief, not theory, but gnosis. When Knowledge enters, Ignorance flees." },
  { number: 2, name: "Joy", expels: "Sorrow", quote: "After Knowledge of God, O Son, there succeedeth Joy; and when Joy is come, Sorrow shall fly away to them that are capable of it.", description: "Not mere happiness but divine gladness — the soul's natural state when freed from false attachment. Joy expels Sorrow." },
  { number: 3, name: "Temperance", expels: "Intemperance", quote: "The third Virtue or Power is Temperance. O most sweet Power! Let us receive her, O Son, most willingly; for how as soon as she is come, she hath thrust away Intemperance.", description: "The capacity for self-governance — not repression of desire but its transformation. Temperance is the soul's sovereignty over its own nature." },
  { number: 4, name: "Continence", expels: "Concupiscence", quote: "Now I call the fourth, Continence, the Power that is over Concupiscence. This, O Son, is the standing and foundation of Justice.", description: "The power to contain one's desires within proper bounds — the foundation of Justice. Continence is strength, not deprivation." },
  { number: 5, name: "Justice", expels: "Injustice", quote: "For see how without judgment she hath driven away Injustice. We are justified, O Son, see, Injustice is gone.", description: "The natural ordering of all things according to their proper nature. Justice does not judge — it simply gives each thing its due." },
  { number: 6, name: "Communion", expels: "Covetousness", quote: "The sixth Power that comes to us, O Son, I call Communion, which is against Covetousness.", description: "The recognition that all things are shared in God. Where Communion dwells, Covetousness cannot survive, for there is nothing to hoard." },
  { number: 7, name: "Truth", expels: "Deceit", quote: "And now being Covetousness departed, I call the Truth; and when Truth cometh, Deceit likewise flies away.", description: "The correspondence between what is and what is spoken. Truth is the very light of the Mind — in its presence, all deception dissolves." },
  { number: 8, name: "The Good", expels: "Envy", quote: "See, O Son, how the Truth is come; and the Good is come; Life and Light follow. And now there are come no more any Torments of Darkness, but being overcome they all fly away with a rushing noise.", description: "The summation of all positive qualities — the nature of God made manifest. When the Good arrives, Envy has no ground to stand on." },
  { number: 9, name: "Life", expels: "Death and Darkness", quote: "Life and Light follow upon the Good.", description: "Not biological life but the eternal Life that is the very activity of God. Life drives away the shadow of death." },
  { number: 10, name: "Light", expels: "All remaining Darkness", quote: "Now thou knowest, O Son, the way of Regeneration.", description: "The final Power that completes the transformation. Light is the fullness of divine presence — the generation of the Decad in the soul." },
];

const hymnText = `Holy is God, the Father of all things.
Holy is God, whose Will is performed and accomplished by his own Powers.
Holy is God, that determineth to be known, and is known of his own.
Holy art Thou, that by thy Word hast established all things.
Holy art Thou, of whom all Nature is the Image.
Holy art Thou, whom Nature hath not formed.
Holy art Thou, that art stronger than all power.
Holy art Thou, that art greater than all excellency.
Holy art Thou, who art better than all praise.

Accept these reasonable sacrifices from a pure Soul and Heart, stretched out unto Thee.

O Thou unspeakable, unutterable, to be praised with silence!

I beseech Thee, that I may never err from the Knowledge of Thee: Look mercifully upon me, and enable me, and enlighten with this Grace those that are in Ignorance, the Brothers of my Kind, but thy Sons.

Therefore I believe Thee, and bear witness, and go into the Life and Light.

Blessed art Thou, O Father; Thy Man would be sanctified with Thee, as Thou hast given him all power.`;

const hymnInstruction = `"Give thanks to God, thus singing. O Tat, this singing or giving of thanks, I must instruct thee to render, standing in the open Air, looking to the North Wind about the going down of the Sun; and to the South when the Sun ariseth."`;

const keyThemes = [
  { theme: "Regeneration as Silence", verse: "v. 4", explanation: `"This wisdom is to be understood in silence, and the seed is the true Good." The process of Regeneration cannot be taught through words alone — it must be undergone in the interior silence of the soul.` },
  { theme: "The Seed is God's Will", verse: "v. 6", explanation: `"Who soweth it? The Will of God, O Son." Regeneration is not a human achievement but a divine gift. The soul can prepare itself, but the transformation comes from God's Will.` },
  { theme: "Going Out of Oneself", verse: "v. 14–18", explanation: `"I am gone out of myself into an immortal body... I am not now what I was before." This is the experiential moment of rebirth — the soul recognizing itself as other than the body.` },
  { theme: "The Zodiacal Tabernacle", verse: "v. 49–52", explanation: `"This Tabernacle consists of the Zodiacal Circle... consists of Twelve numbers." The 12 Torments correspond to the 12 signs of the Zodiac — the soul's imprisonment in the cycle of cosmic necessity.` },
  { theme: "Unity and the Decad", verse: "v. 51–52", explanation: `"The number of Ten is the begetter of Souls... Unity hath the number of Ten." The 10 Powers form a Decad — the complete number that reconstitutes the soul in its divine fullness.` },
  { theme: "The Ogdoad", verse: "v. 58–59", explanation: `The eighth sphere beyond the seven planets — the realm where the regenerated soul sings with the Powers. To reach the Ogdoad is to transcend the governance of Fate.` },
];

// ──────────────────────────────────────────────────────
// STORAGE
// ──────────────────────────────────────────────────────

function loadSet(key: string): Set<number> {
  try { const r = localStorage.getItem(key); return r ? new Set(JSON.parse(r)) : new Set(); }
  catch { return new Set(); }
}
function saveSet(key: string, s: Set<number>) { localStorage.setItem(key, JSON.stringify([...s])); }
function loadStr(key: string): string { return localStorage.getItem(key) || ""; }
function saveStr(key: string, v: string) { localStorage.setItem(key, v); }

// ──────────────────────────────────────────────────────
// REFLECTION PANEL
// ──────────────────────────────────────────────────────

function ReflectionPanel({ storageKey, prompt, label }: { storageKey: string; prompt: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => loadStr(storageKey));
  const [saved, setSaved] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const save = useCallback((v: string) => {
    saveStr(storageKey, v); setSaved(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setSaved(false), 1500);
  }, [storageKey]);
  useEffect(() => () => { if (t.current) clearTimeout(t.current); }, []);

  return (
    <div className="mt-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs" style={{ background: `linear-gradient(to right, rgba(212,175,55,0.04), transparent)`, border: `1px solid ${celestial.gold}20`, color: celestial.textMuted }}>
        <span className="flex items-center gap-2"><PenLine className="w-3 h-3" />{label}{text && !open && <span className="ml-1" style={{ color: celestial.gold }}>(has notes)</span>}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 relative">
          <textarea value={text} onChange={e => setText(e.target.value)} onBlur={() => save(text)} placeholder={prompt} rows={4}
            className="w-full rounded-lg p-3 font-body text-xs leading-relaxed resize-y focus:outline-none"
            style={{ backgroundColor: celestial.sidebar, border: `1px solid ${celestial.border}`, color: celestial.text }}
            onFocus={e => { e.currentTarget.style.borderColor = `${celestial.gold}60`; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = `rgba(212,175,55,0.15)`; }}
          />
          {saved && <span className="absolute top-1 right-2 text-xs" style={{ color: celestial.gold }}>✓ Saved</span>}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// PROGRESS
// ──────────────────────────────────────────────────────

function TransformationProgress({ tormentsDone, powersDone }: { tormentsDone: number; powersDone: number }) {
  const total = 22;
  const done = tormentsDone + powersDone;
  const pct = (done / total) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-2" style={{ color: celestial.textMuted }}>
        <span>Transformation Journey</span>
        <span>{done}/{total}</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: celestial.surface }}>
        <div className="h-full transition-all duration-500" style={{ width: `${(tormentsDone / total) * 100}%`, background: `linear-gradient(to right, ${tormentColor.border}, rgba(138,48,80,0.5))` }} />
        <div className="h-full transition-all duration-500" style={{ width: `${(powersDone / total) * 100}%`, background: `linear-gradient(to right, ${celestial.goldDim}, ${celestial.gold})`, boxShadow: powersDone > 0 ? celestial.goldGlow : "none" }} />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: celestial.textFaint }}>
        <span style={{ color: tormentColor.text }}>{tormentsDone} torments faced</span>
        <span style={{ color: powerColor.text }}>{powersDone} powers cultivated</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────

export default function Regeneration() {
  const [fontSize, setFontSize] = useState(17);
  const [tormentWork, setTormentWork] = useState<Set<number>>(() => loadSet("regeneration-torments-working"));
  const [powerWork, setPowerWork] = useState<Set<number>>(() => loadSet("regeneration-powers-working"));
  const [showFullText, setShowFullText] = useState(false);
  const [showKeyThemes, setShowKeyThemes] = useState(false);
  const [silenceCommit, setSilenceCommit] = useState(() => loadStr("regeneration-silence-commitment") === "true");

  const toggleTorment = useCallback((n: number) => {
    setTormentWork(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      saveSet("regeneration-torments-working", next);
      return next;
    });
  }, []);

  const togglePower = useCallback((n: number) => {
    setPowerWork(prev => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      saveSet("regeneration-powers-working", next);
      return next;
    });
  }, []);

  const toggleSilence = () => {
    const next = !silenceCommit;
    setSilenceCommit(next);
    saveStr("regeneration-silence-commitment", next ? "true" : "false");
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]" style={{ backgroundColor: celestial.bg, backgroundImage: starFieldBg, backgroundRepeat: "repeat" }}>
        {/* Sidebar */}
        <aside className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r p-6 hidden md:block overflow-y-auto" style={{ backgroundColor: celestial.sidebar, borderColor: celestial.border, maxHeight: "calc(100vh - 4rem)" }}>
          <div className="mb-6">
            <Link href="/modules"><Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent" style={{ color: celestial.textMuted }}><ChevronLeft className="w-4 h-4 mr-1" /> Back to Modules</Button></Link>
          </div>

          <TransformationProgress tormentsDone={tormentWork.size} powersDone={powerWork.size} />

          <Separator className="my-5" style={{ backgroundColor: `rgba(212,175,55,0.12)` }} />

          <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tormentColor.text }}>12 Torments</h4>
          <nav className="space-y-0.5 mb-4">
            {torments.map(t => (
              <a key={t.number} href={`#torment-${t.number}`} className="block text-xs py-1 pl-3 border-l-2 border-transparent transition-colors" style={{ color: tormentWork.has(t.number) ? celestial.text : celestial.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = tormentColor.border; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; }}
              >
                {t.number}. {t.name} {tormentWork.has(t.number) && "✓"}
              </a>
            ))}
          </nav>

          <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: powerColor.text }}>10 Powers</h4>
          <nav className="space-y-0.5 mb-4">
            {powers.map(p => (
              <a key={p.number} href={`#power-${p.number}`} className="block text-xs py-1 pl-3 border-l-2 border-transparent transition-colors" style={{ color: powerWork.has(p.number) ? celestial.text : celestial.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = powerColor.border; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; }}
              >
                {p.number}. {p.name} {powerWork.has(p.number) && "✦"}
              </a>
            ))}
          </nav>

          <a href="#hymn" className="block text-xs py-1 pl-3 mb-4 font-semibold" style={{ color: celestial.gold }}>✦ The Secret Song</a>

          <Separator className="my-4" style={{ backgroundColor: `rgba(212,175,55,0.12)` }} />
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" style={{ color: celestial.textFaint }} />
            <input type="range" min="15" max="22" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="w-full" style={{ accentColor: celestial.gold }} />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 relative" style={{ backgroundColor: "transparent" }}>
          <ScrollArea className="h-[calc(100vh-4rem)] w-full">
            <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
              <div className="md:hidden mb-8"><Link href="/modules"><Button variant="ghost" size="sm" className="pl-0" style={{ color: celestial.textMuted }}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button></Link></div>

              {/* Header */}
              <div className="text-center mb-12 space-y-4 animate-in fade-in duration-700">
                <div className="inline-block pb-1 mb-2" style={{ borderBottom: `2px solid ${celestial.gold}50` }}>
                  <span className="font-serif text-lg" style={{ color: celestial.gold }}>Study Module</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: celestial.gold, textShadow: "0 0 30px rgba(212,175,55,0.2)" }}>
                  The Secret of Regeneration
                </h1>
                <p className="font-serif italic text-xl" style={{ color: celestial.textMuted }}>The Powers of God and the Torments of Darkness</p>
                <p className="text-sm" style={{ color: celestial.textFaint }}>The Seventh Book — His Secret Sermon in the Mount of Regeneration</p>
                <p className="text-xs" style={{ color: celestial.goldDim }}>Dr. John Everard Translation (1650) — From The Divine Pymander</p>
              </div>

              {/* Mobile progress */}
              <div className="md:hidden mb-8">
                <TransformationProgress tormentsDone={tormentWork.size} powersDone={powerWork.size} />
              </div>

              {/* Intro */}
              <div className="mb-12 rounded-lg p-6" style={{ border: `1px solid ${celestial.border}`, backgroundColor: celestial.bgLight }}>
                <p className="font-body leading-loose text-justify" style={{ fontSize: `${fontSize}px`, color: celestial.text }}>
                  On the mountain, Hermes reveals to Tat the supreme mystery: Regeneration — the process by which the soul is reborn while still in the body. Twelve Torments, corresponding to the twelve signs of the Zodiac, imprison the soul in darkness. Ten Powers of God, forming the divine Decad, enter the soul and drive out the Torments one by one. When the transformation is complete, the regenerated soul sings the Secret Song — the Hymn of Praise that only the reborn can utter.
                </p>
                <p className="font-body leading-loose text-justify mt-4 italic" style={{ fontSize: `${fontSize}px`, color: `${celestial.text}aa` }}>
                  This is not mere teaching. It is a practice. Mark which Torments you recognize in yourself. Invoke the Powers that oppose them. Track your transformation.
                </p>
              </div>

              {/* ═══ THE 12 TORMENTS ═══ */}
              <div className="mb-16">
                <div className="text-center mb-8 py-6 rounded-lg" style={{ background: `linear-gradient(to right, transparent, rgba(138,48,80,0.08), transparent)`, borderTop: `1px solid ${tormentColor.border}30`, borderBottom: `1px solid ${tormentColor.border}30` }}>
                  <h2 className="font-serif text-3xl font-bold" style={{ color: tormentColor.text }}>The Twelve Torments</h2>
                  <p className="text-sm mt-2" style={{ color: celestial.textFaint }}>The darkness that must be expelled from the soul</p>
                </div>

                <div className="space-y-4" style={{ fontSize: `${fontSize}px` }}>
                  {torments.map(t => (
                    <div key={t.number} id={`torment-${t.number}`} className="rounded-lg p-5 transition-all duration-300" style={{ backgroundColor: tormentWork.has(t.number) ? `rgba(120,40,60,0.04)` : celestial.surface, border: `1px solid ${tormentWork.has(t.number) ? `${tormentColor.border}40` : celestial.border}` }}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleTorment(t.number)} className="mt-1 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{ border: `2px solid ${tormentWork.has(t.number) ? tormentColor.border : celestial.textFaint}`, backgroundColor: tormentWork.has(t.number) ? `${tormentColor.border}30` : "transparent" }}>
                          {tormentWork.has(t.number) && <Flame className="w-3.5 h-3.5" style={{ color: tormentColor.text }} />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: tormentColor.text }}>Torment {t.number}</span>
                            {tormentWork.has(t.number) && <span className="text-xs" style={{ color: celestial.textFaint }}>— confronting</span>}
                          </div>
                          <h3 className="font-serif text-xl font-semibold mb-2" style={{ color: celestial.text }}>{t.name}</h3>
                          <p className="font-body text-sm leading-relaxed mb-3" style={{ color: `${celestial.text}bb` }}>{t.description}</p>
                          <div className="font-serif italic text-sm rounded p-3" style={{ backgroundColor: `rgba(120,40,60,0.05)`, borderLeft: `2px solid ${tormentColor.border}30`, color: `${celestial.text}99` }}>
                            "{t.quote}"
                          </div>
                          <ReflectionPanel
                            storageKey={`regeneration-torment-${t.number}-reflection`}
                            label="Personal Reflection"
                            prompt={`How does the torment of ${t.name} manifest in your life? What triggers it? How do you recognize its presence?`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ THE 10 POWERS ═══ */}
              <div className="mb-16">
                <div className="text-center mb-8 py-6 rounded-lg" style={{ background: `linear-gradient(to right, transparent, rgba(212,175,55,0.06), transparent)`, borderTop: `1px solid ${celestial.borderGold}`, borderBottom: `1px solid ${celestial.borderGold}` }}>
                  <h2 className="font-serif text-3xl font-bold" style={{ color: celestial.gold, textShadow: "0 0 20px rgba(212,175,55,0.15)" }}>The Ten Powers</h2>
                  <p className="text-sm mt-2" style={{ color: celestial.textMuted }}>The divine forces that drive out the darkness</p>
                </div>

                <div className="space-y-4" style={{ fontSize: `${fontSize}px` }}>
                  {powers.map(p => (
                    <div key={p.number} id={`power-${p.number}`} className="rounded-lg p-5 transition-all duration-300" style={{ backgroundColor: powerWork.has(p.number) ? `rgba(212,175,55,0.04)` : celestial.surface, border: `1px solid ${powerWork.has(p.number) ? `${celestial.gold}40` : celestial.border}`, boxShadow: powerWork.has(p.number) ? `0 0 12px rgba(212,175,55,0.08)` : "none" }}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => togglePower(p.number)} className="mt-1 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all" style={{ border: `2px solid ${powerWork.has(p.number) ? celestial.gold : celestial.textFaint}`, backgroundColor: powerWork.has(p.number) ? `${celestial.gold}20` : "transparent" }}>
                          {powerWork.has(p.number) && <Sun className="w-3.5 h-3.5" style={{ color: celestial.gold }} />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: celestial.gold }}>Power {p.number}</span>
                            <span className="text-xs" style={{ color: celestial.textFaint }}>→ Expels {p.expels}</span>
                          </div>
                          <h3 className="font-serif text-xl font-semibold mb-2" style={{ color: celestial.gold }}>{p.name}</h3>
                          <p className="font-body text-sm leading-relaxed mb-3" style={{ color: `${celestial.text}bb` }}>{p.description}</p>
                          <div className="font-serif italic text-sm rounded p-3" style={{ backgroundColor: `rgba(212,175,55,0.04)`, borderLeft: `2px solid ${celestial.gold}40`, color: `${celestial.text}cc` }}>
                            "{p.quote}"
                          </div>
                          <ReflectionPanel
                            storageKey={`regeneration-power-${p.number}-reflection`}
                            label="Personal Reflection"
                            prompt={`How are you cultivating the Power of ${p.name}? What practices help you invoke it? How does it manifest when present?`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ THE SECRET SONG ═══ */}
              <div id="hymn" className="mb-16">
                <div className="rounded-xl p-8 md:p-12 text-center" style={{ background: `linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))`, border: `2px solid ${celestial.borderGold}`, boxShadow: `0 0 40px rgba(212,175,55,0.1), inset 0 0 40px rgba(212,175,55,0.03)` }}>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2" style={{ color: celestial.gold, textShadow: "0 0 20px rgba(212,175,55,0.3)" }}>
                    The Secret Song
                  </h2>
                  <p className="text-sm mb-1" style={{ color: celestial.textMuted }}>The Holy Speech — Hymn of Regeneration</p>
                  <p className="text-xs italic mb-8 max-w-xl mx-auto" style={{ color: celestial.textFaint }}>
                    {hymnInstruction}
                  </p>

                  <div className="font-serif leading-loose whitespace-pre-line text-center" style={{ fontSize: `${Math.max(fontSize + 1, 18)}px`, color: celestial.text }}>
                    {hymnText}
                  </div>
                </div>
              </div>

              {/* ═══ KEY THEMES ═══ */}
              <div className="mb-12">
                <button onClick={() => setShowKeyThemes(!showKeyThemes)} className="w-full flex items-center justify-between px-6 py-4 rounded-lg text-sm font-semibold" style={{ background: celestial.surface, border: `1px solid ${celestial.borderGold}`, color: celestial.gold, boxShadow: celestial.goldGlow }}>
                  <span className="font-serif text-lg">Key Themes</span>
                  {showKeyThemes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showKeyThemes && (
                  <div className="mt-4 space-y-4">
                    {keyThemes.map((t, i) => (
                      <div key={i} className="rounded-lg p-5" style={{ backgroundColor: celestial.bgLight, border: `1px solid ${celestial.border}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-serif font-semibold" style={{ color: celestial.gold }}>{t.theme}</h4>
                          <span className="text-xs" style={{ color: celestial.textFaint }}>({t.verse})</span>
                        </div>
                        <p className="font-body text-sm leading-relaxed" style={{ color: `${celestial.text}cc` }}>{t.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ DAILY PRACTICE ═══ */}
              <div className="mb-12 rounded-lg p-6" style={{ backgroundColor: celestial.bgLight, border: `1px solid ${celestial.border}` }}>
                <h3 className="font-serif text-xl font-semibold mb-4" style={{ color: celestial.gold }}>Daily Practice</h3>
                <ReflectionPanel storageKey="regeneration-daily-practice" label="Today's Practice" prompt="Which Torment am I observing today? Which Power am I invoking? What signs of Regeneration am I experiencing?" />

                <div className="mt-6 flex items-center gap-3">
                  <button onClick={toggleSilence} className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all" style={{ border: `2px solid ${silenceCommit ? celestial.gold : celestial.textFaint}`, backgroundColor: silenceCommit ? celestial.gold : "transparent" }}>
                    {silenceCommit && <Check className="w-3 h-3" style={{ color: celestial.bg }} />}
                  </button>
                  <div>
                    <p className="text-sm font-serif" style={{ color: silenceCommit ? celestial.gold : celestial.textMuted }}>I commit to the Profession of Silence</p>
                    <p className="text-xs" style={{ color: celestial.textFaint }}>"This is a great mystery, and not to be revealed to the profane."</p>
                  </div>
                </div>
              </div>

              {/* Overall Reflection */}
              <ReflectionPanel storageKey="regeneration-overall-reflection" label="Overall Reflection" prompt="How is the process of Regeneration unfolding in your life? What changes are you experiencing as you work with these Powers and Torments?" />

              {/* Full Text */}
              <div className="mt-12 mb-12">
                <button onClick={() => setShowFullText(!showFullText)} className="w-full flex items-center justify-between px-6 py-4 rounded-lg text-sm font-semibold" style={{ background: celestial.surface, border: `1px solid ${celestial.border}`, color: celestial.textMuted }}>
                  <span className="font-serif">Full Authentic Text</span>
                  {showFullText ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                {showFullText && (
                  <div className="mt-4 rounded-lg p-6 font-serif leading-loose whitespace-pre-line" style={{ backgroundColor: celestial.surface, border: `1px solid ${celestial.border}`, borderLeft: `3px solid ${celestial.gold}50`, color: celestial.text, fontSize: `${fontSize}px` }}>
                    <p className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: celestial.goldDim }}>The Seventh Book — His Secret Sermon in the Mount of Regeneration — Dr. John Everard (1650)</p>
                    <p className="mb-4">TAT. In the general Sermon, Father, thou spokest to me darkly and not clearly, speaking of Divinity; thou didst not reveal to me, saying, that no man can be saved before Regeneration.</p>
                    <p className="mb-4">2. And when I did earnestly beg it of thee, as we were coming down the Mountain after thou hadst discoursed to me, thou didst promise me thou wouldst bring me to the Knowledge of Regeneration, saying, when I was ready to estrange myself from the World. I have made myself ready; now inform me how I shall be regenerated.</p>
                    <p className="mb-4">3. Herm. I said, O Son, that in Silence the Truth is spoken.</p>
                    <p className="mb-4">4. Tat. And to whom, O Trismegistus, shall I give praise? To thee, or to God?</p>
                    <p className="mb-4">5. Herm. I would have thee, O Son, give thanks to God, for when thou givest thanks to God, thou shalt know that he is the fountain of good things.</p>
                    <p className="italic" style={{ color: celestial.textFaint }}>[Full text continues — consult The Divine Pymander for the complete 99 verses]</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-12 pt-12 flex items-center justify-between" style={{ borderTop: `1px solid ${celestial.border}` }}>
                <Link href="/modules"><Button variant="outline" style={{ borderColor: `${celestial.gold}30`, color: celestial.textMuted }}><ChevronLeft className="w-4 h-4 mr-2" /> Back to Modules</Button></Link>
                <Link href="/reader/heads-of-things"><Button style={{ backgroundColor: celestial.gold, color: celestial.bg }}>Heads of Things →</Button></Link>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}
