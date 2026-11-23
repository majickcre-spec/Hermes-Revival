import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/sync";

// A private study page (Heads of Things). The page lives on the server and is handed out only to the
// Travis and Star accounts — it is never part of the public site files.
export default function PrivatePage({ which, title }: { which: "halves" | "star"; title: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [msg, setMsg] = useState("Opening…");
  useEffect(() => {
    const api = ((import.meta.env.VITE_API_URL as string) || "").replace(/\/+$/, "");
    const tok = getToken();
    if (!api || !tok) { setMsg("This page is private. Sign in as Travis or Star to open it."); return; }
    fetch(api + "/api/heads/" + which, { headers: { Authorization: "Bearer " + tok }, cache: "no-store" })
      .then((r) => {
        if (r.status === 401 || r.status === 403) throw new Error("private");
        if (!r.ok) throw new Error("net");
        return r.text();
      })
      .then(setHtml)
      .catch((e) => setMsg(e.message === "private" ? "This page is private. Sign in as Travis or Star to open it." : "Can't reach the server. Check your internet and try again."));
  }, [which]);
  return (
    <Layout>
      <div className="w-full bg-[#0a1628]" style={{ height: "calc(100vh - 4rem)" }}>
        {html ? (
          <iframe title={title} srcDoc={html} className="block w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation" />
        ) : (
          <p className="text-center pt-16 px-6 text-[#e8e4d9]/80">{msg}</p>
        )}
      </div>
    </Layout>
  );
}
