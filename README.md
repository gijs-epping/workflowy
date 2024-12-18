# Workflowy Daily Page Chrome Extension

A Chrome extension that enhances Workflowy with a two-pane layout for efficient daily note management. The extension allows you to view and manage your daily notes alongside your regular Workflowy content.


<a href="https://www.buymeacoffee.com/gijseppingk" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>


![Example of Workflowy Daily Page Extension](/cline_docs/images/example.png)

## Installation

1. [Download all files from this repository](https://github.com/gijs-epping/workflowy/archive/refs/heads/main.zip)
2. Visit `chrome://extensions` in your Chrome browser (via omnibox or menu -> Tools -> Extensions)
3. Enable Developer mode by ticking the checkbox in the upper-right corner
4. Click on the "Load unpacked extension..." button
5. Select the directory containing the downloaded extension files

## Features

- Two-pane layout
  - Left pane: Regular Workflowy view
  - Right pane: Selected day's content
- Calendar-based navigation
- Quick mirroring of nodes (Alt+Shift+M shortcut or mirror icon)
- Settings management via popup

## Setup Instructions

1. **Generate Calendar Structure**
   - Visit [Workflowy Calendar Generator](https://www.workflowy-calendar-generator.com/)
   - Select your desired year and month
   - Generate and copy the calendar structure
   - Paste it into your Workflowy account

2. **Configure Extension Settings**
   - After pasting the calendar structure in Workflowy, navigate to its parent node
   - Click the bullet point of the parent node to get its URL
   - Copy the last part of the URL after the '#/' (e.g., from `https://workflowy.com/#/a0a23e960c84`, copy `a0a23e960c84`)
   - Click the extension icon to open settings
   - Paste the copied ID into the settings field
   - Click Save

3. **Using the Extension**
   - The left pane shows your regular Workflowy content
   - The right pane displays the selected day's content
   - Use the calendar navigation at the top to switch between dates
   - Hover over nodes to reveal the mirror icon (left side)
   - Click the mirror icon to copy nodes to the daily page (same as Alt+Shift+M)

## Keyboard Shortcuts

- `Alt+Shift+M`: Mirror selected node
  - Can also be triggered by clicking the mirror icon that appears when hovering over a node

## Tips

- Organize your daily notes under a dedicated parent node
- Use the calendar generator to create a consistent structure
- Mirror important items to your daily pages for easy tracking
- Use the two-pane view to maintain context while managing daily tasks

## Troubleshooting

If the right pane is not showing daily content:
1. Verify you've pasted the correct parent node ID in settings
2. Ensure your calendar structure matches the Workflowy Calendar Generator format
3. Check that the dates in your calendar structure are properly formatted

## Contributing

Feel free to submit issues and enhancement requests!

