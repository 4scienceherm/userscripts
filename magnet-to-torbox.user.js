// ==UserScript==
// @name         Magnet to TorBox
// @namespace    https://github.com/4scienceherm
// @version      1.0.0
// @description  Adds a TB button next to every magnet link that sends it to the TorBox download client (RDTClient) at torbox.crandall.cc
// @author       Hermes
// @license      MIT
// @match        *://*/*
// @exclude      *://torbox.crandall.cc/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      torbox.crandall.cc
// @connect      10.10.10.4
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/4scienceherm/userscripts/main/magnet-to-torbox.user.js
// @downloadURL  https://raw.githubusercontent.com/4scienceherm/userscripts/main/magnet-to-torbox.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Talks to RDTClient's qBittorrent-compatible API (the same one Sonarr/Radarr use).
    // No password is stored in this script. If RDTClient login is ever turned on,
    // use the menu command "TorBox: set login" and it is kept only in your browser's script storage.
    const DEFAULT_BASE = 'https://torbox.crandall.cc';
    const DEFAULT_CATEGORIES = ['movies', 'tv'];
    const MARK = 'data-tb-processed';

    const cfg = {
        base: () => String(GM_getValue('baseUrl', DEFAULT_BASE)).replace(/\/+$/, ''),
        user: () => GM_getValue('username', ''),
        pass: () => GM_getValue('password', ''),
        lastCat: () => GM_getValue('lastCategory', ''),
    };

    let loggedIn = false;
    let existing = new Set();
    let categories = null;
    const buttons = new Map(); // hash -> [button elements]

    function request(method, path, form) {
        return new Promise((resolve, reject) => {
            const body = form ? new URLSearchParams(form).toString() : null;
            GM_xmlhttpRequest({
                method,
                url: cfg.base() + path,
                data: body,
                headers: form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
                timeout: 30000,
                onload: (r) => (r.status >= 200 && r.status < 300 ? resolve(r.responseText) : reject(new Error(`HTTP ${r.status}`))),
                onerror: () => reject(new Error('Could not reach TorBox client (are you on the home network or Tailscale?)')),
                ontimeout: () => reject(new Error('TorBox client timed out')),
            });
        });
    }

    async function ensureLogin() {
        if (loggedIn || !cfg.user()) return;
        const res = await request('POST', '/api/v2/auth/login', { username: cfg.user(), password: cfg.pass() });
        if (!/ok/i.test(res)) throw new Error('TorBox login failed');
        loggedIn = true;
    }

    function magnetHash(href) {
        const m = /[?&]xt=urn:btih:([^&]+)/i.exec(href || '');
        if (!m) return null;
        const h = m[1].trim();
        if (/^[A-Fa-f0-9]{40}$/.test(h)) return h.toLowerCase();
        return h.toUpperCase(); // base32; left as-is, only used for the duplicate check when it is hex
    }

    async function loadExisting() {
        try {
            await ensureLogin();
            const list = JSON.parse(await request('GET', '/api/v2/torrents/info'));
            existing = new Set(list.map((t) => String(t.hash || '').toLowerCase()));
            for (const [hash, btns] of buttons) if (existing.has(hash)) btns.forEach((b) => setState(b, 'exists'));
        } catch (e) {
            console.debug('[Magnet to TorBox] could not load existing torrents:', e.message);
        }
    }

    async function loadCategories() {
        if (categories) return categories;
        try {
            await ensureLogin();
            const c = Object.keys(JSON.parse(await request('GET', '/api/v2/torrents/categories')));
            categories = c.length ? c : DEFAULT_CATEGORIES;
        } catch (_) {
            categories = DEFAULT_CATEGORIES;
        }
        return categories;
    }

    function toast(msg, ok) {
        const t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = `position:fixed;bottom:20px;left:20px;z-index:2147483647;max-width:320px;padding:12px 16px;border-radius:8px;background:#1d1d1d;color:#fff;font:14px/1.3 sans-serif;border-left:4px solid ${ok ? '#22c55e' : '#ef4444'};box-shadow:0 6px 20px rgba(0,0,0,.4)`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 4500);
    }

    function setState(btn, state) {
        const s = {
            default: ['TB', '#0ea5e9', 'pointer', 'Send to TorBox'],
            busy: ['…', '#64748b', 'wait', 'Sending…'],
            added: ['✓', '#22c55e', 'default', 'Sent to TorBox'],
            exists: ['✓', '#22c55e', 'default', 'Already in TorBox'],
        }[state];
        btn.textContent = s[0];
        btn.style.background = s[1];
        btn.style.cursor = s[2];
        btn.title = s[3];
        btn.dataset.state = state;
    }

    function closeMenus() {
        document.querySelectorAll('.tb-menu').forEach((m) => m.remove());
    }

    async function send(btn, magnet, category) {
        setState(btn, 'busy');
        try {
            await ensureLogin();
            const res = await request('POST', '/api/v2/torrents/add', { urls: magnet, category });
            if (/fail/i.test(res)) throw new Error('TorBox client rejected the magnet');
            GM_setValue('lastCategory', category);
            const h = magnetHash(magnet);
            if (h) existing.add(h);
            setState(btn, 'added');
            toast(`Sent to TorBox (${category})`, true);
        } catch (e) {
            setState(btn, 'default');
            toast(e.message, false);
        }
    }

    async function showMenu(btn, magnet) {
        closeMenus();
        const cats = await loadCategories();
        const menu = document.createElement('div');
        menu.className = 'tb-menu';
        const r = btn.getBoundingClientRect();
        menu.style.cssText = `position:fixed;z-index:2147483647;top:${Math.min(r.bottom + 4, window.innerHeight - 40 - cats.length * 32)}px;left:${Math.min(r.left, window.innerWidth - 170)}px;min-width:150px;padding:6px;border-radius:8px;background:#1d1d1d;box-shadow:0 8px 24px rgba(0,0,0,.45);font:13px sans-serif;`;
        const title = document.createElement('div');
        title.textContent = 'Send to TorBox as:';
        title.style.cssText = 'padding:4px 8px;color:#94a3b8;font-size:11px';
        menu.appendChild(title);
        const last = cfg.lastCat();
        [...cats].sort((a, b) => (a === last ? -1 : b === last ? 1 : 0)).forEach((c) => {
            const item = document.createElement('div');
            item.textContent = c;
            item.style.cssText = 'padding:7px 10px;border-radius:5px;color:#fff;cursor:pointer;text-transform:capitalize';
            item.onmouseenter = () => (item.style.background = '#334155');
            item.onmouseleave = () => (item.style.background = '');
            item.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); closeMenus(); send(btn, magnet, c); };
            menu.appendChild(item);
        });
        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener('click', closeMenus, { once: true }), 0);
    }

    function makeButton(link) {
        const btn = document.createElement('span');
        btn.setAttribute('data-tb-inserted', '1');
        btn.style.cssText = 'display:inline-block;min-width:18px;height:18px;margin-left:6px;padding:0 4px;vertical-align:middle;border-radius:3px;color:#fff;text-align:center;line-height:18px;font:bold 11px sans-serif;user-select:none;box-sizing:border-box';
        setState(btn, 'default');
        btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            if (btn.dataset.state !== 'default') return;
            showMenu(btn, link.href);
        });
        return btn;
    }

    function scan(root) {
        for (const link of (root || document).querySelectorAll('a[href^="magnet:"]')) {
            if (link.hasAttribute(MARK) || !link.parentNode) continue;
            link.setAttribute(MARK, '1');
            const btn = makeButton(link);
            link.parentNode.insertBefore(btn, link.nextSibling);
            const h = magnetHash(link.href);
            if (h) {
                if (!buttons.has(h)) buttons.set(h, []);
                buttons.get(h).push(btn);
                if (existing.has(h)) setState(btn, 'exists');
            }
        }
    }

    function debounce(fn, ms) {
        let t;
        return () => { clearTimeout(t); t = setTimeout(fn, ms); };
    }

    GM_registerMenuCommand('TorBox: set address', () => {
        const v = prompt('TorBox client address:', cfg.base());
        if (v) { GM_setValue('baseUrl', v.trim()); loggedIn = false; categories = null; location.reload(); }
    });
    GM_registerMenuCommand('TorBox: set login (only if login is enabled)', () => {
        const u = prompt('Username (blank to clear):', cfg.user());
        if (u === null) return;
        const p = u ? prompt('Password:', '') : '';
        GM_setValue('username', u.trim());
        GM_setValue('password', p || '');
        loggedIn = false;
        location.reload();
    });

    scan();
    if (buttons.size) loadExisting();
    new MutationObserver(debounce(() => {
        const before = buttons.size;
        scan();
        if (!before && buttons.size) loadExisting();
    }, 200)).observe(document.body, { childList: true, subtree: true });
})();
