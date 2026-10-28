// MAJICK Music — its own standalone full-screen platform (no Hermetic chrome,
// no navigation back into the Hermes app). Safe to share on its own.
import gameHtml from "./music-theory.game.html?raw";

export default function MusicTheory() {
  return (
    <div style={{ height: "100dvh", width: "100%", background: "#140d28" }}>
      <iframe
        title="MAJICK Music"
        srcDoc={gameHtml}
        className="block w-full h-full border-0"
        allow="microphone; bluetooth"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
