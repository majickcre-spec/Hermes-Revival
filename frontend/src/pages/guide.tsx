import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Lightbulb, Map, Compass, BookOpen, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function Guide() {
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="bg-card border-b border-white/10 px-6 py-4 flex items-center gap-4 shrink-0">
          <Link href="/editor">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Editor
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <div>
            <h1 className="font-serif text-xl text-foreground font-medium flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              The Hermetic Lens Guide
            </h1>
            <p className="text-xs text-muted-foreground">Instructions for completing each section</p>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            
            {/* Introduction */}
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-foreground mb-2">The Purpose of the Hermetic Lens</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Each section of the sacred text contains layers of meaning. The Hermetic Lens helps you capture these layers 
                    so that students can approach the teaching from multiple angles: through contemplation, intellectual understanding, 
                    and embodied practice.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 1: Contemplation Prompt */}
            <Card className="p-6 bg-card border-white/10">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-foreground">1. Contemplation Prompt</h2>
                  <p className="text-sm text-primary/80 italic">The Bridge Between Reading and Understanding</p>
                </div>
              </div>
              
              <div className="space-y-4 pl-14">
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">What You Write</h3>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li>A single question (or 2-3 related questions)</li>
                    <li>Points the reader toward the <strong>core mystery</strong> of the passage</li>
                    <li>Invites personal reflection <strong>without giving away the answer</strong></li>
                    <li>Creates a "sacred pause" before they dive deeper</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Example (for Sections 1-4)</h4>
                  <p className="text-foreground italic leading-relaxed">
                    "In this opening vision, Hermes describes a state where his bodily senses were 'held back' while his understanding 
                    was 'lifted up.' What conditions in your own life create space for deeper understanding? When have you experienced 
                    moments where the noise of the senses faded and clarity emerged?"
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">End Result</h3>
                  <p className="text-muted-foreground">
                    The student reads your modern translation, then encounters this prompt. It makes them <strong>stop and think</strong> before 
                    moving on. They form a personal relationship with the teaching rather than consuming it passively.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 2: The Map */}
            <Card className="p-6 bg-card border-white/10">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Map className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-foreground">2. The Map</h2>
                  <p className="text-sm text-primary/80 italic">The Intellectual Framework</p>
                </div>
              </div>
              
              <div className="space-y-4 pl-14">
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">What You Write</h3>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li><strong>Core Concepts:</strong> Name the key ideas (e.g., "The Primacy of Mind")</li>
                    <li><strong>Key Principles:</strong> Philosophical laws revealed (e.g., "Mentalism," "Polarity")</li>
                    <li><strong>Related Teachings:</strong> Cross-references to other books, traditions, or verses</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 font-mono text-sm">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 font-sans">Example</h4>
                  <pre className="text-foreground whitespace-pre-wrap leading-relaxed">{`Core Concepts:
• Pymander = The Divine Mind
• Light vs. Darkness (primordial forces)
• The Logos (creative Word)

Key Principles:
• "The Mind is God" — Mentalism
• Unity of the Father, Word, and Life

Related Teachings:
• Genesis 1:1-3 (Let there be Light)
• Gospel of John 1:1 (In the beginning was the Word)
• Plato's Theory of Forms`}</pre>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">End Result</h3>
                  <p className="text-muted-foreground">
                    The student who wants to <strong>understand intellectually</strong> has a "map" to orient themselves. 
                    They see how this passage connects to the whole Hermetic system and to other wisdom traditions.
                  </p>
                </div>
              </div>
            </Card>

            {/* Section 3: The Practice */}
            <Card className="p-6 bg-card border-white/10">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-foreground">3. The Practice</h2>
                  <p className="text-sm text-primary/80 italic">Embodied Application</p>
                </div>
              </div>
              
              <div className="space-y-4 pl-14">
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">What You Write</h3>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li><strong>Meditation:</strong> A specific practice to <em>experience</em> the teaching</li>
                    <li><strong>Journaling Prompts:</strong> Questions for deeper self-inquiry</li>
                    <li><strong>Warning/Caution:</strong> What NOT to do, or where students might go astray</li>
                  </ul>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Example</h4>
                  <div className="text-foreground space-y-3 leading-relaxed">
                    <div>
                      <span className="text-emerald-500 font-semibold">Meditation:</span>
                      <p className="mt-1">Sit in stillness. Close your eyes and imagine an infinite Light. Hold the image of Pymander—the Divine Mind—in your awareness. Ask inwardly: "What do I wish to learn and know?"</p>
                    </div>
                    <div>
                      <span className="text-emerald-500 font-semibold">Journal Prompts:</span>
                      <ol className="mt-1 list-decimal list-inside">
                        <li>What is the "darkness" in your life that obscures the Light?</li>
                        <li>How might you "hold the Divine in your mind" more often?</li>
                      </ol>
                    </div>
                    <div>
                      <span className="text-red-400 font-semibold">Warning:</span>
                      <p className="mt-1">Do not rush past this vision. The teaching must be <em>experienced</em>, not merely understood. Return to this section after meditation.</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">End Result</h3>
                  <p className="text-muted-foreground">
                    The student who wants to <strong>live the teaching</strong> has a path to walk. This transforms 
                    intellectual theory into spiritual transformation.
                  </p>
                </div>
              </div>
            </Card>

            {/* Final Product */}
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <h2 className="font-serif text-xl text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                The Final Product (Student View)
              </h2>
              <p className="text-muted-foreground mb-4">
                When a student opens a chapter, they will experience:
              </p>
              <ol className="space-y-3 text-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">1</span>
                  <span><strong>The Text</strong> — Your beautiful modern translation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">2</span>
                  <span><strong>The Prompt</strong> — A contemplation question that creates a sacred pause</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">3</span>
                  <div>
                    <strong>Two Optional Lenses:</strong>
                    <ul className="mt-1 text-muted-foreground list-disc list-inside">
                      <li>Click "The Map" → See the intellectual framework</li>
                      <li>Click "The Practice" → See meditation and journaling exercises</li>
                    </ul>
                  </div>
                </li>
              </ol>
              <Separator className="my-4 bg-white/10" />
              <p className="text-muted-foreground italic">
                This way, you honor both the <strong>scholar</strong> and the <strong>practitioner</strong>—and your devotion 
                becomes a living teaching tool that transforms readers into students of the Way.
              </p>
            </Card>

            {/* Quick Reference */}
            <Card className="p-6 bg-card border-white/10">
              <h2 className="font-serif text-xl text-foreground mb-4">Quick Reference</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold text-amber-500">Prompt</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Ask, don't tell. Guide without dictating. Create pause.</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Map className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-blue-500">Map</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Name concepts. List principles. Connect to other teachings.</p>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Compass className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-emerald-500">Practice</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Give meditation. Prompt journaling. Warn of pitfalls.</p>
                </div>
              </div>
            </Card>

            <div className="text-center py-8">
              <Link href="/editor">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-return">
                  Return to Editor
                </Button>
              </Link>
            </div>

          </div>
        </ScrollArea>
      </div>
    </Layout>
  );
}
