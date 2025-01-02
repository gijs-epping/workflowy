// Message handling service

class MessageService {
  constructor() {
    this.listeners = new Map();
    this.setupMessageListeners();
  }

  // Set up chrome runtime message listeners
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXTENSION_STATE') {
        this.notifyListeners('extensionState', { enabled: message.enabled });
        sendResponse({ success: true });
      }

      if (message.type === 'SET_PARENT_NODE') {
        this.notifyListeners('parentNode', { parentNodeId: message.parentNodeId });
        sendResponse({ success: true });
      }
    });

    // Listen for messages from iframes
    window.addEventListener('message', (event) => {
      if (event.data.type === 'PASTE_TO_RIGHT') {
        this.notifyListeners('pasteToRight', { content: event.data.content });
      }

      if (event.data.type === 'CREATE_MIRROR') {
        this.notifyListeners('createMirror', { content: event.data.content });
      }
    });
  }

  // Send message to background script
  sendToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  // Send message to iframe
  sendToIframe(iframe, message) {
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
    }
  }

  // Add event listener
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Clean up all listeners
  cleanup() {
    this.listeners.clear();
  }
}

// Export singleton instance
export const messageService = new MessageService();
