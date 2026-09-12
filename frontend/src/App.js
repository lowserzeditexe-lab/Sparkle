import { useEffect, useRef, useState } from "react";
import "@/App.css";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Sparkles, Download, ArrowRight, ChevronDown, Puzzle, Zap, LayoutDashboard,
  Filter, ShieldCheck, RefreshCw, Trophy, MousePointerClick, Github,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const asset = (p) => `${process.env.PUBLIC_URL || ""}${p}`;
const LOGO = asset("/brand/logo.png");

const FEATURES = [
  { icon: Trophy, title: "Complétion automatique", text: "Termine les quêtes Discord automatiquement — vidéos, jeux et streams — sans lever le petit doigt." },
  { icon: LayoutDashboard, title: "Dashboard intégré", text: "Un tableau de bord clair dans Discord : toutes tes quêtes en grille 2 colonnes, en un coup d'œil." },
  { icon: MousePointerClick, title: "Auto-inscription", text: "S'inscrit tout seul aux quêtes disponibles pour ne jamais rater une récompense." },
  { icon: Filter, title: "Filtres & badges", text: "Filtre par statut, repère d'un regard ce qui est en cours, terminé ou à réclamer grâce aux badges." },
  { icon: RefreshCw, title: "Toujours à jour", text: "Basé sur la dernière méthode de complétion (rev. novembre 2025) avec l'API fetch native." },
  { icon: ShieldCheck, title: "Léger & propre", text: "Un simple plugin BetterDiscord, sans dépendance lourde, qui s'active en un clic." },
];

const FAQ = [
  { q: "Qu'est-ce qu'AutoQuest ?", a: "AutoQuest est un plugin qui complète automatiquement les quêtes Discord et t'offre un tableau de bord intégré pour tout suivre. Il fait partie de la suite Sparkle." },
  { q: "Quelle différence entre l'installeur et le plugin ?", a: "L'installeur Sparkle configure tout pour toi : il installe l'extension Vencord (BdCompat) dans Discord et ajoute AutoQuest, activé par défaut. Le plugin seul est le fichier AutoQuest.plugin.js à glisser toi-même si tu utilises déjà BetterDiscord ou Vencord." },
  { q: "Lequel dois-je télécharger ?", a: "Si tu pars de zéro, prends l'installeur Sparkle : c'est le plus simple. Si tu as déjà BetterDiscord/Vencord installé, télécharge directement le plugin AutoQuest." },
  { q: "Est-ce que je risque quelque chose ?", a: "AutoQuest s'appuie sur les mécaniques officielles des quêtes Discord. Comme tout plugin tiers, utilise-le en connaissance de cause. L'installeur peut être retiré à tout moment." },
  { q: "Comment installer le plugin manuellement ?", a: "Ouvre Discord → Paramètres → BetterDiscord (Plugins) → Ouvre le dossier des plugins, puis dépose-y AutoQuest.plugin.js. Active-le dans la liste et c'est prêt." },
];

function FaqItem({ item, open, onToggle, idx }) {
  return (
    <div className={`faq-item ${open ? "open" : ""}`} data-testid={`faq-item-${idx}`}>
      <button className="faq-q" onClick={onToggle} data-testid={`faq-toggle-${idx}`}>
        <span>{item.q}</span>
        <ChevronDown className="faq-chev" size={18} />
      </button>
      <div className="faq-a-wrap" style={{ maxHeight: open ? 300 : 0 }}>
        <p className="faq-a">{item.a}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [plugin, setPlugin] = useState({ name: "AutoQuest", author: "999none", version: "1.5.0" });
  const [downloads, setDownloads] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const anchorRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/info`).then((r) => { if (r.data?.plugin) setPlugin((p) => ({ ...p, ...r.data.plugin })); }).catch(() => {});
    axios.get(`${API}/stats`).then((r) => setDownloads(r.data?.downloads ?? null)).catch(() => {});
  }, []);

  const download = (url) => { const a = anchorRef.current; a.href = url; a.click(); };
  const downloadInstaller = () => download(`${API}/installer/download?autoquest=true`);
  const downloadPlugin = () => download(`${API}/plugin/download`);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="Land">
      <a ref={anchorRef} style={{ display: "none" }} download data-testid="hidden-download-anchor">dl</a>
      <div className="bg-glow" />
      <div className="bg-grid" />

      {/* NAV */}
      <header className="nav" data-testid="landing-nav">
        <div className="nav-brand" onClick={() => scrollTo("top")}>
          <img src={LOGO} alt="Sparkle" /><span>Sparkle</span>
        </div>
        <nav className="nav-links">
          <button onClick={() => scrollTo("about")}>Présentation</button>
          <button onClick={() => scrollTo("features")}>Fonctionnalités</button>
          <button onClick={() => scrollTo("faq")}>FAQ</button>
        </nav>
        <button className="btn btn-primary btn-sm" data-testid="nav-download-btn" onClick={() => scrollTo("download")}>
          <Download size={15} /> Télécharger
        </button>
      </header>

      {/* HERO */}
      <section id="top" className="hero" data-testid="hero-section">
        <motion.div className="hero-inner"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <div className="hero-badge"><Sparkles size={14} /> Un plugin de la suite Sparkle</div>
          <div className="hero-logo"><img src={LOGO} alt="AutoQuest logo" /></div>
          <h1 className="hero-title display">Auto<span className="grad">Quest</span></h1>
          <p className="hero-sub">
            Complète tes <b>quêtes Discord</b> automatiquement, avec un dashboard intégré.
            Installé et activé en quelques secondes grâce à <b>Sparkle</b>.
          </p>

          <div id="download" className="hero-cta" data-testid="download-section">
            <div className="dl-card" data-testid="dl-installer-card">
              <div className="dl-ic"><Sparkles size={20} /></div>
              <div className="dl-body">
                <div className="dl-t">Installeur Sparkle</div>
                <div className="dl-d">Tout-en-un : installe Vencord (BdCompat) + AutoQuest, activé par défaut. Recommandé.</div>
              </div>
              <button className="btn btn-primary dl-btn" data-testid="download-installer-btn" onClick={downloadInstaller}>
                <Download size={16} /> Installeur <span className="dl-meta">.exe</span>
              </button>
            </div>

            <div className="dl-card" data-testid="dl-plugin-card">
              <div className="dl-ic alt"><Puzzle size={20} /></div>
              <div className="dl-body">
                <div className="dl-t">Plugin AutoQuest <span className="ver">v{plugin.version}</span></div>
                <div className="dl-d">Le fichier plugin seul, pour BetterDiscord / Vencord déjà installés.</div>
              </div>
              <button className="btn btn-ghost dl-btn" data-testid="download-plugin-btn" onClick={downloadPlugin}>
                <Download size={16} /> Plugin <span className="dl-meta">.js</span>
              </button>
            </div>
          </div>

          <div className="hero-foot">
            {downloads != null && <span className="stat" data-testid="downloads-stat"><Zap size={13} /> {downloads.toLocaleString("fr-FR")} téléchargements</span>}
            <span className="stat">Par {plugin.author}</span>
            <span className="stat">Windows · Discord</span>
          </div>
        </motion.div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about" data-testid="about-section">
        <div className="sec-head">
          <div className="kicker">Présentation</div>
          <h2 className="sec-title display">AutoQuest, propulsé par Sparkle</h2>
          <p className="sec-lead">
            Discord multiplie les quêtes pour débloquer récompenses et badges — mais les compléter à la main est fastidieux.
            <b> AutoQuest</b> automatise tout ça, et <b>Sparkle</b> se charge de l’installer proprement dans ton client.
          </p>
        </div>
        <div className="about-grid">
          <div className="about-card" data-testid="about-card-autoquest">
            <div className="ab-ic"><Trophy size={22} /></div>
            <h3>AutoQuest</h3>
            <p>Le plugin qui détecte, s’inscrit et complète tes quêtes automatiquement, avec un tableau de bord clair directement dans Discord.</p>
          </div>
          <div className="about-card" data-testid="about-card-sparkle">
            <div className="ab-ic alt"><Sparkles size={22} /></div>
            <h3>Sparkle</h3>
            <p>L’installeur qui met en place l’extension Vencord (BdCompat) et ajoute AutoQuest, activé par défaut — sans manipulation technique.</p>
          </div>
          <div className="about-card" data-testid="about-card-easy">
            <div className="ab-ic"><Zap size={22} /></div>
            <h3>Simple</h3>
            <p>Un double-clic sur l’installeur, ou un glisser-déposer du plugin. Aucune configuration, tout fonctionne dès le lancement.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="features" data-testid="features-section">
        <div className="sec-head">
          <div className="kicker">Fonctionnalités</div>
          <h2 className="sec-title display">Tout ce qu’AutoQuest sait faire</h2>
          <p className="sec-lead">Pensé pour être invisible quand tout roule, et limpide quand tu veux garder le contrôle.</p>
        </div>
        <div className="feat-grid">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} className="feat-card" data-testid={`feature-card-${i}`}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}>
              <div className="feat-ic"><f.icon size={20} /></div>
              <div className="feat-t">{f.title}</div>
              <div className="feat-d">{f.text}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="faq" data-testid="faq-section">
        <div className="sec-head">
          <div className="kicker">FAQ</div>
          <h2 className="sec-title display">Questions fréquentes</h2>
        </div>
        <div className="faq-list">
          {FAQ.map((item, i) => (
            <FaqItem key={i} item={item} idx={i} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
          ))}
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="cta-final" data-testid="cta-final-section">
        <div className="cta-inner">
          <h2 className="sec-title display">Prêt à automatiser tes quêtes ?</h2>
          <p className="sec-lead">Télécharge l’installeur Sparkle ou récupère directement le plugin AutoQuest.</p>
          <div className="cta-btns">
            <button className="btn btn-primary" data-testid="cta-installer-btn" onClick={downloadInstaller}>
              <Download size={17} /> Installeur Sparkle <ArrowRight size={16} />
            </button>
            <button className="btn btn-ghost" data-testid="cta-plugin-btn" onClick={downloadPlugin}>
              <Puzzle size={16} /> Plugin AutoQuest
            </button>
          </div>
        </div>
      </section>

      <footer className="foot-bar">
        <div className="nav-brand"><img src={LOGO} alt="" /><span>Sparkle</span></div>
        <span className="foot-txt">AutoQuest v{plugin.version} · par {plugin.author} · pour Discord</span>
      </footer>
    </div>
  );
}
