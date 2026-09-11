import { useEffect, useRef, useState } from "react";
import "@/App.css";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles, Puzzle,
  Download, Check, ArrowRight, ArrowLeft, Info, Terminal,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FALLBACK_STEPS = [
  { id: "prepare", label: "Préparation de l'environnement" },
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
  const [opts, setOpts] = useState({ autoquest: true, enable: true, close: true, beta: false });
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const anchorRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/info`).then((r) => {
      if (r.data?.plugin) setPlugin((p) => ({ ...p, ...r.data.plugin }));
      if (r.data?.steps?.length) setSteps(r.data.steps.filter((s) => s.id !== "done"));
    }).catch(() => {});
  }, []);

  const go = (next) => {
    setDir(FLOW.indexOf(next) >= FLOW.indexOf(step) ? 1 : -1);
    setStep(next);
  };

  const downloadUrl = () => {
    const q = new URLSearchParams({ autoquest: opts.autoquest }).toString();
    return `${API}/installer/download?${q}`;
  };
  const triggerDownload = () => {
    const a = anchorRef.current;
    a.href = downloadUrl();
    a.click();
    setDownloaded(true);
  };

  const runPreparation = async () => {
    go("install");
    setProgress(0);
    setStatusText("");
    const active = opts.autoquest ? steps : steps.filter((s) => s.id !== "plugin");
    for (let i = 0; i < active.length; i++) {
      setStatusText(active[i].label);
      await new Promise((r) => setTimeout(r, 560));
      setProgress(Math.round(((i + 1) / active.length) * 100));
    }
    setStatusText("Génération du paquet…");
    await new Promise((r) => setTimeout(r, 450));
    triggerDownload();
    await new Promise((r) => setTimeout(r, 450));
    go("done");
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

        {/* top bar */}
        <div className="topbar">
          {showBack ? (
            <button className="back-btn" data-testid="back-btn" onClick={() => go("welcome")}>
              <ArrowLeft size={16} /> Retour
            </button>
          ) : <span className="back-ph" />}

          <div className="brand"><img src="/brand/logo.png" alt="" /><span>Spark</span></div>

          <span className="back-ph" />
        </div>

        {/* slides */}
        <div className="viewport">
          <AnimatePresence mode="wait" custom={dir}>
            {step === "welcome" && (
              <motion.div key="welcome" data-testid="step-welcome" className="slide"
                custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className="hero-mark"><img src="/brand/logo.png" alt="logo" /></div>
                <div className="kicker">Installeur Spark</div>
                <h1 className="title display">Spark</h1>
                <p className="subtitle">Installe l'extension Vencord <b>BdCompat</b> dans Discord — avec le plugin <b>{plugin.name}</b> en option. Un vrai installeur Windows, prêt en un clic.</p>
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
                  <div className={`choice ${opts.autoquest ? "sel" : ""}`} data-testid="choice-plugin-yes" onClick={() => setOpts((o) => ({ ...o, autoquest: true }))}>
                    <div className="c-check"><Check size={13} strokeWidth={3} /></div>
                    <div className="c-icn"><Sparkles size={22} /></div>
                    <span className="pill-rec">Recommandé</span>
                    <div className="c-t">Oui, installer {plugin.name}</div>
                    <div className="c-d">Le plugin est ajouté et activé par défaut au démarrage.</div>
                  </div>
                  <div className={`choice ${!opts.autoquest ? "sel" : ""}`} data-testid="choice-plugin-no" onClick={() => setOpts((o) => ({ ...o, autoquest: false }))}>
                    <div className="c-check"><Check size={13} strokeWidth={3} /></div>
                    <div className="c-icn"><Puzzle size={22} /></div>
                    <div className="c-t" style={{ marginTop: 28 }}>Non, seulement BdCompat</div>
                    <div className="c-d">Installe uniquement l'extension, sans plugin préchargé.</div>
                  </div>
                </div>

                <div className="cta">
                  <button className="btn btn-primary" data-testid="prepare-start-btn" onClick={runPreparation}>
                    Installer <ArrowRight size={17} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "install" && (
              <motion.div key="install" data-testid="step-install" className="slide"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <div className="hero-mark install-mark"><img src="/brand/logo.png" alt="installation" /></div>
                <h1 className="title sm display">Téléchargement de Spark…</h1>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} data-testid="install-progress" /></div>
                <div className="progress-label" data-testid="install-status">{statusText} · {progress}%</div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" data-testid="step-done" className="slide"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <motion.div className="done-check" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
                  <Check size={38} strokeWidth={3} />
                </motion.div>
                <h1 className="title sm display">Spark est prêt</h1>
                <p className="subtitle">L'installeur <b>{opts.autoquest ? "Spark-Setup.exe" : "Spark-Setup-Lite.exe"}</b> a été téléchargé. Lance-le sur ton PC Windows pour terminer.</p>

                <div className="steps-mini">
                  <div className="mini"><span className="m-n">1</span><div><div className="m-t">Lance <code>{opts.autoquest ? "Spark-Setup.exe" : "Spark-Setup-Lite.exe"}</code></div><div className="m-d">Double-clic ouvre l'installeur Spark.</div></div></div>
                  <div className="mini"><span className="m-n">2</span><div><div className="m-t">Suis l'assistant → « Installer »</div><div className="m-d">{opts.autoquest ? `Vencord injecté et ${plugin.name} activé.` : "Vencord BdCompat est injecté."}</div></div></div>
                  <div className="mini"><span className="m-n">3</span><div><div className="m-t">Relance Discord</div></div></div>
                </div>

                <div className="note">
                  <Info size={15} />
                  <span>Discord doit être fermé pendant l'installation. Si Windows SmartScreen s'affiche : clique sur « Informations complémentaires » → « Exécuter quand même ».</span>
                </div>

                <div className="cta">
                  <button className="btn btn-primary" data-testid="download-again-btn" onClick={triggerDownload}>
                    <Download size={17} /> {downloaded ? "Retélécharger" : "Télécharger"}
                  </button>
                </div>
                <button className="link-btn" data-testid="restart-btn" onClick={() => { setDownloaded(false); go("welcome"); }}>
                  Recommencer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="foot"><Terminal size={13} /> Spark · extension Vencord BdCompat · plugin {plugin.name} par {plugin.author}</div>
      </div>
    </div>
  );
}
