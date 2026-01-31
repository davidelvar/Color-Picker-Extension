// Background Service Worker for Color Picker Extension

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureScreen') {
    // Capture the visible tab
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Capture error:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'colorPicked') {
    // Store the picked color
    chrome.storage.local.get(['colorHistory'], (data) => {
      let history = data.colorHistory || [];
      history = history.filter(c => c !== message.color);
      history.unshift(message.color);
      history = history.slice(0, 8);
      chrome.storage.local.set({ 
        colorHistory: history,
        lastColor: message.color 
      });
    });
  }
  
  return true;
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  activatePickerOnTab(tab);
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'activate-picker') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      activatePickerOnTab(tab);
    }
  }
});

// Shared function to activate picker
async function activatePickerOnTab(tab) {
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    return;
  }
  
  try {
    // Inject content script if needed
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['content.css']
    });
  } catch (e) {
    // Script might already be injected
  }
  
  try {
    const data = await chrome.storage.local.get(['colorFormat']);
    const format = data.colorFormat || 'hex';
    
    await chrome.tabs.sendMessage(tab.id, { 
      action: 'activatePicker', 
      format: format 
    });
  } catch (err) {
    console.error('Failed to activate picker:', err);
  }
}
