# WAExport

A browser extension for exporting WhatsApp Web conversations to HTML, Excel, CSV, or JSON.

## Overview

WAExport is a Manifest V3 extension compatible with Chrome and Firefox. It reads the currently open WhatsApp Web chat, extracts message data from the DOM, and generates a downloadable file in the selected format. The extension is designed for personal archival and data portability.

## Features

- Export the currently open chat to **HTML**, **Excel**, **CSV**, or **JSON**.
- Optional date range filtering (start and end date).
- Optional message limit (by number of messages or days).
- Two export modes: **Safe Mode** and **Quick Export**.
- Automatic scroll-and-harvest routine that loads older messages until inactivity is detected.
- Cross-browser support (Chrome and Firefox).

## Project Structure

```
.
├── manifest.json        # Extension manifest (MV3, Chrome + Firefox)
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic and message dispatch
├── content.js           # Content script: DOM harvesting and export logic
├── background.js        # Background service worker / scripts
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md
```

## Installation

### Chrome

1. Open `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the project folder.
4. Open [WhatsApp Web](https://web.whatsapp.com/) and click the extension icon.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select the `manifest.json` file.
4. Open [WhatsApp Web](https://web.whatsapp.com/) and click the extension icon.

> **Note:** For permanent installation on Firefox, the extension must be signed by Mozilla Add-ons (AMO). The `browser_specific_settings.gecko.id` field in `manifest.json` is required for signing.

## Usage

1. Open a chat in WhatsApp Web.
2. Click the WAExport icon in the browser toolbar.
3. Select the desired **file format** (HTML, Excel, CSV, or JSON).
4. Optionally set a **date range** and a **message limit**.
5. Choose the **export mode**.
6. Click **Export chat**.

The extension will scroll through the chat, collect messages, and download the generated file automatically.

### Export Modes

- **Safe Mode**: Slower, more conservative scrolling to reduce the risk of triggering WhatsApp Web's rate limits or anti-automation checks.
- **Quick Export**: Faster harvesting with a shorter polling interval. Recommended for smaller chats.

## How It Works

The content script (`content.js`) performs the following steps:

1. Locates the scrollable message container in the WhatsApp Web DOM.
2. Repeatedly scrolls to the top and clicks the "Load older messages" button when available.
3. Harvests message elements matching `[data-pre-plain-text]`, extracting metadata and message text.
4. Deduplicates messages using a `Map` keyed by metadata and cleaned text.
5. Stops when no new messages are added and the inactivity limit (10 seconds) is reached, or when the maximum runtime (10 minutes) is exceeded.
6. Serializes the collected messages and triggers a file download via a Blob URL.

The popup (`popup.js`) validates user input, checks that the active tab is WhatsApp Web, and sends the export configuration to the content script via `browser.tabs.sendMessage`.

## Permissions

| Permission                                    | Reason                                              |
| --------------------------------------------- | --------------------------------------------------- |
| `scripting`                                   | Inject and communicate with the content script.     |
| `activeTab`                                   | Access the currently active tab.                    |
| `downloads`                                   | Trigger file downloads.                             |
| `storage`                                     | Persist user preferences (reserved for future use). |
| `host_permissions` (`*://web.whatsapp.com/*`) | Restrict content script execution to WhatsApp Web.  |

## Browser Compatibility

| Browser | Manifest V3      | Background         |
| ------- | ---------------- | ------------------ |
| Chrome  | Supported        | `service_worker`   |
| Firefox | Supported (109+) | `scripts` fallback |

The `background` field includes both `service_worker` (Chrome) and `scripts` (Firefox) to ensure compatibility across browsers.

## Limitations

- **Media export is not implemented.** The media toggle in the popup is disabled.
- **"All chats" export is not implemented.** Only the currently open chat is supported.
- The extension relies on WhatsApp Web's DOM structure, which may change without notice and break the harvesting logic.
- Exporting very large chats may be slow or may hit the 10-minute runtime safety limit.

## Disclaimer

This extension is intended for personal use, such as archiving your own conversations. Users are responsible for complying with WhatsApp's Terms of Service and applicable data protection laws. The authors are not affiliated with WhatsApp or Meta.

## License

This project is provided as-is for personal and educational use. Add a license of your choice (e.g., MIT) before distributing.
