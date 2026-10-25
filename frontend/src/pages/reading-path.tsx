import Layout from "@/components/layout";
// Self-contained reader (authentic Everard text + plain reading + questions).
// Vite ?raw inlines it; runs in a same-origin srcDoc iframe, progress in
// localStorage, no login required.
import gameHtml from "./reading-path.game.html?raw";

export default function ReadingPath() {
  return (
    <Layout>
      <div className="w-full bg-[#0a1628]" style={{ height: "calc(100vh - 4rem)" }}>
        <iframe
          title="The Reading Path"
          srcDoc={gameHtml}
          className="block w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </Layout>
  );
}
