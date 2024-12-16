// Background service worker for Workflowy Daily Page extension

// Handle extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
    console.warn('Extension event:', details.reason);
    
    if (details.reason === 'install') {
        console.warn('Workflowy Daily Page extension installed');
    } else if (details.reason === 'update') {
        console.warn('Workflowy Daily Page extension updated');
    }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.warn('Background received message:', message);
    
    if (message.type === 'GET_STATUS') {
        sendResponse({ status: 'active' });
        return true;
    }
    
    if (message.type === 'TOGGLE_DAILY_VIEW') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.includes('workflowy.com')) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_DAILY_VIEW' });
            }
        });
        return true;
    }
});
