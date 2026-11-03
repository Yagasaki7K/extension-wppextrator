// popup.js

document.addEventListener("DOMContentLoaded", () => {
    const exportBtn = document.getElementById("exportBtn");
    const formatRadios = document.querySelectorAll('input[name="format"]');
    const chatSelect = document.getElementById("chatSelect");
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    const limitValueInput = document.getElementById("limitValue");
    const limitTypeSelect = document.getElementById("limitType");
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const mediaToggle = document.getElementById("mediaToggle");

    // Desabilita o toggle de mídia, pois não está implementado
    mediaToggle.disabled = true;

    exportBtn.addEventListener("click", async () => {
        const format = document.querySelector('input[name="format"]:checked').value;
        const chatOption = chatSelect.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const limitValue = limitValueInput.value ? parseInt(limitValueInput.value, 10) : null;
        const limitType = limitTypeSelect.value;
        const mode = document.querySelector('input[name="mode"]:checked').value;

        // Validação básica
        if (limitValue !== null && limitValue <= 0) {
            alert("A quantidade deve ser maior que zero.");
            return;
        }

        // Busca a aba ativa do WhatsApp Web
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url || !tab.url.includes("web.whatsapp.com")) {
            alert("Por favor, abra o WhatsApp Web nesta aba antes de exportar.");
            return;
        }

        // Envia as configurações para o content script
        try {
            const response = await browser.tabs.sendMessage(tab.id, {
                action: "startExport",
                options: {
                    format,
                    chatOption,
                    startDate,
                    endDate,
                    limitValue,
                    limitType,
                    mode,
                },
            });

            if (response && response.success) {
                // A exportação foi iniciada; o content script fará o download.
                window.close(); // Fecha o popup
            } else {
                alert("Erro ao iniciar a exportação: " + (response?.error || "Desconhecido"));
            }
        } catch (error) {
            alert("Erro de comunicação com a página. Certifique-se de que o WhatsApp Web está carregado.");
            console.error(error);
        }
    });
});
