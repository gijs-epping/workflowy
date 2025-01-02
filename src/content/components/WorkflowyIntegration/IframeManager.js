// Iframe manager for Workflowy integration
import { messageService } from '../../services/messageService.js';

export class IframeManager {
  constructor() {
    this.leftIframe = null;
    this.rightIframe = null;
  }

  // Initialize iframe manager with iframes
  initialize(leftIframe, rightIframe) {
    this.leftIframe = leftIframe;
    this.rightIframe = rightIframe;
    this.setupIframeHandlers();
  }

  // Set up event handlers for iframes
  async setupIframeHandlers() {
    if (!this.leftIframe || !this.rightIframe) return;

    try {
      // Wait for left iframe to load
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Left iframe load timeout')), 10000);
        
        const checkIframe = () => {
          const doc = this.leftIframe.contentDocument;
          if (doc?.readyState === 'complete' && doc.querySelector('.page')) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(checkIframe, 100);
          }
        };

        if (this.leftIframe.contentDocument?.readyState === 'complete') {
          checkIframe();
        } else {
          this.leftIframe.addEventListener('load', checkIframe);
        }
      });

      // Set up mutation observer
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              if (node.matches('.project')) {
                this.addCtrlClickHandler(node);
              }
              node.querySelectorAll('.project').forEach(project => {
                this.addCtrlClickHandler(project);
              });
            }
          });
        });
      });

      // Add handlers to existing nodes
      const doc = this.leftIframe.contentDocument;
      doc.querySelectorAll('.project').forEach(project => {
        this.addCtrlClickHandler(project);
      });
      
      // Watch for new nodes
      observer.observe(doc.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      console.error('Failed to setup iframe handlers:', error);
    }

    // Set up message handlers for right iframe
    messageService.addEventListener('pasteToRight', ({ content }) => {
      this.handlePasteToRight(content);
    });

    messageService.addEventListener('createMirror', ({ content }) => {
      this.handleCreateMirror(content);
    });
  }

  // Add CTRL+click handler to project node
  addCtrlClickHandler(project) {
    project.addEventListener('click', async (e) => {
      if (e.ctrlKey) {
        e.stopPropagation();
        e.preventDefault();
        
        const nodeId = project.getAttribute('projectid');
        if (!nodeId) return;

        const nameElement = project.querySelector('.name');
        if (!nameElement) return;

        // Get node text
        const nodeText = nameElement.textContent.trim();
        
        // Send message to create mirror
        messageService.sendToIframe(this.rightIframe, {
          type: 'CREATE_MIRROR',
          content: nodeText
        });

        // Provide visual feedback
        project.classList.add('sent');
        setTimeout(() => {
          project.classList.remove('sent');
        }, 500);
      }
    });
  }

  // Handle paste to right iframe
  handlePasteToRight(content) {
    if (this.rightIframe?.contentWindow) {
      messageService.sendToIframe(this.rightIframe, {
        type: 'PASTE_CONTENT',
        content
      });
    }
  }

  // Handle create mirror in right iframe
  async handleCreateMirror(content) {
    if (!this.rightIframe?.contentDocument) return;

    try {
      const doc = this.rightIframe.contentDocument;
      
      // Find current node
      const currentNode = doc.querySelector('.project.selected');
      if (!currentNode) {
        throw new Error('No selected node found');
      }

      // Click add child button
      const addChildButton = currentNode.querySelector('.addChildButton');
      if (addChildButton) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: this.rightIframe.contentWindow
        });
        addChildButton.dispatchEvent(clickEvent);
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        throw new Error('Add child button not found');
      }

      // Type mirror syntax
      doc.execCommand('insertText', false, '((');
      await new Promise(resolve => setTimeout(resolve, 30));

      // Type first 10 characters of node text
      const typingLength = Math.min(10, content.length);
      for (let i = 0; i < typingLength; i++) {
        doc.execCommand('insertText', false, content[i]);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      await new Promise(resolve => setTimeout(resolve, 30));

      // Press Enter to complete mirror
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true
      });
      doc.dispatchEvent(enterEvent);
    } catch (error) {
      console.error('Error creating mirror:', error);
    }
  }

  // Clean up manager
  cleanup() {
    this.leftIframe = null;
    this.rightIframe = null;
  }
}
