// Initialize storage with default values
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    enabled: true,
    whitelist: [],
    adsBlocked: 0
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INCREMENT_COUNTER') {
    chrome.storage.local.get('adsBlocked', (data) => {
      const newCount = (data.adsBlocked || 0) + message.count;
      chrome.storage.local.set({ adsBlocked: newCount });
    });
  }
}); 