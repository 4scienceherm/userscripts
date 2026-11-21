// ==UserScript==
// @name         Skip Shortlinks Lite
// @namespace    https://github.com/4scienceherm
// @version      1.0.0
// @description  On link-shortener and file-host pages: decodes the destination from the URL, speeds up countdowns, blocks popups and clicks the final "Continue / Get link" button. Captchas are left for you to solve.
// @license      MIT
// @author       Hermes
// @match        *://*/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/4scienceherm/userscripts/main/skip-shortlinks-lite.user.js
// @downloadURL  https://raw.githubusercontent.com/4scienceherm/userscripts/main/skip-shortlinks-lite.user.js
// ==/UserScript==

(function () {
    'use strict';

    // This script only does anything on the sites listed below plus any you add from the
    // userscript menu ("Skip Shortlinks: add this site"). On every other site it exits immediately.
    const BUILTIN_HOSTS = ["10short.com", "1bitspace.com", "1fichier.com", "1short.io", "1shortlink.com", "2linkes.com", "2wheelslife.com", "3link.com", "3rabsports.com", "4fnet.org", "4kphotoediting.com", "6harfli.com", "8tm.net", "9sblog.com", "ac.totsugeki.com", "aceforce2apk.com", "actualpost.com", "adbtc.top", "adfoc.us", "admediaflex.com", "adoc.pub", "adrinolinks.in", "adsssy.com", "adtival.network", "aduzz.com", "advertisingcamps.com", "advupdates.com", "aiimsopd.com", "aiperceiver.com", "airevue.net", "akash.classicoder.com", "alljntuworld.in", "allnotes.in", "almontsf.com", "alorra.com", "amalot.net", "amanguides.com", "americanstylo.com", "animerigel.com", "anlikgb.com", "anonym.ninja", "api.gplinks.com", "apkadmin.com", "apkallworld.com", "apkvmod.com", "apkw.ru", "arab-plus.net", "arabe-tech.com", "arkarinaukrinetwork.com", "atravan.net", "autofaucet.dutchycorp.space", "aysodamag.com", "balatroltd.com", "bankshiksha.in", "baristakesehatan.com", "barlianta.com", "bcsclass.com", "beautifulfashionnailart.com", "bebkub.com", "befinja.com", "besargaji.com", "bestfonts.pro", "bestloansoffers.com", "bewbin.com", "bflig.com", "bgmiobb.com", "bico8.com", "bigbtc.win", "bihartown.com", "biit.site", "bilgilendirici.com", "bioinflu.com", "biovetro.net", "bitcotasks.com", "bitcrypto.info", "bitwidgets.net", "bjp.org.in", "blog-myst.com", "blog.klublog.com", "blog.yurasu.xyz", "blog4nx.com", "blogfly.site", "bloggerpemula.pythonanywhere.com", "blogmado.com", "blogmystt.com", "blogsward.com", "bnbfree.in", "bnirfinance.com", "boost.ink", "bowfile.com", "brewmasterly.com", "bstlar.com", "bubblix.eu", "bulkpit.com", "businesssoftwarehere.com", "buzzheavier.com", "camdigest.com", "cararabic.com", "carbikenation.com", "carbikesupdate.com", "carbikeswale.com", "carfocus.site", "carjankaari.com", "carribo.net", "carsmania.net", "carstopia.net", "cdrab.com", "chownest.com", "chronoat.com", "cinemascene.net", "clikern.com", "clk.sh", "coinilium.net", "coinjest.com", "coinscap.info", "coinsrev.com", "coinsrise.net", "coinstrend.net", "coinsvalue.net", "comohoy.com", "constructorspro.com", "cookinguide.net", "cooklike.info", "countriesguide.net", "cpmlink.net", "creditcarred.com", "creditsgoal.com", "cryptonews.faucetbin.com", "cryptonewssite.rf.gd", "cryptorotator.website", "cryptosparatodos.com", "cryptowidgets.net", "cshort.org", "csyildizi.com", "curto.win", "cuttlinks.com", "cuttty.com", "cutyion.com", "cutynow.com", "dadinthemaking.com", "dailytech-news.eu", "dailyuploads.net", "dataupload.net", "dayuploads.com", "dbree.me", "dddrive.me", "ddieta.net", "desimonthdate.com", "desiupload.co", "devnote.in", "dhanyogi.com", "dinheiromoney.com", "dinoogaming.com", "disheye.com", "diudemy.com", "dizok.com", "djbassking.com", "djremixganna.com", "djstar.in", "dlgamingvn.com", "doodrive.com", "douploads.net", "down.fast-down.com", "down.mdiaload.com", "downfile.site", "downloader.tips", "dramaticqueen.com", "drinkspartner.com", "drop.download", "dropgalaxy.com", "dutchycorp.space", "dvjobs.in", "earnmoneyyt.com", "easylink.gamingwithtr.com", "easyupload.io", "ebanglapro.com", "ecofriendlyz.com", "ecoinfotec.com", "ecosolardigest.com", "ecq.info", "ecryptly.com", "eduprothink.com", "emubliss.com", "encurt4.com", "encurtacash.com", "englishgrammarpro.net", "enlacito.com", "equickle.com", "esladvice.com", "exblog.jp", "exe-links.com", "exe-urls.com", "exeygo.com", "exnion.com", "expertvn.com", "ez4mods.com", "ezeviral.com", "f2h.io", "fabriksite.com", "falpus.com", "fansonlinehub.com", "fastcars1.com", "file-upload.net", "file-upload.org", "filedm.com", "filemoon.sx", "fileresources.net", "files.fm", "filespayouts.com", "finance240.com", "financebolo.com", "financedoze.com", "financekita.com", "financenube.com", "financenuz.com", "financerites.com", "financewada.com", "fingau.com", "finquizy.com", "firefaucet.win", "fitbodygenius.com", "fitdynamos.com", "fitnesswifi.com", "flamebook.eu.org", "flickr.com", "foodxor.com", "forex-22.com", "forex-articles.com", "forex-trnd.com", "forexrw7.com", "formshelp.in", "fourlinez.com", "freebitco.in", "freeoseocheck.com", "freepreset.net", "freeth.in", "freevpshere.com", "funplayarcade.com", "furtnitureplanet.net", "fuyde.com", "fx-22.com", "g34new.com", "gadgetbuzz.net", "gadialert.in", "game5s.com", "games2mobile.com", "gamestopia.net", "gamezigg.com", "gamezizo.com", "gdflix.dad", "geekgrove.net", "geotides.net", "getknldgg.site", "getpczone.com", "giftmagic.net", "gizmoera.com", "gkvstudy.com", "glimmerbyte.com", "glowandglamcorner.com", "go.paylinks.cloud", "gocmod.com", "gofile.io", "goodmorningimg.com", "governmentjobvacancies.com", "gputrends.net", "grtjobs.in", "gyoblog.com", "hamroguide.com", "headlinerpost.com", "healthfirstweb.com", "healthylifez.com", "helpdeep.com", "heygirlish.com", "hipsonyc.com", "historyofyesterday.com", "hitfile.net", "hnablog.com", "hobbymania.net", "homesteadfeast.com", "horoscop.info", "hosttbuzz.com", "howifx.com", "howtoconcepts.com", "hyperkhabar.com", "hypicc.com", "icryptowin.com", "illustrationmaster.com", "imagereviser.com", "importantclass.com", "indids.com", "indobo.com", "infoguidebd.com", "infonerd.org", "inshort.in", "inshortnote.com", "insurancegold.in", "insuranceleadsinfo.com", "insurancemyst.com", "insurancexguide.com", "insurelean.com", "jansamparks.com", "jioupload.com", "jioupload.icu", "jksb.in", "jobinmeghalaya.in", "jobmatric.com", "jobpagol.com", "jobqwe.com", "jobydt.com", "jobzhub.store", "jplna.com", "junkyponk.com", "k2s.cc", "kabilnews.in", "kaomojihub.com", "karanpc.com", "karyawan.co.id", "katfile.com", "keedabankingnews.com", "keeplinks.org", "kiddyshort.com", "kisalt.digital", "knowiz0.blogspot.com", "kongutoday.com", "krakenfiles.com", "kredilerim.com", "labgame.io", "lajangspot.web.id", "lakhisarainews.in", "languagefluency.net", "lanza.me", "lapviral.com", "latestjobupdate.com", "lifeprovy.com", "link2unlock.com", "linkbox.to", "linkcents.com", "linkforearn.com", "linksly.co", "linkspy.cc", "linkvertise.com", "listofthis.com", "lixapk.com", "lksfy.com", "lmktec.net", "loanifyt.site", "lobirtech.com", "lolinez.com", "lopteapi.com", "lyricsbaazaar.com", "m-womenstyle.com", "m.flyad.vip", "mainitbd.com", "majalahhewan.com", "makego.net", "makeupguide.net", "maloma3arbi.blogspot.com", "mangareleasedate.com", "maqal360.com", "marketrook.com", "masrawytrend.com", "mastkhabre.com", "mazen-ve3.com", "mboost.me", "mclox.com", "mdseotools.com", "mealcold.com", "mealold.com", "mediafire.com", "mega4upload.net", "megaup.net", "megaupto.com", "melodyspot.net", "merekrut.com", "mexa.sh", "mgame.info", "minhamoto.com", "minhapostagem.top", "mirrored.to", "miuiku.com", "mixrootmods.com", "mobcupring.com", "mobileflashtools.com", "modcombo.com", "modsbase.com", "modsfire.com", "mohtawaa.com", "momge.net", "motahone.in", "mp4upload.com", "mpsarkarihelp.in", "mukhyamantriyojanadoot.com", "mukhyasamachar.in", "multiup.io", "myscheme.org.in", "mythnest.com", "mythvista.com", "nameortho.com", "newkhabar24.com", "newsamp.net", "newscrypto.info", "newselab.com", "newsminer.uno", "newsobjective.com", "newsonnline.com", "newspute.com", "nitro-link.com", "niveshskill.com", "nivtu.com", "o-pro.online", "odiadance.com", "odiadjremix.in", "odiafm.com", "on-scroll.com", "onlinetechsolution.link", "orbitlo.com", "origamiarthub.com", "ountriesguide.net", "ouo.io", "owoanime.com", "oydir.com", "pagalworldlyrics.com", "pagalworldsong.com", "paidinsurance.in", "paisasutra.com", "panyhealth.com", "pastescript.com", "paycut.pro", "pdfcoffee.com", "pdfvale.com", "petsguide.net", "phimne.com", "phimsubmoi.com", "phonesparrow.com", "placementsmela.com", "plantsguide.net", "playallgames.net", "playghub.com", "playnano.online", "playpaste.com", "pokoarcade.com", "policiesreview.com", "poorhindi.com", "posterify.net", "proappapk.com", "professionaley.com", "programasvirtualespc.net", "qiwi.gg", "qrixpe.com", "raftarsamachar.in", "raftarwords.in", "rapidgator.net", "rcccn.in", "redfea.com", "reidoplacar.com", "rekonise.com", "remixsounds.com", "render-state.to", "renovatehub.net", "retrocove.net", "retrotechreborn.com", "revlink.pro", "rfaucet.com", "rotizer.net", "sabkiyojana.com", "sakazi.net", "sarkarins.in", "sealanebio.com", "sekilastekno.com", "selfcareinsights.com", "send.now", "servicemassar.ma", "sevayojana.in", "sewdamp3.com.in", "seydisehirmansethaber.com", "sfl.gl", "sharclub.in", "sharedp.com", "sharemods.com", "sharetext.me", "shareus.io", "shortfaster.net", "shortit.pw", "shortlinks2btc.somee.com", "shrs.link", "skyrimer.com", "slink.bid", "smoplay.com", "snaplessons.net", "social-unlock.com", "socialwolvez.com", "softwaresolutionshere.com", "spatsify.com", "speakzyo.com", "sportswordz.com", "sportweb.info", "stockbhoomi.com", "stockmarg.com", "studywithsanjeet.in", "suaurl.com", "sub2get.com", "superheromaniac.com", "swachataparnibandh.com", "takefile.link", "tastywhiz.com", "techacode.com", "techavash.com", "techawaaz.in", "techetta.net", "techforu.in", "techiephone.com", "technofreez.com", "technons.com", "techoflix.com", "techrain.in", "techxploitz.eu.org", "tejtime24.com", "teknoasian.com", "telefonzilsesi.com", "tempatwisata.pro", "templeshelp.com", "tenorminiuk.com", "teqwit.com", "tessofficial.com", "thardekho.com", "the2.link", "thedeorianews.com", "thejessiek.com", "thepragatishilclasses.com", "thinksrace.com", "tinybc.com", "tmail.io", "todayheadliners.com", "topgeninsurance.com", "tophistoryview.com", "tophotelsukraine.com", "topjanakri.com", "toplistee.com", "tournguide.com", "tradeshowrating.com", "travelironguide.com", "travelperi.com", "triggeredplay.com", "trimorspacks.com", "tuasy.com", "turbobit.net", "turkiyertg.com", "tutorialsaya.com", "tvseriescentral.net", "ubnem.com", "udrop.com", "ukrupdate.com", "up-4ever.net", "updatewallah.in", "upfion.com", "upload.ee", "uploadev.org", "uploadhaven.com", "uploadrar.com", "uploadsoon.com", "uploady.io", "utkarshonlinetest.com", "uzaay.com", "v34down.com", "vahanmitra24.in", "vaultfind.net", "vebma.com", "vepiv.com", "verli.com", "veroan.com", "videoclip.info", "videolyrics.in", "viralmp3.com.in", "viralxns.com", "virtualrealitieshub.com", "virtuous-tech.net", "vitalityvista.net", "vocalley.com", "vosan.co", "vuotlinkvip.com", "vyaapaarguru.in", "wanderjourney.net", "watchtheeye.com", "web1s.com", "web9academy.com", "webfreetools.net", "webhostsec.com", "wellness4live.com", "wii.si", "wiki-topia.com", "winezones.in", "wokaz.com", "workupload.com", "worldzc.com", "worthtester.com", "wp2hostt.com", "wpcheap.net", "yitarx.com", "yodharealty.com", "yogablogfit.com", "yogatrick.com", "youlinks.in", "yrtourguide.com", "zegtrends.com", "ziggame.com", "zoninews.com", "zulgame.com", "zygina.com"];

    const host = location.hostname.toLowerCase().replace(/^www\./, '');
    const extra = () => GM_getValue('extraHosts', []);
    const matches = (list) => list.some((h) => host === h || host.endsWith('.' + h));

    GM_registerMenuCommand(`Skip Shortlinks: ${matches(extra()) ? 'remove' : 'add'} ${host}`, () => {
        const s = new Set(extra());
        s.has(host) ? s.delete(host) : s.add(host);
        GM_setValue('extraHosts', [...s]);
        location.reload();
    });
    GM_registerMenuCommand('Skip Shortlinks: pause for 10 minutes', () => {
        GM_setValue('pausedUntil', Date.now() + 10 * 60 * 1000);
        location.reload();
    });

    if (!(matches(BUILTIN_HOSTS) || matches(extra()))) return;
    if (Date.now() < GM_getValue('pausedUntil', 0)) return;
    if (window.top !== window.self) return; // only the top page, never ad or captcha frames

    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    // ---- 1. Destination hidden in the URL --------------------------------------------------
    const PARAMS = ['url', 'u', 'r', 'link', 'go', 'to', 'dest', 'destination', 'target', 'redirect', 'redirect_to', 'href', 'out', 'goto', 'q', 'l', 'd', 'k'];
    const looksUrl = (s) => /^https?:\/\/[^\s/]+\.[^\s/]+/i.test(s || '');
    function tryDecode(v) {
        if (!v) return null;
        const cands = [v];
        try { cands.push(decodeURIComponent(v)); } catch (_) { /* keep going */ }
        for (const c of [...cands]) {
            if (/^[A-Za-z0-9+/_-]{16,}={0,2}$/.test(c)) {
                try {
                    const b = atob(c.replace(/-/g, '+').replace(/_/g, '/'));
                    cands.push(b);
                    if (/^[A-Za-z0-9+/=]{16,}$/.test(b)) cands.push(atob(b)); // double base64
                } catch (_) { /* not base64 */ }
            }
        }
        return cands.find((c) => looksUrl(c) && new URL(c).hostname.replace(/^www\./, '') !== host) || null;
    }
    function destinationFromUrl() {
        const q = new URLSearchParams(location.search);
        for (const p of PARAMS) { const d = tryDecode(q.get(p)); if (d) return d; }
        const frag = location.hash.replace(/^#!?/, '');
        return tryDecode(frag);
    }
    const dest = destinationFromUrl();
    if (dest) {
        console.log('[Skip Shortlinks] destination found in the URL:', dest);
        location.replace(dest);
        return;
    }

    // ---- 2. Make the page think the tab is visible and focused ------------------------------
    try {
        Object.defineProperty(w.document, 'hidden', { get: () => false, configurable: true });
        Object.defineProperty(w.document, 'visibilityState', { get: () => 'visible', configurable: true });
        w.document.hasFocus = () => true;
        for (const ev of ['visibilitychange', 'blur', 'focusout', 'pagehide']) {
            w.addEventListener(ev, (e) => e.stopImmediatePropagation(), true);
            document.addEventListener(ev, (e) => e.stopImmediatePropagation(), true);
        }
    } catch (_) { /* some pages lock these */ }

    // ---- 3. Speed up countdowns and block popups ---------------------------------------------
    const realSetInterval = w.setInterval, realSetTimeout = w.setTimeout;
    w.setInterval = function (fn, ms, ...a) { return realSetInterval.call(this, fn, ms >= 400 && ms <= 5000 ? 40 : ms, ...a); };
    w.setTimeout = function (fn, ms, ...a) { return realSetTimeout.call(this, fn, ms >= 1000 && ms <= 60000 ? Math.min(ms, 120) : ms, ...a); };
    let blockedPopups = 0;
    w.open = function () { blockedPopups++; return null; };

    // ---- 4. Click the real "continue" button once it is ready --------------------------------
    // Button wording that means "go on", matched against the whole label.
    const GO = /^(please\s+)?(click\s+(here\s+)?to\s+)?(continue|get\s+(the\s+)?link|get\s+download\s+link|go\s+to\s+(the\s+)?(link|download|destination|website)|skip(\s+ad(s)?)?|proceed|unlock(\s+link)?|show\s+link|open\s+link|create\s+(download\s+)?link|generate\s+link|final\s+link|free\s+download|slow\s+download|regular\s+download|download(\s+now)?|click\s+here)(\s*[>»→]+)?$/i;
    // Things that look like it but are ads or accounts.
    const BAD = /premium|buy|upgrade|install|vpn|sign\s*up|log\s*in|register|app\b|extension|play\s*now|install\s*now/i;
    const clicked = new WeakSet();

    function captchaPending() {
        const widget = document.querySelector('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], iframe[src*="turnstile"], .g-recaptcha, .h-captcha, .cf-turnstile, [data-sitekey]');
        if (!widget) return false;
        const solved = [...document.querySelectorAll('[name="g-recaptcha-response"], [name="h-captcha-response"], [name="cf-turnstile-response"]')].some((e) => (e.value || '').length > 20);
        return !solved;
    }
    const visible = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 8 && r.height > 8 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.1;
    };
    const label = (el) => (el.value && el.tagName === 'INPUT' ? el.value : el.textContent || '').replace(/\s+/g, ' ').trim();

    function toast(msg) {
        let t = document.getElementById('skl-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'skl-toast';
            t.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:2147483647;padding:8px 12px;border-radius:6px;background:#111c;color:#fff;font:12px sans-serif;pointer-events:none';
            (document.body || document.documentElement).appendChild(t);
        }
        t.textContent = msg;
        clearTimeout(t._h); t._h = setTimeout(() => t.remove(), 3500);
    }

    function pass() {
        if (!document.body) return;
        if (captchaPending()) return;                    // you solve the captcha, then it goes on
        const els = document.querySelectorAll('a[href], button, input[type="submit"], input[type="button"], [role="button"], div[onclick], span[onclick]');
        for (const el of els) {
            if (clicked.has(el) || el.disabled || el.getAttribute('aria-disabled') === 'true' || /disabled/.test(el.className)) continue;
            const text = label(el);
            if (!text || text.length > 40 || !GO.test(text) || BAD.test(text) || /\d/.test(text) || !visible(el)) continue;
            if (el.tagName === 'A') {
                const h = el.getAttribute('href') || '';
                if (/^(javascript:void|#)/.test(h) === false && /^https?:/i.test(h) && new URL(h, location.href).hostname.replace(/^www\./, '') !== host) {
                    // a link straight to another site: take it instead of clicking
                    clicked.add(el); toast(`Skip Shortlinks: following "${text}"`); location.assign(h); return;
                }
            }
            clicked.add(el);
            toast(`Skip Shortlinks: clicked "${text}"`);
            el.click();
            return;
        }
        // Forms that submit themselves after a countdown
        const f = document.querySelector('form[id*="go" i], form[name*="go" i]');
        if (f && !clicked.has(f) && f.querySelector('[type="submit"]:not([disabled])') && !captchaPending()) { clicked.add(f); f.submit(); }
    }

    const start = () => {
        realSetInterval.call(w, pass, 400);
        new MutationObserver(() => realSetTimeout.call(w, pass, 100)).observe(document.documentElement, { childList: true, subtree: true });
        if (blockedPopups) toast(`Skip Shortlinks: blocked ${blockedPopups} popup(s)`);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
