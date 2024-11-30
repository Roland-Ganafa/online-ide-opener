# Development Guide

This guide will help you set up and contribute to the Online IDE Opener extension.

## Development Environment Setup

### Prerequisites

- Node.js (v16.x or later)
- npm (v7 or later)
- Chrome browser
- Git

### Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Roland-Ganafa/online-ide-opener.git
   cd online-ide-opener
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

### Development Workflow

1. Start development:
   ```bash
   npm run build -- --watch
   ```

2. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

3. Make changes to the code:
   - The extension will automatically rebuild when files change
   - Reload the extension in Chrome to see your changes

### Testing

#### Unit Tests

Run unit tests:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

#### E2E Tests

Run E2E tests:
```bash
npm run test:e2e
```

View test report:
```bash
npx playwright show-report
```

### Code Style

We use ESLint for code style enforcement. Run the linter:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint -- --fix
```

### Building for Production

Create a production build:
```bash
npm run build
```

The built extension will be in the `dist` directory.

### Creating a Release

1. Update version in `package.json`
2. Create and push a new tag:
   ```bash
   git tag v1.x.x
   git push origin v1.x.x
   ```

This will trigger:
- GitHub Actions to create a release
- Chrome Web Store deployment (if configured)

### Debugging

1. Background Script:
   - Go to `chrome://extensions`
   - Find the extension
   - Click "background page" under "Inspect views"

2. Content Script:
   - Right-click on a page
   - Select "Inspect"
   - Look for your content script in the Sources panel

3. Popup:
   - Right-click the extension icon
   - Select "Inspect popup"

### Project Structure

```
online-ide-opener/
├── src/
│   ├── background.js     # Background script
│   ├── content.js        # Content script
│   ├── popup/
│   │   ├── popup.html    # Popup UI
│   │   ├── popup.js      # Popup logic
│   │   └── popup.css     # Popup styles
│   └── options/
│       ├── options.html  # Options page
│       └── options.js    # Options logic
├── tests/
│   ├── unit/            # Unit tests
│   └── e2e/             # E2E tests
├── dist/                # Built extension
└── docs/               # Documentation
```

### Common Issues

1. **Extension not updating:**
   - Make sure the build completed successfully
   - Try reloading the extension in `chrome://extensions`

2. **Tests failing:**
   - Ensure all dependencies are installed
   - Check if you need to update test snapshots

3. **Build errors:**
   - Clear the `dist` directory
   - Delete `node_modules` and run `npm install`

### Contributing

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes and commit:
   ```bash
   git commit -m "feat: add new feature"
   ```

3. Push and create a PR:
   ```bash
   git push origin feature/your-feature
   ```

4. Wait for CI checks to pass
5. Request review

### Need Help?

- Check existing [issues](https://github.com/Roland-Ganafa/online-ide-opener/issues)
- Create a new issue
- Join our discussions
