// Listen for messages from parent window
window.addEventListener('message', async (event) => {
    if (event.data.type === 'CREATE_MIRROR') {
        try {
            // Find or create a bullet point to insert the mirror
            let currentNode = document.querySelector('.project.selected .content');
            if (!currentNode) {
                // If no node is selected, create a new one
                const addButton = document.querySelector('.addButton');
                if (addButton) {
                    addButton.click();
                    await new Promise(resolve => setTimeout(resolve, 100));
                    currentNode = document.querySelector('.project.selected .content');
                }
            }

            if (!currentNode) {
                throw new Error('Could not find or create a node to insert mirror');
            }

            // Focus the node
            currentNode.click();
            await new Promise(resolve => setTimeout(resolve, 100));

            // Press Enter to complete the mirror
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true
            });
            document.dispatchEvent(enterEvent);
            await new Promise(resolve => setTimeout(resolve, 100));
           

            await new Promise(resolve => setTimeout(resolve, 100));

            // Type opening parentheses
            document.execCommand('insertText', false, '((');
            await new Promise(resolve => setTimeout(resolve, 50));

            // Type the node text
            document.execCommand('insertText', false, event.data.content);
            await new Promise(resolve => setTimeout(resolve, 50));

            // Type closing parentheses
            //document.execCommand('insertText', false, '))');
           // await new Promise(resolve => setTimeout(resolve, 50));

            document.dispatchEvent(enterEvent);

        } catch (error) {
            console.error('Failed to create mirror:', error);
        }
    }
});
