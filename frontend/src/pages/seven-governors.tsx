import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronDown, ChevronUp, PenLine, Trash2, Type } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";

const sevenGovernorsContent = {
  title: "The Seven Governors",
  originalTitle: "The Ascent of the Soul through the Planetary Spheres",
  source: "From the Poimandres (Corpus Hermeticum, Book I)",
  introduction: `In the Poimandres, the great revelation text of the Hermetic tradition, Poimandres—the Mind of the Sovereignty—reveals to Hermes the secret of the soul's journey after death. The soul, freed from the material body, ascends through seven planetary spheres, each governed by a celestial power. At each sphere, the soul surrenders a particular vice or limitation it acquired during its descent into incarnation. Stripped of all mortal accretions, the soul arrives naked and pure at the Eighth Sphere, where it joins the Powers and sings praise to the Father.

This teaching is one of the oldest and most influential doctrines of Western esotericism, shaping later Gnostic, Neoplatonic, and alchemical traditions. The Seven Governors are simultaneously cosmic rulers, planetary intelligences, and psychological forces within the human being.`,
  sections: [
    {
      heading: "The Creation of the Seven Governors",
      authenticText: `For the Mind being God, Male and Female, Life and Light, brought forth by his Word another Mind or Workman; which being God of the Fire, and the Spirit, fashioned and formed seven other Governors, which in their circles contain the Sensible World, whose Government or disposition is called Fate or Destiny.`,
      studyNotes: `The Seven Governors are the seven planetary powers that govern the visible cosmos. They were fashioned by the second Mind—the Demiurge or Workman—from Fire and Spirit. Their circular orbits define the architecture of the material world, and their collective governance constitutes what the ancients called Heimarmene: Fate or Destiny. Every soul that descends into incarnation must pass through their spheres and receive from each a portion of their nature.`,
      planet: null
    },
    {
      heading: "Man Among the Governors",
      authenticText: `Having all Power, he considered the Operations or Workmanships of the Seven; but they loved him, and everyone made him partaker of his own order.

And he learning diligently, and understanding their Essence, and partaking their Nature, resolved to pierce and break through the Circumference of the Circles, and to understand the power of him that sits upon the Fire.`,
      studyNotes: `When the Primal Man—the divine Anthropos created in the image of God—descended through the seven spheres, each Governor shared its power and nature with him. This is the source of humanity's dual nature: we carry within us both the divine image of the Father and the sevenfold imprint of the planetary powers. The qualities we must surrender in the ascent are the very qualities we received in the descent.`,
      planet: null
    },
    {
      heading: "The Preamble of Ascent",
      authenticText: `And thus it is that man doth speed him through the Harmony. To the first zone he gives the Energy of Growth and Waning; unto the second zone, Device of Evils now de-energized; unto the third, the Guile of the Desires de-energized; unto the fourth, his Domineering Arrogance, also de-energized; unto the fifth, unholy Daring and the Rashness of Audacity, de-energized; unto the sixth, Striving for Wealth by evil means, de-energized; and to the seventh zone, Ensnaring Falsehood, de-energized.`,
      studyNotes: `This is the central passage of the Poimandres on the soul's ascent. The G.R.S. Mead translation uses the striking phrase "de-energized" — the Greek apergos, meaning rendered inactive, stripped of operative power. The soul does not merely leave these qualities behind; their very energy is withdrawn from them. Each zone receives back what it originally gave, and the soul passes through lighter and freer.

The seven sections that follow examine each zone individually.`,
      planet: null
    },
    {
      heading: "The First Zone — The Moon",
      sphere: 1,
      planet: "Moon",
      symbol: "☽",
      quality: "The Energy of Growth and Waning",
      authenticText: `To the first zone he gives the Energy of Growth and Waning.`,
      studyNotes: `The Moon governs growth and decay, the waxing and waning of all things in the sublunary world. In the ascent, the soul surrenders its attachment to the rhythms of physical change—the anxiety over aging, the clinging to youth, the fear of diminishment. The lunar power represents the soul's bondage to biological time, to the cycles of the body's flourishing and decline. To pass beyond the Moon is to release the illusion that the self is subject to increase or decrease.`
    },
    {
      heading: "The Second Zone — Mercury",
      sphere: 2,
      planet: "Mercury",
      symbol: "☿",
      quality: "Device of Evils, de-energized",
      authenticText: `Unto the second zone, Device of Evils now de-energized.`,
      studyNotes: `Mercury, the planet of intellect and communication, here reveals its shadow aspect: cunning, manipulation, and strategic deception. This is the rational mind turned toward self-serving ends—the capacity for plotting, scheming, and the clever justification of harmful actions. In surrendering this quality, the soul releases the habit of using intelligence as a weapon, the tendency to construct elaborate rationalizations for selfish behavior. The craft of Mercury, purified, becomes wisdom rather than guile.`
    },
    {
      heading: "The Third Zone — Venus",
      sphere: 3,
      planet: "Venus",
      symbol: "♀",
      quality: "The Guile of the Desires, de-energized",
      authenticText: `Unto the third, the Guile of the Desires de-energized.`,
      studyNotes: `Venus governs desire in its most seductive and illusory form—not love itself, but the false promises of desire, the way longing creates fantasies that have no substance. The "Guile of the Desires" is desire that deceives: it promises fulfillment but delivers only further craving. In surrendering this, the soul releases not the capacity for love, but the compulsive quality of desire—the endless wanting that masquerades as love but is actually a form of spiritual hunger.`
    },
    {
      heading: "The Fourth Zone — The Sun",
      sphere: 4,
      planet: "Sun",
      symbol: "☉",
      quality: "Domineering Arrogance, de-energized",
      authenticText: `Unto the fourth, his Domineering Arrogance, also de-energized.`,
      studyNotes: `The Sun, center of the planetary system, represents sovereignty and authority. Its shadow is the insatiable drive for power, dominion, and recognition—the ego's bottomless need to be supreme. This is ambition that can never be satisfied because it arises not from genuine purpose but from an inner emptiness that no amount of worldly authority can fill. The Sun's position at the center of the spheres makes this the pivotal surrender: the death of the tyrannical ego, the relinquishing of the soul's false claim to ultimate sovereignty over its world.`
    },
    {
      heading: "The Fifth Zone — Mars",
      sphere: 5,
      planet: "Mars",
      symbol: "♂",
      quality: "Unholy Daring and the Rashness of Audacity, de-energized",
      authenticText: `Unto the fifth, unholy Daring and the Rashness of Audacity, de-energized.`,
      studyNotes: `Mars governs action, courage, and martial force. Its corruption is reckless aggression masquerading as courage—the unholy daring that acts without wisdom, the headlong rush into conflict driven by false confidence. This is the spirit of contention for its own sake, the glorification of force, the mistake of confusing violence with strength. "Unholy" daring is sacred courage inverted: it desecrates rather than consecrates. In releasing this, the soul surrenders not courage itself but the delusion that force alone can achieve spiritual ends.`
    },
    {
      heading: "The Sixth Zone — Jupiter",
      sphere: 6,
      planet: "Jupiter",
      symbol: "♃",
      quality: "Striving for Wealth by evil means, de-energized",
      authenticText: `Unto the sixth, Striving for Wealth by evil means, de-energized.`,
      studyNotes: `Jupiter, the planet of expansion, abundance, and prosperity, here reveals its shadow: the pursuit of wealth through harmful means, and the futility of riches acquired without righteousness. The "striving by evil means" encompasses the compromises, exploitations, and moral shortcuts taken in pursuit of material gain. In surrendering this quality, the soul releases its attachment to material accumulation as a source of security or meaning—the deep-seated belief that enough possessions can protect against the fundamental uncertainties of mortal existence.`
    },
    {
      heading: "The Seventh Zone — Saturn",
      sphere: 7,
      planet: "Saturn",
      symbol: "♄",
      quality: "Ensnaring Falsehood, de-energized",
      authenticText: `And to the seventh zone, Ensnaring Falsehood, de-energized.`,
      studyNotes: `Saturn, the outermost planet of the ancient cosmos and guardian of the threshold, holds the most insidious quality: the subtle, persistent falsehood that underlies all the others. This is not crude deception but the fundamental lie at the root of the incarnate condition—the whisper that says the soul is merely mortal, merely material, merely what the senses report. "Ensnaring" suggests a trap that tightens the more one struggles against it. Saturn's falsehood is the final veil between the soul and its divine nature. Only by surrendering this last, most subtle deception can the soul pass beyond the realm of the seven and enter the Ogdoad—the Eighth Sphere of pure being.`
    },
    {
      heading: "The Eighth Sphere — Beyond the Governors",
      authenticText: `And then, with all the energizings of the Harmony stript from him, clothed in his proper Power, he cometh to that Nature which belongs unto the Eighth, and there with those-that-are hymneth the Father.

They who are there welcome his coming with joy; and he, made like to them that sojourn there, doth further hear the Powers who are above the Eighth Nature singing their decrees to God in a voice that is their own. And then they, in a band, go to the Father home; of their own selves they make surrender of themselves to Powers, and thus becoming Powers they are in God. This is the Good; this is the consummation, for those who have got Gnosis.`,
      studyNotes: `Having shed all seven accretions of Fate, the soul arrives "stript"—divested of every mortal quality—at the Eighth Sphere, the realm of the fixed stars and the dwelling place of the divine Powers. Here it recovers its "proper Power," the original divine nature it possessed before the descent. It is welcomed by the other purified souls and joins their eternal hymn of praise. The journey is complete: from God, through the seven, into matter, and back again through the seven to God. The soul, becoming a Power itself, is finally "in God"—not annihilated but fulfilled, not lost but found.`,
      planet: null
    },
    {
      heading: "The Hymn of Ascent",
      authenticText: `Holy art Thou, O God, the universals' Father.
Holy art Thou, O God, whose Will perfects itself by means of its own Powers.
Holy art Thou, O God, who willeth to be known and art known by Thine own.
Holy art Thou, who didst by Word make to consist the things that are.
Holy art Thou, of whom All-nature hath been made an image.
Holy art Thou, whose Form Nature hath never made.
Holy art Thou, more powerful than all power.
Holy art Thou, transcending all pre-eminence.
Holy Thou art, Thou better than all praise.

Accept my reason's offerings pure, from soul and heart for aye stretched up to Thee, O Thou unutterable, unspeakable, Whose Name naught but the Silence can express.`,
      studyNotes: `This hymn is the voice of the soul that has completed the ascent—that has surrendered the seven veils and stands in the presence of the Father. It is both a prayer and a map: each "Holy art Thou" affirms a quality of the Divine that corresponds to one of the mortal qualities surrendered at the seven gates. The closing invocation of Silence as the only adequate name for God is one of the most profound theological statements in the Hermetic corpus—pointing beyond all language to direct experience of the Divine.`,
      planet: null
    }
  ]
};

// Celestial theme colors
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
};

// CSS star field background as inline SVG data URI
const starFieldBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3CradialGradient id='s'%3E%3Cstop offset='0' stop-color='%23fff' stop-opacity='.6'/%3E%3Cstop offset='1' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='30' r='1' fill='%23ffffff' opacity='.4'/%3E%3Ccircle cx='180' cy='60' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='320' cy='20' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='90' cy='120' r='.5' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='250' cy='100' r='1' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='370' cy='90' r='.6' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='30' cy='200' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='150' cy='180' r='.5' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='280' cy='210' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='390' cy='170' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='70' cy='290' r='.6' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='200' cy='270' r='.8' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='340' cy='300' r='.5' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='120' cy='350' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='260' cy='370' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='380' cy='340' r='.6' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='45' cy='380' r='.5' fill='%23ffffff' opacity='.15'/%3E%3Ccircle cx='310' cy='150' r='.4' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='160' cy='320' r='.6' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='220' cy='40' r='.4' fill='%23ffffff' opacity='.15'/%3E%3C/svg%3E")`;

const sphereColors: Record<string, { gradient: string; border: string; glow: string }> = {
  "Moon": { gradient: "linear-gradient(to right, rgba(180,195,220,0.1), rgba(180,195,220,0.02))", border: "#b0c4de", glow: "0 0 10px rgba(176,196,222,0.15)" },
  "Mercury": { gradient: "linear-gradient(to right, rgba(212,175,55,0.1), rgba(212,175,55,0.02))", border: "#d4af37", glow: "0 0 10px rgba(212,175,55,0.15)" },
  "Venus": { gradient: "linear-gradient(to right, rgba(100,200,140,0.08), rgba(100,200,140,0.02))", border: "#70c896", glow: "0 0 10px rgba(112,200,150,0.12)" },
  "Sun": { gradient: "linear-gradient(to right, rgba(255,200,50,0.12), rgba(255,200,50,0.02))", border: "#ffc832", glow: "0 0 14px rgba(255,200,50,0.2)" },
  "Mars": { gradient: "linear-gradient(to right, rgba(220,80,60,0.08), rgba(220,80,60,0.02))", border: "#dc5040", glow: "0 0 10px rgba(220,80,64,0.12)" },
  "Jupiter": { gradient: "linear-gradient(to right, rgba(80,120,220,0.08), rgba(80,120,220,0.02))", border: "#6090e0", glow: "0 0 10px rgba(96,144,224,0.12)" },
  "Saturn": { gradient: "linear-gradient(to right, rgba(150,100,200,0.08), rgba(150,100,200,0.02))", border: "#a070d0", glow: "0 0 10px rgba(160,112,208,0.12)" },
};

const PLANETS = ["moon", "mercury", "venus", "sun", "mars", "jupiter", "saturn"] as const;

function storageKey(planet: string) {
  return `seven-governors-notes-${planet.toLowerCase()}`;
}

function loadAllNotes(): Record<string, string> {
  const notes: Record<string, string> = {};
  for (const p of PLANETS) {
    notes[p] = localStorage.getItem(storageKey(p)) || "";
  }
  return notes;
}

function ReflectionPanel({
  planet,
  sphereStyle,
  notes,
  onUpdate,
}: {
  planet: string;
  sphereStyle: { gradient: string; border: string; glow: string };
  notes: string;
  onUpdate: (planet: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((value: string) => {
    localStorage.setItem(storageKey(planet), value);
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 1500);
  }, [planet]);

  const handleChange = (value: string) => {
    onUpdate(planet, value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(value), 2000);
  };

  const handleBlur = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    save(notes);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors"
        style={{
          background: sphereStyle.gradient,
          border: `1px solid ${sphereStyle.border}30`,
          color: celestial.textMuted,
        }}
      >
        <span className="flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          Personal Reflection
          {notes && !open && <span className="text-xs ml-1" style={{ color: celestial.gold }}>(has notes)</span>}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="mt-3 relative">
          <textarea
            value={notes}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={`How do you see ${planet}'s influence in your life? Reflect on patterns, experiences, and insights...`}
            rows={5}
            className="w-full rounded-lg p-4 font-body text-sm leading-relaxed resize-y focus:outline-none transition-all"
            style={{
              backgroundColor: celestial.sidebar,
              border: `1px solid ${celestial.border}`,
              color: celestial.text,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${celestial.gold}60`;
              e.currentTarget.style.boxShadow = `0 0 12px rgba(212,175,55,0.15)`;
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = `rgba(212,175,55,0.15)`;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {saved && (
            <span className="absolute top-2 right-3 text-xs animate-in fade-in duration-300" style={{ color: celestial.gold }}>
              ✓ Saved
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function SevenGovernors() {
  const [fontSize, setFontSize] = useState(18);
  const [notes, setNotes] = useState<Record<string, string>>(loadAllNotes);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const updateNote = useCallback((planet: string, value: string) => {
    setNotes((prev) => ({ ...prev, [planet.toLowerCase()]: value }));
  }, []);

  const clearAllNotes = () => {
    for (const p of PLANETS) {
      localStorage.removeItem(storageKey(p));
    }
    setNotes(loadAllNotes());
    setShowClearConfirm(false);
  };

  const hasAnyNotes = Object.values(notes).some((n) => n.length > 0);

  const defaultSphereStyle = { gradient: `linear-gradient(to right, rgba(212,175,55,0.06), transparent)`, border: celestial.gold, glow: celestial.goldGlow };

  return (
    <Layout>
      <div
        className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]"
        style={{ backgroundColor: celestial.bg, backgroundImage: starFieldBg, backgroundRepeat: "repeat" }}
      >
        {/* Sidebar / Table of Contents */}
        <aside
          className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r p-6 hidden md:block"
          style={{ backgroundColor: celestial.sidebar, borderColor: celestial.border }}
        >
          <div className="mb-6">
            <Link href="/modules">
              <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent" style={{ color: celestial.textMuted }}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Modules
              </Button>
            </Link>
          </div>

          <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: celestial.gold }}>The Seven Spheres</h3>
          <nav className="space-y-1">
            {sevenGovernorsContent.sections.map((section, idx) => (
              <a
                key={idx}
                href={`#section-${idx}`}
                className="block text-sm transition-colors py-1.5 border-l-2 border-transparent pl-3"
                style={{ color: celestial.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = celestial.text;
                  e.currentTarget.style.borderColor = celestial.gold;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = celestial.textMuted;
                  e.currentTarget.style.borderColor = "transparent";
                }}
              >
                {"symbol" in section && section.symbol ? (
                  <span className="mr-2">{section.symbol}</span>
                ) : null}
                {section.heading}
              </a>
            ))}
          </nav>

          <Separator className="my-6" style={{ backgroundColor: `rgba(212,175,55,0.12)` }} />

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: celestial.textFaint }}>Reading Settings</h4>
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4" style={{ color: celestial.textFaint }} />
              <input
                type="range"
                min="16"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: celestial.gold }}
              />
            </div>
          </div>
        </aside>

        {/* Main Reading Area */}
        <div className="flex-1 relative" style={{ backgroundColor: "transparent" }}>
          <ScrollArea className="h-[calc(100vh-4rem)] w-full">
            <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
              {/* Mobile back button */}
              <div className="md:hidden mb-8">
                <Link href="/modules">
                  <Button variant="ghost" size="sm" className="pl-0" style={{ color: celestial.textMuted }}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Modules
                  </Button>
                </Link>
              </div>

              {/* Header */}
              <div className="text-center mb-16 space-y-4 animate-in fade-in duration-700">
                <div className="inline-block pb-1 mb-2" style={{ borderBottom: `2px solid ${celestial.gold}50` }}>
                  <span className="font-serif text-lg" style={{ color: celestial.gold }}>Study Module</span>
                </div>
                <h1
                  className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                  style={{ color: celestial.gold, textShadow: "0 0 30px rgba(212,175,55,0.2)" }}
                >
                  {sevenGovernorsContent.title}
                </h1>
                <p className="font-serif italic text-xl" style={{ color: celestial.textMuted }}>
                  {sevenGovernorsContent.originalTitle}
                </p>
                <p className="text-sm" style={{ color: celestial.textFaint }}>
                  {sevenGovernorsContent.source}
                </p>
                {hasAnyNotes && (
                  <div className="pt-4">
                    {showClearConfirm ? (
                      <div className="inline-flex items-center gap-2 text-sm">
                        <span style={{ color: celestial.textMuted }}>Clear all reflection notes?</span>
                        <Button size="sm" variant="destructive" onClick={clearAllNotes} className="h-7 text-xs">
                          Yes, clear all
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowClearConfirm(false)} className="h-7 text-xs" style={{ color: celestial.textMuted }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowClearConfirm(true)}
                        className="text-xs hover:text-destructive"
                        style={{ color: celestial.textFaint }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Clear All Notes
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Introduction */}
              <div className="mb-16 animate-in slide-in-from-bottom-4 duration-700 delay-150">
                <div
                  className="rounded-lg p-8"
                  style={{
                    border: `1px solid ${celestial.border}`,
                    backgroundColor: celestial.bgLight,
                    boxShadow: `inset 0 1px 0 rgba(212,175,55,0.05)`,
                  }}
                >
                  <p
                    className="font-body leading-loose text-justify whitespace-pre-line"
                    style={{ fontSize: `${fontSize}px`, color: celestial.text }}
                  >
                    {sevenGovernorsContent.introduction}
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div
                className="space-y-16 animate-in slide-in-from-bottom-4 duration-700 delay-300"
                style={{ fontSize: `${fontSize}px` }}
              >
                {sevenGovernorsContent.sections.map((section, idx) => {
                  const planet = "planet" in section ? section.planet : null;
                  const symbol = "symbol" in section ? section.symbol : null;
                  const quality = "quality" in section ? section.quality : null;
                  const currentSphereStyle = planet && sphereColors[planet] ? sphereColors[planet] : defaultSphereStyle;

                  return (
                    <section key={idx} id={`section-${idx}`} className="relative">
                      {/* Sphere number watermark */}
                      {"sphere" in section && section.sphere && (
                        <span
                          className="absolute -left-12 top-0 text-6xl font-serif font-bold select-none hidden md:block"
                          style={{ color: `rgba(212,175,55,0.08)` }}
                        >
                          {section.sphere}
                        </span>
                      )}

                      {/* Planet header card */}
                      {planet && (
                        <div
                          className="rounded-lg p-4 mb-6"
                          style={{
                            background: currentSphereStyle.gradient,
                            border: `1px solid ${currentSphereStyle.border}25`,
                            boxShadow: currentSphereStyle.glow,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {symbol && (
                              <span
                                className="text-3xl"
                                style={{ color: currentSphereStyle.border, textShadow: `0 0 8px ${currentSphereStyle.border}40` }}
                              >
                                {symbol}
                              </span>
                            )}
                            <div>
                              <h2 className="font-serif text-2xl font-semibold" style={{ color: celestial.gold }}>
                                {section.heading}
                              </h2>
                              {quality && (
                                <p className="text-sm italic mt-1" style={{ color: celestial.textMuted }}>
                                  Quality surrendered: {quality}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Non-planet heading */}
                      {!planet && (
                        <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-3" style={{ color: celestial.gold }}>
                          {section.heading}
                        </h2>
                      )}

                      {/* Authentic Text */}
                      <div
                        className="rounded-lg p-6 my-6 font-serif italic leading-loose whitespace-pre-line"
                        style={{
                          backgroundColor: celestial.surface,
                          border: `1px solid ${celestial.border}`,
                          borderLeft: `3px solid ${celestial.gold}50`,
                          color: celestial.text,
                          boxShadow: `inset 3px 0 12px -4px rgba(212,175,55,0.08)`,
                        }}
                      >
                        <p className="text-xs font-sans not-italic uppercase tracking-widest mb-3" style={{ color: celestial.goldDim }}>
                          From the Poimandres — G.R.S. Mead Translation
                        </p>
                        {section.authenticText}
                      </div>

                      {/* Study Notes */}
                      <div className="mt-4">
                        <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: celestial.textFaint }}>
                          Contemporary Understanding
                        </p>
                        <div className="font-body leading-loose text-justify whitespace-pre-line" style={{ color: `${celestial.text}cc` }}>
                          {section.studyNotes}
                        </div>
                      </div>

                      {/* Reflection panel for planetary sections */}
                      {planet && (
                        <ReflectionPanel
                          planet={planet}
                          sphereStyle={currentSphereStyle}
                          notes={notes[planet.toLowerCase()] || ""}
                          onUpdate={updateNote}
                        />
                      )}
                    </section>
                  );
                })}
              </div>

              {/* Navigation Footer */}
              <div className="mt-24 pt-12 flex items-center justify-between" style={{ borderTop: `1px solid ${celestial.border}` }}>
                <Link href="/modules">
                  <Button
                    variant="outline"
                    style={{ borderColor: `${celestial.gold}30`, color: celestial.textMuted }}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Modules
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}
