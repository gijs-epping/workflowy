// Script to be injected into Workflowy iframes
(function() {
    // Only run in iframes
    if (window.top === window) {
        return;
    }

    let isLeftPane = false;
    let selectedDayNodeId = null;
    let isInitialized = false;

    // Function to check if Workflowy is ready
    function isWorkflowyReady() {
        return document.querySelector('.page') && 
               document.querySelector('.project') &&
               !document.querySelector('.login');
    }

    // Listen for messages from parent window
    window.addEventListener('message', (event) => {
        if (event.data.type === 'INIT_IFRAME' && !isInitialized) {
            isLeftPane = event.data.isLeftPane;
            isInitialized = true;
            console.log('Initialized as', isLeftPane ? 'left' : 'right', 'pane');
            initializeWorkflowy();
        } else if (event.data.type === 'SELECTED_DAY_NODE') {
            selectedDayNodeId = event.data.nodeId;
            console.log('Received selected day node ID:', selectedDayNodeId);
        } else if (event.data.type === 'MIRROR_NODE' && !isLeftPane) {
            console.log('Received MIRROR_NODE message with content:', event.data.content);
            const nodeContent = event.data.content;
            if (!selectedDayNodeId) {
                console.warn('No day selected for mirroring');
                return;
            }

            // Navigate to the selected day node
            const nodeUrl = `https://workflowy.com/#/${selectedDayNodeId}`;
            window.location.href = nodeUrl;

            // Wait for navigation and then simulate pasting
            setTimeout(() => {
                // Find the currently focused item
                const focusedItem = document.querySelector('.focused');
                if (focusedItem) {
                    const editor = focusedItem.querySelector('.contentEditable');
                    if (editor) {
                        editor.focus();
                        document.execCommand('insertText', false, nodeContent);
                    } else {
                        console.warn('Could not find contentEditable element');
                    }
                } else {
                    console.warn('Could not find focused item');
                }
            }, 500);
        }
    });

    console.log('Iframe script loaded, waiting for initialization...');

    // Function to simulate keyboard event
    function simulateKeyPress(key, ctrl = false, alt = false, shift = false) {
        const keyEvent = new KeyboardEvent('keydown', {
            key: key,
            code: `Key${key.toUpperCase()}`,
            ctrlKey: ctrl,
            altKey: alt,
            shiftKey: shift,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(keyEvent);
    }

    // Helper function to extract the last part of a node ID
    function extractLastPartOfId(fullId) {
        // Match the last segment after the last hyphen or remove everything before last 12 chars
        const match = fullId.match(/-([^-]+)$/);
        return match ? match[1] : fullId.slice(-12);
    }

    // Function to create link button
    function createLinkButton() {
        const btn = document.createElement('a');
        btn.className = 'link-btn';
        btn.setAttribute('data-tooltip', 'Copy Internal Link');
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('viewBox', '0 0 18 18');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M10 8H6a2 2 0 0 0-2 2v4m0-4a2 2 0 0 1 2-2h4m-4 2h4m0-2v4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        
        svg.appendChild(path);
        btn.appendChild(svg);
        
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Get the node ID from the closest project
            const target = e.target.closest('.link-btn') || e.target;
            const projectNode = target.closest('.project');
            if (!projectNode) return;
            
            const nodeId = projectNode.getAttribute('projectid');
            if (!nodeId) return;

            // Extract the last part of the ID for the link
            const shortId = extractLastPartOfId(nodeId);
            const internalLink = `https://workflowy.com/#/${shortId}`;
            
            // Create a temporary textarea to copy the link
            const textarea = document.createElement('textarea');
            textarea.value = internalLink;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            // If we're in the left pane and have a selected day node, paste to right pane
            if (isLeftPane && selectedDayNodeId) {
                window.parent.postMessage({ 
                    type: 'PASTE_TO_RIGHT',
                    content: internalLink
                }, '*');
            }
        });
        
        return btn;
    }

    // Function to create mirror button
    function createMirrorButton() {
        const btn = document.createElement('a');
        btn.className = 'mirror-btn';
        btn.setAttribute('data-tooltip', 'Mirror (Alt+Shift+M)');
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '18');
        svg.setAttribute('height', '18');
        svg.setAttribute('viewBox', '0 0 18 18');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M5 9a2 2 0 1 1 4 0M13 9a2 2 0 1 0-4 0');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        
        svg.appendChild(path);
        btn.appendChild(svg);
        
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!selectedDayNodeId) {
                console.warn('No day selected');
                return;
            }

            // First, simulate copy (Ctrl+C) on the current node
            simulateKeyPress('C', true, false, false);
            
            // Wait a brief moment for the copy to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate to the selected day node
            window.parent.postMessage({ 
                type: 'NAVIGATE_TO_NODE', 
                nodeId: selectedDayNodeId 
            }, '*');

            // Wait for navigation
            await new Promise(resolve => setTimeout(resolve, 200));

            // Finally, trigger the mirror command
            simulateKeyPress('M', false, true, true);
        });
        
        return btn;
    }

    // Function to add buttons to node
    function addButtonsToNode(project) {
        if (!isLeftPane) return;

        const nameButtons = project.querySelector('.nameButtons');
        if (!nameButtons || nameButtons.querySelector('.link-btn')) return;

        // Find or create button group
        let btnGroup = nameButtons.querySelector('.hover-btn-group');
        if (!btnGroup) {
            btnGroup = document.createElement('div');
            btnGroup.className = 'hover-btn-group';
            nameButtons.insertBefore(btnGroup, nameButtons.firstChild);
        }

        // Only add buttons if they don't exist
        if (!btnGroup.querySelector('.mirror-btn')) {
            const mirrorBtn = createMirrorButton();
            btnGroup.appendChild(mirrorBtn);
        }
        if (!btnGroup.querySelector('.link-btn')) {
            const linkBtn = createLinkButton();
            btnGroup.appendChild(linkBtn);
        }

        console.log('Added buttons to node:', project.getAttribute('projectid'));
    }

    // Function to add buttons to all nodes
    function addButtonsToAllNodes() {
        if (!isLeftPane) return;
        console.log('Adding buttons to all nodes');
        document.querySelectorAll('.project').forEach(addButtonsToNode);
    }

    // Function to handle node changes
    function setupNodeObserver() {
        if (!isLeftPane) return;
        console.log('Setting up node observer in left pane');

        // Watch for project nodes being added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                // Handle added nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the node itself is a project
                        if (node.matches('.project')) {
                            addButtonsToNode(node);
                        }
                        // Check child nodes for projects
                        node.querySelectorAll('.project').forEach(addButtonsToNode);
                    }
                });

                // Handle attribute changes
                if (mutation.type === 'attributes' && 
                    mutation.target.matches('.project') && 
                    !mutation.target.querySelector('.link-btn')) {
                    addButtonsToNode(mutation.target);
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        // Initial button addition
        addButtonsToAllNodes();
    }

    // Wait for Workflowy to be fully loaded and authenticated
    function initializeWorkflowy() {
        console.log('Initializing Workflowy script...');

        // If Workflowy is already ready, start immediately
        if (isWorkflowyReady()) {
            console.log('Workflowy is already ready');
            setupNodeObserver();
            return;
        }

        // Otherwise, wait for it
        const observer = new MutationObserver((mutations, obs) => {
            if (isWorkflowyReady()) {
                console.log('Workflowy ready detected by observer');
                obs.disconnect();
                setupNodeObserver();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

        // Set a timeout to prevent infinite waiting
        setTimeout(() => {
            observer.disconnect();
            console.error('Timed out waiting for Workflowy');
        }, 10000);
        // Set a timeout to prevent infinite waiting
        setTimeout(() => {
            observer.disconnect();
            console.error('Timed out waiting for Workflowy');
        }, 10000);
    }

})();
