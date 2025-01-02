// Content script entry point

// Ensure the script only runs once
if (!window.WORKFLOWY_DAILY_INITIALIZED) {
    window.WORKFLOWY_DAILY_INITIALIZED = true;
    window.WORKFLOWY_DAILY_ENABLED = true;

    // Helper function to get extension URL
    const getExtensionUrl = (path) => {
        return chrome.runtime.getURL(path);
    };

    // Initialize the extension
    const initializeExtension = async () => {
        try {
            // Dynamically import modules
            const [{ default: App }, { messageService }] = await Promise.all([
                import(getExtensionUrl('src/content/App.js')),
                import(getExtensionUrl('src/content/services/messageService.js'))
            ]);

            // Listen for extension state changes
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'EXTENSION_STATE') {
                    window.WORKFLOWY_DAILY_ENABLED = message.enabled;
                    
                    // Notify all components of state change
                    messageService.notifyListeners('extensionState', { enabled: message.enabled });
                    
                    sendResponse({ success: true });
                }
            });

            // Initialize App
            App.initialize();

        } catch (error) {
            console.error('Failed to initialize extension:', error);
        }
    };

    // Start initialization
    initializeExtension();
}
