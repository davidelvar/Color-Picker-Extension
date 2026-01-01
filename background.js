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
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    return;
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
});
