// popup.js - Popup UI logic

let selectedDuration = 25;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadBlockedSites();
  await checkFocusStatus();
  
  // Duration button handlers
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDuration = parseInt(btn.dataset.duration);
    });
  });
  
  // Start button handler
  document.getElementById('startBtn').addEventListener('click', async () => {
    chrome.runtime.sendMessage({ 
      action: 'startSession', 
      duration: selectedDuration 
    });
    window.close(); // Close popup after starting
  });
  
  // End button handler
  document.getElementById('endBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to end this focus session early?')) {
      chrome.runtime.sendMessage({ action: 'endSession' });
      window.close();
    }
  });
  
  // Add site handler
  document.getElementById('addSiteBtn').addEventListener('click', addBlockedSite);
  document.getElementById('newSiteInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBlockedSite();
  });
  
  // Update timer if active
  setInterval(checkFocusStatus, 1000);
});

async function loadStats() {
  const data = await chrome.storage.sync.get(['stats']);
  const stats = data.stats || { totalSessions: 0, totalMinutes: 0 };
  
  document.getElementById('totalSessions').textContent = stats.totalSessions || 0;
  document.getElementById('totalMinutes').textContent = `${stats.totalMinutes || 0}m`;
}

async function loadBlockedSites() {
  const data = await chrome.storage.sync.get(['blockedSites']);
  const sites = data.blockedSites || [];
  
  const siteList = document.getElementById('siteList');
  siteList.innerHTML = '';
  
  sites.forEach(site => {
    const div = document.createElement('div');
    div.className = 'site-item';
    div.innerHTML = `
      <span>${site.name}</span>
      <button class="remove-btn" data-id="${site.id}">Remove</button>
    `;
    
    div.querySelector('.remove-btn').addEventListener('click', () => {
      removeBlockedSite(site.id);
    });
    
    siteList.appendChild(div);
  });
}

async function addBlockedSite() {
  const input = document.getElementById('newSiteInput');
  const url = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  if (!url) return;
  
  const data = await chrome.storage.sync.get(['blockedSites']);
  const sites = data.blockedSites || [];
  
  // Check if already exists
  if (sites.some(s => s.url === url)) {
    alert('This site is already blocked!');
    return;
  }
  
  const newSite = {
    id: Date.now().toString(),
    url: url,
    name: url.split('.')[0].charAt(0).toUpperCase() + url.split('.')[0].slice(1)
  };
  
  sites.push(newSite);
  await chrome.storage.sync.set({ blockedSites: sites });
  
  input.value = '';
  loadBlockedSites();
}

async function removeBlockedSite(id) {
  const data = await chrome.storage.sync.get(['blockedSites']);
  const sites = data.blockedSites || [];
  
  const filtered = sites.filter(s => s.id !== id);
  await chrome.storage.sync.set({ blockedSites: filtered });
  
  loadBlockedSites();
}

async function checkFocusStatus() {
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    const inactiveView = document.getElementById('inactiveView');
    const activeView = document.getElementById('activeView');
    
    if (response.focusModeActive) {
      inactiveView.classList.add('hidden');
      activeView.classList.remove('hidden');
      
      // Update timer display
      const minutes = Math.floor(response.timeRemaining / 60);
      const seconds = response.timeRemaining % 60;
      document.getElementById('timerDisplay').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Update progress bar
      const progress = ((response.sessionDuration * 60 - response.timeRemaining) / (response.sessionDuration * 60)) * 100;
      document.getElementById('progressFill').style.width = `${progress}%`;
    } else {
      inactiveView.classList.remove('hidden');
      activeView.classList.add('hidden');
    }
  });
}