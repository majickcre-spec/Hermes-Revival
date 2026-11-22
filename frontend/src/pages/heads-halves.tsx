import Layout from "@/components/layout";
// Heads of Things — study guide, graded quiz, progress, spoken meditation (Everard's 68 Heads, verses 14–81).
// Inlined at build time and run in a same-origin srcDoc iframe so progress persists per device.
import gameHtml from "./heads-halves.game.html?raw";

export default function HeadsHalves() {
  return (
    <Layout>
      <div className="w-full bg-[#0a1628]" style={{ height: "calc(100vh - 4rem)" }}>
        <iframe
          title="Heads of Things"
          srcDoc={gameHtml}
          className="block w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
        />
      </div>
    </Layout>
  );
}
