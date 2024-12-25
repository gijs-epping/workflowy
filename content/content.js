// Ensure the script only runs once and track extension state
if (!window.WORKFLOWY_DAILY_INITIALIZED) {
    window.WORKFLOWY_DAILY_INITIALIZED = true;
    window.WORKFLOWY_DAILY_ENABLED = true;

    // Listen for extension state changes
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'EXTENSION_STATE') {
            window.WORKFLOWY_DAILY_ENABLED = message.enabled;
            const workflowyDaily = WorkflowyDailyPage.getInstance();
            if (message.enabled) {
                workflowyDaily.init();
            } else {
                workflowyDaily.cleanup();
            }
            sendResponse({ success: true });
        }
    });

    class WorkflowyDailyPage {
        static getInstance() {
            if (!WorkflowyDailyPage.instance) {
                WorkflowyDailyPage.instance = new WorkflowyDailyPage();
            }
            return WorkflowyDailyPage.instance;
        }

        constructor() {
            if (WorkflowyDailyPage.instance) {
                return WorkflowyDailyPage.instance;
            }

            this.instanceId = 'wf-daily-' + Date.now();
            this.container = null;
            this.leftPane = null;
            this.rightPane = null;
            this.header = null;
            this.currentUrl = window.location.href;
            this.leftIframe = null;
            this.rightIframe = null;
            this.isInitialized = false;
            this.currentDate = new Date();
            this.retryAttempts = 0;
            this.maxRetries = 10;
            this.retryDelay = 1000;
            this.parentNodeId = null;

            WorkflowyDailyPage.instance = this;

            // Load parent node ID from storage
            chrome.storage.sync.get(['parentNodeId'], (result) => {
                if (result.parentNodeId) {
                    this.parentNodeId = result.parentNodeId;
                }
            });
        }

        // Helper function to extract the last part of a node ID
        extractLastPartOfId(fullId) {
            // Match the last segment after the last hyphen
            const match = fullId.match(/-([^-]+)$/);
            return match ? match[1] : fullId;
        }

        // Helper function to check if a node is a descendant of the parent node
        isDescendantOf(node, items) {
            if (!node || !this.parentNodeId) return true; // If no parent ID is set, include all nodes
            
            let current = node;
            while (current) {
                // Extract the last part of the current node's ID
                const currentLastPart = this.extractLastPartOfId(current.id);
                
                // Check if it matches the parent node ID
                if (currentLastPart === this.parentNodeId) {
                    return true;
                }

                // If we've reached the root, break
                if (!current.prnt) break;

                // Find the parent node
                current = items.find(item => item.id === current.prnt);
                if (!current) break;
            }
            return false;
        }

        async init() {
            // Only initialize if extension is enabled
            if (!window.WORKFLOWY_DAILY_ENABLED) return;

            // Clean up any existing instances first
            this.cleanup();

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Add active class and setup
            document.body.classList.add('workflowy-daily-active');
            await this.setup();
        }

        cleanup() {
            try {
                // Only proceed if document is ready
                if (!document.body) {
                    return;
                }

                // Remove active class from body if it exists
                if (document.body.classList.contains('workflowy-daily-active')) {
                    document.body.classList.remove('workflowy-daily-active');
                }

                // Remove all existing instances and elements if they exist
                const elements = document.querySelectorAll('.workflowy-daily-container, .workflowy-daily-header');
                if (elements) {
                    elements.forEach(el => {
                        if (el && el.parentNode) {
                            el.parentNode.removeChild(el);
                        }
                    });
                }

                // Remove any orphaned iframes if they exist
                const iframes = document.querySelectorAll('iframe');
                if (iframes) {
                    iframes.forEach(iframe => {
                        if (iframe && iframe.src && iframe.src.includes('workflowy.com') && iframe.parentNode) {
                            iframe.parentNode.removeChild(iframe);
                        }
                    });
                }

                // Reset state
                this.container = null;
                this.leftPane = null;
                this.rightPane = null;
                this.header = null;
                this.leftIframe = null;
                this.rightIframe = null;
                this.isInitialized = false;
            } catch (error) {
                console.error('Cleanup error:', error);
            }
        }

        // Handle extension disable/unload
        handleUnload() {
            this.cleanup();
        }

        // Handle URL changes
        handleUrlChange(newUrl) {
            if (!window.WORKFLOWY_DAILY_ENABLED) return;
            
            if (this.currentUrl !== newUrl) {
                this.currentUrl = newUrl;
                // Only reinitialize if we're the active instance
                if (document.querySelector(`[data-instance-id="${this.instanceId}"]`)) {
                    this.cleanup();
                    this.init();
                }
            }
        }

        async setup() {
            if (this.isInitialized) return;

            try {
                // Initialize session through background script
                const response = await this.sendMessage({ type: 'INITIALIZE_SESSION' });
                if (!response.success) {
                    throw new Error('Failed to initialize session');
                }

                this.isInitialized = true;
                await this.createLayout();
                this.createHeader();
            } catch (error) {
                console.error('Setup failed:', error);
                this.cleanup();
                throw error;
            }
        }

        sendMessage(message) {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage(message, resolve);
            });
        }

        async createLayout() {
            try {
                this.container = document.createElement('div');
                this.container.className = 'workflowy-daily-container';
                this.container.setAttribute('data-instance-id', this.instanceId);

                // Create left pane
                this.leftPane = document.createElement('div');
                this.leftPane.className = 'workflowy-daily-pane';
                this.leftIframe = document.createElement('iframe');
                this.leftPane.appendChild(this.leftIframe);

                // Create right pane
                this.rightPane = document.createElement('div');
                this.rightPane.className = 'workflowy-daily-pane';
                this.rightIframe = document.createElement('iframe');
                this.rightPane.appendChild(this.rightIframe);

                this.container.appendChild(this.leftPane);
                this.container.appendChild(this.rightPane);
                document.body.appendChild(this.container);

                // Wait for container to be in DOM
                await new Promise(resolve => setTimeout(resolve, 100));

                // Get current URL without hash and query params
                const url = new URL(window.location.href);
                url.hash = '';
                url.search = '';
                const baseUrl = url.toString();

                // Set up left iframe first
                await new Promise((resolve, reject) => {
                    const loadTimeout = setTimeout(() => {
                        reject(new Error('Left iframe load timeout'));
                    }, 5000);

                    this.leftIframe.addEventListener('load', () => {
                        clearTimeout(loadTimeout);
                        console.log('Left iframe loaded');
                        this.setupLeftPane(this.leftIframe);
                        resolve();
                    }, { once: true });

                    this.leftIframe.src = baseUrl;
                });

                // Wait before setting up right iframe
                await new Promise(resolve => setTimeout(resolve, 100));

                // Set up right iframe
                await new Promise((resolve, reject) => {
                    const loadTimeout = setTimeout(() => {
                        reject(new Error('Right iframe load timeout'));
                    }, 5000);

                    this.rightIframe.addEventListener('load', () => {
                        clearTimeout(loadTimeout);
                        console.log('Right iframe loaded');
                        resolve();
                    }, { once: true });

                    this.rightIframe.src = baseUrl;
                });
            } catch (error) {
                console.error('Failed to initialize layout:', error);
                // Clean up on error
                this.cleanup();
                throw error;
            }
        }

        // Setup left pane functionality
        setupLeftPane(iframe) {
            const doc = iframe.contentDocument;
            
            // Function to create button group with mirror button
            const createButtonGroup = (projectNode) => {
                const btnGroup = document.createElement('div');
                btnGroup.className = 'hover-btn-group comment-hover-btn-group';

                // Create mirror button
                const mirrorBtn = document.createElement('a');
                mirrorBtn.className = 'send-btn iconButton lg shape-circle';
                mirrorBtn.setAttribute('data-tooltip', 'Mirror Node');
                
                const mirrorSvg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
                mirrorSvg.setAttribute('width', '18');
                mirrorSvg.setAttribute('height', '18');
                mirrorSvg.setAttribute('viewBox', '0 0 18 18');
                mirrorSvg.classList.add('svg-inline--fa', 'fa-arrow-right-arrow-left', 'fa-1x');
                
                const mirrorPath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
                mirrorPath.setAttribute('d', 'M7.5 3.5L4 7l3.5 3.5M4 7h10m-3.5 4.5L14 15l3.5-3.5M14 15H4');
                mirrorPath.setAttribute('stroke', 'currentColor');
                mirrorPath.setAttribute('stroke-width', '1.5');
                mirrorPath.setAttribute('fill', 'none');
                mirrorPath.setAttribute('stroke-linecap', 'round');
                mirrorPath.setAttribute('stroke-linejoin', 'round');
                
                mirrorSvg.appendChild(mirrorPath);
                mirrorBtn.appendChild(mirrorSvg);
                btnGroup.appendChild(mirrorBtn);

                // Add click handler for mirror button
                mirrorBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const nodeId = projectNode.getAttribute('projectid');
                    if (!nodeId) return;

                    const nameElement = projectNode.querySelector('.name');
                    if (!nameElement) return;

                    // Get node text
                    const nodeText = nameElement.textContent.trim();
                    
                    // Send message to right pane to create mirror
                    if (this.rightIframe) {
                        this.rightIframe.contentWindow.postMessage({
                            type: 'CREATE_MIRROR',
                            content: nodeText
                        }, '*');
                    }

                    // Provide visual feedback
                    mirrorBtn.classList.add('sent');
                    setTimeout(() => {
                        mirrorBtn.classList.remove('sent');
                    }, 500);
                });

                return btnGroup;
            };

            // Function to add buttons to node
            const addButtonsToNode = (project) => {
                const nameButtons = project.querySelector('.nameButtons');
                if (!nameButtons || nameButtons.querySelector('.send-btn')) return;

                const btnGroup = createButtonGroup(project);
                nameButtons.insertBefore(btnGroup, nameButtons.firstChild);

                // Show buttons on hover
                const name = project.querySelector('.name');
                if (name) {
                    name.addEventListener('mouseenter', () => {
                        btnGroup.style.display = 'flex';
                    });
                    name.addEventListener('mouseleave', () => {
                        btnGroup.style.display = 'none';
                    });
                }
            };

            // Watch for project nodes being added
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.matches('.project')) {
                                addButtonsToNode(node);
                            }
                            node.querySelectorAll('.project').forEach(addButtonsToNode);
                        }
                    });
                });
            });

            // Start observing once Workflowy is ready
            const waitForWorkflowy = setInterval(() => {
                if (doc.querySelector('.page')) {
                    clearInterval(waitForWorkflowy);
                    
                    // Add buttons to existing nodes
                    doc.querySelectorAll('.project').forEach(addButtonsToNode);
                    
                    // Watch for new nodes
                    observer.observe(doc.body, {
                        childList: true,
                        subtree: true
                    });
                }
            }, 100);

            // Clear interval after 10 seconds
            setTimeout(() => clearInterval(waitForWorkflowy), 10000);
        }

        createHeader() {
            this.header = document.createElement('div');
            this.header.className = 'workflowy-daily-header';
            this.header.setAttribute('data-instance-id', this.instanceId);

            this.header.innerHTML = `
                <div class="daily-calendar">
                    <button class="daily-nav-arrow prevDaily">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div class="daily-date-grid"></div>
                    <button class="daily-nav-arrow nextDaily">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;

            // Update event listeners to use new class names
            this.header.querySelector('.daily-nav-arrow.prevDaily').addEventListener('click', () => this.navigateWeek(-1));
            this.header.querySelector('.daily-nav-arrow.nextDaily').addEventListener('click', () => this.navigateWeek(1));
            
            document.body.appendChild(this.header);
            this.updateDateGrid();
        }

        updateDateGrid() {
            const grid = this.header.querySelector('.daily-date-grid');
            grid.innerHTML = '';

            // Get Monday of the current week
            const startOfWeek = new Date(this.currentDate);
            startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay() + 1);

            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);

                const cell = document.createElement('div');
                cell.className = 'daily-date-cell';
                if (this.isSameDay(date, this.currentDate)) {
                    cell.classList.add('active');
                }

                cell.innerHTML = `
                    <div class="day">${days[i]}</div>
                    <div class="date">${date.getDate()}</div>
                `;

                cell.addEventListener('click', () => this.handleDateClick(date));
                grid.appendChild(cell);
            }
        }

        navigateWeek(direction) {
            const newDate = new Date(this.currentDate);
            newDate.setDate(this.currentDate.getDate() + (direction * 7));
            this.currentDate = newDate;
            this.updateDateGrid();
            this.handleDateChange(this.currentDate);
        }

        handleDateClick(date) {
            console.log('Date clicked:', date);
            this.currentDate = date;

            this.handleDateChange(date);
        }

        isSameDay(date1, date2) {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        }

        async handleDateChange(date) {
            try {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();

                console.log('Handling date change:', { year, month, day });

                // Refresh tree data
                const treeResponse = await this.sendMessage({ type: 'REFRESH_TREE_DATA' });
                if (!treeResponse.success) {
                    throw new Error('Failed to refresh tree data');
                }

                // Find all matching date nodes
                const dateNodes = treeResponse.data.items.filter(item => {
                    const timeMatch = item.nm.match(/<time startYear="(\d+)" startMonth="(\d+)" startDay="(\d+)">/);
                    if (timeMatch) {
                        const [_, nodeYear, nodeMonth, nodeDay] = timeMatch;
                        return parseInt(nodeYear) === year &&
                               parseInt(nodeMonth) === month &&
                               parseInt(nodeDay) === day;
                    }
                    return false;
                });

                // Filter nodes based on parent node
                const matchingNode = dateNodes.find(node => 
                    this.isDescendantOf(node, treeResponse.data.items)
                );

                if (matchingNode) {
                    console.log('Found matching date node:', matchingNode);
                    const nodeUrl = `https://workflowy.com/#/${matchingNode.id}`;
                    console.log('Navigating to:', nodeUrl);
                    if (this.rightIframe) {
                        this.rightIframe.src = nodeUrl;
                    }
                } else {
                    console.log('No matching date node found for:', { year, month, day });
                }
            } catch (error) {
                console.error('Error in handleDateChange:', error);
            }
        }
    }

    // Initialize the extension when DOM is ready
    const initializeExtension = (retryCount = 0) => {
        const maxRetries = 10;
        const retryDelay = 100;

        // Check if document and body are ready
        if (!document || !document.body) {
            if (retryCount < maxRetries) {
                setTimeout(() => initializeExtension(retryCount + 1), retryDelay);
            } else {
                console.error('Failed to initialize: document.body not available');
            }
            return;
        }

        try {
            const workflowyDaily = WorkflowyDailyPage.getInstance();

            // Watch for URL changes
            let lastUrl = window.location.href;
            new MutationObserver(() => {
                const currentUrl = window.location.href;
                if (currentUrl !== lastUrl) {
                    lastUrl = currentUrl;
                    workflowyDaily.handleUrlChange(currentUrl);
                }
            }).observe(document, { subtree: true, childList: true });

            // Handle extension disable/unload
            window.addEventListener('unload', () => {
                workflowyDaily.handleUnload();
            });

            // Initialize after setting up observers
            workflowyDaily.init().catch(error => {
                console.error('Failed to initialize extension:', error);
            });
        } catch (error) {
            console.error('Error during initialization:', error);
            if (retryCount < maxRetries) {
                setTimeout(() => initializeExtension(retryCount + 1), retryDelay);
            }
        }
    };

    // Start initialization after a short delay
    setTimeout(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initializeExtension());
        } else {
            initializeExtension();
        }
    }, 100);

    // Function to handle messages from iframes
    window.addEventListener('message', (event) => {
        if (event.data.type === 'PASTE_TO_RIGHT' && workflowyDaily.rightIframe) {
            console.log('Received paste message:', event.data.content);
            // Forward the paste content to the right iframe
            workflowyDaily.rightIframe.contentWindow.postMessage({
                type: 'PASTE_CONTENT',
                content: event.data.content
            }, '*');
        }
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SET_PARENT_NODE') {
            console.log('Setting parent node:', message.parentNodeId);
            workflowyDaily.parentNodeId = message.parentNodeId;
            sendResponse({ success: true });
        }
    });
}
