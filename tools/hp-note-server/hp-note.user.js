// ==UserScript==
// @name         HP-Note - GitHub Code Review Softener
// @namespace    hp-note
// @version      1.3
// @description  Adds an HP-Note button to GitHub PR comment boxes to soften harsh review comments
// @match        https://github.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @stylistic/quotes */
(function () {
    'use strict';

    const API_URL = 'http://localhost:3033/hp-note';

    function callServer(text) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: API_URL,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ text }),
                onload(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.result) resolve(data.result);
                        else reject(new Error(data.error || 'Unknown error'));
                    } catch (e) {
                        reject(new Error('Invalid response from server'));
                    }
                },
                onerror(err) {
                    reject(new Error("Could not reach the local server.\nMake sure it's running: pnpm run hp-note"));
                }
            });
        });
    }

    function createButton(textarea) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.hpNoteBtn = 'true';
        btn.className = 'prc-Button-ButtonBase-9n-Xk py-1 px-2';
        btn.setAttribute('data-loading', 'false');
        btn.setAttribute('data-no-visuals', 'true');
        btn.setAttribute('data-size', 'medium');
        btn.setAttribute('data-variant', 'default');

        btn.innerHTML =
            '<span data-component="buttonContent" data-align="center" class="prc-Button-ButtonContent-Iohp5">' +
            '<span data-component="text" class="prc-Button-Label-FWkx3">HP-Note</span>' +
            '</span>';

        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const text = textarea.value.trim();
            if (!text) return;

            const label = btn.querySelector('[data-component="text"]');
            label.textContent = 'Translating...';
            btn.disabled = true;

            try {
                const result = await callServer(text);
                const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
                nativeSetter.call(textarea, result);
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            } catch (err) {
                alert('HP-Note: ' + err.message);
            }

            label.textContent = 'HP-Note';
            btn.disabled = false;
        });

        return btn;
    }

    function addButtons() {
        const editors = document.querySelectorAll('[class*="MarkdownEditor-module__container"]');

        editors.forEach((editor) => {
            if (editor.dataset.hpNote) return;
            editor.dataset.hpNote = 'true';

            const textarea = editor.querySelector('textarea');
            if (!textarea) return;

            const footer = editor.querySelector('[class*="Footer-module__childrenStyling"]');
            if (footer) {
                footer.prepend(createButton(textarea));
            }
        });
    }

    addButtons();

    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(addButtons, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
