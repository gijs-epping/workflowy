// Main application class
class App {
  constructor() {
    this.splitPane = null;
    this.header = null;
    this.iframeManager = null;
    this.nodeHandler = null;
    this.workflowyService = null;
    this.dateManager = null;
    this.messageService = null;
    this.isInitialized = false;
    this.currentUrl = window.location.href;
  }

  async setup() {
    try {
      // Dynamically import services first
      const [
        { workflowyService },
        { dateManager },
        { messageService }
      ] = await Promise.all([
        import(chrome.runtime.getURL('src/content/services/workflowy.js')),
        import(chrome.runtime.getURL('src/content/services/dateManager.js')),
        import(chrome.runtime.getURL('src/content/services/messageService.js'))
      ]);

      // Initialize services
      this.workflowyService = workflowyService;
      this.dateManager = dateManager;
      this.messageService = messageService;

      // Import components
      const [
        { SplitPane },
        { IframeManager },
        { NodeHandler }
      ] = await Promise.all([
        import(chrome.runtime.getURL('src/content/components/Layout/SplitPane.js')),
        import(chrome.runtime.getURL('src/content/components/WorkflowyIntegration/IframeManager.js')),
        import(chrome.runtime.getURL('src/content/components/WorkflowyIntegration/NodeHandler.js'))
      ]);

      // Initialize components
      this.splitPane = new SplitPane();
      this.iframeManager = new IframeManager();
      this.nodeHandler = new NodeHandler();

      return true;
    } catch (error) {
      console.error('Failed to setup app:', error);
      return false;
    }
  }

  // Initialize the application
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

    try {
      // Initialize session through workflowy service
      await this.workflowyService.initializeSession();

      // Add active class to body
      document.body.classList.add('workflowy-daily-active');

      // Create layout
      await this.createLayout();

      // Initialize components
      this.isInitialized = true;

      // Navigate to current day
      await this.handleDateChange(new Date());
    } catch (error) {
      console.error('Initialization failed:', error);
      this.cleanup();
      throw error;
    }
  }

  // Create application layout
  async createLayout() {
    try {
      // Import Header component
      const { Header } = await import(chrome.runtime.getURL('src/content/components/Layout/Header.js'));

      // Create split pane layout first
      const layout = await this.splitPane.create();
      if (!layout) {
        throw new Error('Failed to create split pane layout');
      }

      // Wait a bit for iframes to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create header before initializing iframe manager
      this.header = new Header(date => this.handleDateChange(date));
      const headerElement = this.header.create();
      if (!headerElement) {
        throw new Error('Failed to create header');
      }

      // Add header to right pane
      layout.rightPane.insertBefore(headerElement, layout.rightIframe);

      // Initialize iframe manager last
      await new Promise(resolve => setTimeout(resolve, 500)); // Additional wait for iframes
      this.iframeManager.initialize(layout.leftIframe, layout.rightIframe);

    } catch (error) {
      console.error('Failed to create layout:', error);
      throw error;
    }
  }

  // Handle date changes
  async handleDateChange(date) {
    try {
      // Update date manager
      this.dateManager.setCurrentDate(date);

      // Find node for selected date
      const result = await this.nodeHandler.findNodeByDate(date);
      
      if (result.success) {
        // Navigate right iframe to node
        this.splitPane.navigateRight(result.url);
      } else {
        console.warn('No matching date node found:', result.error);
      }
    } catch (error) {
      console.error('Error handling date change:', error);
    }
  }

  // Handle URL changes
  handleUrlChange(newUrl) {
    if (!window.WORKFLOWY_DAILY_ENABLED) return;
    
    if (this.currentUrl !== newUrl) {
      this.currentUrl = newUrl;
      // Only reinitialize if we're the active instance
      if (document.querySelector(`[data-instance-id="${this.splitPane.instanceId}"]`)) {
        this.cleanup();
        this.init();
      }
    }
  }

  // Clean up application
  cleanup() {
    try {
      // Only proceed if document is ready
      if (!document.body) return;

      // Remove active class from body
      document.body.classList.remove('workflowy-daily-active');

      // Clean up components
      if (this.splitPane) {
        this.splitPane.cleanup();
      }
      if (this.header) {
        this.header.cleanup();
      }
      if (this.iframeManager) {
        this.iframeManager.cleanup();
      }
      if (this.nodeHandler) {
        this.nodeHandler.cleanup();
      }

      // Reset state
      this.header = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Handle extension disable/unload
  handleUnload() {
    this.cleanup();
  }
}

// Initialize the extension
const initializeExtension = async (retryCount = 0) => {
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
    // Watch for URL changes
    let lastUrl = window.location.href;
    new MutationObserver(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        app.handleUrlChange(currentUrl);
      }
    }).observe(document, { subtree: true, childList: true });

    // Handle extension disable/unload
    window.addEventListener('unload', () => {
      app.handleUnload();
    });

    // Initialize app
    await app.init();
  } catch (error) {
    console.error('Error during initialization:', error);
    if (retryCount < maxRetries) {
      setTimeout(() => initializeExtension(retryCount + 1), retryDelay);
    }
  }
};

// Export singleton instance with initialize function
const app = new App();

export default {
  initialize: () => {
    // Start initialization after a short delay
    setTimeout(async () => {
      try {
        await app.setup();
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', async () => await initializeExtension(app));
        } else {
          await initializeExtension(app);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    }, 100);
  }
};
