/**
 * @name AutoQuest
 * @author 999none
 * @description Automatically completes Discord quests with an integrated dashboard. Based on aamiaa's quest completion script (aligned with aamiaa gist rev de novembre 2025). Modified: shows all quests, auto-enrolls, status badges, filters, 2-column grid layout, native fetch API.
 * @version 1.5.0
 */

module.exports = (() => {
    /* ================================================================
     *  CONFIGURATION
     * ================================================================ */
    const META = {
        name: "AutoQuest",
        version: "1.5.0",
        description: "Automatically completes Discord quests (aligned with aamiaa gist rev de novembre 2025, video-progress sleep-first pattern).",
        github: "",
        updateUrl: "",
        updateCheckUrl: ""
    };

    const DEFAULT_SETTINGS = {
        autoComplete: false,
        notifications: true,
        autoUpdate: true
    };

    const SUPPORTED_TASKS = [
        "WATCH_VIDEO",
        "PLAY_ON_DESKTOP",
        "PLAY_ON_DESKTOP_V2",
        "STREAM_ON_DESKTOP",
        "PLAY_ACTIVITY",
        "WATCH_VIDEO_ON_MOBILE"
    ];

    const API_BASE = "https://discord.com/api/v9";
    const CDN_BASE = "https://cdn.discordapp.com";

    /* ================================================================
     *  LOCALIZATION
     * ================================================================ */
    const L10N = {
        "en-US": {
            title: "AutoQuest",
            autoComplete: "Auto-Complete",
            noQuests: "No quests available",
            complete: "Complete",
            completing: "Completing...",
            completed: "Completed",
            notEnrolled: "Not enrolled",
            expired: "Expired",
            available: "Available",
            enrolling: "Enrolling...",
            minutesLeft: "min left",
            settingsNotifications: "Quest Notifications",
            settingsNotificationsNote: "Show a toast when a new quest becomes available",
            settingsAutoComplete: "Auto-Complete Quests",
            settingsAutoCompleteNote: "Complete quests automatically in the background (auto-enrolls if needed)",
            settingsAutoUpdate: "Auto-Update",
            settingsAutoUpdateNote: "Check GitHub for new versions and install them",
            newQuest: "New quest available!",
            questDone: "Quest completed!",
            updateReady: "AutoQuest update available!",
            desktopOnly: "This quest requires the desktop app",
            noChannel: "No suitable channel found for activity quest",
            started: "AutoQuest started",
            stopped: "AutoQuest stopped",
            moduleError: "Some modules could not be found. Check console for details.",
            enrollFailed: "Failed to enroll in quest",
            unsupportedTask: "Unsupported",
            filterAll: "All",
            filterAvailable: "Available",
            filterNotEnrolled: "Not enrolled",
            filterCompleted: "Completed",
            filterClaimable: "Claimable",
            claimed: "Claimed",
            claimAllRewards: "Claim {n} reward(s)",
            claimableReady: "reward(s) ready to claim",
            goToQuests: "Quests"
        },
        fr: {
            title: "AutoQuest",
            autoComplete: "Auto-Completion",
            noQuests: "Aucune quete disponible",
            complete: "Completer",
            completing: "En cours...",
            completed: "Terminee",
            notEnrolled: "Non inscrit",
            expired: "Expiree",
            available: "Disponible",
            enrolling: "Inscription...",
            minutesLeft: "min restantes",
            settingsNotifications: "Notifications de Quetes",
            settingsNotificationsNote: "Afficher un toast quand une nouvelle quete est disponible",
            settingsAutoComplete: "Auto-Completion des Quetes",
            settingsAutoCompleteNote: "Completer automatiquement les quetes en arriere-plan (inscription auto si necessaire)",
            settingsAutoUpdate: "Mise a jour automatique",
            settingsAutoUpdateNote: "Verifier et installer les mises a jour depuis GitHub",
            newQuest: "Nouvelle quete disponible !",
            questDone: "Quete terminee !",
            updateReady: "Mise a jour AutoQuest disponible !",
            desktopOnly: "Cette quete necessite l'application de bureau",
            noChannel: "Aucun salon adapte trouve pour la quete activite",
            started: "AutoQuest demarre",
            stopped: "AutoQuest arrete",
            moduleError: "Certains modules n'ont pas pu etre trouves. Voir la console pour les details.",
            enrollFailed: "Echec de l'inscription a la quete",
            unsupportedTask: "Non supporte",
            filterAll: "Toutes",
            filterAvailable: "Disponibles",
            filterNotEnrolled: "Non inscrit",
            filterCompleted: "Terminees",
            filterClaimable: "A reclamer",
            claimed: "Reclame",
            claimAllRewards: "Reclamer {n} recompense(s)",
            claimableReady: "recompense(s) a reclamer",
            goToQuests: "Quetes"
        },
        de: {
            title: "AutoQuest",
            autoComplete: "Auto-Abschluss",
            noQuests: "Keine Quests verfuegbar",
            complete: "Abschliessen",
            completing: "Wird abgeschlossen...",
            completed: "Abgeschlossen",
            notEnrolled: "Nicht eingeschrieben",
            expired: "Abgelaufen",
            available: "Verfuegbar",
            enrolling: "Einschreiben...",
            minutesLeft: "Min uebrig",
            settingsNotifications: "Quest-Benachrichtigungen",
            settingsNotificationsNote: "Toast anzeigen wenn eine neue Quest verfuegbar ist",
            settingsAutoComplete: "Quests automatisch abschliessen",
            settingsAutoCompleteNote: "Quests automatisch im Hintergrund abschliessen (automatische Einschreibung)",
            settingsAutoUpdate: "Auto-Update",
            settingsAutoUpdateNote: "Auf GitHub nach neuen Versionen suchen",
            newQuest: "Neue Quest verfuegbar!",
            questDone: "Quest abgeschlossen!",
            updateReady: "AutoQuest-Update verfuegbar!",
            desktopOnly: "Diese Quest erfordert die Desktop-App",
            noChannel: "Kein passender Kanal fuer Aktivitaets-Quest gefunden",
            started: "AutoQuest gestartet",
            stopped: "AutoQuest gestoppt",
            moduleError: "Einige Module konnten nicht gefunden werden. Details in der Konsole.",
            enrollFailed: "Einschreibung fehlgeschlagen",
            unsupportedTask: "Nicht unterstuetzt",
            filterAll: "Alle",
            filterAvailable: "Verfuegbar",
            filterNotEnrolled: "Nicht eingeschrieben",
            filterCompleted: "Abgeschlossen",
            filterClaimable: "Abholbar",
            claimed: "Abgeholt",
            claimAllRewards: "{n} Belohnung(en) abholen",
            claimableReady: "Belohnung(en) abholbar",
            goToQuests: "Quests"
        },
        es: {
            title: "AutoQuest",
            autoComplete: "Auto-Completar",
            noQuests: "No hay misiones disponibles",
            complete: "Completar",
            completing: "Completando...",
            completed: "Completada",
            notEnrolled: "No inscrito",
            expired: "Expirada",
            available: "Disponible",
            enrolling: "Inscribiendo...",
            minutesLeft: "min restantes",
            settingsNotifications: "Notificaciones de Misiones",
            settingsNotificationsNote: "Mostrar un aviso cuando una nueva mision este disponible",
            settingsAutoComplete: "Auto-Completar Misiones",
            settingsAutoCompleteNote: "Completar misiones automaticamente en segundo plano (inscripcion automatica)",
            settingsAutoUpdate: "Actualizacion automatica",
            settingsAutoUpdateNote: "Buscar e instalar actualizaciones desde GitHub",
            newQuest: "Nueva mision disponible!",
            questDone: "Mision completada!",
            updateReady: "Actualizacion de AutoQuest disponible!",
            desktopOnly: "Esta mision requiere la aplicacion de escritorio",
            noChannel: "No se encontro un canal adecuado para la mision de actividad",
            started: "AutoQuest iniciado",
            stopped: "AutoQuest detenido",
            moduleError: "Algunos modulos no se pudieron encontrar. Ver la consola para detalles.",
            enrollFailed: "Error al inscribirse",
            unsupportedTask: "No soportado",
            filterAll: "Todas",
            filterAvailable: "Disponibles",
            filterNotEnrolled: "No inscrito",
            filterCompleted: "Completadas",
            filterClaimable: "Reclamables",
            claimed: "Reclamado",
            claimAllRewards: "Reclamar {n} recompensa(s)",
            claimableReady: "recompensa(s) para reclamar",
            goToQuests: "Misiones"
        },
        "pt-BR": {
            title: "AutoQuest",
            autoComplete: "Auto-Completar",
            noQuests: "Nenhuma missao disponivel",
            complete: "Completar",
            completing: "Completando...",
            completed: "Completada",
            notEnrolled: "Nao inscrito",
            expired: "Expirada",
            available: "Disponivel",
            enrolling: "Inscrevendo...",
            minutesLeft: "min restantes",
            settingsNotifications: "Notificacoes de Missoes",
            settingsNotificationsNote: "Mostrar notificacao quando uma nova missao estiver disponivel",
            settingsAutoComplete: "Auto-Completar Missoes",
            settingsAutoCompleteNote: "Completar missoes automaticamente em segundo plano (inscricao automatica)",
            settingsAutoUpdate: "Atualizacao automatica",
            settingsAutoUpdateNote: "Verificar e instalar atualizacoes do GitHub",
            newQuest: "Nova missao disponivel!",
            questDone: "Missao completada!",
            updateReady: "Atualizacao do AutoQuest disponivel!",
            desktopOnly: "Esta missao requer o aplicativo desktop",
            noChannel: "Nenhum canal adequado encontrado para a missao de atividade",
            started: "AutoQuest iniciado",
            stopped: "AutoQuest parado",
            moduleError: "Alguns modulos nao foram encontrados. Veja o console para detalhes.",
            enrollFailed: "Falha na inscricao",
            unsupportedTask: "Nao suportado",
            filterAll: "Todas",
            filterAvailable: "Disponiveis",
            filterNotEnrolled: "Nao inscrito",
            filterCompleted: "Completadas",
            filterClaimable: "Resgatavel",
            claimed: "Resgatado",
            claimAllRewards: "Resgatar {n} recompensa(s)",
            claimableReady: "recompensa(s) para resgatar",
            goToQuests: "Missoes"
        },
        ja: {
            title: "AutoQuest",
            autoComplete: "Auto Complete",
            noQuests: "Questnashi",
            complete: "Kanryou",
            completing: "Shori-chuu...",
            completed: "Kanryou",
            notEnrolled: "Mi-touroku",
            expired: "Kigen-gire",
            available: "Riyou-kanou",
            enrolling: "Touroku-chuu...",
            minutesLeft: "fun nokori",
            settingsNotifications: "Quest Tsuuchi",
            settingsNotificationsNote: "Atarashii quest ga aru toki tsuuchi wo hyouji suru",
            settingsAutoComplete: "Quest Jidou Kanryou",
            settingsAutoCompleteNote: "Background de quest wo jidou kanryou suru (jidou touroku)",
            settingsAutoUpdate: "Jidou Update",
            settingsAutoUpdateNote: "GitHub kara atarashii version wo check suru",
            newQuest: "Atarashii quest!",
            questDone: "Quest kanryou!",
            updateReady: "AutoQuest update!",
            desktopOnly: "Desktop app ga hitsuyou",
            noChannel: "Tekisetsu na channel ga mitsukaranai",
            started: "AutoQuest kaishi",
            stopped: "AutoQuest teishi",
            moduleError: "Module ga mitsukaranai. Console wo kakunin shite kudasai.",
            enrollFailed: "Touroku shippai",
            unsupportedTask: "Fusapo-to",
            filterAll: "Subete",
            filterAvailable: "Riyou-kanou",
            filterNotEnrolled: "Mi-touroku",
            filterCompleted: "Kanryou",
            filterClaimable: "Uketori-kanou",
            claimed: "Uketori-zumi",
            claimAllRewards: "Houshu wo {n} uketoru",
            claimableReady: "uketori kanou na houshu",
            goToQuests: "Quest"
        }
    };

    /* ================================================================
     *  CSS — Glassmorphism / Modern / Animated
     * ================================================================ */
    const CSS = `
/* ===== AUTOQUEST — GLASSMORPHISM THEME ===== */

/* ---- Keyframes ---- */
@keyframes aq-in{0%{opacity:0;transform:translate(-50%,-50%) translateY(-14px) scale(.95);filter:blur(6px)}100%{opacity:1;transform:translate(-50%,-50%) translateY(0) scale(1);filter:blur(0)}}
@keyframes aq-tile-enter{0%{opacity:0;transform:translateY(18px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes aq-shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes aq-glow-pulse{0%,100%{box-shadow:0 0 8px rgba(139,124,247,.3)}50%{box-shadow:0 0 20px rgba(139,124,247,.45)}}
@keyframes aq-gradient-flow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes aq-badge-pop{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
@keyframes aq-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes aq-settings-in{0%{opacity:0;transform:translateY(-10px)}100%{opacity:1;transform:translateY(0)}}

/* ---- Toolbar Icon ---- */
.aq-toolbar-btn{position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;cursor:pointer;color:var(--interactive-normal);transition:color .2s,filter .3s;margin:0 8px}
.aq-toolbar-btn:hover{color:var(--interactive-hover);filter:drop-shadow(0 0 6px rgba(139,124,247,.5))}
.aq-toolbar-btn.aq-active{color:#8b7cf7;filter:drop-shadow(0 0 10px rgba(139,124,247,.6))}
.aq-toolbar-btn img.aq-icon{width:24px;height:24px;border-radius:50%;object-fit:cover;transition:transform .3s cubic-bezier(.25,.8,.25,1)}
.aq-toolbar-btn:hover img.aq-icon{transform:scale(1.12)}
.aq-toolbar-btn svg{width:24px;height:24px}
.aq-orbs-hdr{display:flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:rgba(139,124,247,.1);border:1px solid rgba(139,124,247,.15);font-size:12px;font-weight:700;color:var(--header-primary,#ededf5);line-height:1;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:all .25s cubic-bezier(.25,.8,.25,1)}
.aq-orbs-hdr:hover{background:rgba(139,124,247,.18);border-color:rgba(139,124,247,.3);box-shadow:0 0 12px rgba(139,124,247,.15)}
.aq-orbs-hdr img{width:16px;height:16px}
.aq-badge{position:absolute;top:-5px;right:-7px;min-width:17px;height:17px;padding:0 4px;background:linear-gradient(135deg,#f23f43,#ff6b6b);border-radius:9px;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;pointer-events:none;box-sizing:border-box;animation:aq-badge-pop .35s cubic-bezier(.25,.8,.25,1);box-shadow:0 2px 8px rgba(242,63,67,.4)}

/* ---- Popout Overlay ---- */
.aq-overlay{position:fixed;inset:0;z-index:1001;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
.aq-popout{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:min(750px,90vw);height:min(600px,85vh);background:rgba(12,12,20,.82);backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);border-radius:18px;border:1px solid rgba(255,255,255,.06);box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.03) inset,0 2px 60px -10px rgba(139,124,247,.12);display:flex!important;flex-direction:column!important;overflow:hidden!important;animation:aq-in .3s cubic-bezier(.25,.8,.25,1) both;z-index:1002}

/* ---- Accent Line ---- */
.aq-accent-line{height:2px;background:linear-gradient(90deg,transparent,#8b7cf7,#56d4c8,transparent);background-size:200% 100%;animation:aq-gradient-flow 4s ease infinite;opacity:.6;flex-shrink:0}

/* ---- Header ---- */
.aq-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:none}
.aq-hdr-left{display:flex;align-items:center;gap:10px}
.aq-hdr-title{font-size:24px;font-weight:800;color:#ededf5;letter-spacing:-.04em;background:linear-gradient(135deg,#ededf5 60%,#8b7cf7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* ---- Claim All Bar ---- */
.aq-claim-all-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(139,124,247,.06);border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.aq-claim-all-info{display:flex;align-items:center;gap:7px;font-size:11px;color:#a4a4bc}
.aq-claim-all-info svg{width:14px;height:14px;color:#8b7cf7}
.aq-claim-all-count{font-weight:700;color:#8b7cf7}
.aq-claim-all-btn{padding:6px 16px;font-size:11px;font-weight:700;border:none;border-radius:20px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#8b7cf7,#56d4c8);transition:all .25s cubic-bezier(.25,.8,.25,1);display:flex;align-items:center;gap:5px;letter-spacing:.02em;box-shadow:0 2px 12px rgba(139,124,247,.25)}
.aq-claim-all-btn:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(139,124,247,.4)}
.aq-claim-all-btn:active{transform:translateY(0) scale(.97)}
.aq-claim-all-btn svg{width:12px;height:12px}

/* ---- Toggle Switch ---- */
.aq-sw{position:relative;width:38px;height:20px;cursor:pointer;display:inline-block}
.aq-sw input{opacity:0;width:0;height:0;position:absolute}
.aq-sw-track{position:absolute;inset:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.06);border-radius:10px;transition:all .3s cubic-bezier(.25,.8,.25,1)}
.aq-sw-track::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;background:rgba(255,255,255,.6);border-radius:50%;transition:all .3s cubic-bezier(.25,.8,.25,1);box-shadow:0 1px 4px rgba(0,0,0,.2)}
.aq-sw input:checked+.aq-sw-track{background:linear-gradient(135deg,#8b7cf7,#56d4c8);border-color:rgba(139,124,247,.3);box-shadow:0 0 14px rgba(139,124,247,.25)}
.aq-sw input:checked+.aq-sw-track::after{transform:translateX(18px);background:#fff;box-shadow:0 1px 6px rgba(139,124,247,.4)}

/* ---- Filter Tabs ---- */
.aq-filters{display:flex;flex-wrap:nowrap;gap:4px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.06);overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.aq-filters::-webkit-scrollbar{display:none}
.aq-filter-btn{flex:0 0 auto;padding:5px 12px;font-size:10px;font-weight:600;border:1px solid transparent;border-radius:20px;cursor:pointer;color:#5c5c72;background:transparent;transition:all .25s cubic-bezier(.25,.8,.25,1);white-space:nowrap;line-height:1.4}
.aq-filter-btn:hover{color:#a4a4bc;background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.06)}
.aq-filter-btn.aq-filter-active{color:#fff;background:linear-gradient(135deg,rgba(139,124,247,.25),rgba(86,212,200,.15));border-color:rgba(139,124,247,.25);box-shadow:0 0 12px rgba(139,124,247,.12)}
.aq-filter-count{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;margin-left:4px;font-size:8px;font-weight:700;border-radius:8px;background:rgba(255,255,255,.1);color:inherit;transition:all .2s}

/* ---- Scroll Wrapper ---- */
.aq-scroll-wrap{flex:1 1 0%;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch}
.aq-scroll-wrap::-webkit-scrollbar{width:6px}
.aq-scroll-wrap::-webkit-scrollbar-thumb{background:rgba(139,124,247,.25);border-radius:3px;min-height:40px}
.aq-scroll-wrap::-webkit-scrollbar-thumb:hover{background:rgba(139,124,247,.45)}
.aq-scroll-wrap::-webkit-scrollbar-track{background:transparent}

/* ---- Quest Grid ---- */
.aq-grid{padding:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px;align-content:start}

/* ---- Quest Card (Glassmorphism) ---- */
.aq-tile{display:flex;flex-direction:column;background:rgba(255,255,255,.035);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:14px;border:1px solid rgba(255,255,255,.06);overflow:hidden;transition:all .3s cubic-bezier(.25,.8,.25,1);cursor:default;animation:aq-tile-enter .4s cubic-bezier(.25,.8,.25,1) both}
.aq-tile:hover{transform:translateY(-3px);background:rgba(255,255,255,.065);border-color:rgba(255,255,255,.14);box-shadow:0 8px 24px rgba(0,0,0,.25),0 0 20px rgba(139,124,247,.08)}
.aq-tile.aq-tile-completed{opacity:.45}

/* ---- Status ---- */
.aq-tile-status-bar{display:flex;align-items:center;padding:8px 10px}
.aq-tile-status-inline{padding:3px 8px;border-radius:20px;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:all .2s}
.aq-tile-thumb-wrap{display:none}
.aq-tile-thumb{display:none}
.aq-tile-thumb-fb{display:none}
.aq-tile-status{position:absolute;top:5px;right:5px;padding:3px 8px;border-radius:20px;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
.aq-tile-status-completed{background:rgba(86,212,200,.12);color:#56d4c8;border:1px solid rgba(86,212,200,.18)}
.aq-tile-status-available{background:rgba(139,124,247,.12);color:#a99cf9;border:1px solid rgba(139,124,247,.18)}
.aq-tile-status-not-enrolled{background:rgba(148,155,164,.08);color:#8888a0;border:1px solid rgba(148,155,164,.12)}
.aq-tile-status-unsupported{background:rgba(242,99,67,.1);color:#e8755a;border:1px solid rgba(242,99,67,.12)}
.aq-tile-status-claimable{background:rgba(139,124,247,.12);color:#a99cf9;border:1px solid rgba(139,124,247,.18)}

/* ---- Tile Body ---- */
.aq-tile-body{padding:0 10px 10px;display:flex;flex-direction:column;gap:6px;flex:1}
.aq-tile-name{font-size:11px;font-weight:700;color:#ededf5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;letter-spacing:-.01em}
.aq-tile-task{font-size:9px;color:#5c5c72;text-transform:capitalize;line-height:1.2;font-weight:500}

/* ---- Progress ---- */
.aq-tile-prog-row{display:flex;align-items:center;gap:8px}
.aq-tile-prog{flex:1;height:4px;background:rgba(255,255,255,.06);border-radius:4px;overflow:hidden}
.aq-tile-prog-fill{height:100%;background:linear-gradient(90deg,#8b7cf7,#56d4c8);background-size:200% 100%;border-radius:4px;transition:width .5s cubic-bezier(.25,.8,.25,1);box-shadow:0 0 8px rgba(139,124,247,.3)}
.aq-tile-prog-fill.aq-done{background:linear-gradient(90deg,#56d4c8,#23a55a);box-shadow:0 0 8px rgba(86,212,200,.3)}
.aq-tile-pct{font-size:9px;font-weight:600;color:#a4a4bc;white-space:nowrap;flex-shrink:0}

/* ---- Buttons ---- */
.aq-tile-btn{width:100%;padding:6px 0;font-size:10px;font-weight:700;border:none;border-radius:10px;cursor:pointer;transition:all .25s cubic-bezier(.25,.8,.25,1);color:#fff;line-height:1.4;text-align:center;letter-spacing:.02em}
.aq-btn-primary{background:linear-gradient(135deg,#8b7cf7,#7065d9);box-shadow:0 2px 10px rgba(139,124,247,.2)}
.aq-btn-primary:hover{background:linear-gradient(135deg,#9d90f9,#8b7cf7);transform:translateY(-1px);box-shadow:0 4px 16px rgba(139,124,247,.35)}
.aq-btn-primary:active{transform:translateY(0) scale(.97)}
.aq-btn-ok{background:rgba(86,212,200,.12);color:#56d4c8;cursor:default;border:1px solid rgba(86,212,200,.12)}
.aq-btn-wait{background:linear-gradient(135deg,rgba(139,124,247,.25),rgba(86,212,200,.15));color:rgba(255,255,255,.7);cursor:wait;animation:aq-glow-pulse 2s ease-in-out infinite}
.aq-btn-disabled{background:rgba(255,255,255,.04);color:#5c5c72;cursor:not-allowed;border:1px solid rgba(255,255,255,.04)}
.aq-tile-btn:disabled{opacity:.35;cursor:not-allowed}

/* ---- Empty State ---- */
.aq-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;color:#5c5c72}
.aq-empty svg{width:40px;height:40px;margin-bottom:12px;opacity:.3;animation:aq-float 3s ease-in-out infinite}
.aq-empty-text{font-size:12px;font-weight:600;letter-spacing:-.01em}

/* ---- Footer ---- */
.aq-footer{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-top:1px solid rgba(255,255,255,.06);font-size:9px;color:#5c5c72;font-weight:500}
.aq-footer a{color:#8b7cf7;text-decoration:none;transition:color .2s}
.aq-footer a:hover{color:#a99cf9;text-decoration:underline}

/* ---- Settings ---- */
.aq-gear-btn{display:flex;align-items:center;justify-content:center;width:30px;height:30px;cursor:pointer;color:#a4a4bc;transition:color .3s cubic-bezier(.25,.8,.25,1),background .3s cubic-bezier(.25,.8,.25,1),border-color .3s cubic-bezier(.25,.8,.25,1);background:rgba(255,255,255,.04);border:1px solid transparent;padding:0;border-radius:10px}
.aq-gear-btn:hover{color:#fff;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}
.aq-gear-btn svg{width:18px;height:18px;transition:transform .3s cubic-bezier(.25,.8,.25,1)}
.aq-gear-btn:hover svg{transform:rotate(60deg)}
.aq-settings{flex:1 1 0!important;min-height:0!important;padding:10px;display:flex;flex-direction:column;gap:8px;background:transparent;animation:aq-settings-in .3s cubic-bezier(.25,.8,.25,1) both;overflow-y:auto!important;-webkit-overflow-scrolling:touch}
.aq-settings::-webkit-scrollbar{width:6px}
.aq-settings::-webkit-scrollbar-thumb{background:rgba(139,124,247,.25);border-radius:3px;min-height:40px}
.aq-settings::-webkit-scrollbar-thumb:hover{background:rgba(139,124,247,.45)}
.aq-settings::-webkit-scrollbar-track{background:transparent}
.aq-setting-row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(255,255,255,.035);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:12px 14px;transition:all .25s cubic-bezier(.25,.8,.25,1)}
.aq-setting-row:hover{background:rgba(255,255,255,.065);border-color:rgba(255,255,255,.14)}
.aq-setting-info{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.aq-setting-name{font-size:11px;font-weight:700;color:#ededf5;letter-spacing:-.01em}
.aq-setting-note{font-size:9px;color:#5c5c72;line-height:1.35;font-weight:500}

/* ---- Quests Button ---- */
.aq-goto-quests{padding:6px 14px;font-size:10px;font-weight:700;border:none;border-radius:20px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#8b7cf7,#56d4c8);transition:all .25s cubic-bezier(.25,.8,.25,1);display:flex;align-items:center;gap:5px;box-shadow:0 2px 10px rgba(139,124,247,.2)}
.aq-goto-quests:hover{transform:translateY(-1px);box-shadow:0 4px 18px rgba(139,124,247,.35)}
.aq-goto-quests:active{transform:translateY(0) scale(.97)}

/* ---- Debug ---- */
.aq-debug{display:none}

`;

    /* ================================================================
     *  PLUGIN CLASS
     * ================================================================ */
    return class AutoQuest {
        constructor() {
            this.settings = { ...DEFAULT_SETTINGS };
            this.modules = {};
            this.activeJobs = new Map();
            this.dashboardOpen = false;
            this.dashboardRoot = null;
            this.observer = null;
            this.pollInterval = null;
            this.autoInterval = null;
            this.knownQuestIds = new Set();
            this._forceUpdate = null;
            this._token = null;
            this._cleanFetch = null;
            this._fetchIframe = null;
            this._cleanFetchFailStreak = 0;
        }

        /* ================================================================
         *  LIFECYCLE
         * ================================================================ */
        start() {
            this.loadSettings();
            BdApi.DOM.addStyle(META.name, CSS);

            try {
                this.resolveModules();
            } catch (err) {
                console.error("[AutoQuest] Module resolution failed:", err);
                BdApi.UI.showToast(this.t("moduleError"), { type: "error" });
            }

            this.injectToolbarIcon();

            if (this.settings.autoComplete) this.startAutoComplete();

            this.pollInterval = setInterval(() => this.checkNewQuests(), 300_000);
            this.checkNewQuests();

            if (this.settings.autoUpdate) {
                setTimeout(() => this.checkForUpdates(), 10_000);
            }

            // Sparkle : pop-up de bienvenue (une fois par version)
            setTimeout(() => { try { this.showSparkleWelcome(); } catch (e) { console.error("[Sparkle] welcome failed", e); } }, 2500);

            BdApi.UI.showToast(this.t("started"), { type: "success" });
        }

        /* ================================================================
         *  SPARKLE WELCOME (changelog-style popup, once per version)
         * ================================================================ */
        showSparkleWelcome() {
            const SPARKLE_VERSION = META.version;
            const KEY = "sparkleWelcomeVersion";
            let seen = null;
            try { seen = BdApi.Data.load(META.name, KEY); } catch (_) {}
            if (seen === SPARKLE_VERSION) return; // déjà vu pour cette version

            const title = "Bienvenue sur Sparkle";
            const subtitle = `Version ${SPARKLE_VERSION}`;
            const blurb = "Sparkle a configuré ton Discord pour toi. Voici tout ce qui vient d'être installé et activé automatiquement.";
            const changes = [
                {
                    title: "Ce que Sparkle inclut",
                    type: "added",
                    items: [
                        "**Vencord (BDVencord)** — le client mod est installé et injecté dans Discord.",
                        "**Compatibilité BetterDiscord** — tes plugins BetterDiscord fonctionnent désormais dans Discord.",
                        "**AutoQuest** — complète automatiquement tes quêtes Discord, avec un tableau de bord intégré.",
                    ],
                },
                {
                    title: "Pour démarrer",
                    type: "improved",
                    items: [
                        "Ouvre le **tableau de bord AutoQuest** depuis l'icône dans la barre d'outils.",
                        "Tes quêtes se complètent toutes seules — laisse Sparkle travailler pour toi.",
                    ],
                },
            ];

            const markSeen = () => { try { BdApi.Data.save(META.name, KEY, SPARKLE_VERSION); } catch (_) {} };

            // 1) Modal changelog natif de BetterDiscord (style "nouvelle version")
            try {
                if (BdApi.UI && typeof BdApi.UI.showChangelogModal === "function") {
                    BdApi.UI.showChangelogModal({ title, subtitle, blurb, changes });
                    markSeen();
                    return;
                }
            } catch (e) { console.error("[Sparkle] changelog modal error", e); }

            // 2) Fallback : modal de confirmation simple
            try {
                if (BdApi.UI && typeof BdApi.UI.showConfirmationModal === "function") {
                    const text = [
                        blurb, "",
                        "Sparkle inclut :",
                        "• Vencord / BDVencord (client mod installé et injecté)",
                        "• Compatibilité BetterDiscord (tes plugins BD fonctionnent)",
                        "• AutoQuest (complétion automatique des quêtes + dashboard)",
                    ].join("\n");
                    BdApi.UI.showConfirmationModal(title, text, {
                        confirmText: "C'est parti",
                        cancelText: null,
                    });
                    markSeen();
                    return;
                }
            } catch (e) { console.error("[Sparkle] confirmation modal error", e); }

            // 3) Dernier recours : toast
            try {
                BdApi.UI.showToast(`${title} — Vencord + BdCompat + AutoQuest sont prêts !`, { type: "success", timeout: 6000 });
            } catch (_) {}
            markSeen();
        }

        stop() {
            BdApi.DOM.removeStyle(META.name);
            BdApi.Patcher.unpatchAll(META.name);

            for (const [, job] of this.activeJobs) {
                if (job.cancel) job.cancel();
            }
            this.activeJobs.clear();

            if (this.pollInterval) clearInterval(this.pollInterval);
            if (this.autoInterval) clearInterval(this.autoInterval);

            if (this.observer) { this.observer.disconnect(); this.observer = null; }

            this.closeDashboard();
            document.querySelectorAll(".aq-toolbar-btn").forEach(el => el.remove());

            // Clean up iframe used for unpatched fetch
            if (this._fetchIframe) {
                try { this._fetchIframe.remove(); } catch {}
                this._fetchIframe = null;
                this._cleanFetch = null;
            }
            this._token = null;

            BdApi.UI.showToast(this.t("stopped"), { type: "info" });
        }

        /* ================================================================
         *  SETTINGS
         * ================================================================ */
        loadSettings() {
            const saved = BdApi.Data.load(META.name, "settings");
            this.settings = { ...DEFAULT_SETTINGS, ...saved };
        }

        saveSettings() {
            BdApi.Data.save(META.name, "settings", this.settings);
        }

        getSettingsPanel() {
            return BdApi.UI.buildSettingsPanel({
                settings: [
                    {
                        type: "switch",
                        id: "notifications",
                        name: this.t("settingsNotifications"),
                        note: this.t("settingsNotificationsNote"),
                        value: this.settings.notifications
                    },
                    {
                        type: "switch",
                        id: "autoComplete",
                        name: this.t("settingsAutoComplete"),
                        note: this.t("settingsAutoCompleteNote"),
                        value: this.settings.autoComplete
                    },
                    {
                        type: "switch",
                        id: "autoUpdate",
                        name: this.t("settingsAutoUpdate"),
                        note: this.t("settingsAutoUpdateNote"),
                        value: this.settings.autoUpdate
                    }
                ],
                onChange: (_, id, value) => {
                    this.settings[id] = value;
                    this.saveSettings();

                    if (id === "autoComplete") {
                        value ? this.startAutoComplete() : this.stopAutoComplete();
                        if (this._forceUpdate) this._forceUpdate();
                    }
                }
            });
        }

        /* ================================================================
         *  LOCALIZATION
         * ================================================================ */
        getLocale() {
            // Cache locale for 30s to avoid repeated Webpack lookups
            const now = Date.now();
            if (this._cachedLocale && now - this._cachedLocaleTs < 30_000) return this._cachedLocale;
            try {
                const store = BdApi.Webpack.getStore?.("LocaleStore");
                if (store?.locale) { this._cachedLocale = store.locale; this._cachedLocaleTs = now; return store.locale; }

                const localeModule = BdApi.Webpack.getModule(m => m?.getLocale, { searchExports: true });
                const loc = localeModule?.getLocale?.() || navigator.language || "en-US";
                this._cachedLocale = loc; this._cachedLocaleTs = now;
                return loc;
            } catch { return "en-US"; }
        }

        t(key) {
            const locale = this.getLocale();
            const lang = locale.split("-")[0];
            const strings = L10N[locale] || L10N[lang] || L10N["en-US"];
            return strings[key] || L10N["en-US"][key] || key;
        }

        /* ================================================================
         *  WEBPACK MODULE RESOLUTION
         * ================================================================ */
        resolveModules() {
            const log = (name, found, key) => {
                if (found) {
                    console.log(`[AutoQuest] Found: ${name}`);
                } else {
                    console.warn(`[AutoQuest] Not found: ${name} (expected export key: ${key})`);
                }
            };

            // Safely wrap each resolver so a single broken module doesn't cascade.
            const safe = (name, fn) => {
                try { return fn(); }
                catch (e) { console.warn(`[AutoQuest] Resolver failed for ${name}:`, e?.message || e); return null; }
            };

            // Token module - critical for native fetch
            this.modules.TokenStore = safe("TokenStore", () =>
                BdApi.Webpack.getModule(m => m?.getToken && typeof m.getToken === "function", { searchExports: true }) ||
                BdApi.Webpack.getStore?.("AuthenticationStore")
            );
            log("TokenStore", !!this.modules.TokenStore, "getToken");

            // QuestsStore — gist targets exports.A with getQuest on __proto__
            this.modules.QuestsStore = safe("QuestsStore", () =>
                BdApi.Webpack.getStore?.("QuestsStore") ||
                BdApi.Webpack.getModule(m => m?.getQuest && m?.quests, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.__proto__?.getQuest && m?.quests, { searchExports: true }) ||
                this._findByExportKey("A", "getQuest", true) ||
                this._findModuleByProto("getQuest", "quests")
            );
            if (this.modules.QuestsStore && !this._hasMethod(this.modules.QuestsStore, "getQuest")) {
                console.warn("[AutoQuest] QuestsStore missing getQuest signature; discarding.");
                this.modules.QuestsStore = null;
            }
            log("QuestsStore", !!this.modules.QuestsStore, "A");

            // RunningGameStore — gist targets exports.Ay with getRunningGames (own method)
            this.modules.RunningGameStore = safe("RunningGameStore", () =>
                BdApi.Webpack.getStore?.("RunningGameStore") ||
                BdApi.Webpack.getModule(m => m?.getRunningGames, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.__proto__?.getRunningGames, { searchExports: true }) ||
                this._findByExportKey("Ay", "getRunningGames", false) ||
                this._findModuleByProto("getRunningGames")
            );
            if (this.modules.RunningGameStore && !this._hasMethod(this.modules.RunningGameStore, "getRunningGames")) {
                console.warn("[AutoQuest] RunningGameStore missing getRunningGames signature; discarding.");
                this.modules.RunningGameStore = null;
            }
            log("RunningGameStore", !!this.modules.RunningGameStore, "Ay");

            // ApplicationStreamingStore — gist targets exports.A with getStreamerActiveStreamMetadata on __proto__
            this.modules.ApplicationStreamingStore = safe("ApplicationStreamingStore", () =>
                BdApi.Webpack.getStore?.("ApplicationStreamingStore") ||
                BdApi.Webpack.getModule(m => m?.getStreamerActiveStreamMetadata, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.__proto__?.getStreamerActiveStreamMetadata, { searchExports: true }) ||
                this._findByExportKey("A", "getStreamerActiveStreamMetadata", true) ||
                this._findModuleByProto("getStreamerActiveStreamMetadata")
            );
            if (this.modules.ApplicationStreamingStore && !this._hasMethod(this.modules.ApplicationStreamingStore, "getStreamerActiveStreamMetadata")) {
                console.warn("[AutoQuest] ApplicationStreamingStore missing getStreamerActiveStreamMetadata signature; discarding.");
                this.modules.ApplicationStreamingStore = null;
            }
            log("ApplicationStreamingStore", !!this.modules.ApplicationStreamingStore, "A");

            // ChannelStore — gist targets exports.A with getAllThreadsForParent on __proto__
            this.modules.ChannelStore = safe("ChannelStore", () =>
                BdApi.Webpack.getStore?.("ChannelStore") ||
                BdApi.Webpack.getModule(m => m?.getSortedPrivateChannels, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.__proto__?.getSortedPrivateChannels, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.getAllThreadsForParent, { searchExports: true }) ||
                this._findByExportKey("A", "getAllThreadsForParent", true)
            );
            log("ChannelStore", !!this.modules.ChannelStore, "A");

            // GuildChannelStore — gist targets exports.Ay with getSFWDefaultChannel (own method)
            this.modules.GuildChannelStore = safe("GuildChannelStore", () =>
                BdApi.Webpack.getStore?.("GuildChannelStore") ||
                BdApi.Webpack.getModule(m => m?.getSFWDefaultChannel, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.__proto__?.getSFWDefaultChannel, { searchExports: true }) ||
                this._findByExportKey("Ay", "getSFWDefaultChannel", false)
            );
            log("GuildChannelStore", !!this.modules.GuildChannelStore, "Ay");

            // FluxDispatcher — gist targets exports.h with flushWaitQueue on __proto__
            this.modules.FluxDispatcher = safe("FluxDispatcher", () =>
                BdApi.Webpack.getModule(m => m?.dispatch && m?.subscribe && m?.unsubscribe, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.__proto__?.flushWaitQueue && m?.dispatch, { searchExports: true }) ||
                this._findByExportKey("h", "flushWaitQueue", true) ||
                this._findFluxDispatcher()
            );
            if (this.modules.FluxDispatcher && typeof this.modules.FluxDispatcher.dispatch !== "function") {
                console.warn("[AutoQuest] FluxDispatcher missing dispatch signature; discarding.");
                this.modules.FluxDispatcher = null;
            }
            log("FluxDispatcher", !!this.modules.FluxDispatcher, "h");

            // Discord's internal HTTP API module (Bo) — has get/post
            this.modules.DiscordAPI = safe("DiscordAPI", () => this._findDiscordAPI());
            log("DiscordAPI", !!this.modules.DiscordAPI, "Bo");

            // Super Properties module (needed for proper API authentication)
            this.modules.SuperProperties = safe("SuperProperties", () => this._findSuperProperties());
            log("SuperProperties", !!this.modules.SuperProperties, "getSuperPropertiesBase64");

            // Navigation module (for internal Discord routing to /quests)
            this.modules.NavigationUtils = safe("NavigationUtils", () =>
                BdApi.Webpack.getModule(m => m?.transitionTo && typeof m.transitionTo === "function", { searchExports: true }) ||
                BdApi.Webpack.getModule(m => m?.transitionToGuild && typeof m.transitionTo === "function", { searchExports: true }) ||
                // Newer Discord builds renamed transitionTo -> replace/push/navigate
                BdApi.Webpack.getModule(m => m?.replaceWith && m?.transitionTo, { searchExports: true }) ||
                BdApi.Webpack.getModule(m => (typeof m?.replace === "function") && (typeof m?.push === "function") && (typeof m?.back === "function"), { searchExports: true }) ||
                BdApi.Webpack.getModule(m => typeof m?.navigate === "function" && typeof m?.push === "function", { searchExports: true })
            );
            log("NavigationUtils", !!this.modules.NavigationUtils, "transitionTo");

            const found = Object.entries(this.modules).filter(([, v]) => !!v).length;
            const total = Object.keys(this.modules).length;
            console.log(`[AutoQuest] Module resolution: ${found}/${total} found`);

            if (!this.modules.QuestsStore) {
                console.error("[AutoQuest] CRITICAL: QuestsStore not found.");
            }
            if (!this.modules.TokenStore) {
                console.warn("[AutoQuest] WARNING: TokenStore not found. Will try fallback token methods.");
            }
        }

        /**
         * Version signature check — ensures the resolved module actually exposes
         * the expected method (as own or via __proto__) before we trust it.
         */
        _hasMethod(mod, methodName) {
            if (!mod) return false;
            try {
                if (typeof mod[methodName] === "function") return true;
                if (typeof mod?.__proto__?.[methodName] === "function") return true;
            } catch {}
            return false;
        }

        /**
         * Fast path finder aligned with the aamiaa gist: look up modules by an
         * exact minified export key (A, Ay, Bo, h, ...) and validate a specific
         * method signature either on the export itself or on its prototype.
         */
        _findByExportKey(exportKey, methodName, onProto) {
            try {
                let wpRequire;
                try {
                    wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                    webpackChunkdiscord_app.pop();
                } catch { return null; }
                if (!wpRequire?.c) return null;
                for (const m of Object.values(wpRequire.c)) {
                    try {
                        const exp = m?.exports?.[exportKey];
                        if (!exp) continue;
                        const target = onProto ? (exp?.__proto__ || exp) : exp;
                        if (typeof target?.[methodName] === "function") return exp;
                    } catch {}
                }
            } catch (e) {
                console.warn(`[AutoQuest] _findByExportKey(${exportKey}, ${methodName}) failed:`, e?.message || e);
            }
            return null;
        }

        _findModuleByProto(...methodNames) {
            try {
                let wpRequire;
                try {
                    wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                    webpackChunkdiscord_app.pop();
                } catch { return null; }
                if (!wpRequire?.c) return null;
                for (const m of Object.values(wpRequire.c)) {
                    try {
                        for (const key of ['exports', '']) {
                            const base = key ? m[key] : m;
                            if (!base) continue;
                            for (const expKey of ['Z', 'A', 'ZP', 'Ay', 'Bo', 'default', '']) {
                                const exp = expKey ? base[expKey] : base;
                                if (!exp) continue;
                                const proto = exp?.__proto__ || exp;
                                const hasAll = methodNames.every(name =>
                                    typeof proto[name] === "function" || typeof exp[name] === "function"
                                );
                                if (hasAll) return exp;
                            }
                        }
                    } catch {}
                }
            } catch (e) { console.warn("[AutoQuest] _findModuleByProto failed:", e); }
            return null;
        }

        _findFluxDispatcher() {
            try {
                let wpRequire;
                try {
                    wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                    webpackChunkdiscord_app.pop();
                } catch { return null; }
                if (!wpRequire?.c) return null;
                for (const m of Object.values(wpRequire.c)) {
                    try {
                        for (const expKey of ['Z', 'h', 'A', 'default']) {
                            const exp = m?.exports?.[expKey];
                            if (exp?.__proto__?.flushWaitQueue && typeof exp?.dispatch === "function") return exp;
                        }
                    } catch {}
                }
            } catch {}
            return null;
        }

        _findDiscordAPI() {
            try {
                // Try BdApi.Webpack first
                const api = BdApi.Webpack.getModule(m => m?.get && m?.post && m?.patch && m?.del, { searchExports: true });
                if (api) return api;
            } catch {}
            // Gist-aligned fast path: exports.Bo with get + post
            try {
                const viaKey = this._findByExportKey("Bo", "get", false);
                if (viaKey && typeof viaKey.post === "function") return viaKey;
            } catch {}
            try {
                let wpRequire;
                try {
                    wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                    webpackChunkdiscord_app.pop();
                } catch { return null; }
                if (!wpRequire?.c) return null;
                for (const m of Object.values(wpRequire.c)) {
                    try {
                        for (const expKey of ['Bo', 'Z', 'A', 'default', 'Ay', '']) {
                            const exp = expKey ? m?.exports?.[expKey] : m?.exports;
                            if (exp && typeof exp.get === "function" && typeof exp.post === "function") {
                                return exp;
                            }
                        }
                    } catch {}
                }
            } catch {}
            return null;
        }

        _findSuperProperties() {
            try {
                // Strategy 1: BdApi.Webpack
                const sp = BdApi.Webpack.getModule(m => m?.getSuperPropertiesBase64, { searchExports: true });
                if (sp) return sp;
            } catch {}
            try {
                const sp = BdApi.Webpack.getModule(m => typeof m?.getSuperProperties === "function", { searchExports: true });
                if (sp) return sp;
            } catch {}
            try {
                let wpRequire;
                try {
                    wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                    webpackChunkdiscord_app.pop();
                } catch { return null; }
                if (!wpRequire?.c) return null;
                for (const m of Object.values(wpRequire.c)) {
                    try {
                        for (const expKey of ['Z', 'A', 'default', 'Ay', 'Bo', '']) {
                            const exp = expKey ? m?.exports?.[expKey] : m?.exports;
                            if (exp && typeof exp.getSuperPropertiesBase64 === "function") return exp;
                            if (exp && typeof exp.getSuperProperties === "function") return exp;
                        }
                    } catch {}
                }
            } catch {}
            return null;
        }

        _getSuperPropertiesHeader() {
            try {
                const sp = this.modules.SuperProperties;
                if (sp?.getSuperPropertiesBase64) return sp.getSuperPropertiesBase64();
                if (sp?.getSuperProperties) return btoa(JSON.stringify(sp.getSuperProperties()));
            } catch {}
            return null;
        }

        /* ================================================================
         *  NATIVE FETCH API (replaces api.post/api.get)
         *  Fixes the t[1].toLowerCase bug from Discord's internal HTTP module
         *  Uses an iframe to get an unpatched fetch that bypasses Discord's proxy
         * ================================================================ */
        _getCleanFetch() {
            if (this._cleanFetch) return this._cleanFetch;
            try {
                // Strategy 1: Grab fetch from a fresh iframe (bypasses Discord's fetch proxy)
                const iframe = document.createElement("iframe");
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                if (iframe.contentWindow && typeof iframe.contentWindow.fetch === "function") {
                    this._cleanFetch = iframe.contentWindow.fetch.bind(iframe.contentWindow);
                    this._fetchIframe = iframe;
                    console.log("[AutoQuest] Using clean fetch from iframe (bypasses Discord HTTP proxy)");
                    return this._cleanFetch;
                }
                iframe.remove();
            } catch (e) {
                console.warn("[AutoQuest] iframe fetch failed:", e);
            }

            try {
                // Strategy 2: Try to find the original fetch on the window (some BD versions keep it)
                if (window.__ORIGINAL_FETCH__) {
                    this._cleanFetch = window.__ORIGINAL_FETCH__.bind(window);
                    console.log("[AutoQuest] Using __ORIGINAL_FETCH__");
                    return this._cleanFetch;
                }
            } catch {}

            // Strategy 3: Fallback to global fetch (may still have the bug)
            console.warn("[AutoQuest] Could not get clean fetch, falling back to global fetch");
            this._cleanFetch = fetch.bind(window);
            return this._cleanFetch;
        }

        _getToken() {
            // Clear cached token periodically to prevent stale tokens
            try {
                // Strategy 1: TokenStore module (most reliable)
                if (this.modules.TokenStore?.getToken) {
                    const freshToken = this.modules.TokenStore.getToken();
                    if (freshToken) {
                        this._token = freshToken;
                        return this._token;
                    }
                }
                // Strategy 2: Webpack search
                let wpRequire;
                try {
                    wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
                    webpackChunkdiscord_app.pop();
                } catch { /* ignore */ }
                if (wpRequire?.c) {
                    for (const m of Object.values(wpRequire.c)) {
                        try {
                            for (const key of ['Z', 'A', 'default', 'Ay', 'Bo', '']) {
                                const exp = key ? m?.exports?.[key] : m?.exports;
                                if (exp?.getToken && typeof exp.getToken === "function") {
                                    this._token = exp.getToken();
                                    if (this._token) return this._token;
                                }
                            }
                        } catch {}
                    }
                }
                // Strategy 3: document.body (last resort)
                const iframe = document.createElement("iframe");
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                const token = iframe.contentWindow?.localStorage?.getItem?.("token");
                iframe.remove();
                if (token) {
                    this._token = JSON.parse(token);
                    return this._token;
                }
            } catch (e) {
                console.error("[AutoQuest] Token retrieval failed:", e);
            }
            return null;
        }

        _buildHeaders() {
            const token = this._getToken();
            const headers = {
                "Authorization": String(token || ""),
                "Content-Type": "application/json"
            };
            const sp = this._getSuperPropertiesHeader();
            if (sp) headers["X-Super-Properties"] = String(sp);
            return headers;
        }

        /**
         * Ensure all header values are strings to prevent t[1].toLowerCase crashes.
         */
        _sanitizeHeaders(headers) {
            const clean = {};
            for (const [k, v] of Object.entries(headers)) {
                if (v != null) {
                    clean[String(k)] = String(v);
                }
            }
            return clean;
        }

        async _apiGet(url, opts = {}) {
            // Strategy 1: Use Discord's internal API module (includes super-properties, proper auth)
            // Best for GET requests that need full headers
            const api = this.modules.DiscordAPI;
            if (api) {
                try {
                    const res = await api.get({ url });
                    return { body: res.body, status: res.status ?? 200 };
                } catch (e) {
                    // If internal API fails, fall through to clean fetch
                    if (e?.status) {
                        const err = new Error(`API GET ${url} failed: ${e.status}`);
                        err.status = e.status;
                        err.body = e.body;
                        throw err;
                    }
                    // Non-HTTP error (like t[1].toLowerCase bug) - fall through to clean fetch
                }
            }
            // Strategy 2: Fallback to clean fetch with manual token + super-properties
            const token = this._getToken();
            if (!token) throw new Error("No auth token available");
            const cleanFetch = this._getCleanFetch();
            const res = await cleanFetch(`${API_BASE}${url}`, {
                method: "GET",
                headers: this._sanitizeHeaders(this._buildHeaders())
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) {
                const err = new Error(`API GET ${url} failed: ${res.status}`);
                err.status = res.status;
                err.body = body;
                throw err;
            }
            return { body, status: res.status };
        }

        async _apiPost(url, bodyData = {}) {
            // Strategy 1: Clean fetch with super-properties (avoids t[1].toLowerCase bug)
            // If we accumulate 3 consecutive non-HTTP failures we bypass this path
            // and fall straight to the internal api.Bo module.
            const token = this._getToken();
            const useCleanFetch = token && (this._cleanFetchFailStreak ?? 0) < 3;
            if (useCleanFetch) {
                try {
                    const cleanFetch = this._getCleanFetch();
                    const res = await cleanFetch(`${API_BASE}${url}`, {
                        method: "POST",
                        headers: this._sanitizeHeaders(this._buildHeaders()),
                        body: JSON.stringify(bodyData)
                    });
                    const body = await res.json().catch(() => null);
                    if (!res.ok) {
                        // HTTP error is a legitimate server-side response — reset streak
                        this._cleanFetchFailStreak = 0;
                        const err = new Error(`API POST ${url} failed: ${res.status}`);
                        err.status = res.status;
                        err.body = body;
                        throw err;
                    }
                    this._cleanFetchFailStreak = 0;
                    return { body, status: res.status };
                } catch (e) {
                    // If error has a status, it's an HTTP error - re-throw
                    if (e?.status) throw e;
                    // Otherwise it's a fetch/token error - bump streak and fall through
                    this._cleanFetchFailStreak = (this._cleanFetchFailStreak ?? 0) + 1;
                    if (this._cleanFetchFailStreak === 3) {
                        console.warn("[AutoQuest] Clean fetch failed 3x in a row — falling back to api.Bo for subsequent requests.");
                    }
                }
            }
            // Strategy 2: Fallback to Discord's internal API module (api.Bo)
            const api = this.modules.DiscordAPI;
            if (api) {
                try {
                    const res = await api.post({ url, body: bodyData });
                    return { body: res.body, status: res.status ?? 200 };
                } catch (e) {
                    const err = new Error(`API POST ${url} failed: ${e?.status || e?.message || "unknown"}`);
                    err.status = e?.status;
                    err.body = e?.body;
                    throw err;
                }
            }
            throw new Error("No auth token or API module available");
        }

        /* ================================================================
         *  TOOLBAR ICON
         * ================================================================ */
        injectToolbarIcon() {
            // Throttled observer: fires at most once per 500ms instead of every DOM mutation
            let throttleTimer = null;
            this.observer = new MutationObserver(() => {
                if (throttleTimer) return;
                throttleTimer = setTimeout(() => { throttleTimer = null; this.ensureIcon(); }, 500);
            });
            this.observer.observe(document.body, { childList: true, subtree: true });
            this.ensureIcon();
        }

        ensureIcon() {
            if (document.querySelector(".aq-toolbar-btn")) return;
            const toolbar = document.querySelector('[class*="toolbar_"]') || document.querySelector('[class*="toolbar-"]');
            if (!toolbar) return;

            const btn = document.createElement("div");
            btn.className = "aq-toolbar-btn";
            btn.setAttribute("data-testid", "aq-toolbar-btn");
            btn.setAttribute("role", "button");
            btn.setAttribute("aria-label", "AutoQuest");
            btn.innerHTML = `<img class="aq-icon" src="https://cdn3.emoji.gg/emojis/29467-orbs-fascinating.gif" alt="AutoQuest">`;
            btn.addEventListener("click", e => { e.stopPropagation(); this.toggleDashboard(); });

            // Strategy 1: Find the help button and insert before it (same row as inbox)
            const helpBtn = toolbar.querySelector('[aria-label*="elp"]') || toolbar.querySelector('[aria-label*="ide"]') || toolbar.querySelector('a[href*="support"]');
            if (helpBtn) {
                helpBtn.parentNode.insertBefore(btn, helpBtn);
            } else {
                // Strategy 2: Insert after inbox button
                const inboxBtn = toolbar.querySelector('[aria-label*="nbox"]');
                if (inboxBtn?.nextSibling) {
                    inboxBtn.parentNode.insertBefore(btn, inboxBtn.nextSibling);
                } else {
                    // Fallback: prepend to toolbar
                    toolbar.prepend(btn);
                }
            }

            this.refreshBadge();
        }

        refreshBadge() {
            const btn = document.querySelector(".aq-toolbar-btn");
            if (!btn) return;
            const old = btn.querySelector(".aq-badge");
            if (old) old.remove();

            const quests = this.getCompletableQuests();
            if (quests.length > 0) {
                const badge = document.createElement("span");
                badge.className = "aq-badge";
                badge.textContent = quests.length > 9 ? "9+" : quests.length;
                btn.appendChild(badge);
            }
        }

        /**
         * Get the user's current orbs balance (synchronous, from stores).
         * Tries VirtualCurrencyStore and QuestsStore for the actual balance the user owns.
         */
        _getOrbsCount() {
            try {
                // Strategy 1: Dedicated VirtualCurrency / Orbs stores (actual balance)
                try {
                    const storeNames = ["VirtualCurrencyStore", "OrbsStore", "CollectiblesStore", "QuestRewardsStore", "UserCollectiblesStore"];
                    for (const name of storeNames) {
                        const altStore = BdApi.Webpack.getStore?.(name);
                        if (altStore) {
                            if (typeof altStore.getBalance === "function") { const v = altStore.getBalance(); if (typeof v === "number" && v >= 0) return v; }
                            if (typeof altStore.getOrbs === "function") { const v = altStore.getOrbs(); if (typeof v === "number" && v >= 0) return v; }
                            if (typeof altStore.getOrbsBalance === "function") { const v = altStore.getOrbsBalance(); if (typeof v === "number" && v >= 0) return v; }
                            if (typeof altStore.balance === "number") return altStore.balance;
                            if (typeof altStore.orbs === "number") return altStore.orbs;
                            // Deep scan for balance-related properties
                            if (altStore.__getLocalVars) {
                                try {
                                    const vars = altStore.__getLocalVars();
                                    for (const key of Object.keys(vars || {})) {
                                        if (/balance|orb/i.test(key) && typeof vars[key] === "number" && vars[key] >= 0) {
                                            return vars[key];
                                        }
                                    }
                                } catch {}
                            }
                        }
                    }
                } catch {}

                const store = this.modules.QuestsStore;
                // Strategy 2: QuestsStore direct balance methods
                if (store?.getOrbs && typeof store.getOrbs === "function") {
                    const val = store.getOrbs();
                    if (val != null && val >= 0) return val;
                }
                if (store?.getOrbsBalance && typeof store.getOrbsBalance === "function") {
                    const val = store.getOrbsBalance();
                    if (val != null && val >= 0) return val;
                }
                if (store?.orbs != null && typeof store.orbs === "number") return store.orbs;
                if (store?.orbsBalance != null && typeof store.orbsBalance === "number") return store.orbsBalance;

                // Strategy 3: Store state
                if (store?.getState) {
                    try {
                        const state = store.getState();
                        if (state?.orbs != null && typeof state.orbs === "number") return state.orbs;
                        if (state?.orbsBalance != null && typeof state.orbsBalance === "number") return state.orbsBalance;
                    } catch {}
                }

                // Strategy 4: __getLocalVars
                if (store?.__getLocalVars) {
                    try {
                        const vars = store.__getLocalVars();
                        if (vars?.orbs != null && typeof vars.orbs === "number") return vars.orbs;
                        if (vars?.orbsBalance != null && typeof vars.orbsBalance === "number") return vars.orbsBalance;
                        for (const key of Object.keys(vars || {})) {
                            if (/orb|balance/i.test(key) && typeof vars[key] === "number" && vars[key] >= 0) {
                                return vars[key];
                            }
                        }
                    } catch {}
                }

                // Strategy 5: Scan store + prototype for balance-related methods
                if (store) {
                    try {
                        const allKeys = new Set([
                            ...Object.keys(store),
                            ...Object.getOwnPropertyNames(store),
                            ...Object.getOwnPropertyNames(Object.getPrototypeOf(store) || {})
                        ]);
                        for (const key of allKeys) {
                            if (/orb|balance/i.test(key) && key !== "_getOrbsCount") {
                                try {
                                    const val = typeof store[key] === "function" ? store[key]() : store[key];
                                    if (typeof val === "number" && val >= 0) return val;
                                } catch {}
                            }
                        }
                    } catch {}
                }

            } catch (e) {
                console.warn("[AutoQuest] _getOrbsCount error:", e);
            }
            // Return null instead of 0 so the async API call takes priority
            return null;
        }

        /**
         * Fetch the user's CURRENT orbs balance from the Discord API.
         * Primary: /users/@me/virtual-currency/balance (actual balance the user possesses)
         * Fallback: calculate from claimed quest rewards (less accurate, doesn't account for spent orbs)
         */
        async _fetchOrbsFromAPI() {
            // Strategy 1: Direct balance endpoint — returns the actual orbs the user currently owns
            try {
                const res = await this._apiGet("/users/@me/virtual-currency/balance");
                const body = res?.body;
                // Try common response shapes
                const bal = body?.amount ?? body?.balance ?? body?.orbs ?? body?.total ?? body?.value;
                if (bal != null && typeof bal === "number") return bal;
                // If body is a number directly
                if (typeof body === "number") return body;
            } catch (e) {
                console.warn("[AutoQuest] _fetchOrbsFromAPI /virtual-currency/balance error:", e?.status || e?.message || "unknown");
            }

            // Strategy 2 (fallback): Sum orb rewards from claimed quests
            let totalOrbs = 0;

            const extractOrbs = (quests) => {
                let orbs = 0;
                for (const q of quests) {
                    const rewards = q.config?.rewards_config?.rewards
                        || q.config?.rewardsConfig?.rewards
                        || q.config?.rewards
                        || [];
                    for (const r of rewards) {
                        try {
                            if (r.type === 4 || r.type === "VIRTUAL_CURRENCY") {
                                orbs += (r.orb_quantity || r.orbQuantity || r.quantity || r.amount || 0);
                            } else if (r.orb_quantity != null && r.orb_quantity > 0) {
                                orbs += r.orb_quantity;
                            }
                        } catch {}
                    }
                }
                return orbs;
            };

            try {
                const res = await this._apiGet("/quests/@me");
                const body = res?.body;
                if (body?.quests && Array.isArray(body.quests)) {
                    const claimedQuests = body.quests.filter(q =>
                        q.user_status?.claimed_at || q.userStatus?.claimedAt
                    );
                    totalOrbs += extractOrbs(claimedQuests);
                } else if (Array.isArray(body)) {
                    const claimedQuests = body.filter(q =>
                        q.user_status?.claimed_at || q.userStatus?.claimedAt
                    );
                    totalOrbs += extractOrbs(claimedQuests);
                }
            } catch (e) {
                console.warn("[AutoQuest] _fetchOrbsFromAPI /quests/@me error:", e?.status || e?.message || "unknown");
            }

            return totalOrbs > 0 ? totalOrbs : null;
        }

        /* ================================================================
         *  DASHBOARD - 2 Column Grid Layout
         * ================================================================ */
        toggleDashboard() {
            this.dashboardOpen ? this.closeDashboard() : this.openDashboard();
        }

        openDashboard() {
            this.dashboardOpen = true;
            const btn = document.querySelector(".aq-toolbar-btn");
            if (btn) btn.classList.add("aq-active");

            const overlay = document.createElement("div");
            overlay.className = "aq-overlay";
            overlay.id = "aq-overlay";
            overlay.addEventListener("click", e => { if (e.target === overlay) this.closeDashboard(); });

            const popout = document.createElement("div");
            popout.className = "aq-popout";
            popout.id = "aq-popout";
            overlay.appendChild(popout);
            document.body.appendChild(overlay);

            this.renderDashboard(popout);
        }

        closeDashboard() {
            this.dashboardOpen = false;
            const btn = document.querySelector(".aq-toolbar-btn");
            if (btn) btn.classList.remove("aq-active");

            const overlay = document.getElementById("aq-overlay");
            if (overlay) {
                const popout = document.getElementById("aq-popout");
                if (popout && this.dashboardRoot) {
                    try { this.dashboardRoot.unmount(); } catch (_) {}
                    this.dashboardRoot = null;
                }
                overlay.remove();
            }
        }

        renderDashboard(container) {
            const React = BdApi.React;
            const self = this;

            const FILTERS = [
                { key: "all",          label: () => self.t("filterAll") },
                { key: "claimable",    label: () => self.t("filterClaimable") },
                { key: "claimed",      label: () => self.t("filterCompleted") }
            ];

            const Dashboard = () => {
                const [allQuests, setAllQuests] = React.useState([]);
                const [filter, setFilter]       = React.useState("all");
                const [autoOn, setAutoOn]       = React.useState(self.settings.autoComplete);
                const [notifOn, setNotifOn]     = React.useState(self.settings.notifications);
                const [autoUpd, setAutoUpd]     = React.useState(self.settings.autoUpdate);
                const [showSettings, setShowSettings] = React.useState(false);
                const [jobs, setJobs]           = React.useState({});
                const [orbs, setOrbs]           = React.useState(self._getOrbsCount() ?? 0);
                const [, bump]                  = React.useReducer(x => x + 1, 0);

                self._forceUpdate = bump;

                React.useEffect(() => {
                    const refresh = () => {
                        setAllQuests(self.getAllDisplayQuests());
                        const storeOrbs = self._getOrbsCount();
                        if (storeOrbs != null) setOrbs(storeOrbs);
                        const j = {};
                        for (const [id, job] of self.activeJobs) j[id] = { progress: job.progress, status: job.status };
                        setJobs(j);
                    };
                    refresh();

                    // Fetch actual orbs balance from API on mount (most accurate source)
                    self._fetchOrbsFromAPI().then(apiOrbs => {
                        if (apiOrbs != null) setOrbs(apiOrbs);
                    });

                    // Refresh every 5 seconds for more responsive orb updates
                    const iv = setInterval(refresh, 5_000);

                    // Subscribe to FluxDispatcher events for real-time updates
                    const questHandler = () => {
                        setTimeout(() => {
                            setAllQuests(self.getAllDisplayQuests());
                            const storeOrbs = self._getOrbsCount();
                            if (storeOrbs != null) setOrbs(storeOrbs);
                            // Also refresh from API for accuracy
                            self._fetchOrbsFromAPI().then(apiOrbs => {
                                if (apiOrbs != null) setOrbs(apiOrbs);
                            });
                        }, 500);
                    };
                    const dispatcher = self.modules.FluxDispatcher;
                    const events = ["QUESTS_SEND_HEARTBEAT_SUCCESS", "QUEST_COMPLETED", "QUEST_CLAIMED", "USER_SETTINGS_PROTO_UPDATE"];
                    if (dispatcher) {
                        for (const evt of events) {
                            try { dispatcher.subscribe(evt, questHandler); } catch {}
                        }
                    }

                    return () => {
                        clearInterval(iv);
                        self._forceUpdate = null;
                        if (dispatcher) {
                            for (const evt of events) {
                                try { dispatcher.unsubscribe(evt, questHandler); } catch {}
                            }
                        }
                    };
                }, []);

                const quests = filter === "all"
                    ? allQuests
                    : allQuests.filter(q => q._status === filter);

                const counts = allQuests.reduce((acc, q) => {
                    acc.all++;
                    if (q._status === "available") acc.available++;
                    else if (q._status === "not_enrolled") acc.not_enrolled++;
                    else if (q._status === "claimable") acc.claimable++;
                    else if (q._status === "claimed") acc.claimed++;
                    return acc;
                }, { all: 0, available: 0, not_enrolled: 0, claimable: 0, claimed: 0 });

                const onToggle = e => {
                    const v = e.target.checked;
                    setAutoOn(v);
                    self.settings.autoComplete = v;
                    self.saveSettings();
                    v ? self.startAutoComplete() : self.stopAutoComplete();
                };

                const onComplete = async quest => {
                    setJobs(prev => ({ ...prev, [quest.id]: { status: "completing", progress: 0 } }));
                    try {
                        if (!quest.userStatus?.enrolledAt && !quest.userStatus?.enrolled_at) {
                            setJobs(prev => ({ ...prev, [quest.id]: { status: "enrolling", progress: 0 } }));
                            const enrolled = await self.enrollInQuest(quest.id);
                            if (!enrolled) {
                                setJobs(prev => ({ ...prev, [quest.id]: { status: "error", progress: 0 } }));
                                return;
                            }
                            const freshQuest = self.modules.QuestsStore?.quests?.get(quest.id);
                            if (freshQuest) quest = freshQuest;
                        }
                        setJobs(prev => ({ ...prev, [quest.id]: { status: "completing", progress: 0 } }));
                        await self.completeQuest(quest, pct => {
                            setJobs(prev => ({ ...prev, [quest.id]: { status: "completing", progress: pct } }));
                        });
                        setJobs(prev => ({ ...prev, [quest.id]: { status: "completed", progress: 100 } }));
                        setAllQuests(self.getAllDisplayQuests());
                    } catch (err) {
                        console.error("[AutoQuest]", err);
                        setJobs(prev => ({ ...prev, [quest.id]: { status: "error", progress: 0 } }));
                    }
                };

                const onClaimAll = () => {
                    self.closeDashboard();
                    // Strategy 1: NavigationUtils.transitionTo (preferred)
                    try {
                        if (self.modules.NavigationUtils?.transitionTo) {
                            self.modules.NavigationUtils.transitionTo("/quests");
                            return;
                        }
                    } catch {}
                    // Strategy 2: FluxDispatcher NAVIGATE action
                    try {
                        if (self.modules.FluxDispatcher) {
                            self.modules.FluxDispatcher.dispatch({ type: "NAVIGATE", path: "/quests" });
                            return;
                        }
                    } catch {}
                    // Strategy 3: Webpack search for any router/transition module
                    try {
                        const router = BdApi.Webpack.getModule(m => m?.transitionTo, { searchExports: true })
                            || BdApi.Webpack.getModule(m => m?.replaceWith, { searchExports: true });
                        if (router?.transitionTo) { router.transitionTo("/quests"); return; }
                        if (router?.replaceWith) { router.replaceWith("/quests"); return; }
                    } catch {}
                    // Strategy 4: Direct history push (React Router)
                    try {
                        const historyMod = BdApi.Webpack.getModule(m => m?.pushState && m?.replaceState, { searchExports: true });
                        if (historyMod) { historyMod.pushState(null, "", "/quests"); return; }
                    } catch {}
                    // Strategy 5: Fallback to Discord URL (same tab, not new window)
                    window.location.assign("discord://-/quests");
                };

                const h = React.createElement;

                return h("div", { "data-testid": "aq-dashboard", style: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" } },
                    // Header
                    h("div", { className: "aq-hdr" },
                        h("div", { className: "aq-hdr-left" },
                            h("span", { className: "aq-hdr-title", "data-testid": "aq-title" }, self.t("title")),
                            h("span", { className: "aq-orbs-hdr", "data-testid": "aq-orbs-display" },
                                h("img", { src: "https://cdn3.emoji.gg/emojis/37510-orbs-white.png", alt: "orbs" }),
                                h("span", { "data-testid": "aq-orbs-count" }, orbs)
                            )
                        ),
                        h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                            h("button", {
                                className: "aq-gear-btn",
                                onClick: () => setShowSettings(prev => !prev),
                                title: "Settings",
                                "data-testid": "aq-settings-btn"
                            },
                                h("svg", { viewBox: "0 0 24 24", fill: "currentColor" },
                                    h("path", { d: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z" })
                                )
                            )
                        )
                    ),

                    // Accent Line
                    h("div", { className: "aq-accent-line" }),

                    // Settings Panel (full page when open)
                    showSettings && h("div", { className: "aq-settings", "data-testid": "aq-settings-panel" },
                        h("div", { className: "aq-setting-row" },
                            h("div", { className: "aq-setting-info" },
                                h("span", { className: "aq-setting-name" }, self.t("settingsAutoComplete")),
                                h("span", { className: "aq-setting-note" }, self.t("settingsAutoCompleteNote"))
                            ),
                            h("label", { className: "aq-sw" },
                                h("input", { type: "checkbox", checked: autoOn, onChange: onToggle }),
                                h("span", { className: "aq-sw-track" })
                            )
                        ),
                        h("div", { className: "aq-setting-row" },
                            h("div", { className: "aq-setting-info" },
                                h("span", { className: "aq-setting-name" }, self.t("settingsNotifications")),
                                h("span", { className: "aq-setting-note" }, self.t("settingsNotificationsNote"))
                            ),
                            h("label", { className: "aq-sw" },
                                h("input", { type: "checkbox", checked: notifOn, onChange: e => {
                                    const v = e.target.checked;
                                    setNotifOn(v);
                                    self.settings.notifications = v;
                                    self.saveSettings();
                                } }),
                                h("span", { className: "aq-sw-track" })
                            )
                        ),
                        h("div", { className: "aq-setting-row" },
                            h("div", { className: "aq-setting-info" },
                                h("span", { className: "aq-setting-name" }, self.t("settingsAutoUpdate")),
                                h("span", { className: "aq-setting-note" }, self.t("settingsAutoUpdateNote"))
                            ),
                            h("label", { className: "aq-sw" },
                                h("input", { type: "checkbox", checked: autoUpd, onChange: e => {
                                    const v = e.target.checked;
                                    setAutoUpd(v);
                                    self.settings.autoUpdate = v;
                                    self.saveSettings();
                                } }),
                                h("span", { className: "aq-sw-track" })
                            )
                        )
                    ),

                    // Main content (hidden when settings open)
                    !showSettings && h("div", { className: "aq-filters", "data-testid": "aq-filters" },
                        FILTERS.map(f =>
                            h("button", {
                                key: f.key,
                                className: `aq-filter-btn${filter === f.key ? " aq-filter-active" : ""}`,
                                onClick: () => setFilter(f.key),
                                "data-testid": `aq-filter-${f.key}`
                            },
                                f.label(),
                                h("span", { className: "aq-filter-count" }, counts[f.key] ?? 0)
                            )
                        )
                    ),

                    // Quest Grid (2 columns) wrapped in scroll container
                    !showSettings && h("div", { className: "aq-scroll-wrap", "data-testid": "aq-scroll-wrap" },
                        h("div", { className: "aq-grid", "data-testid": "aq-quest-grid" },
                            quests.length === 0
                                ? h("div", { className: "aq-empty" },
                                    h("svg", { viewBox: "0 0 24 24", fill: "currentColor" },
                                        h("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" })
                                    ),
                                    h("div", { className: "aq-empty-text" }, self.t("noQuests"))
                                  )
                                : quests.map((quest, i) => self._renderTile(h, quest, jobs, onComplete, i))
                        )
                    ),

                    // Footer
                    !showSettings && h("div", { className: "aq-footer" },
                        h("span", null, `v${META.version}`)
                    )
                );
            };

            try {
                if (BdApi.ReactDOM.createRoot) {
                    this.dashboardRoot = BdApi.ReactDOM.createRoot(container);
                    this.dashboardRoot.render(React.createElement(Dashboard));
                } else {
                    BdApi.ReactDOM.render(React.createElement(Dashboard), container);
                    this.dashboardRoot = { unmount: () => BdApi.ReactDOM.unmountComponentAtNode(container) };
                }
            } catch (err) {
                console.error("[AutoQuest] Dashboard render error:", err);
            }
        }

        /**
         * Render a single quest tile in the 2-column grid.
         */
        _renderTile(h, quest, jobs, onComplete, tileIdx = 0) {
            const tc = quest.config.taskConfig ?? quest.config.taskConfigV2 ?? quest.config.task_config ?? quest.config.task_config_v2;
            const tasks = tc?.tasks || {};
            const taskName = SUPPORTED_TASKS.find(t => tasks[t] != null);
            const isSupported = !!taskName;
            const needed = isSupported ? (tasks[taskName]?.target || 0) : 0;
            const done = isSupported ? (quest.userStatus?.progress?.[taskName]?.value ?? 0) : 0;
            const pct = needed > 0 ? Math.min(100, (done / needed) * 100) : 0;
            const isClaimed = quest._status === "claimed";
            const isClaimable = quest._status === "claimable";
            const isCompleted = isClaimed || isClaimable;
            const isNotEnrolled = quest._status === "not_enrolled";
            const job = jobs[quest.id];
            const isActive = this.activeJobs.has(quest.id);
            const displayPct = job?.progress ?? pct;
            const allTaskTypes = Object.keys(tasks);
            const displayTask = taskName || allTaskTypes[0] || "---";

            const questName = quest.config.messages?.questName || quest.config.messages?.quest_name || "Quest";

            // Map task type to short label for title suffix
            const taskLabelMap = {
                "PLAY_ON_DESKTOP": "Desktop",
                "PLAY_ON_DESKTOP_V2": "Desktop",
                "WATCH_VIDEO": "Video",
                "WATCH_VIDEO_ON_MOBILE": "Mobile",
                "STREAM_ON_DESKTOP": "Stream",
                "PLAY_ACTIVITY": "Activity"
            };
            const taskShortLabel = taskLabelMap[displayTask] || displayTask.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
            const displayTitle = `${questName} · ${taskShortLabel}`;

            // Status badge
            let statusClass, statusText;
            if (isClaimed) {
                statusClass = "aq-tile-status-completed";
                statusText = this.t("claimed");
            } else if (isClaimable) {
                statusClass = "aq-tile-status-claimable";
                statusText = this.t("completed");
            } else if (!isSupported) {
                statusClass = "aq-tile-status-unsupported";
                statusText = this.t("unsupportedTask");
            } else if (isNotEnrolled) {
                statusClass = "aq-tile-status-not-enrolled";
                statusText = this.t("notEnrolled");
            } else {
                statusClass = "aq-tile-status-available";
                statusText = this.t("available");
            }

            // Action button (no individual claim buttons - use global claim button instead)
            let actionBtn;
            if (isClaimed || job?.status === "claimed") {
                actionBtn = h("button", { className: "aq-tile-btn aq-btn-ok", disabled: true, "data-testid": `aq-btn-${quest.id}` }, this.t("claimed"));
            } else if (isClaimable || job?.status === "completed") {
                actionBtn = h("button", { className: "aq-tile-btn aq-btn-ok", disabled: true, "data-testid": `aq-btn-${quest.id}` }, this.t("completed"));
            } else if (!isSupported) {
                actionBtn = h("button", { className: "aq-tile-btn aq-btn-disabled", disabled: true, "data-testid": `aq-btn-${quest.id}` }, this.t("unsupportedTask"));
            } else if (job?.status === "enrolling") {
                actionBtn = h("button", { className: "aq-tile-btn aq-btn-wait", disabled: true, "data-testid": `aq-btn-${quest.id}` }, this.t("enrolling"));
            } else if (job?.status === "completing" || isActive) {
                actionBtn = h("button", { className: "aq-tile-btn aq-btn-wait", disabled: true, "data-testid": `aq-btn-${quest.id}` }, this.t("completing"));
            } else {
                actionBtn = h("button", {
                    className: "aq-tile-btn aq-btn-primary",
                    onClick: () => onComplete(quest),
                    "data-testid": `aq-btn-${quest.id}`
                }, this.t("complete"));
            }

            return h("div", {
                className: `aq-tile${isClaimed ? " aq-tile-completed" : ""}`,
                key: quest.id,
                "data-testid": `aq-quest-${quest.id}`,
                style: { animationDelay: `${tileIdx * 60}ms` }
            },
                // Status badge (no thumbnail)
                h("div", { className: "aq-tile-status-bar" },
                    h("span", { className: `aq-tile-status-inline ${statusClass}`, "data-testid": `aq-status-${quest.id}` }, statusText)
                ),

                // Body
                h("div", { className: "aq-tile-body" },
                    h("div", { className: "aq-tile-name", title: displayTitle }, displayTitle),

                    isSupported && h("div", { className: "aq-tile-prog-row" },
                        h("div", { className: "aq-tile-prog" },
                            h("div", {
                                className: `aq-tile-prog-fill${isCompleted ? " aq-done" : ""}`,
                                style: { width: `${displayPct}%` }
                            })
                        ),
                        h("span", { className: "aq-tile-pct" }, `${Math.floor(displayPct)}%`)
                    ),

                    actionBtn
                )
            );
        }

        /* ================================================================
         *  QUEST IMAGE HELPERS (CDN assets with multiple fallbacks + debug)
         * ================================================================ */

        /**
         * Get ordered list of thumbnail URLs for a quest.
         * Uses the official Discord CDN quest-assets path:
         *   https://cdn.discordapp.com/assets/quests/{quest_id}/{asset_name}
         * Also tries media.discordapp.net as fallback.
         * Falls back to app-icons, imagePath, reward assets.
         */
        _getQuestThumbUrls(quest) {
            const urls = [];
            const questId = quest.config?.id || quest.id;
            const assets = quest.config?.assets;
            const app = quest.config?.application;
            const videoMeta = quest.config?.videoMetadata || quest.config?.video_metadata;

            // Helper: resolve asset name to full CDN URL
            const resolve = (asset, cdnBase) => {
                if (!asset) return null;
                if (asset.startsWith("http")) return asset;
                const base = cdnBase || CDN_BASE;
                if (asset.includes("/")) return `${base}/assets/${asset}`;
                return `${base}/assets/quests/${questId}/${asset}`;
            };

            // Helper: add CDN URL (skip media.discordapp.net duplicate to reduce 404 spam)
            const addUrl = (asset) => {
                const cdnUrl = resolve(asset, CDN_BASE);
                if (cdnUrl) urls.push(cdnUrl);
            };

            // 1. App icon FIRST (most reliable, rarely 404s)
            if (app?.icon && app?.id) {
                urls.push(`${CDN_BASE}/app-icons/${app.id}/${app.icon}.webp?size=240`);
                urls.push(`${CDN_BASE}/app-icons/${app.id}/${app.icon}.png?size=240`);
            }

            // 2. Quest CDN assets (may 404 for expired/rotated quests)
            if (assets) {
                if (assets.hero) addUrl(assets.hero);
                const qbh = assets.quest_bar_hero || assets.questBarHero;
                if (qbh) addUrl(qbh);
                const gt = assets.game_tile || assets.gameTile;
                if (gt) {
                    if (!gt.includes("/")) urls.push(`${CDN_BASE}/assets/quests/${questId}/dark/${gt}`);
                    addUrl(gt);
                }
            }

            // 3. Video thumbnail
            if (videoMeta?.assets) {
                const va = videoMeta.assets;
                const vpt = va.video_player_thumbnail || va.videoPlayerThumbnail;
                if (vpt) addUrl(vpt);
            }

            // 4. Legacy imagePath field
            if (quest.config?.imagePath || quest.config?.image_path) {
                addUrl(quest.config.imagePath || quest.config.image_path);
            }

            // 5. Reward asset
            const rewards = quest.config?.rewardsConfig?.rewards || quest.config?.rewards_config?.rewards || [];
            for (const reward of rewards) {
                if (reward.asset) addUrl(reward.asset);
            }

            // Deduplicate & remove nulls, limit to 5 max to reduce 404 noise
            const unique = [...new Set(urls.filter(Boolean))];
            return unique.slice(0, 5);
        }

        /* ================================================================
         *  QUEST DATA HELPERS
         * ================================================================ */
        getAllDisplayQuests() {
            try {
                const store = this.modules.QuestsStore;
                if (!store?.quests) {
                    return [];
                }

                const allQuests = [...store.quests.values()];
                if (allQuests.length === 0) {
                    return [];
                }

                const nonExpired = allQuests.filter(q => {
                    const expiresAt = q.config?.expiresAt || q.config?.expires_at;
                    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return false;
                    return true;
                });

                const enriched = nonExpired.map(q => {
                    const tasks = (q.config.taskConfig ?? q.config.taskConfigV2 ?? q.config.task_config ?? q.config.task_config_v2)?.tasks;
                    const hasSupported = tasks && SUPPORTED_TASKS.some(t => tasks[t] != null);

                    let status;
                    if (q.userStatus?.completedAt || q.userStatus?.completed_at) {
                        if (q.userStatus?.claimedAt || q.userStatus?.claimed_at) {
                            status = "claimed";
                        } else {
                            status = "claimable";
                        }
                    } else if (!hasSupported) {
                        status = "unsupported";
                    } else if (!q.userStatus?.enrolledAt && !q.userStatus?.enrolled_at) {
                        status = "not_enrolled";
                    } else {
                        status = "available";
                    }
                    return { ...q, _status: status };
                });

                const order = { available: 0, not_enrolled: 1, claimable: 2, unsupported: 3, claimed: 4 };
                enriched.sort((a, b) => (order[a._status] ?? 9) - (order[b._status] ?? 9));

                return enriched;
            } catch (err) {
                console.error("[AutoQuest] getAllDisplayQuests error:", err);
                return [];
            }
        }

        getCompletableQuests() {
            // Dashboard/badge/auto-complete list.
            // Includes both strictly gist-eligible (already enrolled, not completed,
            // not expired, supported task) AND not-yet-enrolled quests with a
            // supported task, so the plugin can auto-enroll before completing.
            return this.getAllDisplayQuests().filter(q =>
                q._status === "available" || q._status === "not_enrolled"
            );
        }

        /**
         * Strict gist-aligned eligibility predicate (aamiaa rev nov 2025):
         *   x.userStatus?.enrolledAt
         *   && !x.userStatus?.completedAt
         *   && new Date(x.config.expiresAt).getTime() > Date.now()
         *   && supportedTasks.some(t => Object.keys(taskConfig.tasks).includes(t))
         * Kept as a helper for callers that need the raw gist semantics
         * (i.e. quests already enrolled and ready to progress).
         */
        _isQuestEligibleGist(x) {
            try {
                const enrolledAt  = x?.userStatus?.enrolledAt  ?? x?.userStatus?.enrolled_at;
                const completedAt = x?.userStatus?.completedAt ?? x?.userStatus?.completed_at;
                const expiresAt   = x?.config?.expiresAt       ?? x?.config?.expires_at;
                const tc = x?.config?.taskConfig ?? x?.config?.taskConfigV2 ?? x?.config?.task_config ?? x?.config?.task_config_v2;
                if (!enrolledAt) return false;
                if (completedAt) return false;
                if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) return false;
                const taskKeys = Object.keys(tc?.tasks ?? {});
                return SUPPORTED_TASKS.some(t => taskKeys.includes(t));
            } catch { return false; }
        }

        /**
         * Returns quests strictly matching the gist filter — already enrolled
         * and ready to be progressed. Useful for callers that must not trigger
         * enrollment side effects.
         */
        getEligibleQuestsStrict() {
            const store = this.modules.QuestsStore;
            if (!store?.quests) return [];
            try {
                return [...store.quests.values()].filter(q => this._isQuestEligibleGist(q));
            } catch (e) {
                console.warn("[AutoQuest] getEligibleQuestsStrict failed:", e?.message || e);
                return [];
            }
        }

        async enrollInQuest(questId) {
            try {
                console.log(`[AutoQuest] Enrolling in quest ${questId}...`);
                await this._apiPost(`/quests/${questId}/enroll`, { location: 1 });
                console.log(`[AutoQuest] Successfully enrolled in quest ${questId}`);
                return true;
            } catch (e) {
                const errMsg = e?.body?.message || e?.message || String(e);
                console.error(`[AutoQuest] Enrollment failed for ${questId}:`, errMsg);
                BdApi.UI.showToast(`${this.t("enrollFailed")}: ${errMsg}`, { type: "error" });
                return false;
            }
        }

        /* ================================================================
         *  QUEST COMPLETION LOGIC (using native fetch)
         * ================================================================ */
        async completeQuest(quest, onProgress) {
            const { FluxDispatcher, RunningGameStore, ApplicationStreamingStore, ChannelStore, GuildChannelStore } = this.modules;

            if (!quest.userStatus?.enrolledAt && !quest.userStatus?.enrolled_at) {
                const enrolled = await this.enrollInQuest(quest.id);
                if (!enrolled) throw new Error("Enrollment failed");
                await this._sleep(2000);
                const freshQuest = this.modules.QuestsStore?.quests?.get(quest.id);
                if (freshQuest) quest = freshQuest;
            }

            const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2 ?? quest.config.task_config ?? quest.config.task_config_v2;
            const taskName   = SUPPORTED_TASKS.find(t => taskConfig?.tasks?.[t] != null);
            if (!taskName) throw new Error(`No supported task found for quest ${quest.id}`);

            const needed     = taskConfig.tasks[taskName].target;
            let done         = quest.userStatus?.progress?.[taskName]?.value ?? 0;
            const taskData   = taskConfig.tasks[taskName] || {};
            // Gist-aligned application ID fallback:
            //   quest.config.application?.id ?? taskData.applications?.[0]?.id
            const appId      = quest.config.application?.id
                            ?? taskData.applications?.[0]?.id
                            ?? taskData.application?.id;
            const appName    = quest.config.application?.name
                            ?? taskData.applications?.[0]?.name
                            ?? "Unknown";
            const isDesktop  = typeof DiscordNative !== "undefined";

            // Normalize PLAY_ON_DESKTOP_V2 to PLAY_ON_DESKTOP behavior
            const effectiveTask = taskName === "PLAY_ON_DESKTOP_V2" ? "PLAY_ON_DESKTOP" : taskName;

            let cancelled = false;
            const job = {
                cancel: () => { cancelled = true; },
                progress: 0,
                status: "completing"
            };
            this.activeJobs.set(quest.id, job);

            const getProgress = () => {
                try {
                    const cq = this.modules.QuestsStore?.quests?.get(quest.id);
                    if (!cq?.userStatus) return done;
                    if (cq.config.configVersion === 1 || cq.config.config_version === 1) return cq.userStatus.streamProgressSeconds ?? cq.userStatus.stream_progress_seconds ?? 0;
                    return cq.userStatus.progress?.[taskName]?.value ?? cq.userStatus.progress?.[effectiveTask]?.value ?? done;
                } catch { return done; }
            };

            try {
                if (effectiveTask === "WATCH_VIDEO" || effectiveTask === "WATCH_VIDEO_ON_MOBILE") {
                        // Gist-aligned loop (aamiaa rev nov 2025): sleep FIRST for the
                        // `remaining` window, then POST timestamp matching real elapsed
                        // time since enrollment. Sending progress ahead of wall clock
                        // triggers Discord 400 "Bad Request".
                        const speed = 7;
                        let completed = false;
                        let consecutiveErrors = 0;
                        const MAX_CONSECUTIVE_ERRORS = 5;

                        while (!cancelled) {
                            const remaining = Math.min(speed, needed - done);
                            if (remaining <= 0) break;
                            await this._sleep(remaining * 1000);
                            if (cancelled) break;

                            const timestamp = done + speed;
                            try {
                                const body = { timestamp: Math.min(needed, timestamp + Math.random()) };
                                const res = await this._apiPost(`/quests/${quest.id}/video-progress`, body);
                                completed = res?.body?.completed_at != null;
                                done = Math.min(needed, timestamp);
                                job.progress = (done / needed) * 100;
                                if (onProgress) onProgress(job.progress);
                                consecutiveErrors = 0;
                            } catch (e) {
                                consecutiveErrors++;
                                if (consecutiveErrors === 1) {
                                    console.warn(`[AutoQuest] Video progress error: ${e?.status || e?.message || "unknown"}`);
                                }
                                // 400/404 = definitively rejected by server. Give up
                                // on this quest so we don't hammer a bad payload.
                                if (e?.status === 400 || e?.status === 404) break;
                                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                                    console.error(`[AutoQuest] Too many consecutive errors, stopping video progress for quest ${quest.id}`);
                                    this._cleanFetch = null;
                                    if (this._fetchIframe) { try { this._fetchIframe.remove(); } catch {} this._fetchIframe = null; }
                                    break;
                                }
                            }
                            if (timestamp >= needed || completed) break;
                        }

                        // Final flush call — only if we didn't hit a 400/404 above and
                        // the last progress POST succeeded (done reached needed).
                        if (!completed && !cancelled && done >= needed) {
                            try { await this._apiPost(`/quests/${quest.id}/video-progress`, { timestamp: needed }); } catch {}
                        }
                        this.activeJobs.delete(quest.id);
                        if (!cancelled) this._questDone(quest);

                } else if (effectiveTask === "PLAY_ON_DESKTOP") {
                        if (!isDesktop) { this.activeJobs.delete(quest.id); BdApi.UI.showToast(this.t("desktopOnly"), { type: "warning" }); throw new Error("Desktop required"); }

                        const pid = Math.floor(Math.random() * 30000) + 1000;
                        let appData;
                        try { const appRes = await this._apiGet(`/applications/public?application_ids=${appId}`); appData = appRes.body?.[0]; } catch {}
                        if (!appData) appData = { name: appName, executables: [], id: appId };

                        const exeName = appData.executables?.find(x => x.os === "win32")?.name?.replace(">", "") ?? appData.name.replace(/[\/\\:*?"<>|]/g, "");
                        const fakeGame = { cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`, exeName, exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`, hidden: false, isLauncher: false, id: appId, name: appData.name, pid, pidPath: [pid], processName: appData.name, start: Date.now() };

                        const realGames = RunningGameStore?.getRunningGames?.() || [];
                        const origGetGames = RunningGameStore?.getRunningGames;
                        const origGetPID = RunningGameStore?.getGameForPID;
                        if (RunningGameStore) { RunningGameStore.getRunningGames = () => [fakeGame]; RunningGameStore.getGameForPID = p => [fakeGame].find(g => g.pid === p); }
                        if (FluxDispatcher) { try { FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: realGames, added: [fakeGame], games: [fakeGame] }); } catch {} }

                        const cleanup = () => {
                            if (RunningGameStore && origGetGames) RunningGameStore.getRunningGames = origGetGames;
                            if (RunningGameStore && origGetPID) RunningGameStore.getGameForPID = origGetPID;
                            if (FluxDispatcher) { try { FluxDispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [fakeGame], added: [], games: [] }); } catch {} }
                        };

                        const heartbeatHandler = data => {
                            if (cancelled) return;
                            try {
                                const progress = (quest.config.configVersion === 1 || quest.config.config_version === 1)
                                    ? (data.userStatus?.streamProgressSeconds ?? data.userStatus?.stream_progress_seconds ?? 0)
                                    : Math.floor(data.userStatus?.progress?.PLAY_ON_DESKTOP?.value ?? data.userStatus?.progress?.[taskName]?.value ?? 0);
                                done = progress; job.progress = (progress / needed) * 100; if (onProgress) onProgress(job.progress);
                            } catch {}
                        };
                        if (FluxDispatcher) { try { FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", heartbeatHandler); } catch {} }

                        while (!cancelled) {
                            const prog = getProgress(); done = Math.max(done, prog); job.progress = (done / needed) * 100; if (onProgress) onProgress(job.progress);
                            if (done >= needed) break; await this._sleep(30_000);
                        }

                        cleanup();
                        if (FluxDispatcher) { try { FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", heartbeatHandler); } catch {} }
                        this.activeJobs.delete(quest.id);
                        if (!cancelled) this._questDone(quest);

                } else if (effectiveTask === "STREAM_ON_DESKTOP") {
                        if (!isDesktop) { this.activeJobs.delete(quest.id); BdApi.UI.showToast(this.t("desktopOnly"), { type: "warning" }); throw new Error("Desktop required"); }

                        const pid = Math.floor(Math.random() * 30000) + 1000;
                        const origFunc = ApplicationStreamingStore?.getStreamerActiveStreamMetadata;
                        if (ApplicationStreamingStore) ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({ id: appId, pid, sourceName: null });

                        const heartbeatHandler = data => {
                            if (cancelled) return;
                            try {
                                const progress = (quest.config.configVersion === 1 || quest.config.config_version === 1)
                                    ? (data.userStatus?.streamProgressSeconds ?? data.userStatus?.stream_progress_seconds ?? 0)
                                    : Math.floor(data.userStatus?.progress?.STREAM_ON_DESKTOP?.value ?? data.userStatus?.progress?.[taskName]?.value ?? 0);
                                done = progress; job.progress = (progress / needed) * 100; if (onProgress) onProgress(job.progress);
                            } catch {}
                        };
                        if (FluxDispatcher) { try { FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", heartbeatHandler); } catch {} }

                        while (!cancelled) {
                            const prog = getProgress(); done = Math.max(done, prog); job.progress = (done / needed) * 100; if (onProgress) onProgress(job.progress);
                            if (done >= needed) break; await this._sleep(30_000);
                        }

                        if (ApplicationStreamingStore && origFunc) ApplicationStreamingStore.getStreamerActiveStreamMetadata = origFunc;
                        if (FluxDispatcher) { try { FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", heartbeatHandler); } catch {} }
                        this.activeJobs.delete(quest.id);
                        if (!cancelled) this._questDone(quest);

                } else if (effectiveTask === "PLAY_ACTIVITY") {
                        let channelId;
                        try { channelId = ChannelStore?.getSortedPrivateChannels?.()?.[0]?.id; } catch {}
                        if (!channelId) { try { const guilds = GuildChannelStore?.getAllGuilds?.() || {}; for (const guild of Object.values(guilds)) { if (guild != null && guild?.VOCAL?.length > 0) { channelId = guild.VOCAL[0]?.channel?.id; if (channelId) break; } } } catch {} }
                        if (!channelId) { this.activeJobs.delete(quest.id); BdApi.UI.showToast(this.t("noChannel"), { type: "warning" }); throw new Error("No channel"); }

                        const streamKey = `call:${channelId}:1`;
                        let consecutiveErrors = 0;
                        const MAX_CONSECUTIVE_ERRORS = 10;
                        while (!cancelled) {
                            try {
                                const res = await this._apiPost(`/quests/${quest.id}/heartbeat`, { stream_key: streamKey, terminal: false });
                                const progress = res.body?.progress?.PLAY_ACTIVITY?.value || 0;
                                done = progress; job.progress = (progress / needed) * 100; if (onProgress) onProgress(job.progress);
                                consecutiveErrors = 0;
                                if (progress >= needed || res.body?.completed_at) { try { await this._apiPost(`/quests/${quest.id}/heartbeat`, { stream_key: streamKey, terminal: true }); } catch {} break; }
                            } catch (e) {
                                consecutiveErrors++;
                                if (consecutiveErrors === 1) {
                                    console.warn(`[AutoQuest] PLAY_ACTIVITY heartbeat error:`, e?.status || e?.message || "unknown");
                                }
                                if (e?.status === 404) break;
                                if (e?.status === 400 && consecutiveErrors >= 3) break;
                                if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
                                    console.error(`[AutoQuest] Too many consecutive errors for PLAY_ACTIVITY quest ${quest.id}`);
                                    break;
                                }
                            }
                            await this._sleep(20_000);
                        }
                        this.activeJobs.delete(quest.id);
                        if (!cancelled) this._questDone(quest);

                } else {
                        this.activeJobs.delete(quest.id);
                        throw new Error(`Unsupported task: ${taskName}`);
                }
            } catch (err) {
                this.activeJobs.delete(quest.id);
                console.error("[AutoQuest] completeQuest error:", err);
                throw err;
            }
        }

        _questDone(quest) {
            const name = quest.config.messages?.questName || quest.config.messages?.quest_name || "Quest";
            BdApi.UI.showToast(`${this.t("questDone")} --- ${name}`, { type: "success" });
            this.refreshBadge();
        }

        _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

        /* ================================================================
         *  AUTO-COMPLETE
         * ================================================================ */
        startAutoComplete() {
            if (this.autoInterval) return;
            const run = async () => {
                const quests = this.getCompletableQuests();
                for (const quest of quests) {
                    if (this.activeJobs.has(quest.id)) continue;
                    try { await this.completeQuest(quest, null); } catch (err) { console.warn("[AutoQuest] auto-complete failed:", quest.id, err?.message || err); }
                    await this._sleep(5_000);
                }
            };
            setTimeout(run, 3_000);
            this.autoInterval = setInterval(run, 60_000);
        }

        stopAutoComplete() {
            if (this.autoInterval) { clearInterval(this.autoInterval); this.autoInterval = null; }
            for (const [, job] of this.activeJobs) { if (job.cancel) job.cancel(); }
            this.activeJobs.clear();
        }

        /* ================================================================
         *  NEW QUEST DETECTION
         * ================================================================ */
        checkNewQuests() {
            try {
                const quests = this.getCompletableQuests();
                const isFirstRun = this.knownQuestIds.size === 0;
                for (const quest of quests) {
                    if (!this.knownQuestIds.has(quest.id)) {
                        this.knownQuestIds.add(quest.id);
                        const name = quest.config.messages?.questName || quest.config.messages?.quest_name || "Quest";
                        if (!isFirstRun && this.settings.notifications) {
                            BdApi.UI.showToast(`${this.t("newQuest")} --- ${name}`, { type: "info" });
                        }
                    }
                }
                this.refreshBadge();
            } catch (err) { console.warn("[AutoQuest] checkNewQuests:", err); }
        }

        /* ================================================================
         *  AUTO-UPDATE
         * ================================================================ */
        async checkForUpdates() {
            // Skip update check if no URLs configured
            if (!META.updateCheckUrl && !META.updateUrl) return;
            try {
                const cleanFetch = this._getCleanFetch();
                // First try GitHub releases API
                let latest = null;
                try {
                    const res = await cleanFetch(META.updateCheckUrl);
                    if (res.ok) {
                        const data = await res.json();
                        latest = (data.tag_name || data.name || "").replace(/^v/, "");
                    }
                } catch {}
                // Fallback: fetch the raw plugin file and parse version from header
                if (!latest) {
                    try {
                        const res = await cleanFetch(META.updateUrl);
                        if (res.ok) {
                            const text = await res.text();
                            const match = text.match(/@version\s+(\S+)/);
                            if (match) latest = match[1];
                        }
                    } catch {}
                }
                if (!latest || !this._isNewer(latest, META.version)) return;
                BdApi.UI.showNotice(`${this.t("updateReady")} (v${latest})`, { type: "info", buttons: [{ label: "Update", onClick: () => this._installUpdate() }] });
            } catch (err) { console.warn("[AutoQuest] Update check failed:", err); }
        }

        async _installUpdate() {
            if (!META.updateUrl) return;
            try {
                const cleanFetch = this._getCleanFetch();
                const res = await cleanFetch(META.updateUrl);
                if (!res.ok) throw new Error("Download failed");
                const code = await res.text();
                const fs = require("fs");
                const path = require("path");
                const dest = path.join(BdApi.Plugins.folder, `${META.name}.plugin.js`);
                fs.writeFileSync(dest, code, "utf-8");
                BdApi.UI.showToast("AutoQuest updated --- reloading...", { type: "success" });
            } catch (err) {
                console.error("[AutoQuest] Update install failed:", err);
                BdApi.UI.showToast("Update failed. Please update manually.", { type: "error" });
            }
        }

        _isNewer(a, b) {
            const pa = a.split(".").map(Number);
            const pb = b.split(".").map(Number);
            for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
                if ((pa[i] || 0) > (pb[i] || 0)) return true;
                if ((pa[i] || 0) < (pb[i] || 0)) return false;
            }
            return false;
        }
    };
})();