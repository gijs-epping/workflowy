// Ensure the script only runs once
if (!window.WORKFLOWY_DAILY_INITIALIZED) {
    window.WORKFLOWY_DAILY_INITIALIZED = true;

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
            if (document.querySelector(`[data-instance-id="${this.instanceId}"]`)) {
                return;
            }

            this.cleanup();
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        cleanup() {
            document.querySelectorAll('.workflowy-daily-container, .workflowy-daily-header').forEach(el => {
                el.remove();
            });
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
                this.createLayout();
                this.createHeader();
            } catch (error) {
                console.error('Setup failed:', error);
            }
        }

        sendMessage(message) {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage(message, resolve);
            });
        }

        createLayout() {
            this.container = document.createElement('div');
            this.container.className = 'workflowy-daily-container';
            this.container.setAttribute('data-instance-id', this.instanceId);

            // Create left pane
            this.leftPane = document.createElement('div');
            this.leftPane.className = 'workflowy-daily-pane';
            this.leftIframe = document.createElement('iframe');
            this.leftIframe.src = this.currentUrl;
            this.leftPane.appendChild(this.leftIframe);

            // Create right pane
            this.rightPane = document.createElement('div');
            this.rightPane.className = 'workflowy-daily-pane';
            this.rightIframe = document.createElement('iframe');
            this.rightIframe.src = this.currentUrl;
            this.rightPane.appendChild(this.rightIframe);

            this.container.appendChild(this.leftPane);
            this.container.appendChild(this.rightPane);
            document.body.appendChild(this.container);
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

    // Initialize the extension
    const workflowyDaily = WorkflowyDailyPage.getInstance();
    workflowyDaily.init();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SET_PARENT_NODE') {
            workflowyDaily.parentNodeId = message.parentNodeId;
            sendResponse({ success: true });
        }
    });
}
