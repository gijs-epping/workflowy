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
└── icons/              # Extension icons (placeholder)
    └── README.txt      # Icon placeholder note
```

## Key Components

### Content Script (content.js)
- Implements WorkflowyDailyPage class for managing two-pane layout
- Handles iframe embedding of Workflowy content
- Manages date selection and navigation
- Provides dynamic content loading

### Background Service Worker (background.js)
- Manages extension lifecycle events
- Handles cross-origin requests
- Processes messages between components
- Controls extension icon click behavior

### Popup Interface
- Settings management:
  - Auto-expand daily nodes option
  - Default view preference
- View toggle functionality
- Status display
- Refresh capability

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

## External Dependencies
- Workflowy web interface
- Chrome Extensions API
- Web APIs (DOM, iframe, Storage)

## Recent Significant Changes
- Initial implementation complete:
  - Two-pane layout system
  - Date selection functionality
  - Settings management
  - Extension popup interface

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
- Placeholder icons need replacement

## Next Steps
1. Replace placeholder icons with proper extension icons
2. Implement comprehensive error handling
3. Add loading indicators
4. Enhance date navigation
5. Add keyboard shortcuts
