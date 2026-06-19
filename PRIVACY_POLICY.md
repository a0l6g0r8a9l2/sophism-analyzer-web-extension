# Privacy Policy

## Overview

Sophism Analyzer is a browser extension designed to analyze YouTube videos for logical fallacies and manipulative techniques using Google's Gemini AI. This privacy policy explains how we handle your data.

## Data Collection & Usage

### API Key
- Your Google Gemini API key is **stored locally** on your device using Chrome's `chrome.storage.local`
- The API key is **never** sent to our servers or any third parties
- You control when and where your API key is used
- You can delete the API key at any time through the extension popup

### Video Content
- Video content is analyzed only when you explicitly click the "Analyze Fallacies" button
- Video URLs and content are sent directly to Google Gemini API for analysis
- We do not store, cache, or process video content on our servers
- Analysis happens entirely through Google's API

### Analysis Results
- Analysis results are stored locally on your device in Chrome's local storage
- Results are associated with specific videos and remain on your device
- We do not collect or transmit analysis results to external servers

## Third-Party Services

### Google Gemini API
- This extension uses Google's Generative AI API (Gemini 3.5 Flash)
- Video URLs and content are sent to Google for analysis
- Please refer to [Google's Privacy Policy](https://policies.google.com/privacy) for details on how Google processes this data
- You are responsible for maintaining your Google API key credentials securely

## Permissions Explained

### `storage`
- Used to store your API key and language preference locally
- Data never leaves your device unless you explicitly request analysis

### `tabs`
- Used to detect which YouTube video is currently playing
- Allows the extension to function on YouTube.com

### `content_scripts`
- Injects the analysis UI directly into YouTube pages
- No data is collected or transmitted through content scripts

## Data Security

- All data is stored locally on your device
- The API key is not encrypted by the extension (Chrome's storage is used as-is)
- We recommend using environment-specific API keys with appropriate restrictions
- Do not share your API key with others

## Changes to This Policy

We may update this Privacy Policy occasionally. Changes will be reflected in this document with an updated date.

Last updated: 2024

## Contact

For questions about this privacy policy, please open an issue on the project's GitHub repository.
