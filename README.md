# Focus Folder

Focus your VS Code explorer view on multiple folders simultaneously. Perfect for large monorepos or projects with scattered files.

![Focus Folder Demo](https://raw.githubusercontent.com/yasinarshad/focusfolder/main/images/demo.png)

## Features

- **Multi-Folder Focus** - Focus on multiple folders at once in a dedicated panel
- **Declutter Your View** - Only see the folders you're actively working in
- **Full File Operations** - Cut, copy, paste, rename, delete directly from focused view
- **Drag & Drop Reorder** - Organize focused folders with Alt+Up/Down
- **Folder Customization** - Apply colors and icons to folders
- **Keyboard Shortcuts** - All standard shortcuts work
- **Cross-Extension Integration** - Works with Yasin Favorites extension

## Installation

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Focus Folder"
4. Click Install

## Usage

### Focusing Folders
- Right-click any folder in the Explorer
- Select **"Focus on Folder"**
- The folder appears in the "FOCUSED" panel

### Managing Focus
- **Remove focus**: Click the X icon or right-click → "Remove from Focus"
- **Clear all**: Click the clear icon in panel header
- **Reorder**: Alt+Up / Alt+Down

### Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Copy | Cmd+C | Ctrl+C |
| Cut | Cmd+X | Ctrl+X |
| Paste | Cmd+V | Ctrl+V |
| Copy Path | Shift+Cmd+C | Shift+Ctrl+C |
| Rename | Enter | F2 |
| Delete | Cmd+Backspace | Delete |
| Reveal in Finder | Cmd+Shift+R | Ctrl+Shift+R |
| Move Up | Alt+Up | Alt+Up |
| Move Down | Alt+Down | Alt+Down |

## Commands

All commands available via right-click context menu:

- Focus on Folder
- Remove from Focus
- Clear All Focus
- New File / New Folder
- Reveal in Side Bar / Reveal in Finder
- Folder Customization (Color, Icon)
- Create New Templated Folder

## Settings

This extension stores focused folders in VS Code's settings:

- `focusFolder.focusPaths` - List of focused folder paths
- `focusFolder.sortOrder` - Sort order (ASC, DESC, MODIFIED, MANUAL)

## Use Cases

- **Monorepos**: Focus only on the packages you're working on
- **Large Projects**: Zoom in on specific feature directories
- **Multi-Service**: Focus on related frontend/backend folders together
- **Daily Work**: Keep your "hot" folders always visible

## Requirements

- VS Code 1.70.0 or higher

## Known Issues

None currently. Please report issues on [GitHub](https://github.com/yasinarshad/focusfolder/issues).

## Release Notes

### 1.3.0

- Full file operations support
- Folder customization
- Keyboard shortcuts
- Integration with Yasin Favorites

### 1.0.0

- Initial release
- Multi-folder focus
- Basic operations

## Contributing

Contributions welcome! Please open an issue or PR on [GitHub](https://github.com/yasinarshad/focusfolder).

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Enjoy!**
