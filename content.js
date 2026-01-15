// Storage keys
const FOLDERS_KEY = 'chat_folders';
const CHAT_ASSIGNMENTS_KEY = 'chat_assignments';

// Detect platform
const platform = detectPlatform();

console.log('[Chat Organizer] Platform detected:', platform);

// Initialize immediately
if (platform) {
  console.log('[Chat Organizer] Initializing...');
  initChatOrganizer();
} else {
  console.log('[Chat Organizer] Not on a supported platform');
}

function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) return 'chatgpt';
  if (hostname.includes('claude.ai')) return 'claude';
  if (hostname.includes('gemini.google.com')) return 'gemini';
  if (hostname.includes('copilot.microsoft.com')) return 'copilot';
  return null;
}

function initChatOrganizer() {
  // Try to add UI immediately
  if (document.body) {
    console.log('[Chat Organizer] Body available, adding UI...');
    addFolderUI();
    setupNavigationWatcher();
  } else {
    // If body not ready, wait for DOMContentLoaded
    console.log('[Chat Organizer] Waiting for DOM...');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[Chat Organizer] DOM loaded, adding UI...');
        addFolderUI();
        setupNavigationWatcher();
      });
    } else {
      // Use requestAnimationFrame instead of setTimeout
      requestAnimationFrame(() => {
        console.log('[Chat Organizer] Using RAF, adding UI...');
        addFolderUI();
        setupNavigationWatcher();
      });
    }
  }
}

function setupNavigationWatcher() {
  // Watch for URL changes (for SPAs)
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('[Chat Organizer] URL changed to:', currentUrl);
      // Only re-add if button doesn't exist
      if (!document.getElementById('chat-organizer-btn')) {
        console.log('[Chat Organizer] Button missing, re-adding...');
        addFolderUI();
      }
    }
  });
  
  observer.observe(document.body, { subtree: true, childList: true });
  console.log('[Chat Organizer] Navigation watcher set up');
  
  // Inject folders into sidebar
  injectFoldersIntoSidebar();
  
  // Re-inject folders when sidebar updates
  const sidebarObserver = new MutationObserver(() => {
    injectFoldersIntoSidebar();
  });
  
  // Find the sidebar and observe it
  const findSidebarAndObserve = () => {
    const sidebar = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    if (sidebar) {
      sidebarObserver.observe(sidebar, { childList: true, subtree: true });
      console.log('[Chat Organizer] Observing sidebar for changes');
    } else {
      requestAnimationFrame(findSidebarAndObserve);
    }
  };
  
  findSidebarAndObserve();
}

function addFolderUI() {
  // Check if button already exists
  if (document.getElementById('chat-organizer-btn')) {
    console.log('[Chat Organizer] Button already exists');
    return;
  }
  
  console.log('[Chat Organizer] Creating floating button...');
  
  // Create floating button with all styles inline
  const btn = document.createElement('button');
  btn.id = 'chat-organizer-btn';
  btn.innerHTML = '📁';
  btn.title = 'Organize Chats';
  btn.setAttribute('style', `
    position: fixed !important;
    bottom: 24px !important;
    right: 24px !important;
    width: 56px !important;
    height: 56px !important;
    border-radius: 50% !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border: none !important;
    font-size: 24px !important;
    cursor: pointer !important;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
    z-index: 2147483647 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.3s ease !important;
    padding: 0 !important;
    margin: 0 !important;
    animation: pulse 2s infinite !important;
  `);
  
  // Add pulse animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);
  
  try {
    document.body.appendChild(btn);
    console.log('[Chat Organizer] ✅ Button added to DOM!');
  } catch (error) {
    console.error('[Chat Organizer] ❌ Error adding button:', error);
    return;
  }
  
  // Add hover effects
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.1)';
    btn.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });
  
  console.log('[Chat Organizer] Creating side panel...');
  
  // Create side panel
  const panel = document.createElement('div');
  panel.id = 'chat-organizer-panel';
  panel.setAttribute('style', `
    position: fixed !important;
    top: 0 !important;
    right: -400px !important;
    width: 400px !important;
    height: 100vh !important;
    background: white !important;
    box-shadow: -2px 0 20px rgba(0, 0, 0, 0.15) !important;
    z-index: 2147483646 !important;
    transition: right 0.3s ease !important;
    overflow-y: auto !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  `);
  
  panel.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 24px !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
    ">
      <h2 style="font-size: 20px !important; font-weight: 600 !important; margin: 0 !important; color: white !important;">📁 Chat Organizer</h2>
      <button id="close-panel-btn" style="
        background: rgba(255, 255, 255, 0.2) !important;
        border: none !important;
        color: white !important;
        width: 32px !important;
        height: 32px !important;
        border-radius: 50% !important;
        font-size: 18px !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      ">✕</button>
    </div>
    <div style="padding: 24px !important;">
      <div style="margin-bottom: 24px !important; background: #fff3cd !important; padding: 12px !important; border-radius: 6px !important; border-left: 3px solid #ffc107 !important;">
        <div style="font-size: 13px !important; color: #856404 !important; margin-bottom: 8px !important;">
          <strong>How to organize chats:</strong><br>
          1. Enter a chat name below<br>
          2. Select a folder<br>
          3. Click "Save to Folder"
        </div>
      </div>
      <div style="margin-bottom: 32px !important;">
        <h3 style="font-size: 14px !important; font-weight: 600 !important; color: #495057 !important; margin-bottom: 12px !important; text-transform: uppercase !important;">Organize Chat</h3>
        <input type="text" id="chat-name-input" placeholder="Enter chat name..." style="
          width: 100% !important;
          padding: 10px 12px !important;
          border: 1px solid #dee2e6 !important;
          border-radius: 6px !important;
          font-size: 14px !important;
          margin-bottom: 12px !important;
          background: white !important;
          color: #212529 !important;
        ">
        <div id="folder-selector"></div>
      </div>
      <div>
        <h3 style="font-size: 14px !important; font-weight: 600 !important; color: #495057 !important; margin-bottom: 16px !important; text-transform: uppercase !important;">Your Folders</h3>
        <div id="folders-display"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  console.log('[Chat Organizer] ✅ Panel added to DOM!');
  
  // Event listeners
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('[Chat Organizer] Button clicked, opening panel');
    panel.style.right = '0';
    loadPanelContent();
  });
  
  const closeBtn = document.getElementById('close-panel-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[Chat Organizer] Closing panel');
      panel.style.right = '-400px';
    });
  }
  
  // Close panel when clicking on overlay
  panel.addEventListener('click', (e) => {
    if (e.target === panel) {
      console.log('[Chat Organizer] Clicked outside, closing panel');
      panel.style.right = '-400px';
    }
  });
  
  console.log('[Chat Organizer] 🎉 All UI elements ready!');
}

async function loadPanelContent() {
  console.log('[Chat Organizer] Loading panel content...');
  
  const currentChatId = getCurrentChatId();
  const currentChatTitle = getCurrentChatTitle();
  
  console.log('[Chat Organizer] Current URL:', window.location.href);
  console.log('[Chat Organizer] Chat ID:', currentChatId);
  console.log('[Chat Organizer] Chat Title:', currentChatTitle);
  
  // Load folders and assignments
  const result = await chrome.storage.local.get([FOLDERS_KEY, CHAT_ASSIGNMENTS_KEY]);
  const folders = result[FOLDERS_KEY] || [];
  const assignments = result[CHAT_ASSIGNMENTS_KEY] || {};
  
  console.log('[Chat Organizer] Loaded', folders.length, 'folders');
  
  // Display folder selector
  const folderSelector = document.getElementById('folder-selector');
  if (folders.length > 0) {
    let html = '<select id="chat-folder-select" style="width: 100% !important; padding: 10px 12px !important; border: 1px solid #dee2e6 !important; border-radius: 6px !important; font-size: 14px !important; margin-bottom: 12px !important; background: white !important; color: #212529 !important;">';
    html += '<option value="">-- Select Folder --</option>';
    folders.forEach(folder => {
      html += `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`;
    });
    html += '</select>';
    html += '<button id="save-to-folder-btn" style="width: 100% !important; padding: 12px !important; background: #667eea !important; color: white !important; border: none !important; border-radius: 6px !important; font-size: 14px !important; font-weight: 500 !important; cursor: pointer !important;">Save to Folder</button>';
    folderSelector.innerHTML = html;
    
    const saveBtn = document.getElementById('save-to-folder-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const chatNameInput = document.getElementById('chat-name-input');
        const selectEl = document.getElementById('chat-folder-select');
        
        if (!chatNameInput || !selectEl) return;
        
        const chatName = chatNameInput.value.trim();
        const selectedFolderId = selectEl.value;
        
        if (!chatName) {
          alert('Please enter a chat name');
          return;
        }
        
        if (!selectedFolderId) {
          alert('Please select a folder');
          return;
        }
        
        // Create a unique ID from the chat name
        const chatId = 'manual_' + btoa(chatName).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
        
        console.log('[Chat Organizer] Saving chat:', chatName, 'to folder:', selectedFolderId);
        await assignChatToFolder(chatId, selectedFolderId, chatName);
        showNotification('Chat saved to folder!');
        
        // Clear input
        chatNameInput.value = '';
        selectEl.selectedIndex = 0;
        
        // Reload to update counts
        loadPanelContent();
        injectFoldersIntoSidebar();
      });
    }
  } else {
    folderSelector.innerHTML = '<div style="background: #e7f3ff !important; color: #0c5460 !important; padding: 12px !important; border-radius: 6px !important; font-size: 13px !important; text-align: center !important; border-left: 3px solid #667eea !important;">Create folders in the extension popup first</div>';
  }
  
  // Display all folders with their chats
  const foldersDisplay = document.getElementById('folders-display');
  if (folders.length === 0) {
    foldersDisplay.innerHTML = '<div style="background: #e7f3ff !important; color: #0c5460 !important; padding: 12px !important; border-radius: 6px !important; font-size: 13px !important; text-align: center !important; border-left: 3px solid #667eea !important;">No folders yet. Create one in the extension popup!</div>';
  } else {
    let html = '';
    folders.forEach(folder => {
      const folderChats = Object.entries(assignments).filter(([_, data]) => {
        return (typeof data === 'object' ? data.folderId : data) === folder.id;
      });
      const chatCount = folderChats.length;
      
      html += `
        <div style="background: white !important; border: 1px solid #e9ecef !important; border-radius: 8px !important; padding: 16px !important; margin-bottom: 12px !important;">
          <div style="display: flex !important; align-items: center !important; justify-content: space-between !important; margin-bottom: 8px !important;">
            <div style="display: flex !important; align-items: center !important; gap: 8px !important;">
              <span style="font-size: 24px !important;">📁</span>
              <span style="font-size: 16px !important; font-weight: 600 !important; color: #212529 !important;">${escapeHtml(folder.name)}</span>
            </div>
            <span style="font-size: 12px !important; color: #6c757d !important; background: #f8f9fa !important; padding: 4px 8px !important; border-radius: 12px !important;">${chatCount}</span>
          </div>
      `;
      
      if (chatCount > 0) {
        html += '<div style="margin-top: 12px !important; padding-top: 12px !important; border-top: 1px solid #e9ecef !important;">';
        folderChats.forEach(([chatId, data]) => {
          const chatName = typeof data === 'object' ? data.name : chatId;
          html += `
            <div style="display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 8px !important; background: #f8f9fa !important; border-radius: 4px !important; margin-bottom: 4px !important;">
              <span style="font-size: 13px !important; color: #495057 !important;">${escapeHtml(chatName)}</span>
              <button onclick="window.removeChatFromFolder('${chatId}')" style="background: #dc3545 !important; color: white !important; border: none !important; padding: 4px 8px !important; border-radius: 4px !important; font-size: 11px !important; cursor: pointer !important;">Remove</button>
            </div>
          `;
        });
        html += '</div>';
      }
      
      html += '</div>';
    });
    foldersDisplay.innerHTML = html;
  }
}

async function assignChatToFolder(chatId, folderId, chatName) {
  const result = await chrome.storage.local.get(CHAT_ASSIGNMENTS_KEY);
  const assignments = result[CHAT_ASSIGNMENTS_KEY] || {};
  
  if (folderId) {
    assignments[chatId] = {
      folderId: folderId,
      name: chatName || chatId,
      timestamp: Date.now()
    };
  } else {
    delete assignments[chatId];
  }
  
  await chrome.storage.local.set({ [CHAT_ASSIGNMENTS_KEY]: assignments });
  console.log('[Chat Organizer] Chat assignment saved');
}

// Global function for removing chats
window.removeChatFromFolder = async function(chatId) {
  if (!confirm('Remove this chat from the folder?')) return;
  
  const result = await chrome.storage.local.get(CHAT_ASSIGNMENTS_KEY);
  const assignments = result[CHAT_ASSIGNMENTS_KEY] || {};
  delete assignments[chatId];
  await chrome.storage.local.set({ [CHAT_ASSIGNMENTS_KEY]: assignments });
  
  showNotification('Chat removed from folder');
  loadPanelContent();
  injectFoldersIntoSidebar();
};

// Inject folders into the Gemini sidebar
async function injectFoldersIntoSidebar() {
  // Check if already injected
  if (document.getElementById('chat-organizer-folders-section')) {
    // Update existing section
    updateSidebarFolders();
    return;
  }
  
  console.log('[Chat Organizer] Injecting folders into sidebar...');
  
  // Find the "Chats" section in sidebar
  const chatsSectionHeader = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent.trim() === 'Chats' && el.tagName !== 'A'
  );
  
  if (!chatsSectionHeader) {
    console.log('[Chat Organizer] Chats section not found yet');
    return;
  }
  
  // Create folders section
  const foldersSection = document.createElement('div');
  foldersSection.id = 'chat-organizer-folders-section';
  foldersSection.style.cssText = 'margin-top: 16px; margin-bottom: 16px;';
  
  // Insert before the Chats section
  const parent = chatsSectionHeader.parentElement;
  if (parent) {
    parent.insertBefore(foldersSection, chatsSectionHeader);
    console.log('[Chat Organizer] Folders section injected');
    updateSidebarFolders();
  }
}

// Update sidebar folders display
async function updateSidebarFolders() {
  const foldersSection = document.getElementById('chat-organizer-folders-section');
  if (!foldersSection) return;
  
  const result = await chrome.storage.local.get([FOLDERS_KEY, CHAT_ASSIGNMENTS_KEY]);
  const folders = result[FOLDERS_KEY] || [];
  const assignments = result[CHAT_ASSIGNMENTS_KEY] || {};
  
  if (folders.length === 0) {
    foldersSection.innerHTML = '';
    return;
  }
  
  // Create folders header
  let html = `
    <div style="padding: 8px 12px; font-size: 14px; font-weight: 600; color: #e8eaed; display: flex; align-items: center; gap: 8px;">
      <span>📁</span>
      <span>Folders</span>
    </div>
  `;
  
  // Add each folder
  folders.forEach(folder => {
    const folderChats = Object.entries(assignments).filter(([_, data]) => {
      return (typeof data === 'object' ? data.folderId : data) === folder.id;
    });
    const chatCount = folderChats.length;
    
    const folderId = 'folder-' + folder.id;
    const isExpanded = sessionStorage.getItem(folderId) === 'true';
    
    html += `
      <div style="margin-bottom: 4px;">
        <div onclick="window.toggleFolder('${folder.id}')" style="
          padding: 12px;
          margin: 0 8px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.2s;
          background: ${isExpanded ? 'rgba(138, 180, 248, 0.15)' : 'transparent'};
        " onmouseover="this.style.background='rgba(138, 180, 248, 0.1)'" onmouseout="this.style.background='${isExpanded ? 'rgba(138, 180, 248, 0.15)' : 'transparent'}'">
          <div style="display: flex; align-items: center; gap: 8px; color: #e8eaed; font-size: 14px;">
            <span style="font-size: 16px;">${isExpanded ? '📂' : '📁'}</span>
            <span>${escapeHtml(folder.name)}</span>
          </div>
          <span style="font-size: 12px; color: #9aa0a6; background: rgba(154, 160, 166, 0.2); padding: 2px 8px; border-radius: 10px;">${chatCount}</span>
        </div>
        <div id="${folderId}" style="display: ${isExpanded ? 'block' : 'none'}; padding-left: 24px; margin-top: 4px;">
    `;
    
    // Add chats in this folder
    if (chatCount > 0) {
      folderChats.forEach(([chatId, data]) => {
        const chatName = typeof data === 'object' ? data.name : chatId;
        html += `
          <div style="
            padding: 10px 12px;
            margin: 2px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            color: #c4c7c5;
            transition: background 0.2s;
          " onmouseover="this.style.background='rgba(138, 180, 248, 0.1)'" onmouseout="this.style.background='transparent'">
            ${escapeHtml(chatName)}
          </div>
        `;
      });
    } else {
      html += `
        <div style="padding: 10px 12px; margin: 2px 8px; font-size: 12px; color: #9aa0a6; font-style: italic;">
          No chats yet
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
  });
  
  foldersSection.innerHTML = html;
}

// Toggle folder expand/collapse
window.toggleFolder = function(folderId) {
  const folderElement = document.getElementById('folder-' + folderId);
  if (!folderElement) return;
  
  const isExpanded = folderElement.style.display !== 'none';
  folderElement.style.display = isExpanded ? 'none' : 'block';
  
  // Save state
  sessionStorage.setItem('folder-' + folderId, !isExpanded);
  
  // Update the folder icon
  updateSidebarFolders();
};

function getCurrentChatId() {
  const url = window.location.href;
  
  if (platform === 'chatgpt') {
    const match = url.match(/\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  } else if (platform === 'claude') {
    const match = url.match(/\/chat\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  } else if (platform === 'gemini') {
    // Gemini uses different URL patterns
    // Try multiple patterns
    let match = url.match(/\/chat\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      match = url.match(/\/app\/([a-zA-Z0-9_-]+)/);
    }
    if (!match) {
      // Extract from hash or query params
      match = url.match(/[?&]q=([a-zA-Z0-9_-]+)/);
    }
    // If still no match, generate ID from the currently selected chat element
    if (!match) {
      const selectedChat = document.querySelector('[data-test-id*="chat"]');
      if (selectedChat) {
        const chatText = selectedChat.textContent;
        return 'gemini_' + btoa(chatText).substring(0, 20);
      }
    }
    return match ? match[1] : null;
  } else if (platform === 'copilot') {
    const match = url.match(/threadId=([^&]+)/);
    return match ? match[1] : null;
  }
  
  return null;
}

function getCurrentChatTitle() {
  if (platform === 'chatgpt') {
    const titleEl = document.querySelector('title');
    return titleEl ? titleEl.textContent.replace(' | ChatGPT', '').replace('ChatGPT', '').trim() : 'Current Chat';
  } else if (platform === 'claude') {
    const titleEl = document.querySelector('title');
    return titleEl ? titleEl.textContent.replace(' \ Claude', '').trim() : 'Current Chat';
  } else if (platform === 'gemini') {
    // Try to get the selected chat title
    const selectedChat = document.querySelector('[aria-current="true"]');
    if (selectedChat) {
      const titleText = selectedChat.textContent.trim();
      if (titleText && titleText.length > 0) {
        return titleText;
      }
    }
    // Fallback to page title
    const titleEl = document.querySelector('title');
    const pageTitle = titleEl ? titleEl.textContent.replace('Gemini', '').replace('|', '').trim() : '';
    return pageTitle || 'Current Chat';
  } else if (platform === 'copilot') {
    const titleEl = document.querySelector('title');
    return titleEl ? titleEl.textContent.trim() : 'Current Chat';
  }
  
  return 'Current Chat';
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.setAttribute('style', `
    position: fixed !important;
    top: 24px !important;
    right: 24px !important;
    background: #28a745 !important;
    color: white !important;
    padding: 16px 24px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    z-index: 2147483647 !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    opacity: 0 !important;
    transform: translateY(-20px) !important;
    transition: all 0.3s ease !important;
  `);
  document.body.appendChild(notification);
  
  // Use requestAnimationFrame instead of setTimeout
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  });
  
  // Use requestAnimationFrame with manual timing
  const startTime = performance.now();
  const checkRemove = (currentTime) => {
    if (currentTime - startTime > 2000) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      const removeStartTime = performance.now();
      const checkFinalRemove = (removeTime) => {
        if (removeTime - removeStartTime > 300) {
          notification.remove();
        } else {
          requestAnimationFrame(checkFinalRemove);
        }
      };
      requestAnimationFrame(checkFinalRemove);
    } else {
      requestAnimationFrame(checkRemove);
    }
  };
  requestAnimationFrame(checkRemove);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}