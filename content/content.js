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

            WorkflowyDailyPage.instance = this;
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
                    <button class="daily-nav-arrow prev">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <div class="daily-date-grid"></div>
                    <button class="daily-nav-arrow next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;

            // Add event listeners
            this.header.querySelector('.daily-nav-arrow.prev').addEventListener('click', () => this.navigateWeek(-1));
            this.header.querySelector('.daily-nav-arrow.next').addEventListener('click', () => this.navigateWeek(1));
            
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
            this.updateDateGrid();
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
                await this.sendMessage({ type: 'REFRESH_TREE_DATA' });

                // Find date node
                const response = await this.sendMessage({
                    type: 'FIND_DATE_NODE',
                    year,
                    month,
                    day
                });

                if (response.success && response.node) {
                    console.log('Found date node:', response.node);
                    const nodeUrl = `https://workflowy.com/#/${response.node.id}`;
                    console.log('Navigating to:', nodeUrl);
                    if (this.rightIframe) {
                        this.rightIframe.src = nodeUrl;
                    }
                } else {
                    console.log('No date node found for:', { year, month, day });
                }
            } catch (error) {
                console.error('Error in handleDateChange:', error);
            }
        }
    }

    // Initialize the extension
    const workflowyDaily = WorkflowyDailyPage.getInstance();
    workflowyDaily.init();
}
