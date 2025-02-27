document.addEventListener('DOMContentLoaded', async () => {
  const toggleButton = document.getElementById('toggleButton');
  const whitelistButton = document.getElementById('whitelistButton');
  const adsBlockedElement = document.getElementById('adsBlocked');
  const currentSiteElement = document.getElementById('currentSite');
  const resetStatsButton = document.getElementById('resetStats');

  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const hostname = new URL(tab.url).hostname;
  currentSiteElement.textContent = `Current site: ${hostname}`;

  // Load settings
  chrome.storage.local.get(['enabled', 'whitelist', 'adsBlocked'], (result) => {
    const enabled = result.enabled ?? true;
    const whitelist = result.whitelist ?? [];
    const adsBlocked = result.adsBlocked ?? 0;

    toggleButton.checked = enabled;
    whitelistButton.textContent = whitelist.includes(hostname) 
      ? 'Remove from Whitelist' 
      : 'Add to Whitelist';
    adsBlockedElement.textContent = adsBlocked.toLocaleString();

    // Update button style based on whitelist status
    updateWhitelistButtonStyle(whitelist.includes(hostname));
  });

  // Toggle button handler
  toggleButton.addEventListener('change', (e) => {
    chrome.storage.local.set({ enabled: e.target.checked });
    chrome.tabs.reload(tab.id);
  });

  // Whitelist button handler
  whitelistButton.addEventListener('click', async () => {
    const { whitelist = [] } = await chrome.storage.local.get('whitelist');
    const isWhitelisted = whitelist.includes(hostname);
    
    const newWhitelist = isWhitelisted
      ? whitelist.filter(site => site !== hostname)
      : [...whitelist, hostname];

    await chrome.storage.local.set({ whitelist: newWhitelist });
    
    whitelistButton.textContent = isWhitelisted
      ? 'Add to Whitelist'
      : 'Remove from Whitelist';
    
    updateWhitelistButtonStyle(!isWhitelisted);
    chrome.tabs.reload(tab.id);
  });

  // Reset stats handler
  resetStatsButton.addEventListener('click', async () => {
    await chrome.storage.local.set({ adsBlocked: 0 });
    adsBlockedElement.textContent = '0';
  });
});

function updateWhitelistButtonStyle(isWhitelisted) {
  const button = document.getElementById('whitelistButton');
  if (isWhitelisted) {
    button.style.background = '#dc3545';
  } else {
    button.style.background = '#1a73e8';
  }
} 