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

    const STORAGE_KEY_MSG = 'auto_message_current';
    const STORAGE_KEY_LIST = 'auto_message_saved_list';
    const MAX_SAVED = 5; // Doar ultimele 5 mesaje
    const CLICK_DELAY = 800;
    const PASTE_DELAY = 500;
    const SHOW_DEBUG = true;

    let hasClicked = false;
    let hasSent = false;
    let currentMessage = localStorage.getItem(STORAGE_KEY_MSG) || '';
    let savedMessages = JSON.parse(localStorage.getItem(STORAGE_KEY_LIST) || '[]');

    // === Limitează la ultimele 5 mesaje ===
    function enforceMaxSaved() {
        if (savedMessages.length > MAX_SAVED) {
            savedMessages = savedMessages.slice(-MAX_SAVED); // păstrează ultimele 5
            localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(savedMessages));
        }
    }

    // Verificăm la pornire
    enforceMaxSaved();

    // === Creează panoul PRO ===
    function createProPanel() {
        if (document.getElementById('auto-msg-pro-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'auto-msg-pro-panel';
        panel.style.cssText = `
            position: fixed;
            top: 15px;
            right: 15px;
            width: 370px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border: 1px solid #00d4ff;
            border-radius: 16px;
            padding: 16px;
            z-index: 999999;
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #e0f7ff;
            box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3);
            backdrop-filter: blur(10px);
            transition: all 0.4s ease;
            transform: translateY(-10px);
            opacity: 0;
        `;
        document.body.appendChild(panel);

        setTimeout(() => {
            panel.style.transform = 'translateY(0)';
            panel.style.opacity = '1';
        }, 100);

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin:0; font-size:16px; color:#00d4ff; text-shadow: 0 0 8px #00d4ff;">
                    Auto Sender <span style="font-size:12px; color:#aaa;">(ultimele 5)</span>
                </h3>
                <button id="auto-msg-close" style="
                    background:none; border:none; color:#ff6b6b; font-size:20px; cursor:pointer;
                    transition:0.3s; padding:4px 8px; border-radius:6px;
                " onmouseover="this.style.background='#ff6b6b33'" onmouseout="this.style.background='none'">×</button>
            </div>

            <textarea id="auto-msg-input" placeholder="Scrie mesajul aici..." style="
                width:100%; height:90px; background:#0f1b2e; color:#0ff; border:1px solid #00d4ff;
                border-radius:10px; padding:10px; font-size:13px; resize:vertical; outline:none;
                transition:0.3s; box-shadow:0 0 10px rgba(0,212,255,0.2);
            " onfocus="this.style.boxShadow='0 0 15px rgba(0,212,255,0.5)'"
            onblur="this.style.boxShadow='0 0 10px rgba(0,212,255,0.2)'"></textarea>

            <div style="display:flex; gap:8px; margin-top:10px;">
                <button id="auto-msg-save" style="
                    flex:1; padding:10px; background:#00d4ff; color:#000; border:none;
                    border-radius:10px; font-weight:bold; cursor:pointer; transition:0.3s;
                    box-shadow:0 4px 15px rgba(0,212,255,0.4);
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,212,255,0.6)'"
                onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 15px rgba(0,212,255,0.4)'">
                    Salvează
                </button>
                <button id="auto-msg-set" style="
                    flex:1; padding:10px; background:#00ff9d; color:#000; border:none;
                    border-radius:10px; font-weight:bold; cursor:pointer; transition:0.3s;
                    box-shadow:0 4px 15px rgba(0,255,157,0.4);
                " onmouseover="this.style.transform='translateY(-2px)'"
                onmouseout="this.style.transform=''">
                    Folosește
                </button>
            </div>

            <select id="auto-msg-select" style="
                width:100%; margin-top:12px; padding:10px; background:#0f1b2e; color:#0ff;
                border:1px solid #00d4ff; border-radius:10px; outline:none; font-size:13px;
            ">
                <option value="">-- Alege din ultimele 5 --</option>
            </select>

            <button id="auto-msg-delete" style="
                margin-top:8px; width:100%; padding:8px; background:#ff3b30; color:white;
                border:none; border-radius:8px; font-size:12px; cursor:pointer; opacity:0.8;
                transition:0.3s;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">
                Șterge mesajul selectat
            </button>

            <div id="auto-msg-status" style="margin-top:10px; font-size:12px; color:#00ff9d; text-align:center; height:16px;"></div>
        `;

        // Elemente
        const textarea = document.getElementById('auto-msg-input');
        const saveBtn = document.getElementById('auto-msg-save');
        const setBtn = document.getElementById('auto-msg-set');
        const select = document.getElementById('auto-msg-select');
        const deleteBtn = document.getElementById('auto-msg-delete');
        const status = document.getElementById('auto-msg-status');
        const closeBtn = document.getElementById('auto-msg-close');

        textarea.value = currentMessage;
        updateMessageList();

        // === Funcții UI ===
        function showStatus(msg, color = '#00ff9d') {
            status.textContent = msg;
            status.style.color = color;
            setTimeout(() => status.textContent = '', 3000);
        }

        function updateMessageList() {
            select.innerHTML = '<option value="">-- Alege din ultimele 5 --</option>';
            savedMessages.forEach((msg, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                const preview = msg.substring(0, 50) + (msg.length > 50 ? '...' : '');
                opt.textContent = `${i + 1}. ${preview}`;
                select.appendChild(opt);
            });
            deleteBtn.style.display = savedMessages.length ? 'block' : 'none';
        }

        // === SALVEAZĂ (doar ultimele 5) ===
        saveBtn.onclick = () => {
            const text = textarea.value.trim();
            if (!text) return showStatus('Mesaj gol!', '#ff6b6b');

            // Elimină duplicatul dacă există
            const index = savedMessages.indexOf(text);
            if (index !== -1) savedMessages.splice(index, 1);

            // Adaugă noul mesaj la început
            savedMessages.push(text);

            // Limitează la 5
            if (savedMessages.length > MAX_SAVED) {
                savedMessages.shift(); // elimină cel mai vechi
            }

            localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(savedMessages));
            updateMessageList();
            showStatus(`Salvat! (${savedMessages.length}/5)`, '#00ff9d');
        };

        // === SETEAZĂ MESAJUL PENTRU TRIMITERE ===
        setBtn.onclick = () => {
            const text = textarea.value.trim();
            if (!text) return showStatus('Scrie un mesaj!', '#ff6b6b');

            currentMessage = text;
            localStorage.setItem(STORAGE_KEY_MSG, text);
            showStatus('Mesaj setat pentru trimitere!', '#00d4ff');
        };

        // === Alege din listă ===
        select.onchange = () => {
            const idx = select.value;
            if (idx === '') return;
            textarea.value = savedMessages[idx];
            showStatus('Mesaj încărcat');
        };

        // === ȘTERGE MESAJ ===
        deleteBtn.onclick = () => {
            const idx = select.value;
            if (idx === '') return showStatus('Alege un mesaj!', '#ff6b6b');

            if (confirm('Ștergi acest mesaj din ultimele 5?')) {
                savedMessages.splice(idx, 1);
                localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(savedMessages));
                updateMessageList();
                select.value = '';
                showStatus('Mesaj șters');
            }
        };

        // === Închide panoul ===
        closeBtn.onclick = () => {
            panel.style.transform = 'translateY(-20px)';
            panel.style.opacity = '0';
            setTimeout(() => panel.remove(), 400);
        };

        // Dacă nu ai mesaj curent, ia-l pe primul din listă
        if (!currentMessage && savedMessages.length > 0) {
            currentMessage = savedMessages[savedMessages.length - 1];
            localStorage.setItem(STORAGE_KEY_MSG, currentMessage);
            textarea.value = currentMessage;
        }
    }

    // === 1. Deschide chat-ul ===
    function openChat() {
        if (hasClicked || !currentMessage) return false;
        const msgBtn = document.querySelector('i[id^="message-"]');
        if (!msgBtn) {
            if (SHOW_DEBUG) console.log('Aștept butonul message-...');
            return false;
        }
        hasClicked = true;
        msgBtn.style.outline = '4px solid #00ff00';
        msgBtn.title = 'Chat deschis automat [PRO]';
        setTimeout(() => {
            msgBtn.click();
            if (SHOW_DEBUG) console.log('1. Chat deschis!');
            waitForTextarea();
        }, CLICK_DELAY);
        return true;
    }

    // === 2. Lipește mesajul ===
    async function pasteMessage(textarea) {
        textarea.focus();
        textarea.value = currentMessage;

        try {
            await navigator.clipboard.writeText(currentMessage);
            const pasteEvent = new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true });
            textarea.dispatchEvent(pasteEvent);
        } catch (e) { }

        ['input', 'change', 'paste'].forEach(type => {
            textarea.dispatchEvent(new Event(type, { bubbles: true }));
        });

        if (SHOW_DEBUG) console.log('%c2. Mesaj lipit:', 'color: gold;', currentMessage);
    }

    // === Așteaptă textarea ===
    function waitForTextarea() {
        const interval = setInterval(async () => {
            const textarea = document.getElementById('sending-message');
            if (textarea && !hasSent) {
                clearInterval(interval);
                await pasteMessage(textarea);
                setTimeout(clickSendButton, PASTE_DELAY);
            }
        }, 200);
    }

    // === 3. Trimite ===
    function clickSendButton() {
        const sendBtn = document.getElementById('submitto');
        if (!sendBtn || hasSent) return;
        hasSent = true;
        sendBtn.style.outline = '4px solid red';
        sendBtn.style.boxShadow = '0 0 20px red';
        setTimeout(() => {
            sendBtn.click();
            if (SHOW_DEBUG) console.log('%c3. MESAJ TRIMIS!', 'color: cyan; font-size: 16px;');
        }, 300);
    }

    // === PORNIRE ===
    createProPanel();

    const observer = new MutationObserver(() => {
        if (openChat()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(openChat, 600);

    if (SHOW_DEBUG) {
        console.log('%cAuto Message Sender [ULTIMELE 5] – ACTIVAT!', 'color: #00d4ff; font-weight: bold; font-size: 15px;');
    }

    // Redeschiere cu Ctrl + Shift + M
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            if (!document.getElementById('auto-msg-pro-panel')) {
                createProPanel();
            }
        }
    });

})();
