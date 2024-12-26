// Listen for messages from parent window
window.addEventListener('message', async (event) => {
    if (event.data.type === 'CREATE_MIRROR') {
        try {
            // Find the current node
            let currentNode = document.querySelector('.project.selected');
            if (!currentNode) {
                throw new Error('No selected node found');
            }

            // 1. Click the addChildButton using a simulated click event
            const addChildButton = currentNode.querySelector('.addChildButton');
            if (addChildButton) {
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                addChildButton.dispatchEvent(clickEvent);
                await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay for node creation
            } else {
                throw new Error('Add child button not found');
            }

            // Find the newly created node's content
            const newNode = currentNode.querySelector('.children .project:last-child .content');
            if (!newNode) {
                throw new Error('Could not find new node');
            }

            // 2. Click on node to focus it
            const focusEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            newNode.dispatchEvent(focusEvent);
            await new Promise(resolve => setTimeout(resolve, 50));

            // 3. Go to end of line
            const endEvent = new KeyboardEvent('keydown', {
                key: 'End',
                code: 'End',
                bubbles: true
            });
            document.dispatchEvent(endEvent);
            await new Promise(resolve => setTimeout(resolve, 50));

            // 4. Type opening parentheses
            document.execCommand('insertText', false, '((');
            await new Promise(resolve => setTimeout(resolve, 30));

            // 5. Type first 10 characters of node text
            const text = event.data.content;
            const typingLength = Math.min(10, text.length);
            for (let i = 0; i < typingLength; i++) {
                document.execCommand('insertText', false, text[i]);
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            await new Promise(resolve => setTimeout(resolve, 30));

            // 6. Press Enter to complete the mirror
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                bubbles: true
            });
            document.dispatchEvent(enterEvent);

        } catch (error) {
            console.error('Failed to create mirror:', error);
        }
    }
});
