// Node handler for Workflowy operations
import { workflowyService } from '../../services/workflowy.js';
import { messageService } from '../../services/messageService.js';

export class NodeHandler {
  constructor() {
    this.parentNodeId = null;
    this.setupMessageHandlers();
  }

  // Set up message handlers
  setupMessageHandlers() {
    // Listen for parent node changes
    messageService.addEventListener('parentNode', ({ parentNodeId }) => {
      this.parentNodeId = parentNodeId;
    });

    // Store parent node ID in chrome storage
    chrome.storage.sync.get(['parentNodeId'], (result) => {
      if (result.parentNodeId) {
        this.parentNodeId = result.parentNodeId;
      }
    });
  }

  // Find node by date
  async findNodeByDate(date) {
    try {
      // Refresh tree data
      await workflowyService.refreshTreeData();

      // Get date components
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // Convert to 1-based month
      const day = date.getDate();

      // Find matching date nodes
      const dateNodes = workflowyService.findNodesByDate(year, month, day);

      // Filter nodes based on parent node
      const matchingNode = dateNodes.find(node => 
        workflowyService.isDescendantOf(node, this.parentNodeId)
      );

      if (matchingNode) {
        return {
          success: true,
          node: matchingNode,
          url: `https://workflowy.com/#/${matchingNode.id}`
        };
      } else {
        return {
          success: false,
          error: 'No matching date node found'
        };
      }
    } catch (error) {
      console.error('Error finding node by date:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create mirror node
  async createMirror(sourceNode, targetNode) {
    if (!sourceNode || !targetNode) {
      throw new Error('Source and target nodes are required');
    }

    try {
      // Get node text
      const nodeText = sourceNode.querySelector('.name')?.textContent.trim();
      if (!nodeText) {
        throw new Error('Could not get node text');
      }

      // Create mirror reference
      const mirrorText = `((${nodeText}))`;

      // Send message to create mirror
      messageService.sendToIframe(targetNode.ownerDocument.defaultView, {
        type: 'CREATE_MIRROR',
        content: nodeText
      });

      return {
        success: true,
        mirrorText
      };
    } catch (error) {
      console.error('Error creating mirror:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get parent node ID
  getParentNodeId() {
    return this.parentNodeId;
  }

  // Set parent node ID
  setParentNodeId(nodeId) {
    this.parentNodeId = nodeId;
    // Save to storage
    chrome.storage.sync.set({ parentNodeId: nodeId });
  }

  // Clean up handler
  cleanup() {
    this.parentNodeId = null;
  }
}
