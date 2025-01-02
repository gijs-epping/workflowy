// Paste handler for iframe content

// Helper function to get extension URL
const getExtensionUrl = (path) => {
    return chrome.runtime.getURL(path);
};

// Initialize message service
const initializeMessageService = async () => {
    try {
        const { messageService } = await import(getExtensionUrl('src/content/services/messageService.js'));
        return messageService;
    } catch (error) {
        console.error('Failed to load message service:', error);
        return null;
    }
};

// Listen for messages from parent window
window.addEventListener('message', async (event) => {
    if (event.data.type === 'CREATE_MIRROR') {
        try {
            const messageService = await initializeMessageService();
            if (!messageService) {
                throw new Error('Message service not available');
            }

            // Find the current node
            let currentNode = document.querySelector('.project.selected');
            if (!currentNode) {
                throw new Error('No selected node found');
            }

            // Click the addChildButton using a simulated click event
            const addChildButton = currentNode.querySelector('.addChildButton');
            if (addChildButton) {
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                addChildButton.dispatchEvent(clickEvent);
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                throw new Error('Add child button not found');
            }

            // Type opening parentheses
            document.execCommand('insertText', false, '((');
            await new Promise(resolve => setTimeout(resolve, 30));

            // Type first 10 characters of node text
            const text = event.data.content;
            const typingLength = Math.min(10, text.length);
            for (let i = 0; i < typingLength; i++) {
                document.execCommand('insertText', false, text[i]);
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            await new Promise(resolve => setTimeout(resolve, 30));

            // Press Enter to complete the mirror
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true
            });
            document.dispatchEvent(enterEvent);

            // Notify success
            messageService.notifyListeners('mirrorCreated', { success: true });
        } catch (error) {
            console.error('Error creating mirror:', error);
            const messageService = await initializeMessageService();
            if (messageService) {
                messageService.notifyListeners('mirrorCreated', { 
                    success: false, 
                    error: error.message 
                });
            }
        }
    }
});
