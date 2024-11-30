# Online IDE Opener

[![CI](https://github.com/Roland-Ganafa/online-ide-opener/actions/workflows/ci.yml/badge.svg)](https://github.com/Roland-Ganafa/online-ide-opener/actions/workflows/ci.yml)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/Roland-Ganafa/online-ide-opener)](https://github.com/Roland-Ganafa/online-ide-opener/releases)
[![License](https://img.shields.io/github/license/Roland-Ganafa/online-ide-opener)](LICENSE)

A powerful Chrome extension that opens repositories in your favorite online IDEs with just one click. Choose from multiple online development environments and start coding instantly.

## Features

- 🚀 One-click access to popular online IDEs
- 🎨 Clean and intuitive interface
- 🔄 Context menu integration
- ⚙️ Customizable settings
- 🌐 Supports multiple IDE platforms:
  - GitHub.dev
  - CodeSandbox
  - StackBlitz
  - Replit

## Installation

### From Chrome Web Store
*(Coming soon)*

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/Roland-Ganafa/online-ide-opener/releases)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extracted extension directory
5. The extension icon should appear in your Chrome toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. Select your preferred online IDE from the popup menu
3. The selected IDE will open in a new tab

### Context Menu
Right-click on any GitHub repository link to open it directly in your preferred IDE.

## Development

### Prerequisites
- Node.js (v16.x or later)
- npm (v7 or later)

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Roland-Ganafa/online-ide-opener.git
   cd online-ide-opener
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build the extension:
   ```bash
   npm run build
   ```

### Testing
- Run unit tests: `npm test`
- Run E2E tests: `npm run test:e2e`
- Run tests in watch mode: `npm run test:watch`
- Generate coverage report: `npm run test:coverage`

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Built with ❤️ using modern web technologies
