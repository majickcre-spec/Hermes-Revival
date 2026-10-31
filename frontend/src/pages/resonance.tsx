// Schumann Resonance — standalone full-screen frequency portal (no app chrome),
// meant to be shared directly. Live NOAA data + Tomsk spectrogram load fine
// here (real browser, unlike the sandboxed artifact). In the spirit of
// Gayle Fuller, The Boujee Healer.
import gameHtml from "./resonance.game.html?raw";

export default function Resonance() {
  return (
    <div style={{ width: "100%", height: "100vh", background: "#190617" }}>
      <iframe
        title="Schumann Resonance"
        srcDoc={gameHtml}
        style={{ display: "block", width: "100%", height: "100%", border: 0 }}
        sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
      />
    </div>
  );
}
