// Split pane component with drag functionality

export class SplitPane {
  constructor() {
    this.container = null;
    this.leftPane = null;
    this.rightPane = null;
    this.divider = null;
    this.leftIframe = null;
    this.rightIframe = null;
    this.instanceId = 'wf-daily-' + Date.now();
  }

  // Create the split pane layout
  async create() {
    try {
      // Create container
      this.container = document.createElement('div');
      this.container.className = 'workflowy-daily-container';
      this.container.setAttribute('data-instance-id', this.instanceId);

      // Create left pane
      this.leftPane = document.createElement('div');
      this.leftPane.className = 'workflowy-daily-pane left-pane';
      this.leftIframe = document.createElement('iframe');
      this.leftPane.appendChild(this.leftIframe);

      // Create divider
      this.divider = document.createElement('div');
      this.divider.className = 'workflowy-daily-divider';
      this.divider.innerHTML = ''; // Ensure element is not self-closing
      this.setupDragHandling();

      // Create right pane
      this.rightPane = document.createElement('div');
      this.rightPane.className = 'workflowy-daily-pane right-pane';
      this.rightIframe = document.createElement('iframe');
      this.rightPane.appendChild(this.rightIframe);

      // Assemble layout
      this.container.appendChild(this.leftPane);
      this.container.appendChild(this.divider);
      this.container.appendChild(this.rightPane);
      document.body.appendChild(this.container);

      // Wait for container to be in DOM
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get current URL without hash and query params
      const url = new URL(window.location.href);
      url.hash = '';
      url.search = '';
      const baseUrl = url.toString();

      // Set up iframes
      await this.setupIframes(baseUrl);

      return {
        container: this.container,
        leftPane: this.leftPane,
        rightPane: this.rightPane,
        leftIframe: this.leftIframe,
        rightIframe: this.rightIframe
      };
    } catch (error) {
      console.error('Failed to create split pane:', error);
      this.cleanup();
      throw error;
    }
  }

  // Set up drag handling for the divider
  setupDragHandling() {
    let isDragging = false;
    let startX;
    let startLeftWidth;

    const onMouseDown = (e) => {
      e.preventDefault();
      isDragging = true;
      this.divider.classList.add('dragging');
      startX = e.clientX;
      startLeftWidth = this.leftPane.getBoundingClientRect().width;
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const delta = e.clientX - startX;
      const containerWidth = this.container.getBoundingClientRect().width;
      const newLeftWidth = ((startLeftWidth + delta) / containerWidth) * 100;

      // Limit the resize between 30% and 70%
      if (newLeftWidth >= 30 && newLeftWidth <= 70) {
        requestAnimationFrame(() => {
          this.leftPane.style.setProperty('flex', `0 0 ${newLeftWidth}%`, 'important');
          this.rightPane.style.setProperty('flex', `0 0 ${100 - newLeftWidth}%`, 'important');
        });
      }
    };

    const onMouseUp = (e) => {
      e.preventDefault();
      isDragging = false;
      this.divider.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    this.divider.addEventListener('mousedown', onMouseDown);
    this.divider.addEventListener('dragstart', (e) => e.preventDefault());
  }

  // Set up iframes with proper URL and load handling
  async setupIframes(baseUrl) {
    // Helper function to wait for iframe to be ready
    const waitForIframe = async (iframe, name) => {
      await new Promise((resolve, reject) => {
        const loadTimeout = setTimeout(() => {
          reject(new Error(`${name} iframe load timeout`));
        }, 10000);

        const checkIframe = () => {
          try {
            const doc = iframe.contentDocument;
            if (doc?.readyState === 'complete') {
              clearTimeout(loadTimeout);
              console.log(`${name} iframe loaded`);
              resolve();
            } else {
              setTimeout(checkIframe, 100);
            }
          } catch (error) {
            // Handle potential security errors
            console.warn(`Error checking ${name} iframe:`, error);
            setTimeout(checkIframe, 100);
          }
        };

        iframe.addEventListener('load', checkIframe, { once: true });
        iframe.src = baseUrl;
        checkIframe(); // Check immediately in case it's already loaded
      });
    };

    // Set up both iframes
    await Promise.all([
      waitForIframe(this.leftIframe, 'Left'),
      waitForIframe(this.rightIframe, 'Right')
    ]);

    // Additional wait to ensure DOM is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Navigate right iframe to specific URL
  navigateRight(url) {
    if (this.rightIframe) {
      this.rightIframe.src = url;
    }
  }

  // Clean up split pane
  cleanup() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.leftPane = null;
    this.rightPane = null;
    this.divider = null;
    this.leftIframe = null;
    this.rightIframe = null;
  }
}
