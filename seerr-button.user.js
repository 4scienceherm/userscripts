// ==UserScript==
// @name         Seerr Button
// @namespace    https://github.com/yourusername
// @version      1.24
// @description  Adds Seerr and High-Rated TV buttons across supported media sites
// @author       Anthony
// @match        *://www.imdb.com/title/*
// @match        *://imdb.com/title/*
// @match        *://letterboxd.com/film/*
// @match        *://www.letterboxd.com/film/*
// @match        *://trakt.tv/movies/*
// @match        *://trakt.tv/shows/*
// @match        *://www.themoviedb.org/movie/*
// @match        *://www.themoviedb.org/tv/*
// @match        *://www.rottentomatoes.com/m/*
// @match        *://www.rottentomatoes.com/tv/*
// @match        *://seriesgraph.com/show/*
// @match        *://request.crandall.cc/*
// @updateURL    https://raw.githubusercontent.com/4scienceherm/userscripts/main/seerr-button.user.js
// @downloadURL  https://raw.githubusercontent.com/4scienceherm/userscripts/main/seerr-button.user.js
// @icon         https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/jellyseerr.png
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const seerrURL = GM_getValue('seerrURL', 'https://request.crandall.cc');
    const seriesURL = GM_getValue('seriesURL', 'https://series.crandall.cc');
    const defaultThreshold = GM_getValue('seriesThreshold', '8.0');

    let lastPageKey = '';
    let navHooksInstalled = false;
    let seerrWatchdogInstalled = false;

    function getHostname() {
        return window.location.hostname;
    }

    function getPathname() {
        return window.location.pathname;
    }

    function currentPageKey() {
        return `${window.location.hostname}${window.location.pathname}${window.location.search}`;
    }

    function waitForElement(selector, timeout = 8000) {
        return new Promise((resolve) => {
            const existing = document.querySelector(selector);
            if (existing) {
                resolve(existing);
                return;
            }
            const observer = new MutationObserver(() => {
                const match = document.querySelector(selector);
                if (match) {
                    observer.disconnect();
                    resolve(match);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    function parseJSONLD() {
        const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
        for (const script of scripts) {
            try {
                const raw = JSON.parse(script.textContent);
                const items = Array.isArray(raw) ? raw : [raw];
                for (const item of items) {
                    if (item && typeof item === 'object') {
                        return item;
                    }
                }
            } catch (_) {
                // ignore malformed blocks
            }
        }
        return null;
    }

    function makeActionLink({ href, label, title, background, compact = false }) {
        const link = document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = title;
        link.textContent = label;
        link.style.cssText = [
            'display: inline-flex',
            'align-items: center',
            'justify-content: center',
            compact ? 'min-width: 0' : 'min-width: 132px',
            compact ? 'padding: 8px 12px' : 'padding: 10px 12px',
            'border-radius: 8px',
            'color: white',
            compact ? 'font: 600 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' : 'font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            'text-align: center',
            'text-decoration: none',
            `background: ${background}`,
            'box-shadow: 0 2px 8px rgba(0,0,0,0.25)'
        ].join(';');
        return link;
    }

    function buildSeerrQuery(info) {
        if (info.imdbID) {
            return `imdb:${info.imdbID}`;
        }
        return encodeURIComponent(info.title || info.seriesSource || '');
    }

    function buildSeriesUrl(info) {
        const url = new URL(seriesURL);
        url.searchParams.set('source', info.seriesSource);
        url.searchParams.set('threshold', defaultThreshold);
        return url.toString();
    }

    function createFloatingButtonGroup(info) {
        const existing = document.getElementById('seerr-button-container');
        if (existing) {
            existing.remove();
        }

        const container = document.createElement('div');
        container.id = 'seerr-button-container';
        container.style.cssText = [
            'position: fixed',
            'top: 80px',
            'left: 20px',
            'z-index: 999999',
            'display: flex',
            'flex-direction: column',
            'gap: 8px',
            'padding: 8px',
            'border-radius: 10px',
            'background: rgba(0,0,0,0.82)',
            'box-shadow: 0 4px 14px rgba(0,0,0,0.35)',
            'backdrop-filter: blur(4px)'
        ].join(';');

        container.appendChild(makeActionLink({
            href: `${seerrURL}/search?query=${buildSeerrQuery(info)}`,
            label: 'Seerr',
            title: `Search Seerr for ${info.title || info.imdbID || info.tmdbID || info.seriesSource}`,
            background: '#1d4ed8'
        }));

        if (info.seriesSource && info.isTv !== false) {
            container.appendChild(makeActionLink({
                href: buildSeriesUrl(info),
                label: 'High-Rated TV',
                title: `Open High-Rated TV helper for ${info.title || info.seriesSource}`,
                background: '#7c3aed'
            }));
        }

        document.body.appendChild(container);
    }

    function insertSeerrInlineButton(info) {
        const existing = document.getElementById('seerr-inline-high-rated-tv');
        if (existing) {
            existing.remove();
        }

        const titleEl = document.querySelector('h1') || document.querySelector('[data-testid="media-title"]');
        if (!titleEl || !titleEl.parentElement || !info.seriesSource) {
            return false;
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'seerr-inline-high-rated-tv';
        wrapper.style.cssText = [
            'display: flex',
            'align-items: center',
            'gap: 10px',
            'margin: 0 0 12px 0',
            'flex-wrap: wrap'
        ].join(';');

        wrapper.appendChild(makeActionLink({
            href: buildSeriesUrl(info),
            label: 'High-Rated TV',
            title: `Open High-Rated TV helper for ${info.title || info.seriesSource}`,
            background: '#7c3aed',
            compact: true
        }));

        titleEl.parentElement.insertBefore(wrapper, titleEl);
        return true;
    }

    function extractSeerrInfoFromUrl() {
        const match = getPathname().match(/^\/tv\/(\d+)/);
        if (!match) {
            return null;
        }
        const title = document.querySelector('h1')?.innerText.trim() || document.title.replace(/\s*\|.*$/, '').trim() || 'TV Series';
        return {
            title,
            imdbID: null,
            tmdbID: match[1],
            seriesSource: match[1],
            isTv: true,
        };
    }

    function ensureSeerrTvButton() {
        if (getHostname() !== 'request.crandall.cc' || !getPathname().startsWith('/tv/')) {
            return false;
        }
        const info = extractSeerrInfoFromUrl();
        if (!info) {
            return false;
        }
        return insertSeerrInlineButton(info);
    }

    function installSeerrWatchdog() {
        if (seerrWatchdogInstalled) {
            return;
        }
        seerrWatchdogInstalled = true;
        window.setInterval(() => {
            ensureSeerrTvButton();
        }, 1200);
    }

    function parseIMDbPageType() {
        const jsonld = parseJSONLD();
        const type = jsonld && jsonld['@type'];
        return Array.isArray(type) ? type.join(',') : type || '';
    }

    async function extractIMDbInfo() {
        await waitForElement('h1[data-testid="hero__pageTitle"]');
        const idMatch = getPathname().match(/\/title\/(tt\d+)/i);
        const imdbID = idMatch ? idMatch[1].toLowerCase() : null;
        const titleElement = document.querySelector('h1[data-testid="hero__pageTitle"]');
        const title = titleElement ? (titleElement.querySelector('span')?.innerText.trim() || titleElement.innerText.trim()) : '';
        const type = parseIMDbPageType();
        const isTv = /TVSeries|TVMiniSeries|TVEpisode/i.test(type);
        return { imdbID, title, seriesSource: isTv && imdbID ? imdbID : null, isTv };
    }

    async function extractLetterboxdInfo() {
        await waitForElement('h1.headline-1');
        const imdbLink = document.querySelector("a[data-track-action='IMDb'][href*='imdb.com/title/']") || document.querySelector("a[href*='imdb.com/title/']");
        const imdbMatch = imdbLink ? imdbLink.href.match(/(tt\d+)/i) : null;
        const titleElement = document.querySelector('h1.headline-1.js-widont') || document.querySelector('h1.headline-1') || document.querySelector('.film-title-wrapper h1');
        const title = titleElement ? (titleElement.childNodes[0]?.textContent?.trim() || titleElement.textContent.trim()) : '';
        return { imdbID: imdbMatch ? imdbMatch[1].toLowerCase() : null, title, seriesSource: null, isTv: false };
    }

    async function extractTraktInfo() {
        await waitForElement('div.summary, h1');
        const imdbLink = document.querySelector("a.external[href*='imdb.com/title/']");
        const imdbMatch = imdbLink ? imdbLink.href.match(/(tt\d+)/i) : null;
        const title = document.querySelector('div.summary h1')?.innerText.trim() || document.querySelector('h1')?.innerText.trim() || '';
        const isTv = getPathname().startsWith('/shows/');
        return { imdbID: imdbMatch ? imdbMatch[1].toLowerCase() : null, title, seriesSource: isTv ? (imdbMatch ? imdbMatch[1].toLowerCase() : title) : null, isTv };
    }

    async function extractTMDbInfo() {
        await waitForElement('section.header h2, h2 a');
        const tmdbMatch = getPathname().match(/^\/(movie|tv)\/(\d+)/i);
        const tmdbID = tmdbMatch ? tmdbMatch[2] : null;
        const mediaType = tmdbMatch ? tmdbMatch[1].toLowerCase() : '';
        const titleElement = document.querySelector('section.header h2');
        const title = titleElement ? (titleElement.querySelector('a')?.innerText.trim() || titleElement.innerText.trim()) : '';
        const imdbLink = document.querySelector("a.social_link[href*='imdb.com/title/']");
        const imdbMatch = imdbLink ? imdbLink.href.match(/(tt\d+)/i) : null;
        const isTv = mediaType === 'tv';
        return { imdbID: imdbMatch ? imdbMatch[1].toLowerCase() : null, tmdbID, title, seriesSource: isTv ? tmdbID : null, isTv };
    }

    async function extractRottenTomatoesInfo() {
        await waitForElement("h1[data-qa='score-panel-title'], h1.title");
        const titleElement = document.querySelector("h1[data-qa='score-panel-title']") || document.querySelector('h1.title');
        let title = titleElement ? titleElement.innerText.trim() : '';
        const yearElement = document.querySelector("span[data-qa='score-panel-year']") || document.querySelector('span.year');
        if (title && yearElement) {
            const year = yearElement.innerText.replace(/[()]/g, '').trim();
            title = `${title} ${year}`;
        }
        const isTv = getPathname().startsWith('/tv/');
        return { title, imdbID: null, seriesSource: isTv ? title : null, isTv };
    }

    async function extractSeriesGraphInfo() {
        await waitForElement('h3.rt-Heading.rt-r-size-6', 8000);
        const title = document.querySelector('h3.rt-Heading.rt-r-size-6')?.innerText.trim() || '';
        return { title, imdbID: null, seriesSource: window.location.href, isTv: true };
    }

    async function init() {
        const pageKey = currentPageKey();
        if (pageKey === lastPageKey && (document.getElementById('seerr-button-container') || document.getElementById('seerr-inline-high-rated-tv'))) {
            return;
        }
        lastPageKey = pageKey;

        document.getElementById('seerr-button-container')?.remove();
        document.getElementById('seerr-inline-high-rated-tv')?.remove();

        if (ensureSeerrTvButton()) {
            return;
        }

        let info = null;
        if (getHostname().includes('imdb.com')) {
            info = await extractIMDbInfo();
        } else if (getHostname().includes('letterboxd.com')) {
            info = await extractLetterboxdInfo();
        } else if (getHostname().includes('trakt.tv')) {
            info = await extractTraktInfo();
        } else if (getHostname().includes('themoviedb.org')) {
            info = await extractTMDbInfo();
        } else if (getHostname().includes('rottentomatoes.com')) {
            info = await extractRottenTomatoesInfo();
        } else if (getHostname().includes('seriesgraph.com') && getPathname().startsWith('/show/')) {
            info = await extractSeriesGraphInfo();
        }

        if (info) {
            console.log('Seerr Button info', info);
            createFloatingButtonGroup(info);
        }
    }

    function installNavigationHooks() {
        if (navHooksInstalled) {
            return;
        }
        navHooksInstalled = true;

        const rerun = () => window.setTimeout(() => init(), 50);
        window.addEventListener('popstate', rerun);
        window.addEventListener('hashchange', rerun);

        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            const result = originalPushState.apply(this, args);
            rerun();
            return result;
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function (...args) {
            const result = originalReplaceState.apply(this, args);
            rerun();
            return result;
        };
    }

    installNavigationHooks();
    installSeerrWatchdog();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
