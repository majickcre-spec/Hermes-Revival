import Layout from "@/components/layout";
// Music Theory concept — know it (games), hear it (musictheory.net links),
// play it (keyboard prompts). allow-popups lets the external links open.
import gameHtml from "./music-theory.game.html?raw";

export default function MusicTheory() {
  return (
    <Layout>
      <div className="w-full bg-[#0a1628]" style={{ height: "calc(100vh - 4rem)" }}>
        <iframe
          title="Music Theory"
          srcDoc={gameHtml}
          className="block w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </Layout>
  );
}
