let activeTabId;
let startTime;
let currentUrl;

// Initialize when extension loads
chrome.runtime.onInstalled.addListener(() => {
  startTime = Date.now();
  // Initialize tracking for current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].url) {
      handleTabUpdate(tabs[0].url);
    }
  });
});

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    activeTabId = activeInfo.tabId;
    const tab = await chrome.tabs.get(activeTabId);
    if (tab.url) {
      handleTabUpdate(tab.url);
    }
  } catch (error) {
    console.error('Error in onActivated:', error);
  }
});

// Track URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    handleTabUpdate(changeInfo.url);
  }
});

function handleTabUpdate(url) {
  if (!url || url.startsWith('chrome://')) return;

  try {
    const domain = new URL(url).hostname;
    const now = Date.now();

    if (currentUrl && startTime) {
      const timeSpent = now - startTime;
      if (timeSpent > 0) {
        updateTimeData(currentUrl, timeSpent);
      }
    }

    currentUrl = domain;
    startTime = now;
  } catch (error) {
    console.error('Error in handleTabUpdate:', error);
  }
}

function updateTimeData(domain, duration) {
  if (!domain || duration <= 0) return;

  chrome.storage.local.get(['timeData'], (result) => {
    try {
      const timeData = result.timeData || {};
      const today = new Date().toDateString();
      
      if (!timeData[today]) {
        timeData[today] = {};
      }
      
      timeData[today][domain] = (timeData[today][domain] || 0) + duration;
      
      chrome.storage.local.set({ timeData }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving data:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.error('Error in updateTimeData:', error);
    }
  });
}

// Update time every second for active tab
setInterval(() => {
  if (currentUrl && startTime) {
    updateTimeData(currentUrl, 1000);
    startTime = Date.now(); // Reset start time after updating
  }
}, 1000);