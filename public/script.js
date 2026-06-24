async function getPairingCode() {
    const numInput = document.getElementById("phoneNumber").value.trim();
    const getBtn = document.getElementById("getButton");
    const loading = document.getElementById("loading");
    const codeDisplay = document.getElementById("codeDisplay");
    const pairCode = document.getElementById("pairCode");

    if (!numInput) {
        alert("Tafadhali weka namba halali ya simu kiongozi!");
        return;
    }

    // Safisha muonekano wa awali
    getBtn.disabled = true;
    loading.classList.remove("hidden");
    codeDisplay.classList.add("hidden");

    try {
        // Tunatuma ombi (request) kwenda kwenye API yetu ya server.js
        const response = await fetch(`/api/pair?number=${numInput}`);
        const data = await response.json();

        if (data.code) {
            loading.classList.add("hidden");
            codeDisplay.classList.remove("hidden");
            pairCode.innerText = data.code;
        } else {
            alert(data.error || "Imeshindwa kupata kodi. Jaribu tena!");
            getBtn.disabled = false;
            loading.classList.add("hidden");
        }
    } catch (error) {
        console.error("Error fetching pair code:", error);
        alert("Kuna tatizo la mtandao limetokea kiongozi!");
        getBtn.disabled = false;
        loading.classList.add("hidden");
    }
}

function copyCode() {
    const codeText = document.getElementById("pairCode").innerText;
    navigator.clipboard.writeText(codeText).then(() => {
        alert("Kodi imekopiwa kikamilifu! Nenda nenda ka-paste kwenye WhatsApp yako.");
    }).catch(err => {
        console.error("Imeshindwa kukopi: ", err);
    });
}
