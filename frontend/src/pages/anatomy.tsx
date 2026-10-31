// Anatomy of a Song — educational lesson page (full-screen, no app chrome).
import gameHtml from "./anatomy.game.html?raw";

export default function Anatomy() {
  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0b0715" }}>
      <iframe
        title="Anatomy of a Song"
        srcDoc={gameHtml}
        style={{ display: "block", width: "100%", height: "100vh", border: 0 }}
        sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation allow-popups"
      />
    </div>
  );
}
