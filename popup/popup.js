// Popup script for Workflowy Daily Page extension

document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const toggleViewBtn = document.getElementById('toggleView');
    const refreshViewBtn = document.getElementById('refreshView');
    const autoExpandCheckbox = document.getElementById('autoExpand');
    const defaultViewSelect = document.getElementById('defaultView');
    const statusElement = document.getElementById('status');

    // Initialize status
    updateStatus();

    // Toggle daily view
    toggleViewBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url.includes('workflowy.com')) {
            try {
                await chrome.runtime.sendMessage({ type: 'TOGGLE_DAILY_VIEW' });
                window.close();
            } catch (error) {
                console.warn('Error toggling view:', error);
                updateStatus('Error: Could not toggle view');
            }
        } else {
            updateStatus('Not a Workflowy page');
        }
    });

    // Refresh view
    refreshViewBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url.includes('workflowy.com')) {
            try {
                chrome.tabs.reload(tab.id);
                window.close();
            } catch (error) {
                console.warn('Error refreshing view:', error);
                updateStatus('Error: Could not refresh view');
            }
        }
    });

    // Handle settings changes
    autoExpandCheckbox.addEventListener('change', (e) => {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (tab && tab.url.includes('workflowy.com')) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'UPDATE_SETTINGS',
                        settings: { autoExpand: e.target.checked }
                    });
                }
            });
        } catch (error) {
            console.warn('Error updating auto-expand setting:', error);
        }
    });

    defaultViewSelect.addEventListener('change', (e) => {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                if (tab && tab.url.includes('workflowy.com')) {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'UPDATE_SETTINGS',
                        settings: { defaultView: e.target.value }
                    });
                }
            });
        } catch (error) {
            console.warn('Error updating default view setting:', error);
        }
    });

    function updateStatus(message = 'Active') {
        try {
            statusElement.textContent = message;
            if (message === 'Active') {
                statusElement.style.color = '#2c7be5';
            } else if (message.startsWith('Error')) {
                statusElement.style.color = '#dc3545';
            } else {
                statusElement.style.color = '#6c757d';
            }
        } catch (error) {
            console.warn('Error updating status:', error);
        }
    }

    // Check if we're on a Workflowy page
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab.url.includes('workflowy.com')) {
            updateStatus('Inactive');
            toggleViewBtn.disabled = true;
            refreshViewBtn.disabled = true;
            autoExpandCheckbox.disabled = true;
            defaultViewSelect.disabled = true;
        }
    });
});
