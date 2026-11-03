const messageMap = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const INACTIVITY_LIMIT = 10_000; // 10s sem mensagens novas => finaliza
const POLL_INTERVAL = 500; // checa a cada 0.5s
const MAX_RUNTIME = 10 * 60_000; // trava de segurança: 10 min

const findScrollContainer = () => {
    let mainPanel = document.querySelector("#main");
    if (mainPanel) {
        let scrollable = mainPanel.querySelector('div[class*="copyable-area"] > div[role="application"]');
        if (scrollable) return scrollable;
    }
    let el = document.querySelector("[data-pre-plain-text]");
    while (el) {
        const style = getComputedStyle(el);
        if (el.scrollHeight > el.clientHeight && /(auto|scroll)/.test(style.overflowY)) {
            return el;
        }
        el = el.parentElement;
    }
    return document.querySelector("#main") || document.body;
};

const extractMessageData = (el) => {
    const meta = el.getAttribute("data-pre-plain-text");
    const textEl = el.querySelector(".selectable-text");
    let text = textEl ? textEl.innerText : el.innerText;
    text = text.replace(/^(meli\.la|amzn\.divulgador\.link|s\.shopee\.com\.br|natura\.divulgador\.link|magalu\.divulgador\.link|www\.mercadolivre\.com\.br)\s+/i, "");
    return { meta, text: text.trim() };
};

const cleanText = (text) => text.replace(/\s+/g, " ").trim();

// Coleta o que está no DOM agora; retorna quantas mensagens NOVAS foram adicionadas
const harvest = () => {
    let added = 0;
    document.querySelectorAll("[data-pre-plain-text]").forEach((el) => {
        const { meta, text } = extractMessageData(el);
        if (!meta || !text) return;
        const key = meta + "||" + cleanText(text);
        if (!messageMap.has(key)) {
            messageMap.set(key, { meta, text: cleanText(text) });
            added++;
        }
    });
    return added;
};

const clickLoadOlder = () => {
    const btn = [...document.querySelectorAll("button")].find((b) => /get older messages|carregar mensagens antigas/i.test(b.textContent || ""));
    if (btn) {
        btn.click();
        return true;
    }
    return false;
};

const startExport = async () => {
    messageMap.clear();

    // 1) coleta inicial
    harvest();

    const container = findScrollContainer();
    const startTime = Date.now();

    // 2) loop com watchdog de inatividade
    let lastActivity = Date.now();
    let lastHeight = container ? container.scrollHeight : 0;

    while (true) {
        // trava de segurança para não rodar infinito
        if (Date.now() - startTime > MAX_RUNTIME) break;

        // tenta carregar mensagens antigas
        if (container && container.scrollHeight > container.clientHeight) {
            container.scrollTop = 0;
        }
        clickLoadOlder();

        await sleep(POLL_INTERVAL);

        const added = harvest();
        const currentHeight = container ? container.scrollHeight : 0;
        const heightGrew = currentHeight !== lastHeight;
        lastHeight = currentHeight;

        if (added > 0 || heightGrew) {
            lastActivity = Date.now(); // reseta watchdog
            continue;
        }

        // nenhuma novidade nesta iteração — checa se já passou 10s de silêncio
        if (Date.now() - lastActivity >= INACTIVITY_LIMIT) {
            // última varredura antes de entregar
            const finalAdd = harvest();
            if (finalAdd > 0) {
                lastActivity = Date.now();
                continue;
            }
            break;
        }
    }

    // 3) entrega o documento
    const messages = Array.from(messageMap.values());
    const content = JSON.stringify(messages, null, 2);

    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, count: messages.length };
};

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startExport") {
        startExport()
            .then((response) => sendResponse(response))
            .catch((error) => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
