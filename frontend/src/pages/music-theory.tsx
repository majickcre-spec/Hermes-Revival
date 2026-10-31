// MAJICK Music — its own standalone full-screen platform (no Hermetic chrome,
// no navigation back into the Hermes app). Safe to share on its own.
// Custom links: /music-theory?for=Pat&focus=guitar,voice — the name + focus are
// injected into the game so a shared link opens a personalized welcome.
import gameHtml from "./music-theory.game.html?raw";

export default function MusicTheory() {
  let html = gameHtml;
  try {
    const q = new URLSearchParams(window.location.search);
    const forName = q.get("for");
    const focus = q.get("focus");
    if (forName || focus) {
      const inj =
        "<script>window.__MJK_FOR__=" +
        JSON.stringify(forName || "") +
        ";window.__MJK_FOCUS__=" +
        JSON.stringify(focus || "") +
        ";</scr" + "ipt>";
      html = html.replace("</head>", inj + "</head>");
    }
  } catch (e) {
    /* no params — plain app */
  }

  return (
    <div style={{ height: "100dvh", width: "100%", background: "#140d28" }}>
      <iframe
        title="MAJICK Music"
        srcDoc={html}
        className="block w-full h-full border-0"
        allow="microphone; bluetooth"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
