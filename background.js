// Background Service Worker for IDE Opener Pro

// Initialize state
let state = {
  ideStatuses: {},
  performanceData: {},
  collaborativeSessions: new Map(),
  workspaces: new Map(),
  updateAvailable: false
};

// Setup context menus
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
  setupAlarms();
  checkForUpdates();
});

// Setup context menus
function setupContextMenus() {
  chrome.contextMenus.create({
    id: 'ide-opener',
    title: 'Open with IDE',
    contexts: ['selection', 'link', 'page']
  });
  
  chrome.contextMenus.create({
    id: 'quick-launch',
    title: 'Quick Launch IDE',
    contexts: ['all']
  });
  
  chrome.contextMenus.create({
    id: 'save-workspace',
    title: 'Save as Workspace',
    contexts: ['page']
  });
}

// Setup alarms for periodic tasks
function setupAlarms() {
  chrome.alarms.create('checkStatuses', { periodInMinutes: 5 });
  chrome.alarms.create('syncWorkspaces', { periodInMinutes: 15 });
  chrome.alarms.create('checkUpdates', { periodInMinutes: 60 });
  chrome.alarms.create('cleanupHistory', { periodInMinutes: 1440 }); // Daily
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'checkStatuses':
      checkIDEStatuses();
      break;
    case 'syncWorkspaces':
      syncWorkspaces();
      break;
    case 'checkUpdates':
      checkForUpdates();
      break;
    case 'cleanupHistory':
      cleanupHistory();
      break;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'ide-opener':
      handleContextOpen(info, tab);
      break;
    case 'quick-launch':
      chrome.tabs.sendMessage(tab.id, { type: 'INJECT_QUICK_LAUNCH' });
      break;
    case 'save-workspace':
      saveWorkspace(tab);
      break;
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'CHECK_IDE_STATUS':
      checkIDEStatus(request.url).then(sendResponse);
      return true;
    
    case 'GET_IDE_STATUSES':
      sendResponse(state.ideStatuses);
      return true;
    
    case 'SYNC_WORKSPACES':
      syncWorkspaces().then(sendResponse);
      return true;
    
    case 'ADD_TO_HISTORY':
      addToHistory(request.ide);
      return true;
    
    case 'SEARCH_IDES':
      searchIDEs(request.query).then(sendResponse);
      return true;
    
    case 'LAUNCH_IDE':
      launchIDE(request.url, sender.tab);
      return true;
    
    case 'IDE_COMPATIBILITY_DATA':
      processCompatibilityData(request.data, sender.tab);
      return true;
    
    case 'COLLABORATIVE_ACTION':
      handleCollaborativeAction(request.action, sender.tab);
      return true;
    
    case 'PERFORMANCE_DATA':
      processPerformanceData(request.data, sender.tab);
      return true;
  }
});

// Check status of all IDEs
async function checkIDEStatuses() {
  const storage = await chrome.storage.local.get('ides');
  const ides = storage.ides || [];
  
  for (const ide of ides) {
    state.ideStatuses[ide.url] = await checkIDEStatus(ide.url);
  }
  
  // Notify if any IDE is down
  const downIdes = Object.entries(state.ideStatuses)
    .filter(([_, status]) => !status)
    .map(([url]) => url);
  
  if (downIdes.length > 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'IDE Status Alert',
      message: `${downIdes.length} IDE(s) are currently unavailable`
    });
  }
}

// Check status of single IDE
async function checkIDEStatus(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Sync workspaces across devices
async function syncWorkspaces() {
  try {
    const storage = await chrome.storage.sync.get('workspaces');
    const localWorkspaces = Array.from(state.workspaces.values());
    const remoteWorkspaces = storage.workspaces || [];
    
    // Merge workspaces
    const mergedWorkspaces = mergeWorkspaces(localWorkspaces, remoteWorkspaces);
    
    // Update storage
    await chrome.storage.sync.set({ workspaces: mergedWorkspaces });
    
    // Update local state
    state.workspaces = new Map(mergedWorkspaces.map(ws => [ws.id, ws]));
    
    return { success: true };
  } catch (error) {
    console.error('Workspace sync failed:', error);
    return { success: false, error: error.message };
  }
}

// Merge workspaces with conflict resolution
function mergeWorkspaces(local, remote) {
  const merged = new Map();
  
  // Add all workspaces to map, newer versions take precedence
  [...local, ...remote].forEach(workspace => {
    const existing = merged.get(workspace.id);
    if (!existing || existing.lastModified < workspace.lastModified) {
      merged.set(workspace.id, workspace);
    }
  });
  
  return Array.from(merged.values());
}

// Save current tab as workspace
async function saveWorkspace(tab) {
  const workspace = {
    id: generateId(),
    title: tab.title,
    url: tab.url,
    favicon: tab.favIconUrl,
    created: Date.now(),
    lastModified: Date.now()
  };
  
  state.workspaces.set(workspace.id, workspace);
  
  // Trigger sync
  await syncWorkspaces();
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Workspace Saved',
    message: `"${workspace.title}" has been saved`
  });
}

// Handle collaborative actions
async function handleCollaborativeAction(action, tab) {
  switch (action) {
    case 'share':
      shareSession(tab);
      break;
    case 'collaborate':
      startCollaboration(tab);
      break;
    case 'workspace':
      saveWorkspace(tab);
      break;
  }
}

// Share current IDE session
async function shareSession(tab) {
  const session = {
    id: generateId(),
    title: tab.title,
    url: tab.url,
    created: Date.now()
  };
  
  state.collaborativeSessions.set(session.id, session);
  
  // Generate shareable link
  const shareUrl = `https://ide-opener.example.com/share/${session.id}`;
  
  // Copy to clipboard
  await navigator.clipboard.writeText(shareUrl);
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Session Shared',
    message: 'Shareable link copied to clipboard'
  });
}

// Start collaboration session
function startCollaboration(tab) {
  // Implementation would depend on specific collaboration features
  console.log('Starting collaboration for tab:', tab.id);
}

// Process IDE compatibility data
function processCompatibilityData(data, tab) {
  // Check if current page can be opened in an IDE
  const compatibleIdes = findCompatibleIdes(data);
  
  if (compatibleIdes.length > 0) {
    chrome.action.setBadgeText({
      text: ''+compatibleIdes.length,
      tabId: tab.id
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50',
      tabId: tab.id
    });
  }
}

// Find compatible IDEs for given page
function findCompatibleIdes(data) {
  const compatibleIdes = [];
  
  // GitHub repository
  if (data.isGitHub) {
    compatibleIdes.push(
      { name: 'GitHub.dev', url: data.url.replace('github.com', 'github.dev') },
      { name: 'Gitpod', url: `https://gitpod.io/#${data.url}` }
    );
  }
  
  // GitLab repository
  if (data.isGitLab) {
    compatibleIdes.push(
      { name: 'GitLab Web IDE', url: `${data.url}/-/ide/` }
    );
  }
  
  return compatibleIdes;
}

// Process performance data
function processPerformanceData(data, tab) {
  state.performanceData[tab.id] = {
    ...state.performanceData[tab.id],
    ...data,
    timestamp: Date.now()
  };
  
  // Check for performance issues
  checkPerformanceIssues(tab.id);
}

// Check for performance issues
function checkPerformanceIssues(tabId) {
  const data = state.performanceData[tabId];
  if (!data) return;
  
  const issues = [];
  
  // Load time too high
  if (data.loadTime > 5000) {
    issues.push('High load time');
  }
  
  // Memory usage too high
  if (data.memoryUsage > 100 * 1024 * 1024) { // 100MB
    issues.push('High memory usage');
  }
  
  // Too many network requests
  if (data.networkRequests > 100) {
    issues.push('Many network requests');
  }
  
  if (issues.length > 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Performance Alert',
      message: `Issues detected: ${issues.join(', ')}`
    });
  }
}

// Check for extension updates
async function checkForUpdates() {
  try {
    const response = await fetch('https://api.example.com/ide-opener/version');
    const data = await response.json();
    
    if (data.version > chrome.runtime.getManifest().version) {
      state.updateAvailable = true;
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Update Available',
        message: 'A new version of IDE Opener is available'
      });
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
}

// Cleanup old history entries
async function cleanupHistory() {
  const storage = await chrome.storage.local.get('history');
  const history = storage.history || [];
  
  // Keep last 100 entries
  if (history.length > 100) {
    const newHistory = history.slice(-100);
    await chrome.storage.local.set({ history: newHistory });
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize
checkIDEStatuses();
