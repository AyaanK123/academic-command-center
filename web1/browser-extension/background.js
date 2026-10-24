// background.js - Service Worker for blocking logic

// Initialize extension storage
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    extensionInstalled: true, // Flag for web app detection
    focusModeActive: false,
    blockedSites: [
      { id: "1", url: "youtube.com", name: "YouTube" },
      { id: "2", url: "facebook.com", name: "Facebook" },
      { id: "3", url: "instagram.com", name: "Instagram" },
      { id: "4", url: "twitter.com", name: "Twitter/X" },
      { id: "5", url: "reddit.com", name: "Reddit" },
      { id: "6", url: "tiktok.com", name: "TikTok" }
    ],
    sessionDuration: 25,
    sessionStartTime: null,
    soundEnabled: true,
    stats: {
      totalSessions: 0,
      totalMinutes: 0,
      todayMinutes: 0,
      currentStreak: 0
    }
  });
  
  console.log('Focus Mode Extension Installed Successfully');
});

// Check if URL should be blocked
function isUrlBlocked(url, blockedSites) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    return blockedSites.some(site => {
      const siteUrl = site.url.replace('www.', '');
      return hostname.includes(siteUrl) || siteUrl.includes(hostname);
    });
  } catch (e) {
    return false;
  }
}

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only check main frame navigations (not iframes)
  if (details.frameId !== 0) return;
  
  const data = await chrome.storage.sync.get(['focusModeActive', 'blockedSites']);
  
  if (data.focusModeActive && isUrlBlocked(details.url, data.blockedSites)) {
    // Redirect to blocked page
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(details.url)
    });
  }
});

// Listen for tab updates (when user types URL)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const data = await chrome.storage.sync.get(['focusModeActive', 'blockedSites']);
    
    if (data.focusModeActive && isUrlBlocked(changeInfo.url, data.blockedSites)) {
      chrome.tabs.update(tabId, {
        url: chrome.runtime.getURL('blocked.html') + '?site=' + encodeURIComponent(changeInfo.url)
      });
    }
  }
});

// Timer management
let timerInterval = null;
let timeRemaining = 0;

async function startFocusSession(duration) {
  const startTime = Date.now();
  timeRemaining = duration * 60; // Convert to seconds
  
  await chrome.storage.sync.set({
    focusModeActive: true,
    sessionStartTime: startTime,
    sessionDuration: duration,
    timeRemaining: timeRemaining
  });
  
  // Start countdown
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(async () => {
    timeRemaining--;
    
    await chrome.storage.sync.set({ timeRemaining });
    
    if (timeRemaining <= 0) {
      await endFocusSession(true);
    }
  }, 1000);
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Focus Mode Activated! 🎯',
    message: `${duration}-minute focus session started. Stay focused!`
  });
}

async function endFocusSession(completed = false) {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  const data = await chrome.storage.sync.get(['sessionDuration', 'sessionStartTime', 'stats', 'soundEnabled']);
  
  if (completed && data.sessionStartTime) {
    // Update stats
    const stats = data.stats || {};
    stats.totalSessions = (stats.totalSessions || 0) + 1;
    stats.totalMinutes = (stats.totalMinutes || 0) + data.sessionDuration;
    stats.todayMinutes = (stats.todayMinutes || 0) + data.sessionDuration;
    
    await chrome.storage.sync.set({ stats });
    
    // Show completion notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Focus Session Complete! 🎉',
      message: `Great job! You completed ${data.sessionDuration} minutes of focused work.`,
      priority: 2
    });
    
    // Play sound if enabled
    if (data.soundEnabled) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'playCompletionSound' });
        }
      });
    }
  }
  
  await chrome.storage.sync.set({
    focusModeActive: false,
    sessionStartTime: null,
    timeRemaining: 0
  });
}

// Listen for messages from popup and web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startSession') {
    startFocusSession(request.duration);
    sendResponse({ success: true });
  } else if (request.action === 'endSession') {
    endFocusSession(false);
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    chrome.storage.sync.get(['focusModeActive', 'timeRemaining', 'sessionDuration'], (data) => {
      sendResponse(data);
    });
    return true; // Keep channel open for async response
  } else if (request.type === 'PING') {
    // Respond to web app ping
    sendResponse({ installed: true });
  }
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Just stay alive
  }
});