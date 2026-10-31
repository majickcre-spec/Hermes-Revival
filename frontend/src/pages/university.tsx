// Majick Music University — public landing / front door. Full-screen, no app
// chrome. CTAs navigate the top window into /music-theory and /resonance.
import gameHtml from "./university.game.html?raw";

export default function University() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0b0715" }}>
      <iframe
        title="Majick Music University"
        srcDoc={gameHtml}
        style={{ display: "block", width: "100%", height: "100vh", border: 0 }}
        sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-popups"
      />
    </div>
  );
}
