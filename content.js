// Ad blocking rules
const adSelectors = [
  // Common ad containers
  '[class*="ad-"]:not([class*="header"]):not([class*="logo"]):not([class*="navigation"])',
  '[class*="ads-"]',
  '[class*="advertisement"]',
  '[id*="google_ads"]',
  '[id*="banner"]',
  '[class*="partner-wrapper"]',
  '[class*="sponsored"]',
  '[class*="promotion"]',
  
  // Social media sponsored content
  '[data-ad-preview]',
  '[aria-label*="Sponsored"]',
  '[data-ad-comet-preview]',
  '[data-ad]',
  
  // Common ad providers
  '[id*="taboola"]',
  '[id*="outbrain"]',
  '[class*="taboola"]',
  '[class*="outbrain"]',
  
  // Video ad containers
  '.video-ads',
  '.ytp-ad-overlay-container',
  '.ytp-ad-player-overlay',
  '[class*="player-ad"]',
  
  // Generic ad-related classes
  '.adsbygoogle',
  '.ad-container',
  '.sponsored-content',
  'iframe[src*="doubleclick.net"]',
  'iframe[src*="ads"]',
  'iframe[id*="ads"]',
  
  // Popup and overlay ads
  '[class*="popup"]',
  '[class*="overlay"]:not([class*="navigation"])',
  '[id*="popup"]',
  '[id*="modal"]:not([id*="login"]):not([id*="sign"])'
];

// Track number of ads blocked
let adsBlockedCount = 0;

// Function to check if URL is whitelisted
async function isWhitelisted() {
  const { whitelist = [] } = await chrome.storage.local.get('whitelist');
  return whitelist.includes(window.location.hostname);
}

// Function to check if ad blocking is enabled
async function isEnabled() {
  const { enabled = true } = await chrome.storage.local.get('enabled');
  return enabled;
}

// Function to remove ads
async function removeAds() {
  if (!(await isEnabled()) || await isWhitelisted()) {
    return;
  }

  let removedAds = 0;
  adSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Check if element is visible and not already removed
        if (element.offsetParent !== null && !element.dataset.adblocked) {
          // Replace with empty space to prevent layout shifts
          const placeholder = document.createElement('div');
          placeholder.style.width = element.offsetWidth + 'px';
          placeholder.style.height = element.offsetHeight + 'px';
          placeholder.style.display = 'none';
          placeholder.dataset.adblocked = true;
          
          element.parentNode?.replaceChild(placeholder, element);
          removedAds++;
        }
      });
    } catch (error) {
      console.error('Error removing ad:', error);
    }
  });

  if (removedAds > 0) {
    adsBlockedCount += removedAds;
    chrome.runtime.sendMessage({
      type: 'INCREMENT_COUNTER',
      count: removedAds
    });
  }
}

// Create MutationObserver to handle dynamically loaded ads
const observer = new MutationObserver((mutations) => {
  removeAds();
});

// Function to handle iframe ads
function handleIframes() {
  const iframes = document.getElementsByTagName('iframe');
  for (let iframe of iframes) {
    try {
      if (iframe.src.includes('ad') || iframe.src.includes('doubleclick')) {
        iframe.remove();
        adsBlockedCount++;
      }
    } catch (error) {
      // Handle cross-origin iframe errors silently
    }
  }
}

// Initialize ad blocking
async function initialize() {
  if (await isEnabled() && !(await isWhitelisted())) {
    // Start observing DOM changes
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'style', 'class']
    });

    // Initial ad removal
    removeAds();
    handleIframes();

    // Handle dynamically loaded iframes
    setInterval(handleIframes, 1000);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled || changes.whitelist) {
    initialize();
  }
}); 