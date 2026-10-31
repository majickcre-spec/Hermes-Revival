import Layout from "@/components/layout";
// The study game is a self-contained HTML document (styles + logic isolated from
// the app). Vite's ?raw import inlines it at build time; it runs in a same-origin
// srcDoc iframe, so its localStorage persists per-device with no login required.
import gameHtml from "./star-heads.game.html?raw";

export default function StarHeads() {
  return (
    <Layout>
      <div className="w-full bg-[#0a1628]" style={{ height: "calc(100vh - 4rem)" }}>
        <iframe
          title="The Heads of Things"
          srcDoc={gameHtml}
          className="block w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
        />
      </div>
    </Layout>
  );
}
