// Storage keys
const FOLDERS_KEY = 'chat_folders';
const CHAT_ASSIGNMENTS_KEY = 'chat_assignments';

// Get DOM elements
const folderNameInput = document.getElementById('folderNameInput');
const createFolderBtn = document.getElementById('createFolderBtn');
const folderList = document.getElementById('folderList');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadFolders();
  
  createFolderBtn.addEventListener('click', createFolder);
  folderNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      createFolder();
    }
  });
});

// Load and display folders
async function loadFolders() {
  try {
    const result = await chrome.storage.local.get([FOLDERS_KEY, CHAT_ASSIGNMENTS_KEY]);
    const folders = result[FOLDERS_KEY] || [];
    const assignments = result[CHAT_ASSIGNMENTS_KEY] || {};
    
    if (folders.length === 0) {
      folderList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📂</div>
          <div class="empty-state-text">No folders yet. Create one to get started!</div>
        </div>
      `;
      return;
    }
    
    folderList.innerHTML = '';
    
    folders.forEach(folder => {
      const chatCount = Object.values(assignments).filter(f => f === folder.id).length;
      const folderEl = createFolderElement(folder, chatCount);
      folderList.appendChild(folderEl);
    });
  } catch (error) {
    console.error('Error loading folders:', error);
  }
}

// Create folder element
function createFolderElement(folder, chatCount) {
  const div = document.createElement('div');
  div.className = 'folder-item';
  div.innerHTML = `
    <div class="folder-info">
      <span class="folder-icon">📁</span>
      <span class="folder-name">${escapeHtml(folder.name)}</span>
      <span class="folder-count">${chatCount} chat${chatCount !== 1 ? 's' : ''}</span>
    </div>
    <button class="btn-delete" data-folder-id="${folder.id}">Delete</button>
  `;
  
  const deleteBtn = div.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', () => deleteFolder(folder.id));
  
  return div;
}

// Create new folder
async function createFolder() {
  const name = folderNameInput.value.trim();
  
  if (!name) {
    alert('Please enter a folder name');
    return;
  }
  
  try {
    const result = await chrome.storage.local.get(FOLDERS_KEY);
    const folders = result[FOLDERS_KEY] || [];
    
    // Check for duplicate names
    if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
      alert('A folder with this name already exists');
      return;
    }
    
    const newFolder = {
      id: generateId(),
      name: name,
      createdAt: Date.now()
    };
    
    folders.push(newFolder);
    await chrome.storage.local.set({ [FOLDERS_KEY]: folders });
    
    folderNameInput.value = '';
    loadFolders();
  } catch (error) {
    console.error('Error creating folder:', error);
    alert('Failed to create folder');
  }
}

// Delete folder
async function deleteFolder(folderId) {
  if (!confirm('Are you sure you want to delete this folder? Chats will not be deleted, just unassigned.')) {
    return;
  }
  
  try {
    const result = await chrome.storage.local.get([FOLDERS_KEY, CHAT_ASSIGNMENTS_KEY]);
    const folders = result[FOLDERS_KEY] || [];
    const assignments = result[CHAT_ASSIGNMENTS_KEY] || {};
    
    // Remove folder
    const updatedFolders = folders.filter(f => f.id !== folderId);
    
    // Remove all assignments to this folder
    const updatedAssignments = {};
    for (const [chatId, folderIdValue] of Object.entries(assignments)) {
      if (folderIdValue !== folderId) {
        updatedAssignments[chatId] = folderIdValue;
      }
    }
    
    await chrome.storage.local.set({
      [FOLDERS_KEY]: updatedFolders,
      [CHAT_ASSIGNMENTS_KEY]: updatedAssignments
    });
    
    loadFolders();
  } catch (error) {
    console.error('Error deleting folder:', error);
    alert('Failed to delete folder');
  }
}

// Utility functions
function generateId() {
  return `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}