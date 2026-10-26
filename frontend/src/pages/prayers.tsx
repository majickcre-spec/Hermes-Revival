import Layout from "@/components/layout";
// The Prayers — read, fade-to-memory, and order-the-lines for the Hermetic
// prayers. Self-contained; beans shared via the active traveler; no login.
import gameHtml from "./prayers.game.html?raw";

export default function Prayers() {
  return (
    <Layout>
      <div className="w-full bg-[#0a1628]" style={{ height: "calc(100vh - 4rem)" }}>
        <iframe
          title="The Prayers"
          srcDoc={gameHtml}
          className="block w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </Layout>
  );
}
