// ==UserScript==
// @name         Always Remember Me
// @namespace    https://github.com/4scienceherm
// @version      1.0.0
// @description  Ticks "Remember me" / "Keep me signed in" boxes on login forms, including forms that appear later and custom-styled checkboxes
// @license      MIT
// @author       Hermes
// @match        *://*/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @updateURL    https://raw.githubusercontent.com/4scienceherm/userscripts/main/always-remember-me.user.js
// @downloadURL  https://raw.githubusercontent.com/4scienceherm/userscripts/main/always-remember-me.user.js
// ==/UserScript==

(function () {
    'use strict';

    // How it works: instead of a fixed list of ids, it looks at every checkbox that sits
    // in the same form or dialog as a password field and reads its name, id, class, aria-label
    // and visible label text. If that looks like "remember me" it gets ticked once.
    // It re-checks whenever the page changes, so single-page apps and delayed login forms work.
    // If you untick a box yourself, it is left alone for that page.

    const HOST = location.hostname;
    const disabledSites = () => GM_getValue('disabledSites', []);
    const trustDevices = () => GM_getValue('trustDevices', false);

    if (disabledSites().includes(HOST)) return;

    // Positive: wording that means "stay signed in".
    const REMEMBER = /remember|keep\s*me|stay\s*(signed|logged)|keep\s*(signed|logged)|stay\s*in\b|persist(ent)?[-_ ]?(login|session)|signed[-_ ]?in[-_ ]?(on|for)|rememberme|keepmeloggedin|staysignedin/i;
    // Opt-in only: skips two-factor prompts on this browser, so it is off unless enabled in the menu.
    const TRUST = /trust(ed)?[-_ ]?(this[-_ ]?)?(device|browser|computer)|don'?t\s*ask\s*again|do\s*not\s*ask\s*again|skip\s*(2fa|mfa)/i;
    // Never tick these, even when "remember" appears in the text.
    const NEVER = /card|payment|billing|address|shipping|newsletter|marketing|promo|offers|subscribe|autofill|save\s*(my\s*)?(info|details|password)|terms|agree|consent|cookie|privacy/i;

    const touched = new WeakSet();   // boxes we already handled, so a box you untick stays unticked
    const userChanged = new WeakSet();

    function textFor(el) {
        const parts = [el.name, el.id, el.className && String(el.className), el.getAttribute('aria-label'), el.getAttribute('data-testid'), el.getAttribute('title')];
        if (el.labels) for (const l of el.labels) parts.push(l.textContent);
        const wrap = el.closest('label');
        if (wrap) parts.push(wrap.textContent);
        const lb = el.getAttribute('aria-labelledby');
        if (lb) for (const id of lb.split(/\s+/)) parts.push(document.getElementById(id)?.textContent);
        const sib = el.nextElementSibling || el.parentElement;
        if (sib && (sib.textContent || '').length < 80) parts.push(sib.textContent);
        return parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    }

    function inLoginContext(el) {
        const scope = el.closest('form, [role="dialog"], [role="form"], dialog') || el.parentElement?.parentElement?.parentElement;
        if (!scope) return false;
        if (scope.querySelector('input[type="password"]')) return true;
        // Two-step logins show the username first and the password on the next screen.
        const u = scope.querySelector('input[autocomplete~="username"], input[type="email"], input[name*="user" i], input[name*="login" i], input[id*="user" i], input[id*="login" i]');
        return !!(u && /sign\s*in|log\s*in|login/i.test(scope.textContent.slice(0, 600)));
    }

    function wants(el) {
        const t = textFor(el);
        if (!t || NEVER.test(t)) return false;
        if (REMEMBER.test(t)) return true;
        return trustDevices() && TRUST.test(t);
    }

    function isVisible(el) {
        const r = el.getBoundingClientRect();
        const hidden = r.width === 0 && r.height === 0;
        if (!hidden) return true;
        // Custom checkboxes hide the real input and draw their own; those still count.
        return !!(el.closest('label') || el.labels?.length);
    }

    function tick(el) {
        if (el.matches('input[type="checkbox"]')) {
            if (el.checked || el.disabled) return;
            const target = (el.getBoundingClientRect().width === 0 && (el.labels?.[0] || el.closest('label'))) || el;
            target.click();
            if (!el.checked) {                       // some widgets ignore clicks on the label
                el.checked = true;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {                                      // role="checkbox" / role="switch" widgets
            if (el.getAttribute('aria-checked') === 'true' || el.getAttribute('aria-disabled') === 'true') return;
            el.click();
        }
    }

    function scan() {
        const boxes = document.querySelectorAll('input[type="checkbox"], [role="checkbox"], [role="switch"]');
        for (const el of boxes) {
            if (touched.has(el)) continue;
            if (!inLoginContext(el) || !isVisible(el) || !wants(el)) continue;
            touched.add(el);
            tick(el);
            el.addEventListener('click', (e) => { if (e.isTrusted) userChanged.add(el); }, true);
        }
    }

    // A box you deliberately untick is added to `touched` already, so it will not be re-ticked.
    document.addEventListener('click', (e) => {
        const el = e.target.closest?.('input[type="checkbox"], [role="checkbox"], [role="switch"]');
        if (el && e.isTrusted) touched.add(el);
    }, true);

    let timer;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(scan, 250); };
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    scan();
    setTimeout(scan, 800);

    GM_registerMenuCommand(`Always Remember Me: ${disabledSites().includes(HOST) ? 'enable' : 'disable'} on ${HOST}`, () => {
        const list = new Set(disabledSites());
        list.has(HOST) ? list.delete(HOST) : list.add(HOST);
        GM_setValue('disabledSites', [...list]);
        location.reload();
    });
    GM_registerMenuCommand(`Always Remember Me: "trust this device" boxes are ${trustDevices() ? 'ON' : 'OFF'} (click to toggle)`, () => {
        GM_setValue('trustDevices', !trustDevices());
        location.reload();
    });
})();
