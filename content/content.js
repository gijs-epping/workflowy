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
            // Prevent multiple instantiation
            if (WorkflowyDailyPage.instance) {
                return WorkflowyDailyPage.instance;
            }

            this.instanceId = 'wf-daily-' + Date.now();
            this.container = null;
            this.leftPane = null;
            this.rightPane = null;
            this.dateSelector = null;
            this.currentUrl = window.location.href;
            this.leftIframe = null;
            this.rightIframe = null;
            this.isInitialized = false;

            WorkflowyDailyPage.instance = this;
            console.warn('WorkflowyDailyPage: Constructor initialized', this.instanceId);
        }

        init() {
            // Check if already initialized
            if (document.querySelector(`[data-instance-id="${this.instanceId}"]`)) {
                console.warn('WorkflowyDailyPage: Already initialized', this.instanceId);
                return;
            }

            console.warn('WorkflowyDailyPage: Init called', this.instanceId);
            this.cleanup();
            
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }

        cleanup() {
            // Remove any existing instances
            document.querySelectorAll('.workflowy-daily-container, .workflowy-daily-date-selector').forEach(el => {
                console.warn('WorkflowyDailyPage: Removing existing element', el.className);
                el.remove();
            });
        }

        setup() {
            if (this.isInitialized) {
                console.warn('WorkflowyDailyPage: Already set up', this.instanceId);
                return;
            }

            console.warn('WorkflowyDailyPage: Setting up', this.instanceId);
            this.isInitialized = true;
            this.createLayout();
            this.setupDateSelector();
        }

        createLayout() {
            console.warn('WorkflowyDailyPage: Creating layout', this.instanceId);
            
            this.container = document.createElement('div');
            this.container.className = 'workflowy-daily-container';
            this.container.setAttribute('data-instance-id', this.instanceId);

            // Create left pane
            this.leftPane = document.createElement('div');
            this.leftPane.className = 'workflowy-daily-pane';
            this.leftIframe = document.createElement('iframe');
            
            this.leftIframe.addEventListener('load', () => {
                console.warn('WorkflowyDailyPage: Left iframe loaded', this.instanceId);
                this.initializeIframeContent();
            });
            
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

        setupDateSelector() {
            console.warn('WorkflowyDailyPage: Setting up date selector', this.instanceId);
            
            this.dateSelector = document.createElement('div');
            this.dateSelector.className = 'workflowy-daily-date-selector';
            this.dateSelector.setAttribute('data-instance-id', this.instanceId);

            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.value = this.getCurrentDate();
            dateInput.addEventListener('change', (e) => {
                console.warn('Date changed:', e.target.value, this.instanceId);
                this.handleDateChange(e.target.value);
            });

            this.dateSelector.appendChild(dateInput);
            document.body.appendChild(this.dateSelector);
        }

        getCurrentDate() {
            const now = new Date();
            return now.toISOString().split('T')[0];
        }

        initializeIframeContent() {
            console.warn('WorkflowyDailyPage: Initializing iframe content', this.instanceId);
            
            try {
                const iframeDoc = this.leftIframe.contentDocument || 
                                (this.leftIframe.contentWindow && this.leftIframe.contentWindow.document);
                
                if (!iframeDoc || !iframeDoc.body) {
                    console.warn('Iframe document not ready', this.instanceId);
                    return;
                }

                const observer = new MutationObserver((mutations) => {
                    console.warn('WorkflowyDailyPage: Content changed', this.instanceId);
                    this.debugDOM(iframeDoc);
                });

                observer.observe(iframeDoc.body, {
                    childList: true,
                    subtree: true
                });

                this.debugDOM(iframeDoc);

                const dateInput = this.dateSelector.querySelector('input[type="date"]');
                if (dateInput) {
                    this.handleDateChange(dateInput.value);
                }
            } catch (error) {
                console.warn('Error initializing iframe content:', error, this.instanceId);
            }
        }

        debugDOM(doc) {
            if (!doc) return;
            
            const timeElements = doc.querySelectorAll('time[data-monolith]');
            console.warn(`Found ${timeElements.length} time elements`, this.instanceId);
            
            timeElements.forEach((el, index) => {
                const projectEl = el.closest('.project');
                const bulletLink = projectEl ? projectEl.querySelector('.bullet') : null;
                
                console.warn(`Time element ${index + 1}:`, {
                    year: el.getAttribute('startyear'),
                    month: el.getAttribute('startmonth'),
                    day: el.getAttribute('startday'),
                    projectId: projectEl ? projectEl.getAttribute('projectid') : null,
                    bulletHref: bulletLink ? bulletLink.getAttribute('href') : null
                });
            });
        }

        handleDateChange(dateStr) {
            console.warn('Handling date change:', dateStr, this.instanceId);
            
            try {
                const date = new Date(dateStr);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const day = date.getDate();

                if (!this.leftIframe || !this.leftIframe.contentDocument) {
                    console.warn('Iframe not ready yet', this.instanceId);
                    return;
                }

                const iframeDoc = this.leftIframe.contentDocument;
                const dateElement = iframeDoc.querySelector(
                    `time[data-monolith][startyear="${year}"][startmonth="${month}"][startday="${day}"]`
                );

                if (dateElement) {
                    const projectElement = dateElement.closest('.project');
                    if (projectElement) {
                        const bulletLink = projectElement.querySelector('.bullet');
                        if (bulletLink) {
                            const href = bulletLink.getAttribute('href');
                            if (href && this.rightIframe) {
                                const fullUrl = `https://workflowy.com${href}`;
                                console.warn('Navigating to:', fullUrl, this.instanceId);
                                this.rightIframe.src = fullUrl;
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn('Error in handleDateChange:', error, this.instanceId);
            }
        }
    }

    // Initialize the extension
    console.warn('Starting Workflowy Daily Page extension');
    const workflowyDaily = WorkflowyDailyPage.getInstance();
    workflowyDaily.init();
}
