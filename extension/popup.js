document.addEventListener("DOMContentLoaded", async () => {
  const syncBtn = document.getElementById("syncBtn");
  const statusText = document.getElementById("statusText");
  const dmsCount = document.getElementById("dmsCount");
  const commentsCount = document.getElementById("commentsCount");
  const lastSync = document.getElementById("lastSync");

  // Load and display current stats
  async function updateUI() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "GET_STATUS" }, (res) => {
        if (chrome.runtime.lastError) { resolve(); return; }
        if (res) {
          if (res.totalDms !== undefined) dmsCount.textContent = res.totalDms;
          if (res.totalReplies !== undefined) commentsCount.textContent = res.totalReplies;
          if (res.lastResult) statusText.textContent = res.lastResult;
          if (res.lastSync) {
            const d = new Date(res.lastSync);
            lastSync.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          }
        }
        resolve();
      });
    });
  }

  await updateUI();

  syncBtn.addEventListener("click", async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>Running sync...</span>`;
    statusText.textContent = "Fetching comments via LinkedIn API...";

    chrome.runtime.sendMessage({ action: "RUN_SYNC_NOW" }, async (res) => {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 21h5v-5"/>
        </svg>
        <span>Sync LinkedIn Comments Now</span>
      `;

      if (res?.success) {
        statusText.textContent = res.result?.summary || "✅ Sync complete!";
      } else {
        statusText.textContent = res?.error || "⚠️ Sync finished (check console)";
      }

      await updateUI();
    });
  });

  const sendChatBtn = document.getElementById("sendChatBtn");
  if (sendChatBtn) {
    sendChatBtn.addEventListener("click", async () => {
      sendChatBtn.disabled = true;
      sendChatBtn.textContent = "Delivering Lead Magnet...";
      statusText.textContent = "Checking active chat...";

      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.url || !activeTab.url.includes("linkedin.com")) {
        statusText.textContent = "⚠️ Please open a LinkedIn tab first!";
        sendChatBtn.disabled = false;
        sendChatBtn.textContent = "Send Lead Magnet in Current Chat";
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: "SEND_CURRENT_CHAT_DM" }, async (res) => {
        sendChatBtn.disabled = false;
        sendChatBtn.textContent = "Send Lead Magnet in Current Chat";

        if (chrome.runtime.lastError) {
          statusText.textContent = "⚠️ Tab busy. Please refresh the LinkedIn tab and try again.";
        } else if (res?.success) {
          statusText.textContent = res.message || "✅ Lead Magnet delivered to chat!";
        } else {
          statusText.textContent = res?.message || "⚠️ Could not deliver message to this chat.";
        }
        await updateUI();
      });
    });
  }
});
