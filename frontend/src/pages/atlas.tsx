import Layout from "@/components/layout";
// Holistic build tracker across all 17 Books (adult study + Star's path).
// Self-contained; status edits persist in localStorage. No login required.
import gameHtml from "./atlas.game.html?raw";

export default function Atlas() {
  return (
    <Layout>
      <div className="w-full bg-[#0a1628]" style={{ height: "calc(100vh - 4rem)" }}>
        <iframe
          title="The Teaching Atlas"
          srcDoc={gameHtml}
          className="block w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </Layout>
  );
}
