# Codebase Summary: Workflowy Daily Page Chrome Extension

## Project Structure
```
workflowy/
├── manifest.json        # Chrome extension configuration
├── content/
│   ├── content.js      # Content script for two-pane layout and date handling
│   └── content.css     # Styles for two-pane layout
├── background/
│   └── background.js   # Service worker for extension
├── popup/
│   ├── popup.html      # Extension popup interface
│   ├── popup.css       # Popup styles
│   └── popup.js        # Popup functionality and settings management
└── icons/              # Extension icons
```

## Key Components

### Content Script (content.js)
- Implements WorkflowyDailyPage class for managing two-pane layout
- Handles iframe embedding of Workflowy content
- Manages date selection and navigation
- Provides dynamic content loading
- Implements mirror icon functionality for quick node mirroring

### Background Service Worker (background.js)
- Manages extension lifecycle events
- Handles cross-origin requests
- Processes messages between components
- Controls extension icon click behavior

### Popup Interface
- Settings management:
  - Parent node ID configuration
  - Status display
- View toggle functionality
- Refresh capability

## Setup Requirements
1. Calendar Structure:
   - Generated via workflowy-calendar-generator.com
   - Must be properly formatted with time tags
   - Organized under a parent node

2. Parent Node Configuration:
   - ID extracted from Workflowy URL
   - Stored in extension settings
   - Used to filter and locate daily nodes

## Data Flow
1. Extension activates on Workflowy domain
2. Content script creates two-pane layout:
   - Left pane: Current Workflowy page
   - Right pane: Selected date's content
3. Date selector enables navigation
4. Settings in popup control behavior
5. Background worker manages permissions and messaging

## Implementation Details
- Uses CSS Grid for responsive two-pane layout
- Implements iframe-based content embedding
- Manages cross-origin communication
- Provides user settings persistence
- Handles dynamic content updates
- Mirror icon functionality for quick node copying

## External Dependencies
- Workflowy web interface
- Chrome Extensions API
- Web APIs (DOM, iframe, Storage)
- Workflowy Calendar Generator (for setup)

## Recent Significant Changes
- Added mirror icon functionality:
  - Left-aligned icon placement
  - Hover-based visibility
  - Click-to-mirror functionality
  - Keyboard event simulation
- Improved iframe handling
- Enhanced style injection
- Updated documentation

## Development Guidelines
- Follow Chrome Extensions best practices
- Maintain clean separation of concerns
- Use descriptive variable and function names
- Comment complex logic and edge cases
- Test across different Workflowy states

## Known Limitations
- Requires Workflowy to be loaded
- May need adjustments for Workflowy updates
- Cross-origin restrictions may apply
- Requires proper calendar structure setup

## Next Steps
1. Enhance error handling for setup process
2. Add visual feedback for mirror action
3. Improve calendar navigation UX
4. Add setup wizard functionality
5. Implement automatic calendar structure verification
