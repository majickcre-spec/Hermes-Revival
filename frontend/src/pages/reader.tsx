import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Share2, Type } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock content for the reader
const bookContent = {
  title: "Book I: The Pymander",
  originalTitle: "Pymander or The Shepherd of Men",
  content: [
    {
      heading: "The Vision",
      text: "It happened at a moment when my mind was meditating on the things that are, and my thought was raised to a great height, while my bodily senses had been put under restraint as in sleep—though not such sleep as that of men weighed down by fullness of food or bodily weariness."
    },
    {
      heading: "The Great Being",
      text: "Methought there came to me a Being of vast and boundless magnitude, who called me by my name, and said to me: 'What do you wish to hear and see, and to learn and know by thought?'"
    },
    {
      heading: "The Dialogue",
      text: "I said: 'Who are you?' He replied: 'I am Poimandres, the Mind of the Sovereignty.' 'I would fain learn,' said I, 'the things that are, and understand their nature, and get knowledge of God. This,' I said, 'is what I wish to hear.' He answered: 'Hold in your mind all that you wish to learn, and I will teach you.'"
    },
    {
      heading: "The Light",
      text: "When he had thus spoken, he changed in his aspect, and forthwith all things were opened out to me in a moment, and I beheld a boundless view; all was changed into light, a mild and joyous light; and I marveled when I saw it. And presently, after a little while, there came to be a darkness settling down in part, of awesome and gloomy aspect, coiling in tortuous folds, like a snake, as it seemed to me."
    },
    {
      heading: "The Word",
      text: "And then out of the light a Holy Word (Logos) came upon nature, and pure fire leapt up from the moist nature upwards to the height; it was light and sharp and active. And the air, being light, followed the breath (pneuma), ascending from earth and water to the fire, so that it seemed to hang from it; but the earth and water remained mingled together, so that the earth could not be seen apart from the water; but they were kept in motion by the breath of the Word which moved upon them."
    }
  ]
};

export default function Reader() {
  const [match, params] = useRoute("/reader/:id");
  const [fontSize, setFontSize] = useState(18);

  // In a real app, we'd fetch the content based on params.id
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        {/* Sidebar / Table of Contents */}
        <aside className="w-full md:w-64 lg:w-80 border-b md:border-b-0 md:border-r border-white/10 bg-card/30 p-6 hidden md:block">
          <div className="mb-6">
            <Link href="/modules">
              <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-primary">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Modules
              </Button>
            </Link>
          </div>
          
          <h3 className="font-serif text-lg font-semibold text-primary mb-4">Table of Contents</h3>
          <nav className="space-y-2">
            {bookContent.content.map((section, idx) => (
              <a 
                key={idx} 
                href={`#section-${idx}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 border-l-2 border-transparent hover:border-primary pl-3"
              >
                {section.heading}
              </a>
            ))}
          </nav>

          <Separator className="my-6 bg-white/10" />
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reading Settings</h4>
            <div className="flex items-center gap-2">
               <Type className="w-4 h-4 text-muted-foreground" />
               <input 
                 type="range" 
                 min="16" 
                 max="24" 
                 value={fontSize} 
                 onChange={(e) => setFontSize(parseInt(e.target.value))}
                 className="w-full accent-primary"
               />
            </div>
          </div>
        </aside>

        {/* Main Reading Area */}
        <div className="flex-1 bg-background relative">
          <ScrollArea className="h-[calc(100vh-4rem)] w-full">
            <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
              {/* Chapter Header */}
              <div className="text-center mb-16 space-y-4 animate-in fade-in duration-700">
                <div className="inline-block border-b-2 border-primary/30 pb-1 mb-2">
                   <span className="font-serif text-primary text-lg">Module {params?.id || 1}</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground font-bold leading-tight">
                  {bookContent.title}
                </h1>
                <p className="font-serif italic text-xl text-muted-foreground">
                  {bookContent.originalTitle}
                </p>
              </div>

              {/* Text Content */}
              <div 
                className="space-y-12 animate-in slide-in-from-bottom-4 duration-700 delay-150"
                style={{ fontSize: `${fontSize}px` }}
              >
                {bookContent.content.map((section, idx) => (
                  <section key={idx} id={`section-${idx}`} className="relative">
                    <span className="absolute -left-12 top-0 text-6xl font-serif text-primary/5 font-bold select-none hidden md:block">
                      {idx + 1}
                    </span>
                    <h2 className="font-serif text-2xl font-semibold text-primary/90 mb-4 flex items-center gap-3">
                      <span className="md:hidden text-primary/40 text-sm">#{idx + 1}</span>
                      {section.heading}
                    </h2>
                    <p className="font-body text-foreground/90 leading-loose text-justify">
                      {section.text}
                    </p>
                  </section>
                ))}
              </div>

              {/* Navigation Footer */}
              <div className="mt-24 pt-12 border-t border-white/10 flex items-center justify-between">
                <Button variant="outline" className="border-primary/20 text-muted-foreground hover:text-primary" disabled>
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous Book
                </Button>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Next Book <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </Layout>
  );
}
