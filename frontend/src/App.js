import { useEffect, useRef, useState } from "react";
import "@/App.css";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, Puzzle,
  Download, Check, ArrowRight, ArrowLeft, Info, Terminal,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Desktop bridge (present when running inside the Sparkle Electron installer)
const bridge = typeof window !== "undefined" ? window.sparkle : undefined;
const isDesktop = !!(bridge && bridge.isDesktop);

const FALLBACK_STEPS = [
  { id: "vencord", label: "Copie du build Vencord (BdCompat)" },
  { id: "plugin", label: "Ajout du plugin AutoQuest" },
  { id: "close", label: "Fermeture de Discord" },
  { id: "inject", label: "Injection de Vencord dans Discord" },
  { id: "settings", label: "Activation des composants" },
];

const FLOW = ["welcome", "plugin", "install", "done"];

export default function App() {
  const [step, setStep] = useState("welcome");
  const [dir, setDir] = useState(1);
  const [plugin, setPlugin] = useState({ name: "AutoQuest", author: "999none", version: "1.5.0", description: "Complète automatiquement les quêtes Discord." });
  const [steps, setSteps] = useState(FALLBACK_STEPS);
  const [opts, setOpts] = useState({ autoquest: true });
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState(null); // {patched, plugin}
  const [error, setError] = useState("");
  const anchorRef = useRef(null);

  useEffect(() => {
    if (isDesktop) {
      bridge.getInfo?.().then((info) => { if (info?.plugin) setPlugin((p) => ({ ...p, ...info.plugin })); }).catch(() => {});
      bridge.onProgress?.(({ pct, label }) => { setProgress(pct); if (label) setStatusText(label); });
    } else {
      axios.get(`${API}/info`).then((r) => {
        if (r.data?.plugin) setPlugin((p) => ({ ...p, ...r.data.plugin }));
        if (r.data?.steps?.length) setSteps(r.data.steps.filter((s) => s.id !== "done" && s.id !== "prepare"));
      }).catch(() => {});
    }
  }, []);

  const go = (next) => {
    setDir(FLOW.indexOf(next) >= FLOW.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const runInstall = async () => {
    setError("");
    setProgress(0);
    setStatusText("");
    go("install");

    if (isDesktop) {
      try {
        const res = await bridge.install({ installPlugin: opts.autoquest });
        setResult(res || { patched: 0 });
        setProgress(100);
        await new Promise((r) => setTimeout(r, 350));
        go("done");
      } catch (e) {
        setError(e?.message || String(e));
        go("done");
      }
      return;
    }

    // Web preview: simulate the installer steps
    const active = opts.autoquest ? steps : steps.filter((s) => s.id !== "plugin");
    for (let i = 0; i < active.length; i++) {
      setStatusText(active[i].label);
      await new Promise((r) => setTimeout(r, 560));
      setProgress(Math.round(((i + 1) / active.length) * 100));
    }
    setResult({ patched: 0, preview: true });
    await new Promise((r) => setTimeout(r, 300));
    go("done");
  };

  const downloadWindows = () => {
    const a = anchorRef.current;
    a.href = `${API}/installer/download?autoquest=${opts.autoquest}`;
    a.click();
  };

  const variants = {
    enter: (d) => ({ opacity: 0, x: d * 44 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d * -44 }),
  };

  const showBack = step === "plugin";

  return (
    <div className="App">
      <a ref={anchorRef} style={{ display: "none" }} download data-testid="hidden-download-anchor">dl</a>
      <div className="stage">
        <div className="glow-top" />

        <div className="topbar">
          {showBack ? (
            <button className="back-btn" data-testid="back-btn" onClick={() => go("welcome")}>
              <ArrowLeft size={16} /> Retour
            </button>
          ) : <span className="back-ph" />}
          <div className="brand"><img src="/brand/logo.png" alt="" /><span>Sparkle</span></div>
          <span className="back-ph" />
        </div>

        <div className="viewport">
          <AnimatePresence mode="wait" custom={dir}>
            {step === "welcome" && (
              <motion.div key="welcome" data-testid="step-welcome" className="slide"
                custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="hero-mark"><img src="/brand/logo.png" alt="logo" /></div>
                <div className="kicker">Installeur</div>
                <h1 className="title display">Sparkle</h1>
                <p className="subtitle">Installe l'extension Vencord <b>BdCompat</b> dans Discord — avec le plugin <b>{plugin.name}</b> en option. Simple, propre, en quelques secondes.</p>
                <div className="cta">
                  <button className="btn btn-primary" data-testid="welcome-start-btn" onClick={() => go("plugin")}>
                    Commencer <ArrowRight size={17} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "plugin" && (
              <motion.div key="plugin" data-testid="step-plugin" className="slide"
                custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="kicker">Plugin optionnel</div>
                <h1 className="title sm display">Installer le plugin {plugin.name} ?</h1>
                <p className="subtitle">{plugin.description?.slice(0, 110)}{plugin.description?.length > 110 ? "…" : ""}</p>

                <div className="choices">
                  <div className={`choice ${opts.autoquest ? "sel" : ""}`} data-testid="choice-plugin-yes" onClick={() => setOpts({ autoquest: true })}>
                    <div className="c-check"><Check size={13} strokeWidth={3} /></div>
                    <div className="c-icn"><Sparkles size={22} /></div>
                    <span className="pill-rec">Recommandé</span>
                    <div className="c-t">Oui, installer {plugin.name}</div>
                    <div className="c-d">Le plugin est ajouté et activé par défaut au démarrage.</div>
                  </div>
                  <div className={`choice ${!opts.autoquest ? "sel" : ""}`} data-testid="choice-plugin-no" onClick={() => setOpts({ autoquest: false })}>
                    <div className="c-check"><Check size={13} strokeWidth={3} /></div>
                    <div className="c-icn"><Puzzle size={22} /></div>
                    <div className="c-t" style={{ marginTop: 28 }}>Non, seulement BdCompat</div>
                    <div className="c-d">Installe uniquement l'extension, sans plugin préchargé.</div>
                  </div>
                </div>

                <div className="cta">
                  <button className="btn btn-primary" data-testid="prepare-start-btn" onClick={runInstall}>
                    Installer <ArrowRight size={17} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "install" && (
              <motion.div key="install" data-testid="step-install" className="slide"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="hero-mark install-mark"><img src="/brand/logo.png" alt="installation" /></div>
                <h1 className="title sm display">Installation…</h1>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} data-testid="install-progress" /></div>
                <div className="progress-label" data-testid="install-status">{statusText} · {progress}%</div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" data-testid="step-done" className="slide"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <motion.div className={`done-check ${error ? "err" : ""}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
                  {error ? <Info size={36} /> : <Check size={38} strokeWidth={3} />}
                </motion.div>

                {error ? (
                  <>
                    <h1 className="title sm display">Échec de l'installation</h1>
                    <p className="subtitle">{error}</p>
                  </>
                ) : isDesktop ? (
                  <>
                    <h1 className="title sm display">Sparkle est installé</h1>
                    <p className="subtitle">
                      Vencord BdCompat {opts.autoquest ? `et le plugin ${plugin.name} sont` : "est"} installé{opts.autoquest ? "s" : ""} et activé{opts.autoquest ? "s" : ""}.
                      {result?.patched ? ` ${result.patched} installation${result.patched > 1 ? "s" : ""} Discord patchée${result.patched > 1 ? "s" : ""}.` : ""}
                    </p>
                    <div className="steps-mini">
                      <div className="mini"><span className="m-n">1</span><div><div className="m-t">Relance Discord</div><div className="m-d">Ferme-le complètement puis rouvre-le.</div></div></div>
                      <div className="mini"><span className="m-n">2</span><div><div className="m-t">Ouvre les réglages Vencord</div><div className="m-d">{opts.autoquest ? `BdCompat + ${plugin.name} sont déjà actifs.` : "BdCompat est déjà actif."}</div></div></div>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="title sm display">Aperçu terminé</h1>
                    <p className="subtitle">Ceci est l'aperçu de l'interface Sparkle. Pour installer réellement, lance l'application <b>Sparkle</b> sur Windows.</p>
                    <div className="note">
                      <Info size={15} />
                      <span>Mode aperçu : un navigateur ne peut pas modifier Discord. Télécharge <b>Sparkle.exe</b> et double-clique dessus — tu retrouveras exactement cette interface, qui installera Vencord et le plugin.</span>
                    </div>
                    <div className="cta">
                      <button className="btn btn-primary" data-testid="download-again-btn" onClick={downloadWindows}>
                        <Download size={17} /> Télécharger Sparkle.exe
                      </button>
                    </div>
                  </>
                )}

                <button className="link-btn" data-testid="restart-btn" onClick={() => { setError(""); setResult(null); go("welcome"); }}>
                  Recommencer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="foot"><Terminal size={13} /> Sparkle · extension Vencord BdCompat · plugin {plugin.name} par {plugin.author}</div>
      </div>
    </div>
  );
}
