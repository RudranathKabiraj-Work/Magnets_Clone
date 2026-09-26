document.addEventListener("DOMContentLoaded", async () => {
  const syncBtn = document.getElementById("syncBtn");
  const statusText = document.getElementById("statusText");
  const dmsCount = document.getElementById("dmsCount");
  const commentsCount = document.getElementById("commentsCount");
  const lastSync = document.getElementById("lastSync");

  // Load existing stats
  function updateUI() {
    chrome.runtime.sendMessage({ action: "GET_STATUS" }, (res) => {
      if (res) {
        if (res.totalDmsSent !== undefined) dmsCount.textContent = res.totalDmsSent;
        if (res.totalCommentsReplied !== undefined) commentsCount.textContent = res.totalCommentsReplied;
        if (res.lastSyncResult) statusText.textContent = res.lastSyncResult;
        if (res.lastSyncTime) {
          const date = new Date(res.lastSyncTime);
          lastSync.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
    });
  }

  updateUI();

  syncBtn.addEventListener("click", async () => {
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span>Syncing LinkedIn...</span>`;
    statusText.textContent = "Scanning comments & sending DMs...";

    chrome.runtime.sendMessage({ action: "RUN_SYNC_NOW" }, (res) => {
      syncBtn.disabled = false;
      syncBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
        <span>Sync LinkedIn Comments Now</span>
      `;

      if (res?.success) {
        statusText.textContent = res.result?.summary || "Sync finished successfully!";
      } else {
        statusText.textContent = res?.error || "Sync finished.";
      }
      updateUI();
    });
  });
});
