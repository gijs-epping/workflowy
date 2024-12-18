// Popup script for Workflowy Daily Page extension

document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const parentNodeInput = document.getElementById('parentNodeId');
    const setParentNodeBtn = document.getElementById('setParentNode');
    const statusElement = document.querySelector('.date-title'); // Using date-title for status

    // Load saved parent node ID
    chrome.storage.sync.get(['parentNodeId'], (result) => {
        if (result.parentNodeId) {
            parentNodeInput.value = result.parentNodeId;
            updateStatus('Parent node set');
        }
    });

    // Handle setting parent node
    setParentNodeBtn.addEventListener('click', async () => {
        const parentNodeId = parentNodeInput.value.trim();
        
        // Extract the node ID from the full URL if a URL was pasted
        const idMatch = parentNodeId.match(/workflowy\.com\/#\/([^?]+)/);
        const cleanNodeId = idMatch ? idMatch[1] : parentNodeId;

        if (!cleanNodeId) {
            updateStatus('Please enter a node ID');
            return;
        }

        try {
            // Save the parent node ID
            await chrome.storage.sync.set({ parentNodeId: cleanNodeId });
            
            // Notify the background script
            chrome.runtime.sendMessage({ 
                type: 'SET_PARENT_NODE', 
                parentNodeId: cleanNodeId 
            }, (response) => {
                if (response && response.success) {
                    updateStatus('Parent node set successfully');
                } else {
                    updateStatus('Error: Invalid node ID');
                }
            });
        } catch (error) {
            console.error('Error setting parent node:', error);
            updateStatus('Error setting parent node');
        }
    });

    // Handle date cell clicks
    document.querySelectorAll('.date-cell').forEach(cell => {
        cell.addEventListener('click', () => {
            const day = cell.querySelector('.date').textContent;
            const date = new Date();
            date.setDate(parseInt(day));
            
            // Remove active class from all cells
            document.querySelectorAll('.date-cell').forEach(c => c.classList.remove('active'));
            // Add active class to clicked cell
            cell.classList.add('active');

            // Send message to find date node
            chrome.runtime.sendMessage({
                type: 'FIND_DATE_NODE',
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: parseInt(day)
            });
        });
    });

    // Handle navigation arrows
    document.querySelector('.nav-arrow.prev').addEventListener('click', () => {
        // Previous week logic
    });

    document.querySelector('.nav-arrow.next').addEventListener('click', () => {
        // Next week logic
    });

    function updateStatus(message) {
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    // Check if we're on a Workflowy page
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab.url.includes('workflowy.com')) {
            updateStatus('Not a Workflowy page');
            setParentNodeBtn.disabled = true;
            parentNodeInput.disabled = true;
        }
    });
});
