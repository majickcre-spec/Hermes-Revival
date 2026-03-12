import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Eye, Search, MessageCircle, Globe, Link2,
  Check, Lightbulb, RotateCcw, Timer, HelpCircle, CheckCircle,
} from "lucide-react";
import {
  aphorismDatabase,
  exampleScenarios,
  connectionClusters,
  PERSPECTIVE_COLORS,
  type AphorismKnowledge,
  type Perspective,
  type ExampleScenario,
  type ConnectionCluster,
} from "@/data/aphorism-perspectives";

// ─── THEME ────────────────────────────────────────────────────────────────────

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

const starField = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Ccircle cx='50' cy='30' r='1' fill='%23ffffff' opacity='.4'/%3E%3Ccircle cx='180' cy='60' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='320' cy='20' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='90' cy='120' r='.5' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='250' cy='100' r='1' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='370' cy='90' r='.6' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='30' cy='200' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='150' cy='180' r='.5' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='280' cy='210' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='390' cy='170' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='70' cy='290' r='.6' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='200' cy='270' r='.8' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='340' cy='300' r='.5' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='120' cy='350' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='260' cy='370' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='380' cy='340' r='.6' fill='%23ffffff' opacity='.2'/%3E%3C/svg%3E")`;

type LearningMode = "menu" | "perspectives" | "questions" | "examples" | "connections";

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

function loadSet(key: string): Set<string> {
  try { const r = localStorage.getItem(key); return r ? new Set(JSON.parse(r)) : new Set(); }
  catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) { localStorage.setItem(key, JSON.stringify([...s])); }
function loadNum(key: string): number {
  try { return parseInt(localStorage.getItem(key) || "0", 10) || 0; }
  catch { return 0; }
}
function saveNum(key: string, n: number) { localStorage.setItem(key, String(n)); }

// ─── PERSPECTIVE EXPLORER ─────────────────────────────────────────────────────

function PerspectiveExplorer() {
  const [idx, setIdx] = useState(0);
  const [perspIdx, setPerspIdx] = useState(0);
  const [understood, setUnderstood] = useState<Set<string>>(() => loadSet("learning-perspectives-understood"));
  const [viewed, setViewed] = useState<Set<string>>(() => loadSet("learning-perspectives-viewed"));

  const aphorism = aphorismDatabase[idx];
  const perspective = aphorism.perspectives[perspIdx];
  const pColor = PERSPECTIVE_COLORS[perspective.type];

  const markViewed = useCallback((aId: number, pType: string) => {
    setViewed(prev => {
      const next = new Set(prev);
      next.add(`${aId}-${pType}`);
      saveSet("learning-perspectives-viewed", next);
      return next;
    });
  }, []);

  useEffect(() => {
    markViewed(aphorism.id, perspective.type);
  }, [aphorism.id, perspective.type, markViewed]);

  const toggleUnderstood = () => {
    setUnderstood(prev => {
      const next = new Set(prev);
      const key = String(aphorism.id);
      if (next.has(key)) next.delete(key); else next.add(key);
      saveSet("learning-perspectives-understood", next);
      return next;
    });
  };

  const nextAphorism = () => { setIdx((idx + 1) % aphorismDatabase.length); setPerspIdx(0); };
  const prevAphorism = () => { setIdx((idx - 1 + aphorismDatabase.length) % aphorismDatabase.length); setPerspIdx(0); };
  const isUnderstood = understood.has(String(aphorism.id));

  const viewedForThis = aphorism.perspectives.filter(p => viewed.has(`${aphorism.id}-${p.type}`)).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm" style={{ color: celestial.textMuted }}>
        <span>Aphorism {idx + 1} of {aphorismDatabase.length}</span>
        <span>{understood.size} / {aphorismDatabase.length} understood</span>
      </div>

      {/* Aphorism Text */}
      <div className="rounded-xl p-6" style={{
        background: celestial.surface,
        border: `1px solid ${celestial.borderGold}`,
        boxShadow: celestial.goldGlow,
      }}>
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: celestial.goldDim }}>
          Verse {aphorism.id} — {aphorism.category}
        </div>
        <p className="font-serif text-xl md:text-2xl leading-relaxed italic" style={{ color: celestial.text }}>
          "{aphorism.text}"
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: celestial.textFaint }}>
          <Eye className="w-3 h-3" /> {viewedForThis} / {aphorism.perspectives.length} perspectives viewed
        </div>
      </div>

      {/* Perspective Tabs */}
      <div className="flex flex-wrap gap-2">
        {aphorism.perspectives.map((p, i) => {
          const c = PERSPECTIVE_COLORS[p.type];
          const isActive = i === perspIdx;
          const isViewed = viewed.has(`${aphorism.id}-${p.type}`);
          return (
            <button
              key={p.type}
              onClick={() => setPerspIdx(i)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive ? `${c}22` : "transparent",
                border: `1px solid ${isActive ? c : celestial.border}`,
                color: isActive ? c : isViewed ? celestial.textMuted : celestial.textFaint,
              }}
            >
              {p.type} {isViewed && !isActive && <Check className="w-3 h-3 inline ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Perspective Content */}
      <div className="rounded-xl p-6 transition-all duration-300" style={{
        background: `${pColor}08`,
        border: `1px solid ${pColor}33`,
      }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: pColor }}>
          {perspective.type} Perspective
        </div>
        <p className="font-body text-base leading-relaxed mb-4" style={{ color: celestial.text }}>
          {perspective.explanation}
        </p>
        {perspective.example && (
          <div className="rounded-lg p-4 mb-3" style={{ background: `${pColor}0a`, border: `1px solid ${pColor}1a` }}>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: pColor }}>Example</div>
            <p className="text-sm font-body" style={{ color: celestial.textMuted }}>{perspective.example}</p>
          </div>
        )}
        {perspective.connection && (
          <div className="text-sm italic" style={{ color: celestial.textFaint }}>
            <Link2 className="w-3 h-3 inline mr-1" /> {perspective.connection}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button onClick={prevAphorism} variant="ghost" style={{ color: celestial.textMuted }} className="hover:bg-white/5">
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        <div className="flex gap-2">
          {perspIdx < aphorism.perspectives.length - 1 ? (
            <Button onClick={() => setPerspIdx(perspIdx + 1)} style={{ background: `${pColor}22`, color: pColor, border: `1px solid ${pColor}44` }}>
              Next Perspective <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={toggleUnderstood} style={{
              background: isUnderstood ? `${celestial.gold}22` : celestial.gold,
              color: isUnderstood ? celestial.gold : celestial.bg,
              border: `1px solid ${celestial.gold}66`,
            }}>
              {isUnderstood ? <><CheckCircle className="w-4 h-4 mr-1" /> Understood</> : <><Check className="w-4 h-4 mr-1" /> I Understand This</>}
            </Button>
          )}
        </div>

        <Button onClick={nextAphorism} variant="ghost" style={{ color: celestial.textMuted }} className="hover:bg-white/5">
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── DEEP QUESTIONS ───────────────────────────────────────────────────────────

function DeepQuestions() {
  const [idx, setIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [showContext, setShowContext] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [contemplated, setContemplated] = useState<Set<string>>(() => loadSet("learning-questions-contemplated"));
  const [totalTime, setTotalTime] = useState(() => loadNum("learning-questions-total-time"));

  const aphorism = aphorismDatabase[idx];
  const question = aphorism.questions[qIdx];

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive]);

  const startTimer = (mins: number) => {
    setTimer(0);
    setTimerActive(true);
    // Mark as contemplated after starting
    const key = `${aphorism.id}-q${qIdx}`;
    setContemplated(prev => {
      const next = new Set(prev);
      next.add(key);
      saveSet("learning-questions-contemplated", next);
      return next;
    });
  };

  const stopTimer = () => {
    setTimerActive(false);
    const newTotal = totalTime + timer;
    setTotalTime(newTotal);
    saveNum("learning-questions-total-time", newTotal);
  };

  const nextQuestion = () => {
    stopTimer();
    setHintsShown(0);
    setShowContext(false);
    setTimer(0);
    if (qIdx < aphorism.questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      setIdx((idx + 1) % aphorismDatabase.length);
      setQIdx(0);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm" style={{ color: celestial.textMuted }}>
        <span>Aphorism {idx + 1} of {aphorismDatabase.length}</span>
        <span>{contemplated.size} questions contemplated</span>
      </div>

      {/* Aphorism */}
      <div className="rounded-xl p-5" style={{ background: celestial.surface, border: `1px solid ${celestial.border}` }}>
        <div className="text-xs uppercase tracking-widest mb-2" style={{ color: celestial.goldDim }}>
          Verse {aphorism.id} — {aphorism.category}
        </div>
        <p className="font-serif text-lg md:text-xl leading-relaxed italic" style={{ color: celestial.text }}>
          "{aphorism.text}"
        </p>
      </div>

      {/* Question */}
      <div className="rounded-xl p-6" style={{
        background: "#b088f908",
        border: "1px solid #b088f933",
      }}>
        <div className="flex items-start gap-3 mb-4">
          <MessageCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#b088f9" }} />
          <p className="font-body text-lg leading-relaxed" style={{ color: celestial.text }}>
            {question.question}
          </p>
        </div>

        {/* Hints */}
        {question.hints && question.hints.length > 0 && (
          <div className="space-y-2 mb-4">
            {question.hints.slice(0, hintsShown).map((hint, i) => (
              <div key={i} className="rounded-lg px-4 py-2.5 text-sm flex items-start gap-2" style={{
                background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.15)",
              }}>
                <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: celestial.goldDim }} />
                <span style={{ color: celestial.textMuted }}>{hint}</span>
              </div>
            ))}
            {hintsShown < question.hints.length && (
              <Button variant="ghost" size="sm" onClick={() => setHintsShown(h => h + 1)}
                style={{ color: celestial.gold }} className="hover:bg-white/5">
                <HelpCircle className="w-4 h-4 mr-1" /> Give me a hint ({hintsShown + 1}/{question.hints.length})
              </Button>
            )}
          </div>
        )}

        {/* Context / Discussion Points */}
        {question.context && (
          <>
            {!showContext ? (
              <Button variant="ghost" size="sm" onClick={() => setShowContext(true)}
                style={{ color: "#b088f9" }} className="hover:bg-white/5">
                <Eye className="w-4 h-4 mr-1" /> Show discussion points
              </Button>
            ) : (
              <div className="rounded-lg px-4 py-3 text-sm" style={{
                background: "#b088f90a",
                border: "1px solid #b088f91a",
                color: celestial.textMuted,
              }}>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#b088f9" }}>Why this matters</div>
                {question.context}
              </div>
            )}
          </>
        )}
      </div>

      {/* Contemplation Timer */}
      <div className="rounded-xl p-5" style={{ background: celestial.surface, border: `1px solid ${celestial.border}` }}>
        <div className="flex items-center gap-3 mb-3">
          <Timer className="w-5 h-5" style={{ color: celestial.gold }} />
          <span className="text-sm font-medium" style={{ color: celestial.text }}>Contemplation</span>
          {timer > 0 && (
            <span className="font-mono text-lg ml-auto" style={{ color: celestial.gold }}>{formatTime(timer)}</span>
          )}
        </div>

        {!timerActive ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => startTimer(1)} style={{ background: `${celestial.gold}15`, color: celestial.gold, border: `1px solid ${celestial.gold}33` }}>
              1 min
            </Button>
            <Button size="sm" onClick={() => startTimer(3)} style={{ background: `${celestial.gold}15`, color: celestial.gold, border: `1px solid ${celestial.gold}33` }}>
              3 min
            </Button>
            <Button size="sm" onClick={() => startTimer(5)} style={{ background: `${celestial.gold}15`, color: celestial.gold, border: `1px solid ${celestial.gold}33` }}>
              5 min
            </Button>
            <span className="text-xs self-center ml-2" style={{ color: celestial.textFaint }}>
              Total contemplation: {formatTime(totalTime)}
            </span>
          </div>
        ) : (
          <Button size="sm" onClick={stopTimer} variant="ghost" style={{ color: celestial.gold }} className="hover:bg-white/5">
            Stop Timer
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => { stopTimer(); setHintsShown(0); setShowContext(false); setTimer(0); setIdx((idx - 1 + aphorismDatabase.length) % aphorismDatabase.length); setQIdx(0); }}
          style={{ color: celestial.textMuted }} className="hover:bg-white/5">
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <Button onClick={nextQuestion} style={{ background: `#b088f922`, color: "#b088f9", border: "1px solid #b088f944" }}>
          Next Question <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── EXAMPLE MATCHER ──────────────────────────────────────────────────────────

function ExampleMatcher() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(() => loadNum("learning-examples-score"));
  const [perfectCount, setPerfectCount] = useState(() => loadNum("learning-examples-perfect"));

  const scenario = exampleScenarios[scenarioIdx];

  // All aphorisms that appear in the database to use as options
  const allOptions = aphorismDatabase.map(a => ({ id: a.id, text: a.text }));
  // Pick the correct ones + 2-3 distractors
  const correctIds = new Set(scenario.relatedAphorisms);
  const distractors = allOptions
    .filter(a => !correctIds.has(a.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [...allOptions.filter(a => correctIds.has(a.id)), ...distractors]
    .sort((a, b) => a.id - b.id);

  const toggleSelect = (id: number) => {
    if (revealed) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const checkAnswer = () => {
    setRevealed(true);
    // Check if perfect match
    const isCorrectSize = selected.size === correctIds.size;
    const allCorrect = [...selected].every(id => correctIds.has(id));
    if (isCorrectSize && allCorrect) {
      const newPerfect = perfectCount + 1;
      setPerfectCount(newPerfect);
      saveNum("learning-examples-perfect", newPerfect);
    }
    const newScore = score + 1;
    setScore(newScore);
    saveNum("learning-examples-score", newScore);
  };

  const nextScenario = () => {
    setScenarioIdx((scenarioIdx + 1) % exampleScenarios.length);
    setSelected(new Set());
    setRevealed(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm" style={{ color: celestial.textMuted }}>
        <span>Scenario {scenarioIdx + 1} of {exampleScenarios.length}</span>
        <span>{perfectCount} perfect matches</span>
      </div>

      {/* Scenario */}
      <div className="rounded-xl p-6" style={{
        background: "#70c89608",
        border: "1px solid #70c89633",
      }}>
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "#70c896" }}>
          Real World Scenario
        </div>
        <p className="font-body text-lg leading-relaxed" style={{ color: celestial.text }}>
          {scenario.scenario}
        </p>
      </div>

      {/* Question */}
      <p className="font-serif text-lg" style={{ color: celestial.heading }}>
        Which aphorisms relate to this scenario?
      </p>

      {/* Options */}
      <div className="space-y-3">
        {options.map(opt => {
          const isSelected = selected.has(opt.id);
          const isCorrect = correctIds.has(opt.id);
          let borderColor = celestial.border;
          let bgColor = "transparent";

          if (revealed) {
            if (isCorrect) {
              borderColor = "#70c89666";
              bgColor = "#70c89610";
            } else if (isSelected && !isCorrect) {
              borderColor = "#dc504066";
              bgColor = "#dc504010";
            }
          } else if (isSelected) {
            borderColor = celestial.borderGold;
            bgColor = `${celestial.gold}0a`;
          }

          return (
            <button
              key={opt.id}
              onClick={() => toggleSelect(opt.id)}
              className="w-full text-left rounded-xl p-4 transition-all duration-200"
              style={{ background: bgColor, border: `1px solid ${borderColor}` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center" style={{
                  borderColor: isSelected ? celestial.gold : celestial.textFaint,
                  background: isSelected ? `${celestial.gold}22` : "transparent",
                }}>
                  {isSelected && <Check className="w-3 h-3" style={{ color: celestial.gold }} />}
                </div>
                <div>
                  <span className="text-xs font-mono" style={{ color: celestial.textFaint }}>#{opt.id}</span>
                  <p className="font-serif text-sm" style={{ color: celestial.text }}>"{opt.text}"</p>
                </div>
              </div>

              {/* Explanation after reveal */}
              {revealed && isCorrect && scenario.explanations[opt.id] && (
                <div className="mt-3 ml-8 rounded-lg p-3 text-sm" style={{
                  background: "#70c8960a",
                  border: "1px solid #70c8961a",
                  color: celestial.textMuted,
                }}>
                  <CheckCircle className="w-3 h-3 inline mr-1" style={{ color: "#70c896" }} />
                  {scenario.explanations[opt.id]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => { setScenarioIdx((scenarioIdx - 1 + exampleScenarios.length) % exampleScenarios.length); setSelected(new Set()); setRevealed(false); }}
          style={{ color: celestial.textMuted }} className="hover:bg-white/5">
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        {!revealed ? (
          <Button onClick={checkAnswer} disabled={selected.size === 0} style={{
            background: selected.size > 0 ? "#70c89622" : `${celestial.surface}`,
            color: selected.size > 0 ? "#70c896" : celestial.textFaint,
            border: `1px solid ${selected.size > 0 ? "#70c89644" : celestial.border}`,
          }}>
            Check My Understanding
          </Button>
        ) : (
          <Button onClick={nextScenario} style={{ background: "#70c89622", color: "#70c896", border: "1px solid #70c89644" }}>
            Next Scenario <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── CONCEPT CONNECTIONS ──────────────────────────────────────────────────────

function ConceptConnections() {
  const [clusterIdx, setClusterIdx] = useState(0);
  const [showPattern, setShowPattern] = useState(false);
  const [explored, setExplored] = useState<Set<string>>(() => loadSet("learning-connections-explored"));

  const cluster = connectionClusters[clusterIdx];

  const aphorismsInCluster = cluster.aphorisms
    .map(id => aphorismDatabase.find(a => a.id === id))
    .filter(Boolean) as AphorismKnowledge[];

  const revealPattern = () => {
    setShowPattern(true);
    setExplored(prev => {
      const next = new Set(prev);
      next.add(cluster.title);
      saveSet("learning-connections-explored", next);
      return next;
    });
  };

  const nextCluster = () => {
    setClusterIdx((clusterIdx + 1) % connectionClusters.length);
    setShowPattern(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm" style={{ color: celestial.textMuted }}>
        <span>Cluster {clusterIdx + 1} of {connectionClusters.length}</span>
        <span>{explored.size} / {connectionClusters.length} explored</span>
      </div>

      {/* Cluster Title */}
      <div className="rounded-xl p-5" style={{ background: celestial.surface, border: `1px solid ${celestial.borderGold}`, boxShadow: celestial.goldGlow }}>
        <div className="text-xs uppercase tracking-widest mb-1" style={{ color: celestial.goldDim }}>Connected Wisdom</div>
        <h3 className="font-serif text-2xl" style={{ color: celestial.heading }}>{cluster.title}</h3>
      </div>

      {/* Aphorisms in this cluster */}
      <div className="space-y-3">
        {aphorismsInCluster.map(a => (
          <div key={a.id} className="rounded-xl p-5" style={{
            background: "#5bbfba08",
            border: "1px solid #5bbfba22",
          }}>
            <span className="text-xs font-mono" style={{ color: celestial.textFaint }}>#{a.id}</span>
            <p className="font-serif text-base mt-1 italic" style={{ color: celestial.text }}>"{a.text}"</p>
          </div>
        ))}
      </div>

      {/* Prompt */}
      <div className="rounded-xl p-5" style={{ background: "#b088f908", border: "1px solid #b088f922" }}>
        <div className="flex items-start gap-3">
          <Link2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#b088f9" }} />
          <div>
            <p className="font-body text-base leading-relaxed" style={{ color: celestial.text }}>
              How are these aphorisms connected? What deeper pattern links them?
            </p>
            <p className="text-sm mt-1" style={{ color: celestial.textFaint }}>
              Contemplate the relationship before revealing the pattern.
            </p>
          </div>
        </div>
      </div>

      {/* Pattern Reveal */}
      {!showPattern ? (
        <Button onClick={revealPattern} className="w-full" style={{
          background: "#5bbfba15",
          color: "#5bbfba",
          border: "1px solid #5bbfba33",
        }}>
          <Eye className="w-4 h-4 mr-2" /> Show me the pattern
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl p-6" style={{ background: "#5bbfba0a", border: "1px solid #5bbfba33" }}>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: "#5bbfba" }}>The Pattern</div>
            <p className="font-body text-base leading-relaxed" style={{ color: celestial.text }}>
              {cluster.pattern}
            </p>
          </div>
          <div className="rounded-xl p-6" style={{ background: `${celestial.gold}08`, border: `1px solid ${celestial.gold}22` }}>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: celestial.gold }}>The Insight</div>
            <p className="font-body text-base leading-relaxed" style={{ color: celestial.text }}>
              {cluster.insight}
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => { setClusterIdx((clusterIdx - 1 + connectionClusters.length) % connectionClusters.length); setShowPattern(false); }}
          style={{ color: celestial.textMuted }} className="hover:bg-white/5">
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <Button onClick={nextCluster} style={{ background: "#5bbfba22", color: "#5bbfba", border: "1px solid #5bbfba44" }}>
          Next Cluster <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── MODE MENU ────────────────────────────────────────────────────────────────

const modes = [
  {
    id: "perspectives" as const,
    title: "Perspective Explorer",
    desc: "Understand each aphorism from multiple angles — physical, mystical, philosophical",
    icon: <Search className="w-6 h-6" />,
    color: "#87CEEB",
    statsKey: "learning-perspectives-understood",
    statsLabel: "understood",
    statsTotal: aphorismDatabase.length,
  },
  {
    id: "questions" as const,
    title: "Deep Questions",
    desc: "Contemplate thought-provoking questions that unlock deeper wisdom",
    icon: <MessageCircle className="w-6 h-6" />,
    color: "#b088f9",
    statsKey: "learning-questions-contemplated",
    statsLabel: "contemplated",
    statsTotal: aphorismDatabase.reduce((s, a) => s + a.questions.length, 0),
  },
  {
    id: "examples" as const,
    title: "Example Matcher",
    desc: "Connect ancient wisdom to modern life through real-world scenarios",
    icon: <Globe className="w-6 h-6" />,
    color: "#70c896",
    statsKey: "learning-examples-score",
    statsLabel: "scenarios attempted",
    statsTotal: exampleScenarios.length,
  },
  {
    id: "connections" as const,
    title: "Concept Connections",
    desc: "Explore how aphorisms relate and build into a unified teaching",
    icon: <Link2 className="w-6 h-6" />,
    color: "#5bbfba",
    statsKey: "learning-connections-explored",
    statsLabel: "clusters explored",
    statsTotal: connectionClusters.length,
  },
];

function ModeMenu({ onSelect }: { onSelect: (mode: LearningMode) => void }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-2">
        <p className="font-body text-base" style={{ color: celestial.textMuted }}>
          Choose a learning path to deepen your understanding of the Hermetic aphorisms.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {modes.map(mode => {
          let count = 0;
          try {
            const raw = localStorage.getItem(mode.statsKey);
            if (raw) {
              // Could be a Set (JSON array) or a number
              const parsed = JSON.parse(raw);
              count = Array.isArray(parsed) ? parsed.length : (typeof parsed === "number" ? parsed : 0);
            }
          } catch { /* ignore */ }

          return (
            <button
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className="rounded-xl p-6 text-left transition-all duration-300 hover:-translate-y-1"
              style={{
                background: `${mode.color}08`,
                border: `1px solid ${mode.color}22`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{
                  background: `${mode.color}15`,
                  border: `1px solid ${mode.color}33`,
                  color: mode.color,
                }}>
                  {mode.icon}
                </div>
                <div>
                  <h3 className="font-serif text-lg mb-1" style={{ color: mode.color }}>
                    {mode.title}
                  </h3>
                  <p className="text-sm font-body leading-relaxed" style={{ color: celestial.textMuted }}>
                    {mode.desc}
                  </p>
                  {count > 0 && (
                    <div className="text-xs mt-2" style={{ color: celestial.textFaint }}>
                      {count} {mode.statsLabel}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function FlashcardLearning() {
  const [mode, setMode] = useState<LearningMode>("menu");

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
        <div style={{ borderBottom: `1px solid ${celestial.border}`, padding: "2.5rem 0 2rem" }}>
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/reader/heads-of-things">
                <Button variant="ghost" size="sm" style={{ color: celestial.textMuted }} className="hover:bg-white/5">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Heads of Things
                </Button>
              </Link>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl mb-2" style={{ color: celestial.heading, textShadow: "0 0 30px rgba(212,175,55,0.2)" }}>
              {mode === "menu" ? "Choose Your Learning Path" :
               mode === "perspectives" ? "Perspective Explorer" :
               mode === "questions" ? "Deep Questions" :
               mode === "examples" ? "Example Matcher" :
               "Concept Connections"}
            </h1>
            {mode !== "menu" && (
              <Button variant="ghost" size="sm" onClick={() => setMode("menu")}
                style={{ color: celestial.textMuted }} className="hover:bg-white/5 -ml-2 mt-1">
                <RotateCcw className="w-3 h-3 mr-1" /> Change mode
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 pb-20">
          {mode === "menu" && <ModeMenu onSelect={setMode} />}
          {mode === "perspectives" && <PerspectiveExplorer />}
          {mode === "questions" && <DeepQuestions />}
          {mode === "examples" && <ExampleMatcher />}
          {mode === "connections" && <ConceptConnections />}
        </div>
      </div>
    </Layout>
  );
}
