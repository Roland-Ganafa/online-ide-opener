// Content script for IDE Opener Pro

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'INJECT_QUICK_LAUNCH':
      injectQuickLaunch();
      break;
    case 'CHECK_IDE_COMPATIBILITY':
      checkIDECompatibility();
      break;
    case 'INJECT_COLLABORATIVE_TOOLS':
      injectCollaborativeTools();
      break;
  }
});

// Quick Launch overlay
function injectQuickLaunch() {
  const overlay = document.createElement('div');
  overlay.id = 'ide-opener-quick-launch';
  overlay.innerHTML = `
    <div class="quick-launch-container">
      <input type="text" placeholder="Quick launch IDE (Esc to close)">
      <div class="quick-results"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  setupQuickLaunch(overlay);
}

// Setup Quick Launch functionality
function setupQuickLaunch(overlay) {
  const input = overlay.querySelector('input');
  const results = overlay.querySelector('.quick-results');
  
  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      overlay.remove();
    }
  });
  
  // Search as you type
  input.addEventListener('input', async () => {
    const query = input.value.toLowerCase();
    const response = await chrome.runtime.sendMessage({
      type: 'SEARCH_IDES',
      query
    });
    
    updateQuickResults(results, response.ides);
  });
  
  // Focus input
  input.focus();
}

// Update Quick Launch results
function updateQuickResults(container, ides) {
  container.innerHTML = ides.map(ide => `
    <div class="quick-result" data-url="${ide.url}">
      <img src="${ide.icon}" alt="${ide.name}">
      <div class="quick-result-info">
        <div class="quick-result-name">${ide.name}</div>
        <div class="quick-result-description">${ide.description}</div>
      </div>
    </div>
  `).join('');
  
  container.querySelectorAll('.quick-result').forEach(result => {
    result.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'LAUNCH_IDE',
        url: result.dataset.url
      });
    });
  });
}

// Check if current page is IDE compatible
function checkIDECompatibility() {
  const compatibilityData = {
    url: window.location.href,
    title: document.title,
    metaTags: Array.from(document.querySelectorAll('meta')).map(meta => ({
      name: meta.getAttribute('name'),
      content: meta.getAttribute('content')
    })),
    scripts: Array.from(document.querySelectorAll('script')).map(script => script.src),
    isGitHub: window.location.hostname === 'github.com',
    isGitLab: window.location.hostname === 'gitlab.com',
    isBitbucket: window.location.hostname === 'bitbucket.org'
  };
  
  chrome.runtime.sendMessage({
    type: 'IDE_COMPATIBILITY_DATA',
    data: compatibilityData
  });
}

// Inject collaborative tools
function injectCollaborativeTools() {
  // Create floating action button
  const fab = document.createElement('div');
  fab.id = 'ide-opener-fab';
  fab.innerHTML = `
    <button class="fab-main">
      <i class="fas fa-code"></i>
    </button>
    <div class="fab-menu">
      <button class="fab-item" data-action="share">
        <i class="fas fa-share-alt"></i>
        Share IDE Session
      </button>
      <button class="fab-item" data-action="collaborate">
        <i class="fas fa-users"></i>
        Start Collaboration
      </button>
      <button class="fab-item" data-action="workspace">
        <i class="fas fa-save"></i>
        Save Workspace
      </button>
    </div>
  `;
  
  document.body.appendChild(fab);
  setupCollaborativeTools(fab);
}

// Setup collaborative tools
function setupCollaborativeTools(fab) {
  const mainButton = fab.querySelector('.fab-main');
  const menu = fab.querySelector('.fab-menu');
  
  // Toggle menu
  mainButton.addEventListener('click', () => {
    menu.classList.toggle('active');
  });
  
  // Handle actions
  fab.querySelectorAll('.fab-item').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      chrome.runtime.sendMessage({
        type: 'COLLABORATIVE_ACTION',
        action
      });
    });
  });
}

// Initialize performance monitoring
let performanceData = {
  loadTime: 0,
  memoryUsage: 0,
  cpuUsage: 0,
  networkRequests: 0
};

// Monitor performance
function monitorPerformance() {
  // Load time
  performanceData.loadTime = performance.now();
  
  // Memory usage
  if (performance.memory) {
    performanceData.memoryUsage = performance.memory.usedJSHeapSize;
  }
  
  // Network requests
  if (window.performance && performance.getEntriesByType) {
    performanceData.networkRequests = performance.getEntriesByType('resource').length;
  }
  
  // Send data to background
  chrome.runtime.sendMessage({
    type: 'PERFORMANCE_DATA',
    data: performanceData
  });
}

// Start monitoring
setInterval(monitorPerformance, 30000); // Every 30 seconds

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkIDECompatibility();
});
