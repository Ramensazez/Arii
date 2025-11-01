// ==UserScript==
// @name         Auto Message Sender [FULL]
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  1. Click pe message-... -> 2. Scrie "hello" -> 3. Apasa Senden
// @author       Ramensazez
// @match        *://*/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/Ramensazez/Arii/main/Arii-message.user.js
// @downloadURL  https://raw.githubusercontent.com/Ramensazez/Arii/main/Arii-message.user.js
// ==/UserScript==
(function () {
    'use strict';
    const MESSAGE_TEXT = 'hello';
    const CLICK_DELAY = 800;
    const TYPE_DELAY = 300;
    const SHOW_DEBUG = true;
    let hasClicked = false;
    let hasSent = false;

    function openChat() {
        if (hasClicked) return;
        const msgBtn = document.querySelector('i[id^="message-"]');
        if (!msgBtn) {
            if (SHOW_DEBUG) console.log('Astept butonul message-...');
            return false;
        }
        hasClicked = true;
        msgBtn.style.outline = '4px solid lime';
        msgBtn.title = 'Chat deschis automat';
        setTimeout(() => {
            msgBtn.click();
            if (SHOW_DEBUG) console.log('1. Chat deschis! Astept textarea...');
            waitForTextarea();
        }, CLICK_DELAY);
        return true;
    }

    function waitForTextarea() {
        const interval = setInterval(() => {
            const textarea = document.getElementById('sending-message');
            if (textarea && !hasSent) {
                clearInterval(interval);
                textarea.focus();
                textarea.value = '';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                let i = 0;
                const typeChar = () => {
                    if (i < MESSAGE_TEXT.length) {
                        textarea.value += MESSAGE_TEXT[i];
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        i++;
                        setTimeout(typeChar, TYPE_DELAY);
                    } else {
                        if (SHOW_DEBUG) console.log('2. Mesaj scris: "' + MESSAGE_TEXT + '"');
                        setTimeout(clickSendButton, 500);
                    }
                };
                typeChar();
            }
        }, 200);
    }

    function clickSendButton() {
        const sendBtn = document.getElementById('submitto');
        if (!sendBtn || hasSent) {
            if (SHOW_DEBUG) console.warn('Butonul Senden nu e disponibil sau mesajul e trimis deja.');
            return;
        }
        hasSent = true;
        sendBtn.style.outline = '4px solid red';
        sendBtn.style.boxShadow = '0 0 15px red';
        setTimeout(() => {
            sendBtn.click();
            if (SHOW_DEBUG) console.log('3. Mesaj TRIMIS!');
            console.log('%cMesajul "hello" a fost trimis cu succes!', 'color: gold; font-weight: bold; font-size: 16px;');
        }, 300);
    }

    const observer = new MutationObserver(() => {
        if (openChat()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(openChat, 500);

    if (SHOW_DEBUG) {
        console.log('%cAuto Message Sender [FULL] – PORNIT!', 'color: cyan; font-weight: bold;');
    }
})();
