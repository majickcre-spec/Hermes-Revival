import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronDown, ChevronUp, PenLine, Trash2, Type } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";

// ──────────────────────────────────────────────────────
// CONTENT DATA — Dr. John Everard Translation (1650)
// ──────────────────────────────────────────────────────

const theMindContent = {
  title: "The Mind",
  originalTitle: "The Nature of Divine Intelligence",
  source: "Corpus Hermeticum — Books X & XI",
  translationNote: "Dr. John Everard Translation (1650) — From The Divine Pymander",
  introduction: `Books X and XI of the Corpus Hermeticum form a natural pair, both concerned with the nature of Mind (Nous) and its relationship to the soul, the cosmos, and the Divine. Book X, "The Mind to Hermes," presents Mind speaking directly—revealing itself as the very essence of God, the governor of souls, and the liberator from Fate. Book XI, "The Common Mind, to Tat," deepens this teaching through a dialogue on how God, Eternity, the World, Time, and Generation relate to one another, culminating in one of the most ecstatic passages in Western esotericism: the command to "increase thyself unto an immeasurable greatness."

Together they present the Hermetic doctrine that Mind is not merely a faculty of the human being but the very substance of God—the medium through which all creation exists, and the means by which the soul returns to its source. The text presented here preserves the archaic language of Dr. John Everard's 1650 English translation from "The Divine Pymander."`,
  parts: [
    {
      partTitle: "Part I: The Mind to Hermes",
      partSubtitle: "Book X — The Tenth Book of the Corpus Hermeticum",
      partDescription: "Mind speaks directly to Hermes, revealing itself as the essence of God, the healer of souls, and the power that transcends Fate. A dialogue between Hermes and Tat on the nature of Mind, Speech, and the immortality of all things.",
      storagePrefix: "mind-book10",
      sections: [
        {
          heading: "Mind as God's Essence",
          verseRange: "Verses 1–10",
          authenticText: `THE Mind, O Tat, is of the very Essence of God, if yet there be any Essence of God.

2. What kind of Essence that is, he alone knows himself exactly.

3. The Mind therefore is not cut off, or divided from the essentiality of God, but united as the light of the Sun.

4. And this Mind in men, is God, and therefore are some men Divine, and their Humanity is near Divinity.

5. For the good Demon called the Gods, immortal Men, and men mortal Gods.

6. But in the brute Beast, or unreasonable living Wights, the Mind is their Nature.

7. For where there is a Soul, there is the Mind, as where there is Life there is also a Soul.

8. In living Creatures, therefore, that are without Reason, the Soul is Life, void of the operations of the Mind.

9. For the Mind is the Benefactor of the Souls of men, and worketh to the proper Good.

10. And in unreasonable things it co-operateth with the nature of everyone of them, but in men it worketh against their Natures.`,
          studyNotes: `The opening establishes the fundamental Hermetic teaching: Mind is not a human faculty but the very essence of God. It is "united as the light of the Sun"—not separate from its source, but an emanation of it. The famous aphorism from the "good Demon" (Agathos Daimon)—"Gods are immortal Men, and men mortal Gods"—expresses the continuity between human and divine nature. In animals, Mind operates as instinct (nature); only in humans does it work "against their Natures," meaning it opposes the downward pull of bodily passions to draw the soul toward its divine origin.`
        },
        {
          heading: "Mind as Governor of the Soul",
          verseRange: "Verses 11–22",
          authenticText: `11. For the Soul being in the body, is straightway made Evil by Sorrow, and Grief, and Pleasure, or Delight.

12. For Grief and Pleasure, flow like juices from the compound Body, whereinto when the Soul entereth or descendeth, she is moistened and tinctured with them.

13. As many Souls, therefore, as the Mind governeth, or overruleth, to them it shows its own Light, resisting their prepossessions or presumptions.

14. As a good Physician grieveth the Body, prepossessed of a disease, by burning or lancing it for health's sake;

15. After the same manner also the Mind grieveth the Soul, by drawing it out of Pleasure, from whence every disease of the Soul proceedeth.

16. But the Great Disease of the Soul is Atheism, because that opinion followeth to all Evil, and no Good.

17. Therefore, the Mind resisting, it procureth Good to the Soul, as a Physician to the Body.

18. But as many Souls of Men, as do not admit or entertain the Mind for their Governor, do suffer the same thing that the Soul of unreasonable living things.

19. For the Soul being a Co-operator with them, permits or leaves them to their concupiscences, whereunto they are carried by the torrent of their Appetite, and so tend to brutishness.

20. And as brute Bests, they are angry without reason, and they desire without reason, and never cease, nor are satisfied with evil.

21. For unreasonable Angers and Desires are the most exceeding Evils.

22. And therefore hath God set the Mind over there, as a Revenger and Reprover of them.`,
          studyNotes: `The metaphor of Mind as physician is central to this passage. The soul, upon entering the body, is "moistened and tinctured" by grief and pleasure—stained by the emotional substances of embodiment. Mind functions like a surgeon: its healing may be painful, but it draws the soul out of the pleasure from which "every disease of the Soul proceedeth." The "Great Disease"—Atheism—is not mere intellectual disbelief but the soul's fundamental disconnection from its divine source. Those who refuse Mind's governance descend to the level of "brute Beasts," ruled by appetite without reason.`
        },
        {
          heading: "Fate and the Mind's Freedom",
          verseRange: "Verses 23–46",
          authenticText: `23. Tat. Here, O Father, that discourse of Fate of Destiny, which thou madest to me, is in danger of being overthrown; for if it be fatal for any man to commit Adultery or Sacrilege, or do any evil, he is punished also, though he, of necessity, do the work of the Fate or Destiny.

24. Herm. All things, O Son, are the work of Fate, and without it can no bodily thing, either Good or Evil, be done.

25. For it is decreed by Fate, that he that doth any evil, should also suffer for it.

26. And therefore he doth it, that he may suffer that which he suffereth because he did it.

27. But for the present, let alone that speech, concerning Evil and Fate, for at other times we have spoken of it.

28. Now, our discourse is about the Mind, and what it can do, and how it differs, and is in men such a one, but in brute Beasts changed.

29. And again in brute Beasts it is not beneficial, but in men by quenching both their Anger and Concupiscences.

30. And of man, thou must understand, some to be rational, or governed by reason, and some irrational.

31. But all men are subject to Fate, and to Generation, and Change, for these are the beginning and end of Fate or Destiny.

32. And all men suffer those things that are decreed by Fate.

33. But rational men, over whom, as we said, the mind bears rule, do not suffer like unto other men; but being free from viciousness, and being not evil, they do suffer evil.

34. Tat. How sayest thou this again, Father? An Adulterer, is he not evil? A Murderer, is he not evil? and so of others.

35. Herm. But the rational man, O Son, will not suffer for Adultery, but as the Adulterer not for Murder, but as the Murderer.

36. And it is impossible to escape the Quality of change as of Generation, but the Viciousness, he that hath the Mind, may escape.

37. And therefore, O Son, I have always heard the good Demon say, and if he had delivered it in writing, he had much profited all mankind. For he alone, O Son, as the first born, God seeing all things, truly spake Divine words. I have heard him sometimes, That all things are one thing, especially intelligible Bodies, or that all especially intelligible Bodies are one.

38. We live in Power, in Act, and in Eternity.

39. Therefore, a good mind is that which the soul of him is.

40. And if this be so, then no intelligible thing differs from intelligible things.

41. As, therefore, it is possible that the Mind, the Prince of all things; so likewise, that the soul that is of God, can do whatsoever it will.

42. But understand thou well, for this Discourse I have made to the Question which thou askest of me before, I mean concerning Fate and the Mind.

43. First, if, O Son, thou shalt diligently withdraw thyself from all contentious speeches, thou shalt find that in Truth, the Mind, the Soul of God bears rule over all things, both over Fate, and Law, and all other things.

44. And nothing is impossible to him, no, not of the things that are of Fate.

45. Therefore, though the Soul of Man be above it, let it not neglect the things that happen to be under Fate.

46. And these, thus far, were the excellent sayings of the good Demon.`,
          studyNotes: `Tat raises the most pressing objection to the Hermetic system: if Fate governs all things, how can anyone be held responsible for evil? Hermes' answer is subtle: Fate operates within the bodily realm, and within that realm, cause and consequence are inescapable. But Mind transcends Fate. The rational person—the one governed by Mind—still experiences the consequences of action, but is freed from "viciousness," the inner corruption that binds the soul. The invocation of the "good Demon" (Agathos Daimon) emphasizes the authority of this teaching: "the Mind, the Soul of God bears rule over all things, both over Fate, and Law, and all other things." Freedom from Fate is not escape from consequence but awakening to a dimension of being where Fate has no jurisdiction.`
        },
        {
          heading: "Passion and the Incorporeal",
          verseRange: "Verses 47–59",
          authenticText: `47. Tat. Most divinely spoken, O Father, and truly and profitably, yet clear this one thing unto me.

48. Thou sayest, that in brute Beasts the Mind worketh or acteth after the manner of Nature, co-operating also with their inclinations.

49. Now, the impetuous inclinations of brute Beasts, as I conceive, are Passions. If, therefore, the Mind do co-operate with these impetuous Inclinations, and that they are the Passions in brute Beasts, certainly the Mind is also a Passion, conforming itself to Passions.

50. Herm. Well done, Son, thou askest nobly, and yet it is just that I should answer thee.

51. All incorporeal things, O Son, that are in the Body, are passible, nay, they are properly Passions.

52. Everything that moveth is incorporeal; everything that is moved is a Body; and it is moved into the Bodies by the Mind. Now, Motion is passion, and there they both suffer; as well that which moveth, as that which is moved, as well that which ruleth, as that which is ruled.

53. But being freed from the Body, it is freed likewise from Passion.

54. But especially, O Son, there is nothing impassible, but all things are passible.

55. But Passion differs from that which is passible; for that (Passion) acteth, but this suffers.

56. Bodies also of themselves do act; for either they are unmoveable, or else are moved; and which soever it be, it is a Passion.

57. But incorporeal things do always act, or work, and therefore they are passible.

58. Let not, therefore, the appellations or names trouble thee, for Action and Passion are the same thing, but that it is not grievous to use the more honorable name.

59. Tat. O Father, thou hast delivered this discourse most plainly.`,
          studyNotes: `Tat raises a sophisticated philosophical objection: if Mind cooperates with the passions of animals, doesn't that make Mind itself a passion? Hermes' response redefines the terms entirely. Everything in the body is "passible"—subject to being acted upon. But passion and passibility are not the same: passion acts, passibility suffers. The key insight is that "Action and Passion are the same thing"—they are two names for the same reality seen from different perspectives. Mind is never truly passive; even when it cooperates with bodily inclinations, it acts. Freed from the body, it is freed from passion entirely. This is not abstract philosophy but a map of liberation: the soul's freedom lies in recognizing that its true nature is pure action, not reaction.`
        },
        {
          heading: "Mind and Speech as Divine Gifts",
          verseRange: "Verses 60–69",
          authenticText: `60. Herm. Consider this also, O Son, that God hath freely bestowed upon man, above all other living things, these two, to wit, Mind and Speech, or Reason, equal to immortality.

61. These, if any man use, or employ upon what he ought, he shall differ nothing from the Immortals.

62. Yea, rather going out of the Body, he shall be guided and led by them, both into the Choir and Society of the Gods, and blessed ones.

63. Tat. Do not other living creatures use speech, O Father?

64. Herm. No, Son, but only voice. Now, speech and voice do differ exceeding much; for speech is common to all men, but voice is proper unto every kind of living thing.

65. Tat. Yea, but the Speech of men is different, O Father; every man according to his Nation.

66. Herm. It is true, O Son, they do differ: yet as Man is one, so is Speech one also, and it is interpreted and found the same, both in Egypt, Persia, and Greece.

67. But thou seemest unto me, Son, to be ignorant of the Vertue, or Power and greatness of Speech.

68. For the blessed God, the good Demon said or commanded the Soul to be in the Body, the Mind in the Soul, the Word, or Speech, or Reason in the Mind, and the Mind in God, and that God is the Father of them all.

69. Therefore, the Word is the Image of the Mind, and the Mind of God, and the Body of the Idea, and the Idea of the Soul.`,
          studyNotes: `Mind and Speech (Logos) are humanity's two gifts "equal to immortality." Used rightly, they guide the soul after death "into the Choir and Society of the Gods." The distinction between voice (which all creatures possess) and speech (unique to humans) is crucial. Despite the diversity of languages—Egyptian, Persian, Greek—Speech itself is one, because it derives from the one Mind. Verse 68 presents the great chain of containment: Soul in Body, Mind in Soul, Word in Mind, Mind in God. And verse 69 gives the chain of images: Word is the image of Mind, Mind is the image of God. To speak truly is therefore to participate in the divine creative power itself.`
        },
        {
          heading: "The Chain of Being",
          verseRange: "Verses 70–79",
          authenticText: `70. Therefore, of the Matter, the subtilest or smallest part is Air, of the Air the Soul, of the Soul the Mind, of the Mind God.

71. And God is about all things, and through all things, but the Mind about the Soul, the Soul about the Air, and the Air about the Matter.

72. But Necessity, and Providence, and Nature, are the Organs or Instruments of the World, and of the Order of Matter.

73. For of those things that are intelligible, everyone is; but the essence of them is Identity.

74. But of the Bodies of the whole, or universe, every one is many things.

75. For the Bodies that are put together, and that have, and make their changes into other, having this Identity, do always and preserve the incorruption of the Identity.

76. But in every one of the compound Bodies there is a Number.

77. For without Number it is impossible there should be consistence or constitution, or composition, or dissolution.

78. But Unities do both beget and increase Numbers, and again being dissolved, come into themselves.

79. And the Matter is One.`,
          studyNotes: `This passage maps the ascending chain of subtlety: Matter → Air → Soul → Mind → God. Each level encompasses and permeates the one below it. God is "about all things, and through all things"—simultaneously transcendent and immanent. The three "Instruments" of the World—Necessity, Providence, and Nature—govern the material order. The teaching on Number is significant: every compound body has a Number (its mathematical structure), and "without Number it is impossible there should be consistence." Yet the Unities that generate Number return to themselves when dissolved—an early expression of the principle that multiplicity arises from and returns to unity. "The Matter is One"—beneath all apparent diversity, substance is singular.`
        },
        {
          heading: "Nothing is Dead in God's World",
          verseRange: "Verses 80–104",
          authenticText: `80. But this whole World, the great God, and the Image of the Greater, and united unto him, and concerning the Order, and Will of the Father, is the fulness of Life.

81. And there is nothing therein, through all the Eternity of the Revolution, neither of the whole, nor of the parts which doth not live.

82. For there is nothing dead, that either hath been, or is, or shall be in the World.

83. For the Father would have it, as long as it lasts, to be a living thing; and therefore it must needs be God also.

84. How, therefore, O Son, can there be in God in the image of the Universe, in the fulness of Life, any dead things?

85. For dying is Corruption, and corruption is destruction.

86. How, then, can any part of the incorruptible be corrupted, or of God be destroyed?

87. Tat. Therefore, O Father, do not the living things in the World die, though they be parts thereof?

88. Herm. Be wary in thy speech, O Son, and not deceived in the names of things.

89. For they do not die, O Son, but as Compound bodies they are dissolved.

90. But dissolution is not death; and they are dissolved, not that they may be destroyed, but that they may be made new.

91. Tat. What, then, is the operation of Life? Is it not Motion?

92. Herm. And what is there in the World unmoveable? Nothing at all, O Son.

93. Tat. Why, doth not the Earth seem immoveable to thee, O Father?

94. Herm. No, but subject to many Motions, though after a manner, it alone be stable.

95. What a ridiculous thing it were that the nurse of all things should be immoveable which beareth and bringeth forth all things.

96. For it is impossible that anything that bringeth forth, should bring forth without Motion.

97. And a ridiculous question it is, whether the fourth part of the whole, be idle; for the word immoveable, or without motion, signifies nothing else, but idleness.

98. Know generally, O Son, that whatsoever is in the World is moved either according to Augmentation or Diminution.

99. But that which is moved, liveth also, yet it is not necessary that a living thing should be or continue the same.

100. For while the whole world is together, it is unchangeable, O Son, but all the parts thereof are changeable.

101. Yet nothing is corrupted or destroyed, and quite abolished, but the names trouble men.

102. For Generation is not Life, but Sense, neither is Change Death, but Forgetfulness, or rather Occultation, and lying hid. Or better thus:--

103. For Generation is not a Creation of Life, but a production of things to Sense, and making them manifest. Neither is Change Death, but an Occultation of hiding of that which was.

104. These things being so, all things are Immortal, Matter, Life, Spirit, Soul, Mind, whereof every living thing consisteth.`,
          studyNotes: `One of the most radical passages in the Hermetic corpus. "There is nothing dead, that either hath been, or is, or shall be in the World." The World itself is "the fulness of Life," an image of God and therefore necessarily alive in every part. Tat's natural objection—don't things die?—receives a transformative answer: "Be wary in thy speech, O Son, and not deceived in the names of things." What we call death is dissolution, and dissolution is not destruction but renewal: "they are dissolved, not that they may be destroyed, but that they may be made new." Even the Earth, which seems immovable, is "subject to many Motions." The passage climaxes in the great redefinition: "Generation is not Life, but Sense... Change is not Death, but Forgetfulness, or rather Occultation." All things—Matter, Life, Spirit, Soul, Mind—are immortal.`
        },
        {
          heading: "Understanding God",
          verseRange: "Verses 105–128",
          authenticText: `105. Every living thing therefore is Immortal, because of the Mind, but especially Man, who both receiveth God, and converseth with him.

106. For with this living wight, alone is God familiar; in the night by dreams, in the day by Symbols or Signs.

107. And by all things doth he foretell him of things to come, by Birds, by Fowls, by the Spirit, or Wind, and by an Oak.

108. Wherefore, also, Man professeth to know things that have been, things that are present, and things to come.

109. Consider this also, O Son, that every other living Creature goeth upon one part of the World, Swimming things in the Water, Land wights upon the Earth, Flying Fowls in the Air.

110. But Man useth all these, the Earth, the Water, the Air, and the Fire, nay, he seeth and toucheth Heaven by his senses.

111. But God is both about all things, and through all things, for he is both Act and Power.

112. And it is no hard thing, O Son, to understand God.

113. And if thou wilt also see him, look upon the Necessity of things that appear, and the Providence of things that have been, and are done.

114. See the Matter being most full of Life, and so great a God moved, with all good, and Fair, both Gods, and Demons, and Men.

115. Tat. But these, O Father, are wholly Acts, or Operations.

116. Herm. If they be, therefore, wholly acts or operations, O Son, by whom are they acted or operated, but by God?

117. Or art thou ignorant, that as parts of the World, are Heaven, and Earth, and Water, and Air; after the same manner, the Members of God, are Life, and Immortality, and Eternity, and Spirit, and Necessity, and Providence, and Nature, and Soul, and Mind, and the Continuance or Perseverance of all these which is called Good.

118. And there is not anything of all that hath been, and all that is, where God is not.

119. Tat. What, in Matter, O Father?

120. Herm. The Matter, Son, what is it without God, that thou shouldst ascribe a proper place to it?

121. Or what dost thou think it to be? Peradventure, some heap that is not actuated or operated.

122. But if it be actuated, by whom is it actuated? for we have said, that Acts or Operations, are the parts of God.

123. By whom are all living things quickened? and the Immortal, by whom are they immortalized? the things that are changeable, by whom are they changed?

124. Whether thou speak of Matter or Body, or Essence, know that all these are Acts of God.

125. And that the Act of Matter is materiality, and of the Bodies corporality, and of essence essentiality, and this is God the whole.

126. And in the whole, there is nothing that is not God.

127. Wherefore, about God, there is neither Greatness, Place, Quality, Figure, or time, for he is All, and the All, through all, and about all.

128. This Word, O Son, worship and adore. And the only service of God, is not to be evil.`,
          studyNotes: `The closing movement of Book X ascends from humanity's unique position to the direct knowledge of God. Humanity alone among creatures "receiveth God, and converseth with him"—in dreams, in signs, in divination. While fish swim in water and birds fly in air, "Man useth all these, the Earth, the Water, the Air, and the Fire, nay, he seeth and toucheth Heaven by his senses." Hermes' declaration that "it is no hard thing to understand God" is not casualness but confidence: if you see the necessity and providence operating in all things, you see God. The climax arrives at verse 126: "In the whole, there is nothing that is not God." The final verse delivers the practical teaching with stunning simplicity: "This Word, O Son, worship and adore. And the only service of God, is not to be evil."`
        },
      ],
      keyThemes: [
        {
          theme: "Mind as Divine Substance",
          explanation: "Mind is not a human faculty but the very essence of God, 'united as the light of the Sun.' In humans, Mind is literally God operating within mortal form."
        },
        {
          theme: "Mind as Physician of the Soul",
          explanation: "Mind heals the soul as a physician heals the body—sometimes painfully. The 'Great Disease of the Soul is Atheism,' the disconnection from divine awareness."
        },
        {
          theme: "Freedom from Fate",
          explanation: "Though all bodily things are subject to Fate, 'the Mind, the Soul of God bears rule over all things, both over Fate, and Law, and all other things.' Mind transcends determinism."
        },
        {
          theme: "Mind and Speech Equal Immortality",
          explanation: "God bestowed Mind and Speech upon humanity 'equal to immortality.' Used rightly, they guide the soul after death into 'the Choir and Society of the Gods.'"
        },
        {
          theme: "Nothing is Dead",
          explanation: "Death is dissolution, not destruction. 'They are dissolved, not that they may be destroyed, but that they may be made new.' All things—Matter, Life, Spirit, Soul, Mind—are immortal."
        },
        {
          theme: "God is All",
          explanation: "'In the whole, there is nothing that is not God.' The only service of God is not to be evil—ethics and theology are one."
        },
      ]
    },
    {
      partTitle: "Part II: The Common Mind, to Tat",
      partSubtitle: "Book XI — The Eleventh Book of the Corpus Hermeticum",
      partDescription: "The Mind instructs Hermes on the great chain — God, Eternity, the World, Time, Generation — and reveals that God is present in all things, culminating in the ecstatic command to 'increase thyself unto an immeasurable greatness.'",
      storagePrefix: "mind-book11",
      sections: [
        {
          heading: "The Chain of Being: God, Eternity, World, Time, Generation",
          verseRange: "Verses 1–36",
          authenticText: `FORBEAR thy Speech, O Hermes Trismegistus, and call to mind to those things that are said; but I will not delay to speak what comes into my mind, sithence many men have spoken many things, and those very different, concerning the Universe, and Good; but I have not learned the Truth.

2. Therefore, the Lord make it plain to me in this point; for I will believe thee only, for the manifestation of these things.

3. Then said the Mind how the case stands.

4. God and All.

5. God, Eternity, the World, Time, Generation.

6. God made Eternity, Eternity the World, the world Time, and Time Generation.

7. Of God, as it were, the Substance, is the Good, the Fair, Blessedness, Wisdom.

8. Of Eternity, Identity, or Selfness.

9. Of the World, Order.

10. Of Time, Change.

11. Of Generation, Life and Death.

12. But the Operation of God, is Mind and Soul.

13. Of Eternity, Permanence, or Long-lasting, and Immortality.

14. Of the World, Restitution, and Decay, or Destruction.

15. Of Time, Augmentation and Diminution.

16. And of Generation qualities.

17. Therefore, Eternity is in God.

18. The World in Eternity.

19. Time in the World.

20. And Generation in Time.

21. And Eternity standeth about God.

22. The World is moved in Eternity.

23. Time is determined in the World.

24. Generation is done in Time.

25. Therefore, the Spring and Fountain of all things is God.

26. The Substance Eternity.

27. The Matter is the World.

28. The Power of God is Eternity.

29. And the Work of Eternity, is the World not yet made, and yet ever made by Eternity.

30. Therefore, shall nothing be at any time destroyed, for Eternity is incorruptible.

31. Neither can anything perish, or be destroyed in the World, the World being contained and embraced by Eternity.

32. But what is the Wisdom of God? Even the Good and the Fair, and Blessedness, and every Virtue, and Eternity.

33. Eternity, therefore, put into the Matter Immortality and Everlastingness; for the Generation of that depends upon Eternity, even as Eternity doth of God.

34. For Generation and Time, in Heaven and in Earth, are of a double Nature; in Heaven they are unchangeable and incorruptible; but on Earth they are changeable and corruptible.

35. And the Soul of Eternity is God; and the Soul of the World, Eternity; and of the Earth, Heaven.

36. God is in the Mind, the Mind in the Soul, the Soul in the Matter, all things by Eternity.`,
          studyNotes: `The opening of Book XI presents the great metaphysical chain in its purest form. Five levels of reality cascade from the divine source: God → Eternity → World → Time → Generation. Each has its own substance (Good, Identity, Order, Change, Life/Death), its own operation (Mind and Soul, Permanence, Restitution, Augmentation, Qualities), and each contains the level below it while being contained by the level above. "The World not yet made, and yet ever made by Eternity" — the cosmos is simultaneously incomplete and perpetually complete, always becoming and always being. Verse 36 gives the chain of interiority: "God is in the Mind, the Mind in the Soul, the Soul in the Matter, all things by Eternity." This is the map of the soul's journey inward: from Matter to Soul to Mind to God.`
        },
        {
          heading: "God is Not Idle",
          verseRange: "Verses 37–51",
          authenticText: `37. All this Universal Body, in which are all Bodies, is full of Soul, the Soul full of Mind, the Mind full of God.

38. For within he fills them, and without he contains them, quickening the Universe.

39. Without, he quickens this perfect living thing the World, and within all living Creatures.

40. And above in Heaven he abides in Identity or Selfness, but below upon Earth he changeth Generation.

41. Eternity comprehendeth the World either by necessity, or Providence, or Nature.

42. And if any man shall think any other thing, it is God that actuateth, or operateth this All.

43. But the operation or Act of God, is Power insuperable, to which none may compare anything, either Humane or Divine.

44. Therefore, O Hermes, think none of these things below, or the things above, in anywise like unto God; for if thou dost, thou errest from the Truth.

45. For nothing can be like the unlike, and only, and One; nor mayest thou think that he hath given of his Power to any other thing.

46. For who after him can make anything, either of Life or Immortality: of Change or of Quality? and himself, what other things should he make?

47. For God is not idle, for then all things would be idle; for all things are full of God.

48. But there is not anywhere in the World, such a thing as Idleness; for Idleness is a name that implieth a thing void or empty, both of a Doer, and a thing done.

49. But all things must necessarily be made or done both always, and according to the nature of every place.

50. For he that maketh or doth, is in all things, yet not fastened or comprehended in anything; nor making or doing one thing, but all things.

51. For being an active or operating Power, and sufficient of himself for the things that are made, and the things that are made are under him.`,
          studyNotes: `"All this Universal Body, in which are all Bodies, is full of Soul, the Soul full of Mind, the Mind full of God." This is the Hermetic vision of a cosmos saturated with divine presence at every level. God fills all things from within and contains them from without. The teaching that "God is not idle" is not merely a theological claim but a statement about the nature of reality itself: if God ceased to act, all things would cease to exist, because "all things are full of God." There is no idleness anywhere because idleness would imply a void—and there is no void. God is "in all things, yet not fastened or comprehended in anything"—present everywhere, limited nowhere. This is radical omnipresence: not a God who watches from afar, but a God who is the very activity of existence.`
        },
        {
          heading: "The Seven Worlds and Cosmic Order",
          verseRange: "Verses 52–60",
          authenticText: `52. Look upon, through me, the World is subject to thy sight, and understand exactly the Beauty thereof.

53. A Body perpetual, than the which there is nothing more ancient, yet always vigorous and young.

54. See also the Seven Worlds set over us, adorned with an everlasting order, and filling Eternity with a different course.

55. For all things are full of Light, but the Fire is nowhere.

56. For the friendship and commixture of contraries and unlike, become Light shining from the Act or Operation of God, the Father of all Good, the Prince of all Order, and the Ruler of the Seven Worlds.

57. Look also upon the Moon, the forerunner of them all, the Instrument of Nature, and which changeth the matter here below.

58. Behold the Earth the middle of the Whole, the firm and stable Foundation of the Fair World, the Feeder and Nurse of Earthly things.

59. Consider, moreover, how great the multitude is of immortal living things, and of mortal ones also; and see the Moon going about in the midst of both, to wit, of things immortal and mortal.

60. But all things are full of Soul, and all things are properly moved by it; some things about the Heaven, and some things about the Earth; and neither of those on the right hand to the left; nor those on the left hand to the right; nor those things that are above, downward; nor those things that are below, upwards.`,
          studyNotes: `The Mind invites contemplation of the cosmic order itself. The World is "always vigorous and young"—perpetually ancient and perpetually new. The Seven Worlds (the planetary spheres) are "adorned with an everlasting order," each filling Eternity with its own distinct course. The remarkable statement that "all things are full of Light, but the Fire is nowhere" points to the paradox that divine light is not physical fire but something more fundamental—the very visibility and intelligibility of the cosmos. The Moon stands "in the midst of both, to wit, of things immortal and mortal," marking the boundary between the heavenly and earthly realms. Everything moves according to its proper nature and direction, maintaining the cosmic order.`
        },
        {
          heading: "The One God",
          verseRange: "Verses 61–87",
          authenticText: `61. And that all these things are made, O beloved Hermes, thou needst not learn of me.

62. For they are Bodies, and have a Soul, and are moved.

63. And that all these should come together into one, it is impossible without something to gather them together.

64. Therefore, there must be some such one, and he altogether One.

65. For seeing that the motions are divers, and many, and the Bodies not alike, and yet one ordered swiftness among them all; It is impossible there should be two or more Makers.

66. For one order is not kept by many.

67. But in the weaker there would be jealousy of the stronger, and thence also contentions.

68. And if there were one Maker, of mutable mortal living Wights, he would desire also to make immortal ones, as he that were the Maker of immortal ones, would do to make mortal.

69. Moreover, also, if there were two, the Matter of being one, who should be chief, or have the disposing of the future?

70. Or if both of them, which of them the greater part?

71. But think thus that every living Body hath its consistence of Matter and Soul; and of that which is immortal, and that which is mortal and unreasonable.

72. For all living Bodies have a Soul; and those things that are not living, are only matter by itself.

73. And the Soul likewise of itself drawing near her Maker, is the cause of Life and Being, and Being the cause of Life is, after a manner, the cause of immortal things.

74. How then are mortal Wights other from immortal?

75. Or how cannot he make living Wights, that causeth immortal things and immortality?

76. That there is some Body that doth these things it is apparent, and that he is also one, it is most manifest.

77. For there is one Soul, one Life, and one Matter.

78. Who is this? who can it be, other than the One God?

79. For whom else can it benefit to make living things, save only God alone?

80. There is therefore One God.

81. For it is a ridiculous thing to confess the World to be one, one Sun, one Moon, one Divinity, and yet to have, I know not how many gods.

82. He therefore being One, doth all things in many things.

83. And what great thing is it for God, to make Life, and Soul, and Immortality, and Change, when thyself dost so many things?

84. For thou both seest, speaketh, and hearest, smellest, tastest, and touchest, walkest, understandest, and breathest.

85. And it is not one that sees, and another that heareth, and another that speaketh, and another that toucheth, and another that smelleth, and another that walketh, and another that understandeth, and another that breatheth; but one that doth all these things.

86. Yet neither can these things possibly be without God.

87. For as thou, if thou shouldest cease from doing these things, were not a living wight, so if God should cease from those, he were not (which is not lawful to say) any longer God.`,
          studyNotes: `This extended argument for divine unity is remarkable for its combination of logical rigor and devotional intensity. The argument proceeds: the diversity of cosmic motions yet unified order implies a single Maker. Multiple makers would produce rivalry and disorder—"one order is not kept by many." The analogy to human experience is striking: you see, hear, speak, taste, touch, walk, understand, and breathe—yet you are one being, not eight separate entities. Just so, God performs all the operations of the cosmos while remaining one. The final verse delivers a stunning reciprocal argument: just as you would cease to be a living creature if you stopped these activities, "so if God should cease from those, he were not any longer God." God's being and God's activity are identical.`
        },
        {
          heading: "All Things as Acts of God",
          verseRange: "Verses 88–103",
          authenticText: `88. For if it be already demonstrated that nothing can be idle or empty, how much more may be affirmed of God?

89. For if there be anything which he doth not do, then is he (if it were lawful to say so) imperfect.

90. Whereas, seeing he is not idle, but perfect, certainly he doth all things.

91. Now give thyself unto me, O Hermes, for a little while, thou shalt the more easily understand, that it is the necessary work of God, that all things should be made or done that are done, or were once done, or shall be done.

92. And this, O best beloved, is Life.

93. And this is the Fair.

94. And this is the Good.

95. And this is God.

96. And if thou will understand this by work also, mark what happens to thyself when thou will generate.

97. And yet this is not like unto him, for he is not sensible of pleasure, for neither hath he any other Fellow Workman.

98. But being himself the only Workman, he is always in the work, himself being that which he doth or maketh.

99. For all things, if they were separate from him, must needs fall and die, as there being no life in them.

100. And again, if all things be living wights, both which are in heaven, and upon earth, and that there be one Life in all things which are made by God, and that is God, then certainly all things are made or done by God.

101. Life is the union of the Mind and the Soul.

102. But death is not the destruction of those things that were gathered together, but a dissolving of the Union.

103. The Image therefore of God, is Eternity; of Eternity, the World; of the World, the Sun: of the Sun, Man.`,
          studyNotes: `The argument reaches its climax: if nothing can be idle or empty, then God—who is the source of all activity—must be perpetually creating. "It is the necessary work of God, that all things should be made or done that are done, or were once done, or shall be done." And this ceaseless creative activity is identified successively: "this is Life... this is the Fair... this is the Good... and this is God." The identification of Life, Beauty, Goodness, and God is complete. Verse 101 offers a precise metaphysical definition: "Life is the union of the Mind and the Soul." Death, correspondingly, is not destruction but "a dissolving of the Union." The chain of images—God → Eternity → World → Sun → Man—places humanity as the final mirror of the divine, the image of an image of an image, yet still participating in the original.`
        },
        {
          heading: "Nothing is Dead — Change is Occultation",
          verseRange: "Verses 104–107",
          authenticText: `104. But the people say, That changing is Death, because the body is dissolved, and the Life goeth into that which appeareth not.

105. By this discourse, my dearest Hermes, I affirm as thou hearest. That the World is changed, because every day part thereof becomes invisible, but that it is never dissolved.

106. And these are the Passions of the World, Revolutions and Occultations, and Revolution is a turning, but Occultation is Renovation.

107. And the World being all formed, hath not the forms lying without it, but itself changeth in itself.`,
          studyNotes: `A concentrated restatement of the doctrine from Book X: what people call death is merely change, and change is not destruction but "Occultation"—a hiding, a becoming invisible. The World changes "because every day part thereof becomes invisible, but it is never dissolved." The two "Passions of the World" are Revolution (turning, cyclical recurrence) and Occultation (renewal through apparent disappearance). Nothing is added from outside or lost to outside—"the World being all formed, hath not the forms lying without it, but itself changeth in itself." All transformation is internal to the whole.`
        },
        {
          heading: "God's Incorporeal Nature",
          verseRange: "Verses 108–127",
          authenticText: `108. Seeing then the World is all formed, what must he be that made it? for without form, he cannot be.

109. And if he be all formed, he will be kept like the World, but if he have but one form, he shall be in this regardless of the world.

110. What do we then say that he is? We will not raise any doubts by our speech, for nothing that is doubtful concerning God is yet known.

111. He hath therefore one Idea, which is proper to him, which, because it is unbodily, is not subject to the sight, and yet shows all forms by the Bodies.

112. And do not wonder if there be an incorruptible Idea.

113. For they are like the Margents of the Speech, which is in writing; for they seem to be high and swelling, but they are by nature smooth and even.

114. But understand well this that I say, more boldly, for it is more true: As man cannot live without life, so neither can God live not doing good.

115. For this is, as it were, the Life and Motion of God, to Move all things, and Quicken them.

116. But some of the things I have said, must have a particular explanation; Understand then what I say.

117. All things are in God, not as lying in a place, for Place is both a body and immoveable, and those things that are placed, have no motion.

118. For they lie otherwise in that which is unbodily, than in the fantasie, or to appearance.

119. Consider him that contains all things, and understand that nothing is more capacious, than that which is incorporeal, nothing more swift, nothing more powerful, but it is most capacious, most swift, and most strong.

120. And judge of this by thyself, command thy Soul to go into India, and sooner than thou canst bid it, it will be there.

121. Bid it likewise pass over the Ocean, and suddenly it will be there; not as passing from place to place, but suddenly it will be there.

122. Command it to fly into Heaven, and it will not need no wings, neither shall anything hinder it, not the fire of the Sun, not the Aether, not the turning of the Spheres, not the bodies of any other Stars, but cutting through all, it will fly up to the last and furthest body.

123. And if thou wilt even break the whole, and see those things that are without the world (if there be anything without), thou mayest.

124. Behold, how great power, how great swiftness thou hast! Canst thou do all these things, and cannot God?

125. After this manner, therefore, contemplate God to have all the whole world to himself, as it were, all thoughts, or intellections.

126. If therefore thou wilt not equal thyself to God, thou canst not understand God.

127. For the like is intelligible by the like.`,
          studyNotes: `The question of God's form leads to a profound paradox: God must have form (since the formless cannot create form), yet cannot be "all formed" like the World (or he would be limited). The resolution: God has "one Idea, which is proper to him, which, because it is unbodily, is not subject to the sight, and yet shows all forms by the Bodies." The most practical passage begins at verse 120: the famous meditation on the soul's instantaneous travel. Command your soul to go to India—it is already there. Bid it cross the ocean, fly to heaven, break through the spheres—"cutting through all, it will fly up to the last and furthest body." This is not metaphor but instruction: the incorporeal nature of thought demonstrates the incorporeal nature of God. "If therefore thou wilt not equal thyself to God, thou canst not understand God. For the like is intelligible by the like."`
        },
        {
          heading: "Increase Thyself unto Immeasurable Greatness",
          verseRange: "Verses 128–141",
          authenticText: `128. Increase thyself unto an immeasureable greatness, leaping beyond every Body, and transcending all Time, become Eternity, and thou shalt understand God: If thou believe in thyself, that nothing is impossible, but accountest thyself immortal, and that thou canst understand all things, every Art, every Science, and the manner and custom of every living thing.

129. Become higher than all height, lower than all depths, comprehend in thyself the qualities of all the Creatures, of the Fire, the Water, the Dry, and Moist, and conceive likewise, that thou canst at once be everywhere, in the Sea, in the Earth.

130. Thou shalt at once understand thyself, not yet begotten in the Womb, young, old, to be dead, the things after death, and all these together, as also times, places, deeds, qualities, quantities, or else thou canst not yet understand God.

131. But if thou shut up thy Soul in the Body, and abuse it, and say, I understand nothing, I can do nothing, I am afraid of the Sea, I cannot climb up to Heaven, I know not who I am, I cannot tell what I shall be: What hast thou to do with God? for thou canst understand none of those Fair and Good things, and be a lover of the body and Evil.

132. For it is the greatest Evil, not to know God.

133. But to be able to know, and to will, and to hope, is the straight way, and Divine way, proper to the Good, and it will everywhere meet thee, and everywhere be seen of thee, plain and easy, when thou dost not expect or look for it; it will meet thee waking, sleeping, sailing, travelling, by night, by day, when thou speakest, and when thou keepest silence.

134. For there is nothing which is not the Image of God.

135. And yet thou sayest, God is invisible; but be advised, for who is more manifest than He?

136. For therefore hath he made all things, that thou by all things mayest see Him.

137. This is the Good of God, this is the Virtue, to appear, and to be seen in all things.

138. There is nothing invisible, no, not of those things that are incorporeal.

139. The Mind is seen in understanding, and God is seen in doing or making.

140. Let these things thus far forth, be made manifest unto thee, O Trismegistus.

141. Understand in like manner, all other things by thyself, and thou shalt not be deceived.`,
          studyNotes: `The most ecstatic passage in the entire Corpus Hermeticum. This is the Hermetic meditation technique in its most extreme and exalted form: "Increase thyself unto an immeasurable greatness, leaping beyond every Body, and transcending all Time, become Eternity." The practitioner is instructed to expand consciousness to encompass all possible states simultaneously—all heights, all depths, all elements, all places, all ages of life including pre-birth and post-death. This is not sequential imagination but simultaneous awareness of everything at once. The counterpart is equally powerful: "if thou shut up thy Soul in the Body, and say, I understand nothing, I can do nothing, I am afraid of the Sea"—this self-limitation is the "greatest Evil." The resolution is breathtaking: "there is nothing which is not the Image of God." God is not invisible but supremely visible—"who is more manifest than He?" The final teaching: "The Mind is seen in understanding, and God is seen in doing or making." To perceive the activity of any created thing is to perceive God.`
        },
      ],
      keyThemes: [
        {
          theme: "The Five-Level Chain",
          explanation: "God → Eternity → World → Time → Generation. Each level has its own substance, operation, and place in the cosmic hierarchy. Each contains the level below it."
        },
        {
          theme: "God is Not Idle",
          explanation: "If God ceased activity, all things would cease to exist. God's being and God's doing are identical. 'All things are full of God.'"
        },
        {
          theme: "The One God",
          explanation: "The diversity of cosmic motions yet unified order proves a single Maker. 'One order is not kept by many.' The World is one, the Sun is one, the Moon is one—therefore God is one."
        },
        {
          theme: "The Speed of the Soul",
          explanation: "Command your soul to India, to the ocean, to heaven—it arrives instantly. This demonstrates the incorporeal nature shared by soul, Mind, and God."
        },
        {
          theme: "Increase Thyself",
          explanation: "The supreme Hermetic meditation: expand awareness beyond body, time, and space. 'Become Eternity, and thou shalt understand God.' The like is intelligible by the like."
        },
        {
          theme: "Nothing is Not the Image of God",
          explanation: "God is not invisible but supremely manifest. 'He hath made all things, that thou by all things mayest see Him.' The Mind is seen in understanding; God is seen in doing."
        },
      ]
    }
  ]
};

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
};

const starFieldBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3CradialGradient id='s'%3E%3Cstop offset='0' stop-color='%23fff' stop-opacity='.6'/%3E%3Cstop offset='1' stop-color='%23fff' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='30' r='1' fill='%23ffffff' opacity='.4'/%3E%3Ccircle cx='180' cy='60' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='320' cy='20' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='90' cy='120' r='.5' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='250' cy='100' r='1' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='370' cy='90' r='.6' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='30' cy='200' r='.8' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='150' cy='180' r='.5' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='280' cy='210' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='390' cy='170' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='70' cy='290' r='.6' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='200' cy='270' r='.8' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='340' cy='300' r='.5' fill='%23ffffff' opacity='.35'/%3E%3Ccircle cx='120' cy='350' r='1' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='260' cy='370' r='.7' fill='%23ffffff' opacity='.3'/%3E%3Ccircle cx='380' cy='340' r='.6' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='45' cy='380' r='.5' fill='%23ffffff' opacity='.15'/%3E%3Ccircle cx='310' cy='150' r='.4' fill='%23ffffff' opacity='.2'/%3E%3Ccircle cx='160' cy='320' r='.6' fill='%23ffffff' opacity='.25'/%3E%3Ccircle cx='220' cy='40' r='.4' fill='%23ffffff' opacity='.15'/%3E%3C/svg%3E")`;

// ──────────────────────────────────────────────────────
// STORAGE
// ──────────────────────────────────────────────────────

const REFLECTION_KEYS = ["mind-book10-reflection", "mind-book11-reflection"] as const;

function storageKey(key: string) {
  return `the-mind-notes-${key}`;
}

function loadAllNotes(): Record<string, string> {
  const notes: Record<string, string> = {};
  for (const k of REFLECTION_KEYS) {
    notes[k] = localStorage.getItem(storageKey(k)) || "";
  }
  return notes;
}

// ──────────────────────────────────────────────────────
// REFLECTION PANEL
// ──────────────────────────────────────────────────────

function ReflectionPanel({
  sectionKey,
  label,
  notes,
  onUpdate,
}: {
  sectionKey: string;
  label: string;
  notes: string;
  onUpdate: (key: string, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((value: string) => {
    localStorage.setItem(storageKey(sectionKey), value);
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 1500);
  }, [sectionKey]);

  const handleChange = (value: string) => {
    onUpdate(sectionKey, value);
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
    <div className="mt-8">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors"
        style={{
          background: `linear-gradient(to right, rgba(212,175,55,0.06), transparent)`,
          border: `1px solid ${celestial.gold}30`,
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
            placeholder={`Reflect on ${label} — what does this teaching illuminate in your understanding?`}
            rows={6}
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

// ──────────────────────────────────────────────────────
// KEY THEMES (collapsible)
// ──────────────────────────────────────────────────────

function KeyThemesPanel({ themes }: { themes: { theme: string; explanation: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="my-12">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 rounded-lg text-sm font-semibold transition-colors"
        style={{
          background: celestial.surface,
          border: `1px solid ${celestial.borderGold}`,
          color: celestial.gold,
          boxShadow: celestial.goldGlow,
        }}
      >
        <span className="font-serif text-lg">Key Themes</span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          {themes.map((t, i) => (
            <div
              key={i}
              className="rounded-lg p-5"
              style={{
                backgroundColor: celestial.bgLight,
                border: `1px solid ${celestial.border}`,
              }}
            >
              <h4 className="font-serif font-semibold mb-2" style={{ color: celestial.gold }}>{t.theme}</h4>
              <p className="font-body text-sm leading-relaxed" style={{ color: `${celestial.text}cc` }}>{t.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────

export default function TheMind() {
  const [fontSize, setFontSize] = useState(18);
  const [notes, setNotes] = useState<Record<string, string>>(loadAllNotes);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const updateNote = useCallback((key: string, value: string) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAllNotes = () => {
    for (const k of REFLECTION_KEYS) {
      localStorage.removeItem(storageKey(k));
    }
    setNotes(loadAllNotes());
    setShowClearConfirm(false);
  };

  const hasAnyNotes = Object.values(notes).some((n) => n.length > 0);

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

          <h3 className="font-serif text-lg font-semibold mb-4" style={{ color: celestial.gold }}>Contents</h3>

          {theMindContent.parts.map((part, pi) => (
            <div key={pi} className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: celestial.textFaint }}>
                {part.partTitle}
              </p>
              <nav className="space-y-1">
                {part.sections.map((sec, si) => (
                  <a
                    key={si}
                    href={`#part-${pi}-section-${si}`}
                    className="block text-xs transition-colors py-1 border-l-2 border-transparent pl-3 leading-snug"
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
                    {sec.heading}
                  </a>
                ))}
              </nav>
            </div>
          ))}

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
                  {theMindContent.title}
                </h1>
                <p className="font-serif italic text-xl" style={{ color: celestial.textMuted }}>
                  {theMindContent.originalTitle}
                </p>
                <p className="text-sm" style={{ color: celestial.textFaint }}>
                  {theMindContent.source}
                </p>
                <p className="text-xs" style={{ color: celestial.goldDim }}>
                  {theMindContent.translationNote}
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
                    {theMindContent.introduction}
                  </p>
                </div>
              </div>

              {/* Parts */}
              {theMindContent.parts.map((part, pi) => (
                <div key={pi} className="mb-20">
                  {/* Part Header */}
                  <div
                    className="text-center mb-12 py-8 rounded-lg"
                    style={{
                      background: `linear-gradient(to right, transparent, rgba(212,175,55,0.06), transparent)`,
                      borderTop: `1px solid ${celestial.borderGold}`,
                      borderBottom: `1px solid ${celestial.borderGold}`,
                    }}
                  >
                    <h2
                      className="font-serif text-3xl md:text-4xl font-bold mb-2"
                      style={{ color: celestial.gold, textShadow: "0 0 20px rgba(212,175,55,0.15)" }}
                    >
                      {part.partTitle}
                    </h2>
                    <p className="font-serif italic text-lg" style={{ color: celestial.textMuted }}>
                      {part.partSubtitle}
                    </p>
                    <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: celestial.textFaint }}>
                      {part.partDescription}
                    </p>
                  </div>

                  {/* Sections */}
                  <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700">
                    {part.sections.map((section, si) => {
                      const sectionId = `part-${pi}-section-${si}`;
                      const isCollapsed = collapsedSections[sectionId] ?? false;

                      return (
                        <section key={si} id={sectionId} className="relative">
                          {/* Section number watermark */}
                          <span
                            className="absolute -left-12 top-0 text-5xl font-serif font-bold select-none hidden md:block"
                            style={{ color: `rgba(212,175,55,0.08)` }}
                          >
                            {si + 1}
                          </span>

                          {/* Heading (clickable to collapse) */}
                          <button
                            onClick={() => toggleSection(sectionId)}
                            className="w-full text-left flex items-center justify-between mb-2 group"
                          >
                            <div>
                              <h3 className="font-serif text-2xl font-semibold" style={{ color: celestial.gold }}>
                                {section.heading}
                              </h3>
                              <span className="text-xs" style={{ color: celestial.textFaint }}>
                                {section.verseRange}
                              </span>
                            </div>
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: celestial.textFaint }} />
                            ) : (
                              <ChevronUp className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: celestial.textFaint }} />
                            )}
                          </button>

                          {!isCollapsed && (
                            <div style={{ fontSize: `${fontSize}px` }}>
                              {/* Authentic Text */}
                              <div
                                className="rounded-lg p-6 my-4 font-serif leading-loose whitespace-pre-line"
                                style={{
                                  backgroundColor: celestial.surface,
                                  border: `1px solid ${celestial.border}`,
                                  borderLeft: `3px solid ${celestial.gold}50`,
                                  color: celestial.text,
                                  boxShadow: `inset 3px 0 12px -4px rgba(212,175,55,0.08)`,
                                }}
                              >
                                <p className="text-xs font-sans uppercase tracking-widest mb-4" style={{ color: celestial.goldDim }}>
                                  From The Divine Pymander — Dr. John Everard Translation (1650)
                                </p>
                                <div className="leading-loose">
                                  {section.authenticText}
                                </div>
                              </div>

                              {/* Study Notes */}
                              <div className="mt-4">
                                <p className="text-xs font-sans uppercase tracking-widest mb-3" style={{ color: celestial.textFaint }}>
                                  Contemporary Understanding
                                </p>
                                <div className="font-body leading-loose text-justify whitespace-pre-line" style={{ color: `${celestial.text}cc`, fontSize: `${Math.max(fontSize - 1, 15)}px` }}>
                                  {section.studyNotes}
                                </div>
                              </div>
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>

                  {/* Key Themes */}
                  <KeyThemesPanel themes={part.keyThemes} />

                  {/* Reflection for this Book */}
                  <ReflectionPanel
                    sectionKey={part.storagePrefix + "-reflection"}
                    label={part.partTitle}
                    notes={notes[part.storagePrefix + "-reflection"] || ""}
                    onUpdate={updateNote}
                  />
                </div>
              ))}

              {/* Navigation Footer */}
              <div className="mt-12 pt-12 flex items-center justify-between" style={{ borderTop: `1px solid ${celestial.border}` }}>
                <Link href="/modules">
                  <Button
                    variant="outline"
                    style={{ borderColor: `${celestial.gold}30`, color: celestial.textMuted }}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Modules
                  </Button>
                </Link>
                <Link href="/reader/seven-governors">
                  <Button
                    style={{ backgroundColor: celestial.gold, color: celestial.bg }}
                  >
                    Seven Governors →
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
