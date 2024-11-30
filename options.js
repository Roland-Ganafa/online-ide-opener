// Load settings when page opens
document.addEventListener('DOMContentLoaded', loadSettings);

// Save settings when they change
document.querySelectorAll('select, input').forEach(element => {
  element.addEventListener('change', saveSettings);
});

// Button click handlers
document.getElementById('addIde').addEventListener('click', addCustomIde);
document.getElementById('resetShortcuts').addEventListener('click', resetShortcuts);
document.getElementById('clearHistory').addEventListener('click', clearHistory);
document.getElementById('exportSettings').addEventListener('click', exportSettings);
document.getElementById('importSettings').addEventListener('click', importSettings);
document.getElementById('syncWorkspaces').addEventListener('click', syncWorkspaces);
document.getElementById('resetSettings').addEventListener('click', resetSettings);

// Load all settings from storage
async function loadSettings() {
  const storage = await chrome.storage.local.get(null);
  
  // Theme
  document.getElementById('theme').value = storage.theme || 'system';
  applyTheme(storage.theme);
  
  // Color scheme
  const colorScheme = storage.colorScheme || 'blue';
  document.querySelector(`[data-color="${colorScheme}"]`).classList.add('selected');
  
  // View options
  document.getElementById('gridView').checked = storage.gridView || false;
  document.getElementById('compactMode').checked = storage.compactMode || false;
  
  // Load custom IDEs
  loadCustomIdes(storage.customIdes || []);
  
  // Load shortcuts
  loadShortcuts(storage.shortcuts || getDefaultShortcuts());
  
  // Load history
  loadHistory(storage.history || []);
}

// Apply theme to page
function applyTheme(theme) {
  if (theme === 'system') {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', theme);
}

// Save all settings to storage
async function saveSettings() {
  const settings = {
    theme: document.getElementById('theme').value,
    colorScheme: document.querySelector('.color-option.selected').dataset.color,
    gridView: document.getElementById('gridView').checked,
    compactMode: document.getElementById('compactMode').checked,
    customIdes: await getCustomIdes(),
    shortcuts: await getShortcuts(),
    history: await getHistory()
  };
  
  await chrome.storage.local.set(settings);
}

// Add new custom IDE
async function addCustomIde() {
  const name = document.getElementById('ideName').value;
  const url = document.getElementById('ideUrl').value;
  const tags = document.getElementById('ideTags').value.split(',').map(t => t.trim());
  const description = document.getElementById('ideDescription').value;
  
  if (!name || !url) return;
  
  const storage = await chrome.storage.local.get('customIdes');
  const customIdes = storage.customIdes || [];
  
  customIdes.push({ name, url, tags, description });
  await chrome.storage.local.set({ customIdes });
  
  loadCustomIdes(customIdes);
  clearCustomIdeForm();
}

// Load custom IDEs into list
function loadCustomIdes(ides) {
  const container = document.querySelector('.custom-ide-list');
  container.innerHTML = '';
  
  ides.forEach(ide => {
    const element = document.createElement('div');
    element.className = 'custom-ide';
    element.innerHTML = `
      <div class="custom-ide-info">
        <strong>${ide.name}</strong>
        <div>${ide.url}</div>
        <div class="tag-list">
          ${ide.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
      <button onclick="removeCustomIde('${ide.url}')">Remove</button>
    `;
    container.appendChild(element);
  });
}

// Clear custom IDE form
function clearCustomIdeForm() {
  document.getElementById('ideName').value = '';
  document.getElementById('ideUrl').value = '';
  document.getElementById('ideTags').value = '';
  document.getElementById('ideDescription').value = '';
}

// Remove custom IDE
async function removeCustomIde(url) {
  const storage = await chrome.storage.local.get('customIdes');
  const customIdes = storage.customIdes.filter(ide => ide.url !== url);
  await chrome.storage.local.set({ customIdes });
  loadCustomIdes(customIdes);
}

// Get default keyboard shortcuts
function getDefaultShortcuts() {
  return {
    search: '/',
    help: '?',
    vscode: 'alt+1',
    github: 'alt+2',
    codesandbox: 'alt+3',
    // ... add more defaults
  };
}

// Load keyboard shortcuts
function loadShortcuts(shortcuts) {
  const container = document.getElementById('shortcutList');
  container.innerHTML = '';
  
  Object.entries(shortcuts).forEach(([action, shortcut]) => {
    const row = document.createElement('div');
    row.className = 'shortcut-row';
    row.innerHTML = `
      <label>${action}:</label>
      <input type="text" value="${shortcut}" data-action="${action}">
      <button onclick="resetShortcut('${action}')">Reset</button>
    `;
    container.appendChild(row);
  });
}

// Reset all shortcuts to defaults
async function resetShortcuts() {
  const defaults = getDefaultShortcuts();
  await chrome.storage.local.set({ shortcuts: defaults });
  loadShortcuts(defaults);
}

// Load history
function loadHistory(history) {
  const container = document.querySelector('.history-list');
  container.innerHTML = '';
  
  history.forEach(item => {
    const element = document.createElement('div');
    element.className = 'history-item';
    element.innerHTML = `
      <div class="history-info">
        <strong>${item.name}</strong>
        <div>${new Date(item.timestamp).toLocaleString()}</div>
      </div>
    `;
    container.appendChild(element);
  });
}

// Clear history
async function clearHistory() {
  await chrome.storage.local.set({ history: [] });
  loadHistory([]);
}

// Export settings
async function exportSettings() {
  const settings = await chrome.storage.local.get(null);
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ide-opener-settings.json';
  a.click();
  
  URL.revokeObjectURL(url);
}

// Import settings
async function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = async event => {
      const settings = JSON.parse(event.target.result);
      await chrome.storage.local.set(settings);
      loadSettings();
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// Sync workspaces
async function syncWorkspaces() {
  const response = await chrome.runtime.sendMessage({ type: 'SYNC_WORKSPACES' });
  if (response.success) {
    alert('Workspaces synced successfully!');
  } else {
    alert('Failed to sync workspaces.');
  }
}

// Reset all settings
async function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    await chrome.storage.local.clear();
    loadSettings();
  }
}

// Color scheme selection
document.querySelectorAll('.color-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
    saveSettings();
  });
});
