// Workflowy API service

class WorkflowyService {
  constructor() {
    this.treeData = null;
  }

  // Initialize session and get tree data
  async initializeSession() {
    try {
      const response = await this.sendMessage({ type: 'INITIALIZE_SESSION' });
      if (!response.success) {
        throw new Error('Failed to initialize session');
      }
      this.treeData = response.data;
      return response.data;
    } catch (error) {
      console.error('Session initialization failed:', error);
      throw error;
    }
  }

  // Refresh tree data
  async refreshTreeData() {
    try {
      const response = await this.sendMessage({ type: 'REFRESH_TREE_DATA' });
      if (!response.success) {
        throw new Error('Failed to refresh tree data');
      }
      this.treeData = response.data;
      return response.data;
    } catch (error) {
      console.error('Tree data refresh failed:', error);
      throw error;
    }
  }

  // Find nodes by date
  findNodesByDate(year, month, day) {
    if (!this.treeData?.items) {
      return [];
    }

    return this.treeData.items.filter(item => {
      const timeMatch = item.nm.match(/<time startYear="(\d+)" startMonth="(\d+)" startDay="(\d+)">/);
      if (timeMatch) {
        const [_, nodeYear, nodeMonth, nodeDay] = timeMatch;
        return parseInt(nodeYear) === year &&
               parseInt(nodeMonth) === month &&
               parseInt(nodeDay) === day;
      }
      return false;
    });
  }

  // Check if node is descendant of parent node
  isDescendantOf(node, parentNodeId) {
    if (!node || !parentNodeId || !this.treeData?.items) {
      return true; // If no parent ID is set, include all nodes
    }

    const extractLastPartOfId = (fullId) => {
      const match = fullId.match(/-([^-]+)$/);
      return match ? match[1] : fullId;
    };

    let current = node;
    while (current) {
      const currentLastPart = extractLastPartOfId(current.id);
      if (currentLastPart === parentNodeId) {
        return true;
      }
      if (!current.prnt) break;
      current = this.treeData.items.find(item => item.id === current.prnt);
      if (!current) break;
    }
    return false;
  }

  // Send message to background script
  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Export singleton instance
export const workflowyService = new WorkflowyService();
