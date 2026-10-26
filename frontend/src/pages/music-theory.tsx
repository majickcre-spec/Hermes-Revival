import { useEffect } from "react";
import { useLocation } from "wouter";
// MAJICK Music — its own full-screen platform (no Hermetic chrome).
// know it (games), hear it (musictheory.net links), play it (keyboard prompts).
import gameHtml from "./music-theory.game.html?raw";

export default function MusicTheory() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data && e.data.mjk === "home") setLocation("/");
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [setLocation]);

  return (
    <div style={{ height: "100dvh", width: "100%", background: "#140d28" }}>
      <iframe
        title="MAJICK Music"
        srcDoc={gameHtml}
        className="block w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
