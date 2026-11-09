# Majick Music University (MMU) — read before every build

Main app file: `frontend/src/pages/music-theory.game.html` · build: `cd frontend && node scripts/make-app.mjs` · push to deploy (Railway).

Humans don't like overwhelming and over complicated things.

## Structure objectives
1. Uniformity
2. Practicality
3. Customizability
4. Effective — results driven
5. Modern feel and look
6. Functional

## Every build: think of the player using it
1. Does it function like the real thing?
2. Does it sound good and professional?
3. Can I break it into buildable or loopable pieces?
4. Can I play it with my fingers on the instrument to simulate the real thing?
5. Can I watch and play it on my real instrument?
6. Is the screen cluttered? Are my eyes drawn to the parts they need to see, easily and quickly?
7. Is this exercise helping me progress and solve my pain point?
8. Does this session load and play smooth, or does it glitch?
9. Can I test myself on what I've learned?
10. Does this orient itself like the real instrument?
11. Can a first-time user start within 10 seconds, with no instructions?
12. Does every tap respond instantly, with a visible press and no audio delay?
13. Does it remember where I left off: tempo, settings, song, progress?
14. Can I reach everything with one thumb? Are the buttons big enough, in both portrait and landscape?
15. Can I read it at a glance, in a dark room and in bright sun?
16. Can I pause, stop or back out at any moment without losing work or getting stuck?
17. If a device, the mic or the internet isn't there, does it tell me clearly and keep working?
18. Is every word on screen needed? Short, plain labels, no jargon, no leftover test text.
19. Does it hold up over a long session: no heat, no battery drain, no audio drift after 30+ minutes?
20. Does it look and behave like the rest of the app: same buttons, same settings spot, same flow?
21. Are the instruments the same size and formatted consistently?
22. Is the instrument as big as the screen allows? Is it sized for real fingers?
23. Can I play it with real finger positions, the way I'd play the real instrument (e.g. piano fingering)?
24. Can I actually play the instrument itself? No pad buttons on instruments — play the instrument directly.
25. Is anything obstructing my view of what I need to see to play?
26. Am I referencing the sound against something professional — a reference track or reference sound? Is that reference professionally produced, or a professionally made sample?

More get added as Travis finds issues (keep this file and the project doc `claude/mmu-goals-and-build-checklist.md` in step).

## How to test before calling a build done
1. Syntax-check the built app (`node --check` on the inline script) before every push.
2. Screenshot every screen touched at phone size (390×844 portrait and 844×390 landscape), as the player.
3. Answer all 26 questions for each screen; fix what fails before reporting.
4. Test the way it's really used: full session start to finish, with a device connected, including being cut off (sleep, screen lock, reload).
5. Report briefly: what passed, what was fixed, what only a real phone/instrument can confirm.
6. Log the change in the Google Doc tracker (1CIYtRw3wclwBQDeJARNoqcuiqvTEkm1H5ODro-b2ATo).
