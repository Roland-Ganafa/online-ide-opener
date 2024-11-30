// Initialize state
let state = {
  theme: 'light',
  gridView: false,
  compactMode: false,
  favorites: [],
  customIdes: [],
  shortcuts: {},
  history: [],
  popularIdes: [
    {
      id: 'vscode',
      name: 'VS Code Web',
      url: 'https://vscode.dev',
      description: 'Visual Studio Code in the browser',
      icon: 'https://code.visualstudio.com/favicon.ico',
      tags: ['JavaScript', 'Python', 'General'],
      shortcut: '1'
    },
    {
      id: 'github',
      name: 'GitHub.dev',
      url: 'https://github.dev',
      description: 'Edit GitHub repositories directly',
      icon: 'fab fa-github',
      tags: ['Git', 'Cloud'],
      shortcut: '2'
    }
  ]
};

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadSettings();
    renderIdes();
    setupEventListeners();
    updateUI();
    checkIDEStatuses();
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
});

// Load all settings from storage
async function loadSettings() {
  const storage = await chrome.storage.local.get(null);
  state = { ...state, ...storage };
  
  // Apply theme
  applyTheme(state.theme);
  
  // Apply view settings
  document.body.classList.toggle('grid-view', state.gridView);
  document.body.classList.toggle('compact-mode', state.compactMode);
}

// Setup all event listeners
function setupEventListeners() {
  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  
  // View toggle
  document.getElementById('viewToggle')?.addEventListener('click', toggleView);
  
  // Compact mode toggle
  document.getElementById('compactToggle')?.addEventListener('click', toggleCompactMode);
  
  // Settings button
  document.getElementById('settingsButton')?.addEventListener('click', openSettings);
  
  // Search input
  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', handleSearch);
  
  // Category headers
  document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', (e) => toggleCategory(e.currentTarget));
  });
  
  // Custom IDE button
  document.getElementById('customIdeButton')?.addEventListener('click', openCustomIdeDialog);
  
  // Global keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcut);
}

// Handle keyboard shortcuts
function handleKeyboardShortcut(e) {
  // Search focus
  if (e.key === '/' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    document.getElementById('searchInput').focus();
  }
  
  // Help dialog
  if (e.key === '?' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    showHelpDialog();
  }
  
  // Quick launch (Alt + 1-9)
  if (e.altKey && !e.ctrlKey && !isNaN(e.key)) {
    const index = parseInt(e.key);
    if (index >= 1 && index <= 9) {
      e.preventDefault();
      const button = document.querySelector(`[data-shortcut="${index}"]`);
      if (button) button.click();
    }
  }
}

// Toggle theme
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(state.theme);
  saveSettings();
}

// Apply theme to document
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Toggle grid/list view
function toggleView() {
  state.gridView = !state.gridView;
  document.body.classList.toggle('grid-view', state.gridView);
  saveSettings();
}

// Toggle compact mode
function toggleCompactMode() {
  state.compactMode = !state.compactMode;
  document.body.classList.toggle('compact-mode', state.compactMode);
  saveSettings();
}

// Open settings page
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// Handle IDE search
function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  const buttons = document.querySelectorAll('.ide-button');
  
  buttons.forEach(button => {
    const name = button.querySelector('.ide-name').textContent.toLowerCase();
    const description = button.querySelector('.ide-description').textContent.toLowerCase();
    const tags = Array.from(button.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
    
    const matches = name.includes(query) || 
                   description.includes(query) || 
                   tags.some(tag => tag.includes(query));
    
    button.style.display = matches ? '' : 'none';
  });
  
  // Show/hide categories based on visible buttons
  document.querySelectorAll('.category').forEach(category => {
    const hasVisibleButtons = Array.from(category.querySelectorAll('.ide-button'))
      .some(button => button.style.display !== 'none');
    category.style.display = hasVisibleButtons ? '' : 'none';
  });
}

// Toggle category expansion
function toggleCategory(header) {
  const category = header.closest('.category');
  const content = category.querySelector('.category-content');
  const chevron = header.querySelector('.fa-chevron-down, .fa-chevron-up');
  
  // Toggle the expanded state
  const isExpanded = content.classList.toggle('expanded');
  
  // Update the chevron icon
  if (chevron) {
    chevron.classList.toggle('fa-chevron-down', !isExpanded);
    chevron.classList.toggle('fa-chevron-up', isExpanded);
  }
  
  // Save the state
  const categoryId = category.id;
  state.expandedCategories = state.expandedCategories || {};
  state.expandedCategories[categoryId] = isExpanded;
  saveSettings();
}

// Handle IDE button click
async function handleIdeClick(e) {
  const button = e.currentTarget;
  const url = button.dataset.url;
  
  if (!url) {
    console.error('No URL found for IDE button');
    return;
  }

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Open IDE in new tab
    await chrome.tabs.create({ url: url });
    
    // Add to history
    await addToHistory({
      id: button.dataset.id,
      url: url,
      timestamp: Date.now()
    });
    
    // Close popup
    window.close();
  } catch (error) {
    console.error('Error opening IDE:', error);
  }
}

// Toggle favorite status
async function toggleFavorite(button) {
  const url = button.dataset.url;
  const name = button.querySelector('.ide-name').textContent;
  const starIcon = button.querySelector('.star-icon');
  
  const isFavorite = starIcon.classList.contains('fas');
  
  if (isFavorite) {
    state.favorites = state.favorites.filter(f => f.url !== url);
    starIcon.className = 'far fa-star star-icon';
  } else {
    state.favorites.push({ name, url });
    starIcon.className = 'fas fa-star star-icon';
  }
  
  await saveSettings();
  updateFavorites();
}

// Update favorites section
function updateFavorites() {
  const container = document.getElementById('favorites-content');
  const favoritesSection = document.getElementById('favorites');
  
  if (state.favorites.length === 0) {
    favoritesSection.style.display = 'none';
    return;
  }
  
  favoritesSection.style.display = '';
  container.innerHTML = '';
  
  state.favorites.forEach(favorite => {
    const button = document.createElement('button');
    button.className = 'ide-button favorite';
    button.dataset.url = favorite.url;
    
    button.innerHTML = `
      <div class="ide-icon"><i class="fas fa-star"></i></div>
      <div class="ide-info">
        <div class="ide-name">${favorite.name}</div>
      </div>
      <div class="ide-meta">
        <i class="fas fa-star star-icon"></i>
      </div>
    `;
    
    button.addEventListener('click', handleIdeClick);
    button.querySelector('.star-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(button);
    });
    
    container.appendChild(button);
  });
}

// Show IDE preview
function showPreview(e) {
  const button = e.currentTarget;
  const name = button.querySelector('.ide-name').textContent;
  
  const preview = document.createElement('div');
  preview.className = 'preview-tooltip';
  preview.innerHTML = `
    <h3>${name}</h3>
    <img class="preview-image" src="previews/${name.toLowerCase().replace(/\s+/g, '-')}.png" 
         onerror="this.src='previews/default.png'" alt="${name} Preview">
  `;
  
  document.body.appendChild(preview);
  
  const rect = button.getBoundingClientRect();
  preview.style.top = `${rect.top}px`;
  preview.style.left = `${rect.right + 10}px`;
  preview.style.display = 'block';
}

// Hide IDE preview
function hidePreview() {
  const preview = document.querySelector('.preview-tooltip');
  if (preview) {
    preview.remove();
  }
}

// Show help dialog
function showHelpDialog() {
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 400px;
  `;
  
  dialog.innerHTML = `
    <h2>Keyboard Shortcuts</h2>
    <ul>
      <li><code>/</code> - Focus search</li>
      <li><code>?</code> - Show this help</li>
      <li><code>Alt + 1-9</code> - Quick launch IDEs</li>
      <li><code>Esc</code> - Close dialogs</li>
    </ul>
    <button style="
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    ">Close</button>
  `;
  
  const closeButton = dialog.querySelector('button');
  closeButton.addEventListener('click', () => dialog.remove());
  
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') dialog.remove();
  }, { once: true });
  
  document.body.appendChild(dialog);
}

// Open custom IDE dialog
function openCustomIdeDialog() {
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    width: 300px;
  `;
  
  dialog.innerHTML = `
    <h2>Add Custom IDE</h2>
    <div style="margin-bottom: 10px;">
      <label>Name</label>
      <input type="text" id="customIdeName" style="width: 100%; margin-top: 5px;">
    </div>
    <div style="margin-bottom: 10px;">
      <label>URL</label>
      <input type="url" id="customIdeUrl" style="width: 100%; margin-top: 5px;">
    </div>
    <div style="margin-bottom: 10px;">
      <label>Tags (comma-separated)</label>
      <input type="text" id="customIdeTags" style="width: 100%; margin-top: 5px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label>Description</label>
      <textarea id="customIdeDescription" style="width: 100%; margin-top: 5px;"></textarea>
    </div>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button id="cancelCustomIde">Cancel</button>
      <button id="saveCustomIde" style="
        background: var(--primary-color);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Save</button>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  dialog.querySelector('#cancelCustomIde').addEventListener('click', () => dialog.remove());
  dialog.querySelector('#saveCustomIde').addEventListener('click', async () => {
    const name = dialog.querySelector('#customIdeName').value;
    const url = dialog.querySelector('#customIdeUrl').value;
    const tags = dialog.querySelector('#customIdeTags').value.split(',').map(t => t.trim());
    const description = dialog.querySelector('#customIdeDescription').value;
    
    if (!name || !url) return;
    
    state.customIdes.push({ name, url, tags, description });
    await saveSettings();
    updateCustomIdes();
    dialog.remove();
  });
}

// Update custom IDEs in UI
function updateCustomIdes() {
  const container = document.querySelector('#custom-ides .category-content');
  if (!container) return;
  
  container.innerHTML = '';
  
  state.customIdes.forEach(ide => {
    const button = document.createElement('button');
    button.className = 'ide-button';
    button.dataset.url = ide.url;
    
    button.innerHTML = `
      <div class="ide-icon"><i class="fas fa-code"></i></div>
      <div class="ide-info">
        <div class="ide-name">${ide.name}</div>
        <div class="ide-description">${ide.description}</div>
        <div class="tags">
          ${ide.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
      <div class="ide-meta">
        <i class="far fa-star star-icon"></i>
      </div>
    `;
    
    button.addEventListener('click', handleIdeClick);
    button.querySelector('.star-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(button);
    });
    
    container.appendChild(button);
  });
}

// Render IDEs in the popup
function renderIdes() {
  const popularIdesContent = document.getElementById('popularIdesContent');
  popularIdesContent.innerHTML = '';

  state.popularIdes.forEach(ide => {
    const button = document.createElement('button');
    button.className = 'ide-button';
    button.dataset.url = ide.url;
    button.dataset.shortcut = ide.shortcut;
    button.dataset.id = ide.id;

    button.innerHTML = `
      <div class="ide-icon">
        ${ide.icon.startsWith('fab') ? `<i class="${ide.icon}"></i>` : `<img src="${ide.icon}" alt="${ide.name}">`}
      </div>
      <div class="ide-info">
        <div class="ide-name">${ide.name}</div>
        <div class="ide-description">${ide.description}</div>
        <div class="tags">
          ${ide.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
      <div class="ide-meta">
        <div class="status-indicator"></div>
        <span class="keyboard-shortcut">Alt+${ide.shortcut}</span>
        <i class="far fa-star star-icon"></i>
      </div>
    `;

    // Add event listeners
    button.addEventListener('click', handleIdeClick);
    
    const starIcon = button.querySelector('.star-icon');
    starIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(button);
    });
    
    button.addEventListener('mouseenter', showPreview);
    button.addEventListener('mouseleave', hidePreview);

    popularIdesContent.appendChild(button);
  });

  // Restore expanded state
  if (state.expandedCategories) {
    Object.entries(state.expandedCategories).forEach(([categoryId, isExpanded]) => {
      const category = document.getElementById(categoryId);
      if (category) {
        const content = category.querySelector('.category-content');
        const chevron = category.querySelector('.fa-chevron-down, .fa-chevron-up');
        if (isExpanded) {
          content.classList.add('expanded');
          chevron?.classList.remove('fa-chevron-down');
          chevron?.classList.add('fa-chevron-up');
        }
      }
    });
  }

  updateFavorites();
}

// Add to history
async function addToHistory(ide) {
  const message = {
    type: 'ADD_TO_HISTORY',
    ide
  };
  
  chrome.runtime.sendMessage(message);
}

// Check IDE statuses
async function checkIDEStatuses() {
  const message = { type: 'GET_IDE_STATUSES' };
  
  chrome.runtime.sendMessage(message, statuses => {
    document.querySelectorAll('.ide-button').forEach(button => {
      const url = button.dataset.url;
      const indicator = button.querySelector('.status-indicator');
      
      if (indicator && statuses[url] !== undefined) {
        indicator.classList.toggle('status-up', statuses[url]);
        indicator.classList.toggle('status-down', !statuses[url]);
      }
    });
  });
}

// Save settings to storage
async function saveSettings() {
  await chrome.storage.local.set(state);
}

// Update UI based on current state
function updateUI() {
  updateFavorites();
  updateCustomIdes();
}
