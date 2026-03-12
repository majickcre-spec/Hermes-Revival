// Multi-Perspective Knowledge Database for The Heads of Things
// Each aphorism includes multiple viewpoints, deep questions, real-world examples, and connections

export interface Perspective {
  type: 'Physical' | 'Philosophical' | 'Scientific' | 'Mystical' | 'Practical';
  explanation: string;
  example?: string;
  connection?: string;
}

export interface DeepQuestion {
  question: string;
  context?: string;
  hints?: string[];
}

export interface ExampleScenario {
  scenario: string;
  relatedAphorisms: number[];
  explanations: Record<number, string>;
}

export interface ConnectionCluster {
  title: string;
  aphorisms: number[];
  pattern: string;
  insight: string;
}

export interface AphorismKnowledge {
  id: number;
  text: string;
  category: string;
  perspectives: Perspective[];
  questions: DeepQuestion[];
  examples: string[];
  relatedAphorisms: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

// ─── APHORISM DATABASE (10 fully developed) ───────────────────────────────────

export const aphorismDatabase: AphorismKnowledge[] = [
  {
    id: 14,
    text: "All things that are moved, only that which is not is immoveable.",
    category: "Being and Non-Being",
    perspectives: [
      {
        type: "Philosophical",
        explanation: "The Unmoved Mover — Aristotle's concept. Everything in existence is in motion (change), but the source of all motion must itself be unchanging. The Divine/God is the only truly immoveable reality.",
        connection: "Aristotle's Unmoved Mover, Neoplatonic One",
      },
      {
        type: "Physical",
        explanation: "In our universe, everything is in constant motion — from spinning electrons to orbiting galaxies. Even 'still' objects have atoms vibrating. True stillness doesn't exist in the material world.",
        example: "Even a 'stationary' rock has atoms vibrating and Earth spinning beneath it",
      },
      {
        type: "Mystical",
        explanation: "The mind that observes all movement must itself be still to perceive motion. The witness consciousness is unmoved while witnessing all change.",
        connection: "Buddhist witness consciousness, Vedantic Atman",
      },
      {
        type: "Practical",
        explanation: "To find stability in chaos, connect to that which doesn't move — eternal principles, divine truth, your unchanging essence.",
        example: "In crisis, anchor to timeless wisdom rather than temporary circumstances",
      },
    ],
    questions: [
      {
        question: "If everything you can see is moving/changing, where can you find stability?",
        context: "This question leads to understanding the Divine as the only stable reference point",
        hints: [
          "Look beyond the material world",
          "What witnesses the change but doesn't change?",
          "The unchanging observer of all motion",
        ],
      },
      {
        question: "How does recognizing constant motion free you from attachment?",
        context: "Understanding impermanence leads to spiritual liberation",
      },
    ],
    examples: [
      "Planets orbiting the sun",
      "Seasons cycling endlessly",
      "Your thoughts constantly flowing",
      "Atoms vibrating even in 'solid' objects",
      "The aging process",
    ],
    relatedAphorisms: [15, 21, 22, 31],
    difficulty: "intermediate",
    tags: ["motion", "immoveable", "divine", "change", "permanence"],
  },

  {
    id: 15,
    text: "Every body is changeable.",
    category: "Being and Non-Being",
    perspectives: [
      {
        type: "Physical",
        explanation: "Your cells completely replace themselves every 7–10 years. The body you have today is literally not the same body you had a decade ago. Physical form is in constant flux.",
        example: "Children grow, adults age, wounds heal — the body never stops changing",
      },
      {
        type: "Philosophical",
        explanation: "Form is temporary, essence is eternal. This echoes Plato's Theory of Forms — the physical manifestation changes but the ideal Form remains.",
        connection: "Plato's Forms, Buddhist impermanence (anicca)",
      },
      {
        type: "Scientific",
        explanation: "Second law of thermodynamics — all physical systems tend toward entropy. No physical structure remains unchanged over time.",
        example: "Mountains erode, stars die, DNA mutates",
      },
      {
        type: "Mystical",
        explanation: "The body is a temporary vessel for the eternal soul. Recognizing the body's impermanence helps you identify with your true, unchanging nature.",
        connection: "Hermetic teaching: 'The body is the tomb of the soul'",
      },
    ],
    questions: [
      {
        question: "If your body is always changing, what part of 'you' remains constant?",
        context: "This leads to understanding soul/spirit as distinct from body",
        hints: [
          "Your awareness of change doesn't change",
          "The observer of the body is not the body",
          "Consciousness witnesses but doesn't change",
        ],
      },
      {
        question: "How does accepting your body's impermanence change your relationship with aging or illness?",
        context: "Understanding this brings peace with physical changes",
      },
    ],
    examples: [
      "Aging from childhood to old age",
      "Healing from injury — body rebuilds itself",
      "Daily: hunger, fatigue, energy cycles",
      "Seasonal changes in body temperature/energy",
      "Emotional states affecting physical form",
    ],
    relatedAphorisms: [14, 16, 20, 63],
    difficulty: "beginner",
    tags: ["body", "change", "impermanence", "form"],
  },

  {
    id: 25,
    text: "First, God; Secondly, the World; Thirdly, Man.",
    category: "Mortality and Immortality",
    perspectives: [
      {
        type: "Philosophical",
        explanation: "The Great Chain of Being — a cosmic hierarchy where God is the ultimate source, the World is the expression of divine creative power, and Man is a microcosm reflecting both. This is the order of ontological priority.",
        connection: "Neoplatonic emanation, Kabbalistic Tree of Life",
      },
      {
        type: "Mystical",
        explanation: "Man stands between the divine and the material. We are the bridge — capable of ascending toward God through understanding, or descending toward mere materiality through ignorance.",
        connection: "Hermetic anthropology, Jacob's Ladder",
      },
      {
        type: "Practical",
        explanation: "Priorities: put the divine first, understand the natural world second, and know yourself third. Self-knowledge requires understanding both what is above and around you.",
        example: "Study God to understand the world; study the world to understand yourself",
      },
      {
        type: "Scientific",
        explanation: "Modern cosmology echoes this: fundamental laws (God/principle), the universe (World), and conscious observers (Man). Consciousness appears only after the cosmos provides conditions for it.",
        example: "Laws of physics → galaxies/planets → biological life → self-aware beings",
      },
    ],
    questions: [
      {
        question: "Why must Man come third — after God and the World?",
        context: "This reveals Man's dependency on higher orders of reality",
        hints: [
          "Consider what must exist before Man can exist",
          "The World provides Man's body; what provides the World?",
          "Can Man exist without the World? Can the World exist without God?",
        ],
      },
      {
        question: "If Man is third, does that make humanity less important — or does it give us a special role?",
        context: "Understanding Man as the microcosm who mirrors the whole",
      },
    ],
    examples: [
      "An architect (God), a building (World), a resident (Man)",
      "A composer (God), a symphony (World), a listener (Man)",
      "Sunlight (God), the natural world it nourishes (World), the person who perceives it (Man)",
    ],
    relatedAphorisms: [26, 73, 72],
    difficulty: "beginner",
    tags: ["hierarchy", "God", "world", "man", "order"],
  },

  {
    id: 26,
    text: "The World for Man; Man for God.",
    category: "Mortality and Immortality",
    perspectives: [
      {
        type: "Philosophical",
        explanation: "Purpose flows in two directions: the World exists to provide a stage for human experience and learning, while Man's purpose is to know and glorify God. We are the reason the cosmos exists, yet we exist for something beyond us.",
        connection: "Teleological argument, Anthropic principle",
      },
      {
        type: "Mystical",
        explanation: "Man is the priest of creation — the one who gives voice, meaning, and consciousness to the world. Through Man, creation knows itself and returns to God. We complete the circuit.",
        connection: "Islamic concept of Khalifah (steward), Genesis 'dominion'",
      },
      {
        type: "Practical",
        explanation: "Your life has two dimensions: receiving from the world (experiences, sustenance, beauty) and giving back to the divine (service, understanding, worship). Balance both.",
        example: "Enjoy nature's gifts, then use your awareness to appreciate the Giver",
      },
      {
        type: "Scientific",
        explanation: "The Anthropic Principle in physics suggests the universe's constants are fine-tuned for conscious life. In a sense, the cosmos was 'made' so observers could arise within it.",
        connection: "Fine-tuned universe, observer-dependent quantum mechanics",
      },
    ],
    questions: [
      {
        question: "If the World exists 'for Man,' does that give us the right to exploit nature — or a responsibility to be its steward?",
        context: "Explores the ethics of humanity's cosmic position",
        hints: [
          "'For Man' could mean 'for Man's learning,' not 'for Man's consumption'",
          "If Man is 'for God,' what would God want Man to do with the World?",
          "A steward cares for what belongs to someone greater",
        ],
      },
      {
        question: "What does it mean to live 'for God' in practical daily life?",
        context: "Connecting cosmic purpose to everyday action",
      },
    ],
    examples: [
      "A student uses school (World) to learn, then serves society (God's purpose)",
      "Gardens produce food for the gardener, who tends them with love and attention",
      "The body sustains the mind, the mind seeks truth beyond itself",
    ],
    relatedAphorisms: [25, 73, 75, 76],
    difficulty: "intermediate",
    tags: ["purpose", "world", "man", "God", "stewardship"],
  },

  {
    id: 30,
    text: "Every thing that is moveable is not a living thing.",
    category: "Motion and Stillness",
    perspectives: [
      {
        type: "Physical",
        explanation: "Not all motion implies life. Rivers flow, rocks tumble, winds blow — all are moved, but none are alive. Motion can be mechanical, driven by external forces, without inner vitality.",
        example: "A windmill turns, a river flows, a satellite orbits — none are alive",
      },
      {
        type: "Philosophical",
        explanation: "This distinguishes between two kinds of motion: external (being moved by something else) and internal (self-moved, the hallmark of living things). Only self-generated motion indicates life.",
        connection: "Aristotle's distinction between natural and forced motion",
      },
      {
        type: "Scientific",
        explanation: "Modern biology defines life by self-organization, metabolism, and reproduction — not mere movement. A machine can move without being alive. Motion is necessary but not sufficient for life.",
        example: "Robots move but aren't alive; crystals grow but aren't living",
      },
      {
        type: "Mystical",
        explanation: "True life comes from the Soul within, not from external forces. A body may be moved by outside influences, but only the indwelling soul gives true life. Distinguish between animation and vitality.",
        connection: "Hermetic concept of ensouled vs. mechanical existence",
      },
    ],
    questions: [
      {
        question: "What is the difference between something that is merely 'moved' and something that is truly 'alive'?",
        context: "This reveals the nature of soul as the source of self-motion",
        hints: [
          "Consider what makes a plant different from a thrown stone — both 'move'",
          "Where does the motion originate — inside or outside?",
          "Life moves itself; non-life is moved by other things",
        ],
      },
      {
        question: "Can artificial intelligence be 'alive' by this definition? What would it need to qualify?",
        context: "A modern application of ancient wisdom about the nature of life",
      },
    ],
    examples: [
      "A falling leaf (moved by wind) vs. a bird in flight (self-propelled)",
      "A clock's hands move but have no life",
      "Ocean waves move endlessly without being alive",
      "A seed moves — grows — from an inner impulse: that's life",
    ],
    relatedAphorisms: [31, 32, 14, 69],
    difficulty: "intermediate",
    tags: ["motion", "life", "soul", "mechanism", "vitality"],
  },

  {
    id: 42,
    text: "Nothing good upon Earth; nothing evil in Heaven.",
    category: "Mind and Reason",
    perspectives: [
      {
        type: "Philosophical",
        explanation: "Good and evil are relative to the realm. Earth, being material and subject to change, cannot contain permanent good. Heaven, being eternal and divine, cannot harbor evil. Perfection belongs above; imperfection below.",
        connection: "Plato's World of Forms vs. world of becoming",
      },
      {
        type: "Mystical",
        explanation: "This is not pessimism about Earth but a call to seek true goodness at its source. What we call 'good' on Earth is always mixed, partial, temporary. The pure Good exists only in the divine realm.",
        connection: "Gnostic dualism (but Hermetic version is more nuanced)",
      },
      {
        type: "Practical",
        explanation: "Stop expecting perfection from the material world. Relationships, careers, health — all earthly goods are impermanent and mixed. True fulfillment comes from connecting to the divine Good.",
        example: "A beautiful day ends; wealth can be lost; youth fades — earthly goods are borrowed",
      },
      {
        type: "Scientific",
        explanation: "Entropy ensures that no physical state of 'goodness' persists. Order decays. All material arrangements are temporary. The laws themselves (Heaven) are eternal and flawless — it's their manifestation that's imperfect.",
        example: "The law of gravity is 'perfect'; but every physical structure it governs will eventually collapse",
      },
    ],
    questions: [
      {
        question: "If 'nothing good' is upon Earth, how should we relate to earthly pleasures and accomplishments?",
        context: "This isn't about rejecting life but reframing expectations",
        hints: [
          "Enjoy earthly things without clinging to them",
          "'Good' here means permanent, absolute Good — not that life is joyless",
          "Use earthly experiences as pointers to the true Good above",
        ],
      },
      {
        question: "What does it mean practically that 'nothing evil is in Heaven'? How does that change your understanding of God?",
        context: "Explores the purity of the divine nature",
      },
    ],
    examples: [
      "A promotion brings joy — then stress, then obsolescence",
      "Spring blooms beautifully — then wilts in summer heat",
      "Mathematical truths never 'go wrong' — they exist in a kind of 'Heaven'",
    ],
    relatedAphorisms: [43, 44, 45, 51, 52],
    difficulty: "intermediate",
    tags: ["good", "evil", "heaven", "earth", "duality"],
  },

  {
    id: 43,
    text: "God is Good; Man is Evil.",
    category: "Mind and Reason",
    perspectives: [
      {
        type: "Philosophical",
        explanation: "This isn't moral condemnation but ontological description. God is pure Being, unchanging, complete — therefore Good. Man is mixed, changeable, incomplete — therefore, compared to God, deficient (evil). Evil here means 'lacking the fullness of Good.'",
        connection: "Augustine's privation theory of evil, Plotinus on emanation",
      },
      {
        type: "Mystical",
        explanation: "Man's 'evil' is his forgetfulness of his divine origin. We are sparks of the divine trapped in matter, and our 'evil' is the distance between what we are and what we could become. The path of Hermetic practice is closing that gap.",
        connection: "Gnostic fall narrative, Hermetic ascent of the soul",
      },
      {
        type: "Practical",
        explanation: "Humility: recognize that all true goodness flows from the divine, not from ego. When you act from your lower nature (greed, anger, ignorance), you're acting from the 'evil' part. When you act from wisdom and love, you're channeling the divine Good.",
        example: "Selfishness (Man's nature) vs. generosity (reflecting God's nature)",
      },
      {
        type: "Scientific",
        explanation: "Entropy (disorder) is the default state of matter — things fall apart naturally. It takes energy (divine input) to create and maintain order (good). Left to its own devices, matter (Man's body) decays.",
        example: "A garden untended reverts to weeds; a body unexercised weakens",
      },
    ],
    questions: [
      {
        question: "If Man is 'evil,' is there hope? Can Man become good?",
        context: "The entire Hermetic path is about transforming Man's nature toward the divine",
        hints: [
          "Hermes wouldn't teach if transformation were impossible",
          "Evil here means 'incomplete' — can incompleteness be overcome?",
          "What is the Hermetic practice of Regeneration all about?",
        ],
      },
      {
        question: "How is evil as 'absence of good' different from evil as an active force?",
        context: "Understanding evil as privation vs. evil as a positive entity",
      },
    ],
    examples: [
      "Darkness isn't a force — it's the absence of light",
      "Ignorance isn't something you 'have' — it's knowledge you lack",
      "Cold isn't a substance — it's less heat",
      "A child isn't 'evil' — just not yet wise",
    ],
    relatedAphorisms: [42, 44, 45, 80],
    difficulty: "advanced",
    tags: ["God", "man", "good", "evil", "privation", "nature"],
  },

  {
    id: 50,
    text: "Time is the corruption of Man.",
    category: "Heaven and Earth",
    perspectives: [
      {
        type: "Physical",
        explanation: "Time literally corrupts the human body — cells age, DNA accumulates damage, organs degrade. Every moment brings us closer to physical death. Time is the mechanism by which material things dissolve.",
        example: "Gray hair, wrinkles, weakening bones — time's visible corruption",
      },
      {
        type: "Philosophical",
        explanation: "Time belongs to the world of becoming, not being. The eternal is outside time. By being 'in time,' Man is subject to change, decay, and death. To transcend corruption, one must connect to the timeless.",
        connection: "Parmenides on Being vs. Becoming, Plato's Timaeus",
      },
      {
        type: "Mystical",
        explanation: "Time keeps Man distracted — always looking forward or backward, never resting in the eternal Now. The mystic practices presence to step outside time's corruption and touch eternity.",
        connection: "Eckhart Tolle's 'Power of Now,' Zen 'eternal present'",
      },
      {
        type: "Practical",
        explanation: "Don't waste time on what doesn't matter eternally. If time corrupts, then urgency is appropriate — pursue wisdom now. But also: don't let the passage of time create anxiety. Focus on what's timeless.",
        example: "Spend an hour scrolling social media (time corrupts) vs. an hour in meditation (touching the timeless)",
      },
    ],
    questions: [
      {
        question: "If time corrupts Man, is there anything in your experience that time does NOT corrupt?",
        context: "This leads to discovering what is eternal within you",
        hints: [
          "Your body ages, but does your awareness age?",
          "Knowledge can grow with time — is that corruption or refinement?",
          "What you truly are existed before your birth",
        ],
      },
      {
        question: "How would you live differently if you truly understood that time is corrupting you right now?",
        context: "Creates urgency for spiritual practice",
      },
    ],
    examples: [
      "Iron rusts, wood rots, flesh decays — all in time",
      "Languages evolve and die; civilizations rise and fall",
      "Your memories fade and distort over time",
      "Even the sun will eventually burn out",
    ],
    relatedAphorisms: [47, 52, 20, 23, 65],
    difficulty: "intermediate",
    tags: ["time", "corruption", "mortality", "impermanence", "urgency"],
  },

  {
    id: 65,
    text: "The Generation of Man is corruption; the Corruption of Man is the beginning of Generation.",
    category: "Generation and Corruption",
    perspectives: [
      {
        type: "Physical",
        explanation: "Birth leads inevitably to death (corruption). But death makes way for new life — matter is recycled, atoms are reused. Your physical body will become soil that feeds new life. The cycle never stops.",
        example: "Fallen leaves decompose and nourish the soil for new growth",
      },
      {
        type: "Philosophical",
        explanation: "This is the paradox of becoming: creation and destruction are two faces of the same process. Nothing can be born without something else dying. Nothing dies without giving birth to something new. Heraclitus said: 'The way up and the way down are one.'",
        connection: "Heraclitus, Dialectical thinking, Hindu Shiva as creator-destroyer",
      },
      {
        type: "Mystical",
        explanation: "Spiritual rebirth requires the death of the old self. The 'corruption' of your ego, your attachments, your false identity — this is the beginning of your true spiritual generation. You must die to be reborn.",
        connection: "Hermetic Regeneration (Book XIII), Christ's 'die to be born again'",
      },
      {
        type: "Practical",
        explanation: "Every ending is a beginning. Lost job? Opportunity for a new career. Relationship ended? Space for growth. Don't fear corruption/endings — they are the fertile ground for what comes next.",
        example: "Composting: rotting food becomes rich soil for new gardens",
      },
    ],
    questions: [
      {
        question: "Can you identify a 'death' in your life that became the seed of something better?",
        context: "Personal experience of the generation-corruption cycle",
        hints: [
          "Think of a failure that led to growth",
          "A relationship that ended but taught you something essential",
          "A belief you lost that freed you for deeper understanding",
        ],
      },
      {
        question: "If generation IS corruption, does that mean birth is a kind of death? What dies when you are born?",
        context: "Exploring the Hermetic view of incarnation as a 'fall' into matter",
      },
    ],
    examples: [
      "A caterpillar dissolves in the chrysalis to become a butterfly",
      "A forest fire clears old growth, making way for new life",
      "Old skin cells die so new ones can replace them",
      "Stars explode (die) and their matter forms new stars and planets",
    ],
    relatedAphorisms: [60, 61, 63, 64, 20],
    difficulty: "advanced",
    tags: ["generation", "corruption", "cycle", "death", "rebirth", "paradox"],
  },

  {
    id: 80,
    text: "Night follows the Day, and Day the Night.",
    category: "Divine Order",
    perspectives: [
      {
        type: "Physical",
        explanation: "The most observable cycle in nature — Earth's rotation creates the alternation of day and night. This simple fact demonstrates that the cosmos operates in cycles, not straight lines.",
        example: "Every 24 hours, the cycle repeats without fail",
      },
      {
        type: "Philosophical",
        explanation: "Opposites define and require each other. You cannot know day without night, joy without sorrow, life without death. This is the law of polarity — a fundamental Hermetic principle.",
        connection: "Hermetic Principle of Polarity, Taoism's yin-yang, Hegel's dialectic",
      },
      {
        type: "Mystical",
        explanation: "Dark nights of the soul are followed by spiritual dawns. Periods of confusion and doubt (night) prepare you for illumination (day). Trust the cycle — light always returns.",
        connection: "St. John of the Cross 'Dark Night of the Soul'",
      },
      {
        type: "Practical",
        explanation: "Bad times don't last forever — neither do good times. Understanding cycles prevents both despair in darkness and complacency in light. Prepare in the day for the coming night; trust in the night that day will come.",
        example: "Save money in prosperity (day), knowing lean times (night) will come",
      },
    ],
    questions: [
      {
        question: "Are you currently in a 'day' or 'night' period of your life? How does knowing it will change affect how you experience it?",
        context: "Applying cosmic cycles to personal experience",
        hints: [
          "Neither state is permanent",
          "Night isn't punishment — it's rest, gestation, preparation",
          "Can you welcome the night as much as the day?",
        ],
      },
      {
        question: "If day and night are equally necessary, why do we value light over darkness?",
        context: "Challenges the assumption that one pole is 'better'",
      },
    ],
    examples: [
      "Seasons of activity followed by seasons of rest",
      "Economic boom and bust cycles",
      "Breathing in and breathing out — both equally vital",
      "Sleeping and waking — consciousness itself cycles",
    ],
    relatedAphorisms: [14, 47, 64, 73],
    difficulty: "beginner",
    tags: ["cycles", "polarity", "day", "night", "opposites", "rhythm"],
  },
];

// ─── EXAMPLE SCENARIOS (for Example Matcher mode) ─────────────────────────────

export const exampleScenarios: ExampleScenario[] = [
  {
    scenario: "A tree loses its leaves in autumn, stands bare in winter, and blooms again in spring.",
    relatedAphorisms: [15, 65, 80],
    explanations: {
      15: "The tree's physical form changes through seasons — this is the nature of all bodies.",
      65: "The 'death' of leaves (corruption) is the beginning of new growth (generation). The cycle of life and death repeats.",
      80: "Seasons cycle like day and night — dormancy follows growth, growth follows dormancy.",
    },
  },
  {
    scenario: "A child asks 'Why does the sun come back every morning?' and the parent has no answer.",
    relatedAphorisms: [80, 25, 14],
    explanations: {
      80: "Day follows night unfailingly — this is the cosmic order Hermes describes.",
      25: "The child intuits the question of divine order: God first, then World, then Man trying to understand.",
      14: "The sun moves, the Earth moves — everything in the material world is in motion. Only the principle behind it is still.",
    },
  },
  {
    scenario: "A person loses their job and feels devastated, but later finds a career they truly love.",
    relatedAphorisms: [65, 80, 42],
    explanations: {
      65: "The corruption (job loss) became the beginning of generation (new career). Death of one thing births another.",
      80: "The 'night' of unemployment was followed by the 'day' of new purpose. Trust the cycle.",
      42: "Nothing on Earth is permanently good — the 'good' job was temporary. But the loss led to something closer to true fulfillment.",
    },
  },
  {
    scenario: "Scientists discover that the atoms in your body were once inside stars that exploded billions of years ago.",
    relatedAphorisms: [15, 65, 14, 25],
    explanations: {
      15: "Every body is changeable — stellar matter transformed into human bodies over cosmic time.",
      65: "The 'corruption' of stars (supernova) was the 'generation' of elements needed for life. Death births life.",
      14: "All things are moved — atoms journey from star to human across billions of years of motion.",
      25: "First God (the laws of physics), then the World (stars, planets), then Man (arising from stellar dust).",
    },
  },
  {
    scenario: "A meditator sits perfectly still for an hour, yet their heart beats, blood flows, and neurons fire throughout.",
    relatedAphorisms: [14, 30, 15],
    explanations: {
      14: "All things that are moved — even in 'stillness,' the body is in constant motion. Only the awareness observing is truly immovable.",
      30: "The body moves (heart, blood) but the movement of meditation is self-generated — a living thing moves itself.",
      15: "Every body is changeable — even in the meditator's stillness, the body changes moment to moment.",
    },
  },
  {
    scenario: "A wealthy person with every material comfort feels deeply unhappy and empty inside.",
    relatedAphorisms: [42, 43, 26],
    explanations: {
      42: "Nothing good upon Earth — material wealth cannot provide the true Good that the soul seeks.",
      43: "God is Good; Man is Evil — the person's earthly nature (desires, possessions) cannot satisfy the soul's longing for the divine Good.",
      26: "Man exists 'for God' — fulfillment comes from spiritual purpose, not material accumulation. The World is for Man's learning, not Man's hoarding.",
    },
  },
  {
    scenario: "An ancient Roman road, built 2,000 years ago, still exists but is crumbling and overgrown.",
    relatedAphorisms: [15, 50, 14],
    explanations: {
      15: "Every body is changeable — even the most durable structures transform over time.",
      50: "Time is the corruption of Man — and of Man's works. Two thousand years of time have worn down what seemed permanent.",
      14: "All things are moved — the road itself moves, imperceptibly, as weathering reshapes it year by year.",
    },
  },
  {
    scenario: "A parent watches their child take first steps, knowing that this child will one day grow old.",
    relatedAphorisms: [65, 50, 80, 15],
    explanations: {
      65: "Generation (birth, growth) is already corruption — the aging process begins at birth.",
      50: "Time is the corruption of Man — from the first breath, time begins its work.",
      80: "Day follows night — the child's youth (day) will inevitably give way to old age (night), as it must.",
      15: "Every body is changeable — the child's body will transform continuously from infancy to death.",
    },
  },
];

// ─── CONNECTION CLUSTERS (for Concept Connections mode) ───────────────────────

export const connectionClusters: ConnectionCluster[] = [
  {
    title: "The Paradox of Change",
    aphorisms: [14, 15, 21, 22],
    pattern: "These four aphorisms build a logical chain: everything moves → bodies change → what abides is unchangeable → what's unchangeable is eternal. From the observation of change, Hermes leads you to the discovery of the Eternal.",
    insight: "Change is not chaos — it's the proof that something unchanging exists. If everything changed, you'd have no reference point to notice change. The eternal is known through the temporal.",
  },
  {
    title: "The Cosmic Hierarchy",
    aphorisms: [25, 26, 73],
    pattern: "God → World → Man, and The World for Man, Man for God, and The Sum of all is One. These three aphorisms describe a hierarchy that is also a circle: everything flows from One and returns to One.",
    insight: "You are not separate from God or the World — you are the point where the divine becomes aware of itself through creation. The hierarchy is also a unity.",
  },
  {
    title: "Motion and Life",
    aphorisms: [14, 30, 31],
    pattern: "All things move → but not all moving things are alive → yet every living thing IS moved. Movement is necessary for life but not sufficient. What additional quality makes motion become life?",
    insight: "The difference is SELF-motion — the Soul. A living thing moves from within; a dead thing is moved from without. Your ability to choose your own movement is the sign of your soul.",
  },
  {
    title: "Good, Evil, and the Realms",
    aphorisms: [42, 43, 44, 45],
    pattern: "Nothing good on Earth → God is Good, Man is evil → Good is voluntary → Evil is involuntary. Evil isn't a choice — it's the DEFAULT state of material existence. Good requires conscious effort and divine connection.",
    insight: "Evil is passive; good is active. To be 'good' requires choosing to align with the divine. Without that choice, you simply follow material nature — and material nature tends toward corruption.",
  },
  {
    title: "The Cycle of Being",
    aphorisms: [65, 80, 50],
    pattern: "Generation IS corruption → Night follows Day → Time corrupts Man. Together these show that existence is cyclical, not linear, and that time is the mechanism of the cycle.",
    insight: "Don't fight the cycle — understand it. Birth, growth, decay, and death are not enemies but phases of an eternal rhythm. Fighting the cycle creates suffering; understanding it brings wisdom.",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getAphorismById(id: number): AphorismKnowledge | undefined {
  return aphorismDatabase.find(a => a.id === id);
}

export function getAphorismsByCategory(category: string): AphorismKnowledge[] {
  return aphorismDatabase.filter(a => a.category === category);
}

export function getAphorismsByDifficulty(difficulty: AphorismKnowledge['difficulty']): AphorismKnowledge[] {
  return aphorismDatabase.filter(a => a.difficulty === difficulty);
}

export function getRelatedAphorisms(id: number): AphorismKnowledge[] {
  const aphorism = getAphorismById(id);
  if (!aphorism) return [];
  return aphorism.relatedAphorisms
    .map(rid => getAphorismById(rid))
    .filter(Boolean) as AphorismKnowledge[];
}

export const PERSPECTIVE_TYPES: Perspective['type'][] = ['Physical', 'Philosophical', 'Scientific', 'Mystical', 'Practical'];

export const PERSPECTIVE_COLORS: Record<Perspective['type'], string> = {
  Physical: "#87CEEB",      // Cool blue
  Philosophical: "#b088f9", // Purple
  Scientific: "#5bbfba",    // Teal
  Mystical: "#d4af37",      // Gold
  Practical: "#70c896",     // Green
};
