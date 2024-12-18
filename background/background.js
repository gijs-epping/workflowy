// Background service worker for Workflowy Daily Page extension

// Store for authentication and session data
let sessionData = {
    sessionId: null,
    treeData: null
};

// Handle extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
    console.warn('Extension event:', details.reason);
    
    if (details.reason === 'install') {
        console.warn('Workflowy Daily Page extension installed');
    } else if (details.reason === 'update') {
        console.warn('Workflowy Daily Page extension updated');
    }
});

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Request failed:', error);
        throw error;
    }
}

// Initialize session and fetch tree data
async function initializeSession() {
    try {
        // Get initialization data
        const initData = await makeAuthenticatedRequest('https://workflowy.com/get_initialization_data', {
            method: 'POST'
        });

        // Get tree data
        const treeData = await makeAuthenticatedRequest('https://workflowy.com/get_tree_data/');
        sessionData.treeData = treeData;

        return treeData;
    } catch (error) {
        console.error('Failed to initialize session:', error);
        throw error;
    }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.warn('Background received message:', message);
    
    if (message.type === 'INITIALIZE_SESSION') {
        initializeSession()
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    if (message.type === 'REFRESH_TREE_DATA') {
        makeAuthenticatedRequest('https://workflowy.com/get_tree_data/')
            .then(data => {
                sessionData.treeData = data;
                sendResponse({ success: true, data });
            })
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
