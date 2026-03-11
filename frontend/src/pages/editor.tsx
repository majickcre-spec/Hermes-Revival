import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, RotateCcw, Save, ChevronUp, ChevronDown, Lightbulb, Map, Compass, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Original text of The Divine Pymander (Book 2 in Everard 1650, CH I in modern scholarhsip)
const originalTextChunk = `1. MY THOUGHTS being once seriously busied about things that are, and my Understanding lifted up, all my bodily Senses being exceedingly holden back, as it is with them that are heavy of sleep, by reason either of fulness of meat, or of bodily labour: Methought I saw one of an exceeding great stature, and of an infinite greatness, call me by my name, and say unto me, What wouldst thou hear and see? Or what wouldst thou understand to learn and know?

2. Then said I, Who are Thou? I am, quoth he, Pymander, the mind of the great Lord, the most mighty and absolute Emperor: I know what thou wouldst have, and I am always present with thee.

3. Then I said, I would learn the things that are, and understand the nature of them, and know God. How? said he. I answered that I would gladly hear. Then said he, Have me again in they mind, and whasoever though wouldst learn, I will teach thee.

4. When he had thus said, he was changed in his Idea or Form, and straightway, in the twinkling of an eye, all things were opened unto me. And I saw an infinite sight, all things were become light, both sweet and exceeding pleasant; and I was wonderfully delighted in the beholding it.

5. But after a little while, there was a darkness made in part, coming down obliquely, fearful and hideous, which seemed unto me to be changed into a certain moist nature, unspeakably troubled, which yielded a smoke as from Fire; and from whence proceeded a voice unutterable, and very mournful, but inarticulate, inasmuch as it seemed to have come from the Light.

6. Then from that Light, a certain holy Word joined itself unto Nature, and outflew the pure and unmixed Fire from the moist nature upwards on high; it was exceeding Light, and sharp, and operative withal. And the Air, which was also light, followed the Spirit and mourned up to Fire (from the Earth and the Water), insomuch that it seemed to hang and depend upon it.

7. And the Earth and the Water stayed by themselves so mingled together, that the Earth could not be seen for the Water, but they were moved because of the Spiritual word that was carried upon them.

8. Then said Pymander unto me, Dost thou understand this vision, and what it meaneth? I shall know, said I. Then said he, I am that Light, the Mind, thy God, who am before that moist nature that appeared out of darkness; and that bright and lightful Word from the mind is the Son of God.

9. How is that, quoth I? Thus, replied he, understand it: That which in thee seeth and heareth, the Word of the Lord, and the Mind the Father, God, differ not one from the other; and the union of these is Life.

Trismeg.--I thank thee.

Pimand.--But first conceive well the Light in they mind, and know it.

10. When he had said thus, for a long time we looked steadfastly one upon the other, insomuch that I trembled at his Idea or Form.

11. But when he nodded to me, I beheld in my mind the Light that is in innumerable, and the truly indefinite ornament or world; and that the Fire is comprehended or contained in, or by a great moist Power, and constrained to keep its station.

12. These things I understood, seeing the word, or Pymander; and when I was mightily amazed, he said again unto me, Hast thou seen in thy mind that Archetypal Form which was before the interminated and infinite Beginning? Thus Pymander to me. But whence, quoth I, or whereof are the Elements of Nature made? Pymander.-- Of the Will and counsel of God; which taking the Word, and beholding the beautiful World (in the Archetype thereof) imitated it, and so made this World, by the principles and vital seeds or Soul-like productions of itself.

13. For the Mind being God, Male and Female, Life and Light, brought forth by his Word another Mind or Workman; which being God of the Fire, and the Spirit, fashioned and formed seven other Governors, which in their circles contain the Sensible World, whose Government or disposition is called Fate or Destiny.

14. Straightway leaped out, or exalted itself from the downward Elements of God, The Word of God, into the clean and pure Workmanship of Nature, and was united to the Workman, Mind, for it was Consubstantial; and so the downward born elements of Nature were left without Reason, that they might be the only Matter.

15. But the Workman, Mind, together with the Word, containing the circles, and whirling them about, turned round as a wheel, his own Workmanships; and suffered them to be turned from an indefinite Beginning to an indeterminable end, for they always begin where they end.

16. And the Circulation or running round of these, as the mind willeth, out of the lower or downward-born Elements, brought forth unreasonable or brutish Creatures, for they had no reason, the Air flying things, and the Water such as swim.

17. And the Earth and the Water were separated, either from the other, as the Mind would; and the Earth brought forth from herself, such living creatures as she had, four-footed and creeping beasts, wild and tame.

18. But the Father of all things, the Mind being Life and Light, brought forth Man like unto himself, whom he loved s his proper Birth; for he was all beauteous, having the image of his Father.

19. For indeed God was exceedingly enamoured of his own form or shape, and delivered unto it all his own Workmanships. But he, seeing and understanding the Creation of the Workman in the whole, would needs also himself fall to work, and so was separated from the Father, being in the sphere of Generation or Operation.

20. Having all Power, he considered the Operations or Workmanships of the Seven; but they loved him, and everyone made him partaker of his own order.

21. And he learning diligently, and understanding their Essence, and partaking their Nature, resolved to pierce and break through the Circumference of the Circles, and to understand the power of him that sits upon the Fire.

22. And having already all power of mortal things, of the Living, and of the unreasonable creatures of the World, stooped down and peeped through the Harmony, and breaking through the strength of the Circles, so showed and made manifest the downward-born Nature, the fair and beautiful Shape or Form of God.

23. Which, when he saw, having in itself the unsatiable Beauty, and all the operations of the Seven Governors, and the Form or Shape of God, he smiled for love, as if he had seen the shape or likeness in the Water, or the shadow upon the Earth, of the fairest Human form.

24. And seeing in the Water a Shape, a Shape like unto himself, in himself he loved it, and would cohabit with it, and immediately upon the resolution ensued the operation, and brought forth the unreasonable Image or Shape.

25. Nature presently laying hold of what it so much loved, did wholly wrap herself about it, and they were mingled, for they loved one another.

26. And from this cause Man above all things that live upon earth is double: Mortal, because of his body, and Immortal, because of the substantial Man. For being immortal, and having power of all things, he yet suffers mortal things, and such as are subject to Fate or Destiny.

27. And therefore being above all Harmony, he is made and become a servant to Harmony, he is Hermaphrodite, or Male and Female, and watchful, he is governed by and subjected to a Father, that is both Male and Female, and watchful.

28. After these things, I said, Thou art my mind, and I am in love with Reason.

29. Then said Pymander, This is the Mystery that to this day is hidden and kept secret; for Nature being mingled with man, brought forth a Wonder most Wonderful; for he having the nature of the Harmony of the Seven, from him whom I told thee, the Fire and the Spirit, Nature continued not, but forthwith brought forth seven Men, all Males and Females, and sublime, or on high, according to the Natures of the seven Governors.

30. And after these things, O Pymander, quoth I, I am now come into a great desire and longing to hear; do not digress or run out.

31. But he said, Keep silence, for I have not yet finished the first speech.

32. Trism. Behold, I am silent.

33. Pim. The Generation therefore of these Seven was after this manner:--The Air being Feminine and the Water desirous of Copulation, took from the Fire its ripeness, and from the aether Spirit, and so Nature produced Bodies after the species and shape of men.

34. And man was made of Life and Light, into Soul and Mind; of Life the soul, of Light the Mind.

35. And so all the members of the Sensible World, continued unto the period of the end, bearing rule and generating.

36. Hear now the rest of that speech thou so much desireth to hear.

37. When that period was fulfilled, the bond of all things was loosed and untied by the will of God; for all living Creatures being Hermaphroditical, or Male and Female, were loosed and untied together with man; and so the Males were apart by themselves and the Females likewise.

38. And straightways God said to the Holy Word, Increase in increasing and multiplying in multitude all you my Creatures and Workmanships. And let him that is endued with mind, know himself to be immortal; and that the cause of death is the love of the body, and let him learn all things that are.

39. When he had thus said, Providence by Fate of Harmony, made the mixtures and established the Generations, and all things were multiplied according to their kind. And he that knew himself, came at length to the Superstantial of every way substantial good.

40. But he that thro' the error of Love loved the Body, abideth wandering in darkness, sensible, suffering the things of death.

41. Trism. But why do they that are ignorant, sin so much, that they should therefore be deprived of immortality?

42. Pim. Thou seemest not to have understood what thou hast heard.

43. Trism. Peradventure I seem so to thee; but I both understand and remember them.

44. Pim. I am glad for thy sake if thou understoodest them.

45. Trism. Tell me why are they worthy of death, that are in death?

46. Pim. Because there goeth a sad and dismal darkness before its body; of which darkness is the moist nature, of which moist nature the Body consisteth in the sensible world, from whence death is derived. Has thou understood this aright?

47. Trism. But why, or how doth he that understands himself, go or pass into God?

48. Pim. That which the Word of God said, say I: Because the Father of all things consists of Life and Light, whereof man is made.

49. Trism. Thou sayest very well.

50. Pim. God and the Father is Light and Life, of which Man is made. If therefore thou learn and believe thyself to be of the Life and Light, thou shalt again pass into Life.

51. Trism. But yet tell me more, O my Mind, how I shall go into Life.

52. Pim. God saith, Let man, endued with a mind, mark, consider, and know himself well.

53. Trism. Have not all men a mind?

54. Pim. Take heed what thou sayest, for I the mind come unto men that are holy and good, pure and merciful, and that live piously and religiously; and my presence is a help unto them. And forthwith they know all things, and lovingly they supplicate and propitiate the Father; and blessing him, they give him thanks, and sing hymns unto him, being ordered and directed by filial Affection and natural Love. And before they give up their bodies to the death of them, they hate their senses, knowing their Works and Operations.

55. Rather I that am the Mind itself, will not suffer the operations or Works, which happen or belong to the body, to be finished and brought to perfection in them; but being the Porter or Doorkeeper, I will shut up the entrances of Evil, and cut off the thoughtful desires of filthy works.

56. But to the foolish, and evil, and wicked, and envious, and covetous, and murderous, and profane, I am far off, giving place to the revenging Demon, which applying unto him the sharpness of fire, tormenteth such a man sensible, and armeth him the more to all wickedness, that he may obtain the greater punishment.

57. And such an one never ceaseth, having unfulfiled desires, and unsatisfiable concupiscences, and always fighting in darkness; for the Demon always afflicts and tormenteth him continually, and increaseth the fire upon him more and more.

58. Trism. Thou hast, O Mind, most excellently taught me all things, as I desired; but tell me, moreover, after the return is made, what then?

59. Pim. First of all, in the resolution of the material body, the Body itself is given up to alteration, and the form which it had becometh invisible; and the idle manners are permitted, and left to the Demon, and the senses of the body return into their Fountains, being parts, and again made up into Operations.

60. And Anger, and concupiscence, go into the brutish or unreasonable nature; and the rest striveth upward by Harmony.

61. And to the first Zone it giveth the power it had of increasing and diminishing.

62. To the second, the machinations or plotting of evils, and one effectual deceit or craft.

63. To the third, the idle deceit of Concupiscence.

64. To the fourth, the desire of Rule, and unsatiable Ambition.

65. To the fifth, profane Boldness, and the headlong rashness of confidence.

66. To the sixth, Evil and ineffectual occasions of Riches.

67. To the seventh Zone, subtle Falsehood, always lying in wait.

68. And then being made naked of all the Operations of Harmony, it cometh to the Eighth Nature, having its proper power, and singeth praises to the father with the things that are, and all they that are present rejoice, and congratulate the coming of it; and being made like to them with whom it converseth, it heareth also the Powers that are above the Eighth Nature, singing Praise to God in a certain voice that is peculiar to them.

69. And then in order they return unto the Father, and themselves deliver themselves to the Powers, and becoming Powers they are in God.

70. This is the Good, and to them that know, to be desired.

71. Furthermore, why sayest thou, What resteth, but that understanding all men thou become a guide, and way-leader to them that are worthy; that the kind of Humanity, or Mankind, may be saved by God?

72. When Pymander had thus said unto me, he was mingled among the Powers.

73. But I, giving thanks, and blessing the father of all things, rose up, being enabled by him, and taught the Nature of the Nature of the whole, and having seen the greatest sight or spectacle.

74. And I began to Preach unto men, the beauty and fairness of Piety and Knowledge.

75. O ye people, men, born and made of the earth, which have given yourselves over to drunkenness and sleep, and to the ignorance of God, be sober and cease your surfeit, whereunto you are allured and visited by brutish and unreasonable sleep.

76. And they that heard me come willingly and with one accord; and then I said further:

77. Why, O Men of the Offspring of Earth, why have you delivered yourselves over unto Death, having power to partake of Immortality? Repent and change your minds, you that have together walked in Error, and have been darkened in ignorance.

78. Depart from that dark light, be partakers of Immortality, and leave or forsake corruption.

79. And some of them that heard me, mocking and scorning went away, and delivered themselves up to the way of Death.

80. But others casting themselves down before my feet, besought me that they might be taught; but I, causing them to rise up, became a guide of mankind, teaching them the reasons how, and by what means they may be saved. And I sowed in them the Words of Wisdom, and nourished them with Ambrozian Water of Immortality.

81. And when it was evening and the brightness of the same began wholly to go down, I commanded them to go down, I commanded them to give thanks to God; and when they had finished their thanksgiving, everyone returned to his own lodging.

82. But I wrote in myself the bounty and benevolence of Pymander; and being filled with what I most desired, I was exceedingly glad.

83. For the sleep of the body was the sober watchfulness of the mind; and the shutting of my eyes the true sight, and my silence great with child and full of good; and the pronouncing of my words the blossoms and fruits of good things.

84. And thus it came to pass or happened unto me, which I received from my mind, that is Pymander, the Lord of the Word; whereby I became inspired by God with the Truth.

85. For which cause, with my soul and whole strength, I give praise and blessing unto God the Father.

86. Holy is God, the Father of all things.

87. Holy is God, whose will is performed and accomplished by his own powers.

88. Holy is God, that determineth to be known, and is known by his own, or those that are his.

89. Holy art thou, that by thy Word has established all things.

90. Holy art thou, of whom all Nature is the Image.

91. Holy art thou, whom Nature hath not formed.

92. Holy art thou, that art stronger than all power.

93. Holy art thou, that art stronger than all excellency.

94. Holy art thou, that art better than all praise.

95. Accept these reasonable sacrifices from a pure soul, and a heart that stretched out unto thee.

96. O unspeakable, unutterable, to be praised with silence!

97. I beseech thee, that I may never err from the knowledge of thee; look mercifully upon me, and enable me, and enlighten with this Grace those that are in Ignorance, the brothers of my kind, but thy Sons.

98. Therefore I believe thee, and bear witness, and go into the Life and Light.

99. Blessed art thou, O Father; thy man would be sanctified with thee, as thou hast given him all power.`;

const initialModernDraft = `1. My thoughts were once deeply focused on the nature of reality, and my understanding was lifted up, while my bodily senses were held back—like someone heavy with sleep from too much food or labor. In this state, I saw a Being of enormous stature and infinite greatness call me by name and ask: "What do you wish to hear and see? What do you wish to learn and know?"

2. "Who are you?" I asked.
"I am Pymander," he replied, "the Mind of the Great Lord, the most mighty and absolute Emperor. I know what you seek, and I am always present with you."

3. "I wish to learn the things that are," I said, "to understand their nature, and to know God. How can I do this?"
He answered: "Hold me in your mind, and whatever you wish to learn, I will teach you."

4. As he spoke, his form changed. In the twinkling of an eye, everything opened up to me. I saw an infinite vision: everything became Light—sweet, pleasant, and joyous. I was filled with delight as I beheld it.

5. But after a while, a darkness settled in one part—fearful, hideous, and coiling downwards. It seemed to change into a moist, troubled nature, giving off smoke like fire. From this darkness came an unutterable, mournful sound, like a cry of separation from the Light.

6. Then, from the Light, a Holy Word (Logos) joined with Nature. Pure fire leaped up from the moist nature to the heights—it was light, sharp, and active. The air, being light, followed the spirit and rose up to the fire, seeming to hang from it. But the earth and water remained mingled below, moved only by the spiritual Word carried upon them.

7. Pymander asked: "Do you understand this vision and what it means?"
"I will know," I said.
"I am that Light," he said, "the Mind, your God, who was before the moist nature appeared from the darkness. And the bright Word that came from the Mind is the Son of God."

8. "How is that?" I asked.
"Understand it this way: That which sees and hears in you is the Word of the Lord; and your Mind is God the Father. They are not separate from one another, for their union is Life."
"I thank you," I said.
"First," he said, "conceive well the Light in your mind, and know it."

9. We looked steadfastly at each other for a long time, until I trembled at his form. Then, as he nodded, I beheld in my mind the Light that is innumerable, the truly infinite order of the cosmos. I saw that the fire was contained by a great power and held in its place.

10. I was amazed. Pymander asked: "Have you seen in your mind the Archetypal Form—that which was before the infinite Beginning?"
"But where do the elements of nature come from?" I asked.
"From the Will and Counsel of God," he replied. "Receiving the Word and beholding the beautiful World in the Archetype, the Will imitated it and created this world through its own principles and vital seeds."

11. For the Mind being God, Male and Female, Life and Light, brought forth by his Word another Mind or Workman; which being God of the Fire, and the Spirit, fashioned and formed seven other Governors, which in their circles contain the Sensible World, whose Government or disposition is called Fate or Destiny.

12. Straightway leaped out, or exalted itself from the downward Elements of God, The Word of God, into the clean and pure Workmanship of Nature, and was united to the Workman, Mind, for it was Consubstantial; and so the downward born elements of Nature were left without Reason, that they might be the only Matter.

13. But the Workman, Mind, together with the Word, containing the circles, and whirling them about, turned round as a wheel, his own Workmanships; and suffered them to be turned from an indefinite Beginning to an indeterminable end, for they always begin where they end.

14. And the Circulation or running round of these, as the mind willeth, out of the lower or downward-born Elements, brought forth unreasonable or brutish Creatures, for they had no reason, the Air flying things, and the Water such as swim.

15. And the Earth and the Water were separated, either from the other, as the Mind would; and the Earth brought forth from herself, such living creatures as she had, four-footed and creeping beasts, wild and tame.

16. But the Father of all things, the Mind being Life and Light, brought forth Man like unto himself, whom he loved s his proper Birth; for he was all beauteous, having the image of his Father.

17. For indeed God was exceedingly enamoured of his own form or shape, and delivered unto it all his own Workmanships. But he, seeing and understanding the Creation of the Workman in the whole, would needs also himself fall to work, and so was separated from the Father, being in the sphere of Generation or Operation.

18. Having all Power, he considered the Operations or Workmanships of the Seven; but they loved him, and everyone made him partaker of his own order.

19. And he learning diligently, and understanding their Essence, and partaking their Nature, resolved to pierce and break through the Circumference of the Circles, and to understand the power of him that sits upon the Fire.

20. And having already all power of mortal things, of the Living, and of the unreasonable creatures of the World, stooped down and peeped through the Harmony, and breaking through the strength of the Circles, so showed and made manifest the downward-born Nature, the fair and beautiful Shape or Form of God.

21. Which, when he saw, having in itself the unsatiable Beauty, and all the operations of the Seven Governors, and the Form or Shape of God, he smiled for love, as if he had seen the shape or likeness in the Water, or the shadow upon the Earth, of the fairest Human form.

22. And seeing in the Water a Shape, a Shape like unto himself, in himself he loved it, and would cohabit with it, and immediately upon the resolution ensued the operation, and brought forth the unreasonable Image or Shape.

23. Nature presently laying hold of what it so much loved, did wholly wrap herself about it, and they were mingled, for they loved one another.

24. And from this cause Man above all things that live upon earth is double: Mortal, because of his body, and Immortal, because of the substantial Man. For being immortal, and having power of all things, he yet suffers mortal things, and such as are subject to Fate or Destiny.

25. And therefore being above all Harmony, he is made and become a servant to Harmony, he is Hermaphrodite, or Male and Female, and watchful, he is governed by and subjected to a Father, that is both Male and Female, and watchful.

26. After these things, I said, Thou art my mind, and I am in love with Reason.

27. Then said Pymander, This is the Mystery that to this day is hidden and kept secret; for Nature being mingled with man, brought forth a Wonder most Wonderful; for he having the nature of the Harmony of the Seven, from him whom I told thee, the Fire and the Spirit, Nature continued not, but forthwith brought forth seven Men, all Males and Females, and sublime, or on high, according to the Natures of the seven Governors.

28. And after these things, O Pymander, quoth I, I am now come into a great desire and longing to hear; do not digress or run out.

29. But he said, Keep silence, for I have not yet finished the first speech.

30. Trism. Behold, I am silent.

31. Pim. The Generation therefore of these Seven was after this manner:--The Air being Feminine and the Water desirous of Copulation, took from the Fire its ripeness, and from the aether Spirit, and so Nature produced Bodies after the species and shape of men.

32. And man was made of Life and Light, into Soul and Mind; of Life the soul, of Light the Mind.

33. And so all the members of the Sensible World, continued unto the period of the end, bearing rule and generating.

34. Hear now the rest of that speech thou so much desireth to hear.

35. When that period was fulfilled, the bond of all things was loosed and untied by the will of God; for all living Creatures being Hermaphroditical, or Male and Female, were loosed and untied together with man; and so the Males were apart by themselves and the Females likewise.

36. And straightways God said to the Holy Word, Increase in increasing and multiplying in multitude all you my Creatures and Workmanships. And let him that is endued with mind, know himself to be immortal; and that the cause of death is the love of the body, and let him learn all things that are.

37. When he had thus said, Providence by Fate of Harmony, made the mixtures and established the Generations, and all things were multiplied according to their kind. And he that knew himself, came at length to the Superstantial of every way substantial good.

38. But he that thro' the error of Love loved the Body, abideth wandering in darkness, sensible, suffering the things of death.

39. Trism. But why do they that are ignorant, sin so much, that they should therefore be deprived of immortality?

40. Pim. Thou seemest not to have understood what thou hast heard.

41. Trism. Peradventure I seem so to thee; but I both understand and remember them.

42. Pim. I am glad for thy sake if thou understoodest them.

43. Trism. Tell me why are they worthy of death, that are in death?

44. Pim. Because there goeth a sad and dismal darkness before its body; of which darkness is the moist nature, of which moist nature the Body consisteth in the sensible world, from whence death is derived. Has thou understood this aright?

45. Trism. But why, or how doth he that understands himself, go or pass into God?

46. Pim. That which the Word of God said, say I: Because the Father of all things consists of Life and Light, whereof man is made.

47. Trism. Thou sayest very well.

48. Pim. God and the Father is Light and Life, of which Man is made. If therefore thou learn and believe thyself to be of the Life and Light, thou shalt again pass into Life.

49. Trism. But yet tell me more, O my Mind, how I shall go into Life.

50. Pim. God saith, Let man, endued with a mind, mark, consider, and know himself well.

51. Trism. Have not all men a mind?

52. Pim. Take heed what thou sayest, for I the mind come unto men that are holy and good, pure and merciful, and that live piously and religiously; and my presence is a help unto them. And forthwith they know all things, and lovingly they supplicate and propitiate the Father; and blessing him, they give him thanks, and sing hymns unto him, being ordered and directed by filial Affection and natural Love. And before they give up their bodies to the death of them, they hate their senses, knowing their Works and Operations.

53. Rather I that am the Mind itself, will not suffer the operations or Works, which happen or belong to the body, to be finished and brought to perfection in them; but being the Porter or Doorkeeper, I will shut up the entrances of Evil, and cut off the thoughtful desires of filthy works.

54. But to the foolish, and evil, and wicked, and envious, and covetous, and murderous, and profane, I am far off, giving place to the revenging Demon, which applying unto him the sharpness of fire, tormenteth such a man sensible, and armeth him the more to all wickedness, that he may obtain the greater punishment.

55. And such an one never ceaseth, having unfulfiled desires, and unsatisfiable concupiscences, and always fighting in darkness; for the Demon always afflicts and tormenteth him continually, and increaseth the fire upon him more and more.

56. Trism. Thou hast, O Mind, most excellently taught me all things, as I desired; but tell me, moreover, after the return is made, what then?

57. Pim. First of all, in the resolution of the material body, the Body itself is given up to alteration, and the form which it had becometh invisible; and the idle manners are permitted, and left to the Demon, and the senses of the body return into their Fountains, being parts, and again made up into Operations.

58. And Anger, and concupiscence, go into the brutish or unreasonable nature; and the rest striveth upward by Harmony.

59. And to the first Zone it giveth the power it had of increasing and diminishing.

60. To the second, the machinations or plotting of evils, and one effectual deceit or craft.

61. To the third, the idle deceit of Concupiscence.

62. To the fourth, the desire of Rule, and unsatiable Ambition.

63. To the fifth, profane Boldness, and the headlong rashness of confidence.

64. To the sixth, Evil and ineffectual occasions of Riches.

65. To the seventh Zone, subtle Falsehood, always lying in wait.

66. And then being made naked of all the Operations of Harmony, it cometh to the Eighth Nature, having its proper power, and singeth praises to the father with the things that are, and all they that are present rejoice, and congratulate the coming of it; and being made like to them with whom it converseth, it heareth also the Powers that are above the Eighth Nature, singing Praise to God in a certain voice that is peculiar to them.

67. And then in order they return unto the Father, and themselves deliver themselves to the Powers, and becoming Powers they are in God.

68. This is the Good, and to them that know, to be desired.

69. Furthermore, why sayest thou, What resteth, but that understanding all men thou become a guide, and way-leader to them that are worthy; that the kind of Humanity, or Mankind, may be saved by God?

70. When Pymander had thus said unto me, he was mingled among the Powers.

71. But I, giving thanks, and blessing the father of all things, rose up, being enabled by him, and taught the Nature of the Nature of the whole, and having seen the greatest sight or spectacle.

72. And I began to Preach unto men, the beauty and fairness of Piety and Knowledge.

73. O ye people, men, born and made of the earth, which have given yourselves over to drunkenness and sleep, and to the ignorance of God, be sober and cease your surfeit, whereunto you are allured and visited by brutish and unreasonable sleep.

74. And they that heard me come willingly and with one accord; and then I said further:

75. Why, O Men of the Offspring of Earth, why have you delivered yourselves over unto Death, having power to partake of Immortality? Repent and change your minds, you that have together walked in Error, and have been darkened in ignorance.

76. Depart from that dark light, be partakers of Immortality, and leave or forsake corruption.

77. And some of them that heard me, mocking and scorning went away, and delivered themselves up to the way of Death.

78. But others casting themselves down before my feet, besought me that they might be taught; but I, causing them to rise up, became a guide of mankind, teaching them the reasons how, and by what means they may be saved. And I sowed in them the Words of Wisdom, and nourished them with Ambrozian Water of Immortality.

79. And when it was evening and the brightness of the same began wholly to go down, I commanded them to go down, I commanded them to give thanks to God; and when they had finished their thanksgiving, everyone returned to his own lodging.

80. But I wrote in myself the bounty and benevolence of Pymander; and being filled with what I most desired, I was exceedingly glad.

81. For the sleep of the body was the sober watchfulness of the mind; and the shutting of my eyes the true sight, and my silence great with child and full of good; and the pronouncing of my words the blossoms and fruits of good things.

82. And thus it came to pass or happened unto me, which I received from my mind, that is Pymander, the Lord of the Word; whereby I became inspired by God with the Truth.

83. For which cause, with my soul and whole strength, I give praise and blessing unto God the Father.

84. Holy is God, the Father of all things.

85. Holy is God, whose will is performed and accomplished by his own powers.

86. Holy is God, that determineth to be known, and is known by his own, or those that are his.

87. Holy art thou, that by thy Word has established all things.

88. Holy art thou, of whom all Nature is the Image.

89. Holy art thou, whom Nature hath not formed.

90. Holy art thou, that art stronger than all power.

91. Holy art thou, that art stronger than all excellency.

92. Holy art thou, that art better than all praise.

93. Accept these reasonable sacrifices from a pure soul, and a heart that stretched out unto thee.

94. O unspeakable, unutterable, to be praised with silence!

95. I beseech thee, that I may never err from the knowledge of thee; look mercifully upon me, and enable me, and enlighten with this Grace those that are in Ignorance, the brothers of my kind, but thy Sons.

96. Therefore I believe thee, and bear witness, and go into the Life and Light.

97. Blessed art thou, O Father; thy man would be sanctified with thee, as thou hast given him all power.`;

const initialPrompt = `Contemplate: In this opening vision, Hermes describes a state where his bodily senses were "held back" while his understanding was "lifted up." 

What conditions in your own life create space for deeper understanding? When have you experienced moments where the noise of the senses faded and clarity emerged?`;

const initialMapNotes = `Core Concepts:
• The Primacy of Mind (Pymander = Divine Mind)
• Light and Darkness as primordial forces
• The Logos (Word) as creative principle
• The Seven Governors (planetary spheres)

Key Principles:
• Mentalism: "The Mind is God"
• Correspondence: "As above, so below"
• The Dual Nature of Man: Mortal body, Immortal soul

Related Teachings:
• Genesis 1:1-3 (Light from darkness)
• Plato's Allegory of the Cave
• Neoplatonic Emanation`;

const initialPracticeNotes = `Meditation Practice:
Sit in stillness. Close your eyes and imagine a vast, infinite Light. Hold the image of Pymander—the Divine Mind—in your awareness. Ask: "What do I wish to learn and know?"

Journaling Prompts:
1. What is the "darkness" in your life that obscures the Light?
2. How do you currently "hold" the Divine in your mind?
3. What would it mean to be "always present" with the Divine?

Warning:
Do not rush this teaching. The vision must be experienced, not merely understood intellectually. Return to this section after meditation.`;

const STORAGE_KEY = "hermetic-editor-draft-v4";
const PROMPT_STORAGE_KEY = "hermetic-editor-prompt-v1";
const MAP_STORAGE_KEY = "hermetic-editor-map-v1";
const PRACTICE_STORAGE_KEY = "hermetic-editor-practice-v1";

export default function Editor() {
  const [modernText, setModernText] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    }
    return initialModernDraft;
  });
  
  const [promptText, setPromptText] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PROMPT_STORAGE_KEY);
      if (saved) return saved;
    }
    return initialPrompt;
  });
  
  const [mapNotes, setMapNotes] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(MAP_STORAGE_KEY);
      if (saved) return saved;
    }
    return initialMapNotes;
  });
  
  const [practiceNotes, setPracticeNotes] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PRACTICE_STORAGE_KEY);
      if (saved) return saved;
    }
    return initialPracticeNotes;
  });
  
  const [isApproved, setIsApproved] = useState(false);
  const [lensExpanded, setLensExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("prompt");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, modernText);
  }, [modernText]);
  
  useEffect(() => {
    localStorage.setItem(PROMPT_STORAGE_KEY, promptText);
  }, [promptText]);
  
  useEffect(() => {
    localStorage.setItem(MAP_STORAGE_KEY, mapNotes);
  }, [mapNotes]);
  
  useEffect(() => {
    localStorage.setItem(PRACTICE_STORAGE_KEY, practiceNotes);
  }, [practiceNotes]);

  const handleCopyAll = () => {
    const fullContent = `=== MODERN TRANSLATION ===
${modernText}

=== CONTEMPLATION PROMPT ===
${promptText}

=== THE MAP (Concepts & Connections) ===
${mapNotes}

=== THE PRACTICE (Application) ===
${practiceNotes}`;
    
    navigator.clipboard.writeText(fullContent);
    setIsApproved(true);
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Editor Toolbar */}
        <div className="bg-card border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/modules">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6 bg-white/10" />
            <div>
              <h1 className="font-serif text-lg text-foreground font-medium">The Divine Pymander</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                Book II: The Vision (Sections 1-99)
                <span className="text-[10px] text-green-500/80 font-mono uppercase tracking-wider border border-green-500/20 px-1 rounded">
                  Auto-saving locally
                </span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/guide">
              <Button 
                variant="outline" 
                className="border-primary/30 hover:bg-primary/10 text-primary"
                data-testid="button-guide"
              >
                <HelpCircle className="w-4 h-4 mr-2" /> Guide
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm("Are you sure you want to reset all content to the original drafts? Your current edits will be lost.")) {
                  setModernText(initialModernDraft);
                  setPromptText(initialPrompt);
                  setMapNotes(initialMapNotes);
                  setPracticeNotes(initialPracticeNotes);
                }
              }}
              className="border-white/10 hover:bg-white/5 text-muted-foreground"
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reset All
            </Button>
            <Button 
              onClick={handleCopyAll}
              className={cn(
                "transition-all",
                isApproved 
                  ? "bg-green-600 hover:bg-green-700 text-white" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              data-testid="button-copy"
            >
              {isApproved ? (
                <>
                  <Check className="w-4 h-4 mr-2" /> Copied! Paste in Chat
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Copy All to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Text Editor (Top Section) */}
          <div className={cn(
            "overflow-hidden transition-all duration-300",
            lensExpanded ? "flex-1" : "flex-[2]"
          )}>
            <div className="grid md:grid-cols-2 h-full divide-y md:divide-y-0 md:divide-x divide-white/10">
              
              {/* Left Column: Original Text */}
              <div className="flex flex-col h-full min-h-0 bg-background/50">
                <div className="px-6 py-3 bg-white/5 border-b border-white/5 shrink-0">
                  <span className="text-xs font-bold tracking-widest text-primary/60 uppercase">Original Text (1650)</span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-6 font-serif text-lg leading-loose text-muted-foreground whitespace-pre-wrap font-medium">
                    {originalTextChunk}
                  </div>
                </ScrollArea>
              </div>

              {/* Right Column: Modernized Text (Editable) */}
              <div className="flex flex-col h-full min-h-0 bg-background">
                <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex justify-between items-center shrink-0">
                  <span className="text-xs font-bold tracking-widest text-primary uppercase">Modern Translation (Editable)</span>
                  <span className="text-xs text-muted-foreground italic">You can edit the text below</span>
                </div>
                <div className="flex-1 relative min-h-0">
                  <textarea
                    value={modernText}
                    onChange={(e) => {
                      setModernText(e.target.value);
                      setIsApproved(false);
                    }}
                    className="w-full h-full resize-none bg-transparent p-6 font-body text-xl leading-loose text-foreground focus:outline-none selection:bg-primary/20 overflow-y-auto"
                    spellCheck={false}
                    data-testid="textarea-modern"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hermetic Lens Panel (Bottom Section) */}
          <div className={cn(
            "border-t border-primary/30 bg-gradient-to-b from-card to-background transition-all duration-300",
            lensExpanded ? "h-[320px]" : "h-12"
          )}>
            {/* Panel Header */}
            <button
              onClick={() => setLensExpanded(!lensExpanded)}
              className="w-full px-6 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
              data-testid="button-toggle-lens"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-primary">The Hermetic Lens</span>
                  <span className="text-xs text-muted-foreground ml-2">Synthesis & Teaching Notes</span>
                </div>
              </div>
              {lensExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Panel Content */}
            {lensExpanded && (
              <div className="px-6 pb-4 h-[calc(100%-48px)]">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="bg-white/5 border border-white/10 mb-3 shrink-0">
                    <TabsTrigger value="prompt" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-prompt">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Contemplation Prompt
                    </TabsTrigger>
                    <TabsTrigger value="map" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-map">
                      <Map className="w-4 h-4 mr-2" />
                      The Map
                    </TabsTrigger>
                    <TabsTrigger value="practice" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-practice">
                      <Compass className="w-4 h-4 mr-2" />
                      The Practice
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="prompt" className="flex-1 mt-0 min-h-0">
                    <div className="h-full flex flex-col">
                      <p className="text-xs text-muted-foreground mb-2">The bridge between reading and understanding. Ask questions that guide without dictating.</p>
                      <textarea
                        value={promptText}
                        onChange={(e) => {
                          setPromptText(e.target.value);
                          setIsApproved(false);
                        }}
                        className="flex-1 w-full resize-none bg-white/5 border border-white/10 rounded-lg p-4 text-base leading-relaxed text-foreground focus:outline-none focus:border-primary/50 selection:bg-primary/20"
                        placeholder="Write a contemplation prompt for this section..."
                        data-testid="textarea-prompt"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="map" className="flex-1 mt-0 min-h-0">
                    <div className="h-full flex flex-col">
                      <p className="text-xs text-muted-foreground mb-2">Core concepts, principles, and connections to other teachings. The intellectual framework.</p>
                      <textarea
                        value={mapNotes}
                        onChange={(e) => {
                          setMapNotes(e.target.value);
                          setIsApproved(false);
                        }}
                        className="flex-1 w-full resize-none bg-white/5 border border-white/10 rounded-lg p-4 text-base leading-relaxed text-foreground focus:outline-none focus:border-primary/50 selection:bg-primary/20 font-mono text-sm"
                        placeholder="List key concepts, principles, and related teachings..."
                        data-testid="textarea-map"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="practice" className="flex-1 mt-0 min-h-0">
                    <div className="h-full flex flex-col">
                      <p className="text-xs text-muted-foreground mb-2">Meditations, journaling prompts, and warnings. How to embody this teaching.</p>
                      <textarea
                        value={practiceNotes}
                        onChange={(e) => {
                          setPracticeNotes(e.target.value);
                          setIsApproved(false);
                        }}
                        className="flex-1 w-full resize-none bg-white/5 border border-white/10 rounded-lg p-4 text-base leading-relaxed text-foreground focus:outline-none focus:border-primary/50 selection:bg-primary/20"
                        placeholder="Add meditation practices, journal prompts, and spiritual warnings..."
                        data-testid="textarea-practice"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
