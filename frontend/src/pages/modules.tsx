import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { BookOpen, Star, Lock, Orbit, Brain, Lightbulb, Sunrise, Sparkles } from "lucide-react";

const books = [
  { id: 1, title: "Book I", subtitle: "The Divine Pymander", desc: "Hermes' vision of the Great Mind and the structure of reality.", locked: false },
  { id: 2, title: "Book II", subtitle: "To Asclepius", desc: "A dialogue on the universal spirit and nature.", locked: false },
  { id: 3, title: "Book III", subtitle: "The Holy Sermon", desc: "The glory of the works of God.", locked: false },
  { id: 4, title: "Book IV", subtitle: "The Key", desc: "The basin of Mind sent down for souls to baptize themselves in.", locked: false },
  { id: 5, title: "Book V", subtitle: "God is Unmanifest", desc: "Though unmanifest, God is most manifest in all things.", locked: true },
  { id: 6, title: "Book VI", subtitle: "In God Alone is Good", desc: "Understanding the nature of Good and Evil.", locked: true },
  { id: 7, title: "Book VII", subtitle: "Ignorance of God", desc: "The greatest evil among men is the ignorance of God.", locked: true },
  { id: 8, title: "Book VIII", subtitle: "Nothing Perishes", desc: "Death is not destruction, but change.", locked: true },
  { id: 9, title: "Book IX", subtitle: "On Thought and Sense", desc: "How sensation and thought operate in the human.", locked: true },
  { id: 10, title: "Book X", subtitle: "The Key (To Tat)", desc: "Further instructions on the soul and mind.", locked: true },
];

export default function Modules() {
  return (
    <Layout>
      <div className="bg-background min-h-screen pb-20">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent py-20 border-b border-white/5">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-serif text-primary mb-6">The Path of Understanding</h1>
            <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
              Select a module to begin your study. Proceed in order to build a complete understanding of the mysteries of God and Nature.
            </p>
          </div>
        </div>

        {/* Study Modules */}
        <div className="container mx-auto px-4 pt-16 pb-8">
          <h2 className="text-2xl font-serif text-primary/80 mb-6">Study Modules</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold tracking-widest text-primary uppercase">Deep Learning</span>
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground mt-2">Deep Learning System</h3>
                <div className="text-sm font-medium text-primary/70">Multi-Perspective Wisdom Tool</div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground/80 font-body leading-relaxed h-16 line-clamp-3">
                  Master the 82 Aphorisms through multiple perspectives, deep questions, real-world examples, and concept connections.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/learning">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Sparkles className="w-4 h-4 mr-2" /> Start Learning
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-card border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold tracking-widest text-primary/60 uppercase">Study Module</span>
                  <Orbit className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground mt-2">The Seven Governors</h3>
                <div className="text-sm font-medium text-muted-foreground">Poimandres, Book I</div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground/80 font-body leading-relaxed h-16 line-clamp-3">
                  The soul's ascent through the seven planetary spheres — Moon, Mercury, Venus, Sun, Mars, Jupiter, Saturn — each stripping away mortal qualities.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/reader/seven-governors">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <BookOpen className="w-4 h-4 mr-2" /> Begin Study
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-card border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold tracking-widest text-primary/60 uppercase">Study Module</span>
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground mt-2">The Mind</h3>
                <div className="text-sm font-medium text-muted-foreground">Books X & XI</div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground/80 font-body leading-relaxed h-16 line-clamp-3">
                  The nature of divine intelligence — how Mind pervades all things and how the soul participates in divine thought.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/reader/the-mind">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <BookOpen className="w-4 h-4 mr-2" /> Begin Study
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-card border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold tracking-widest text-primary/60 uppercase">Study Module</span>
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground mt-2">The Heads of Things</h3>
                <div className="text-sm font-medium text-muted-foreground">Book I</div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground/80 font-body leading-relaxed h-16 line-clamp-3">
                  The 82 Aphorisms: Master the memory of all Divine knowledge (Dr. John Everard, 1650)
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/reader/heads-of-things">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <BookOpen className="w-4 h-4 mr-2" /> Begin Study
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="bg-card border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold tracking-widest text-primary/60 uppercase">Study Module</span>
                  <Sunrise className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-2xl font-serif text-foreground mt-2">The Secret of Regeneration</h3>
                <div className="text-sm font-medium text-muted-foreground">Book XIII</div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground/80 font-body leading-relaxed h-16 line-clamp-3">
                  The 12 Torments and 10 Powers — transform vices into virtues through divine rebirth.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/reader/regeneration">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <BookOpen className="w-4 h-4 mr-2" /> Begin Study
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Corpus Hermeticum */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-serif text-primary/80 mb-6">Corpus Hermeticum</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <Card key={book.id} className={`bg-card border-white/10 transition-all duration-300 ${book.locked ? 'opacity-70' : 'hover:-translate-y-1 hover:border-primary/40'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold tracking-widest text-primary/60 uppercase">Module {book.id}</span>
                    {book.locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Star className="w-4 h-4 text-primary" />}
                  </div>
                  <h3 className="text-2xl font-serif text-foreground mt-2">{book.subtitle}</h3>
                  <div className="text-sm font-medium text-muted-foreground">{book.title}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground/80 font-body leading-relaxed h-16 line-clamp-3">
                    {book.desc}
                  </p>
                </CardContent>
                <CardFooter>
                  {book.locked ? (
                    <Button disabled variant="secondary" className="w-full bg-white/5 text-muted-foreground">
                      Locked
                    </Button>
                  ) : (
                    book.id === 1 ? (
                      <Link href={`/editor/${book.id}`}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          <BookOpen className="w-4 h-4 mr-2" /> Modernize & Edit
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/reader/${book.id}`}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          <BookOpen className="w-4 h-4 mr-2" /> Start Reading
                        </Button>
                      </Link>
                    )
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
