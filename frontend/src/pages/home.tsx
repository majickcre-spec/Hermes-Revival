import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import heroBg from "/generated_images/mystical_dark_blue_background_with_golden_sacred_geometry.png";
import logo from "/generated_images/golden_hermetic_caduceus_symbol.png";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 flex justify-center"
          >
            <img src={logo} alt="Emblem" className="h-24 w-24 md:h-32 md:w-32 animate-pulse-slow" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-primary to-primary/60 mb-6 drop-shadow-sm"
          >
            Nature of All Things
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body leading-relaxed"
          >
            A guide to understanding God, Reality, and the Self through the ancient wisdom of Hermes Trismegistus.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/modules">
              <Button size="lg" className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-serif tracking-wide w-full sm:w-auto">
                Begin the Great Work
              </Button>
            </Link>
            <Link href="/guide">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-primary/30 text-primary hover:bg-primary/10 rounded-full font-serif tracking-wide w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-24 bg-gradient-to-b from-background to-black/40">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl text-primary font-serif">The Knowledge of God</h2>
              <p className="text-muted-foreground text-lg leading-relaxed font-body">
                This platform is not merely a library of old texts, but a living guide to the nature of existence. 
                Based on the lineage of Hermes Trismegistus, we offer a path to understand the Creator through the creation.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed font-body">
                By understanding the things that are—how they are ordered, governed, and by whom—we come to know the Truth.
                Explore the teachings to unlock the mysteries of the Divine Mind.
              </p>
            </div>
            <div className="relative h-96 w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 p-1">
               <div className="absolute inset-0 bg-primary/5 z-0" />
               <div className="relative z-10 h-full w-full flex items-center justify-center border border-white/5 rounded-lg p-8">
                 <div className="text-center space-y-4">
                   <div className="text-6xl font-serif text-primary/80">XVII</div>
                   <div className="text-2xl font-serif text-muted-foreground">Books of Wisdom</div>
                   <div className="w-16 h-1 bg-primary/40 mx-auto mt-4" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Modules Preview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl text-foreground font-serif mb-4">The Sacred Texts</h2>
            <p className="text-muted-foreground font-body max-w-2xl mx-auto">
              Embark on a structured path of study through the Hermetic Corpus.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Book I: The Pymander",
                desc: "The vision of the Universal Mind and the creation of the cosmos.",
                idx: "I"
              },
              {
                title: "Book IV: The Key",
                desc: "Understanding the nature of the soul and its journey.",
                idx: "IV"
              },
              {
                title: "Book X: The Mind to Hermes",
                desc: "A discourse on the nature of divine intelligence and human perception.",
                idx: "X"
              }
            ].map((item, i) => (
              <Card key={i} className="bg-card/50 border-white/10 hover:border-primary/50 transition-colors group cursor-pointer backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-4xl font-serif text-primary/20 mb-4 group-hover:text-primary/40 transition-colors">{item.idx}</div>
                  <h3 className="text-xl text-primary font-serif mb-3 group-hover:text-primary-foreground transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground font-body leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/modules">
              <Button variant="link" className="text-primary text-lg font-serif italic hover:text-primary/80">
                View all teaching modules &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
