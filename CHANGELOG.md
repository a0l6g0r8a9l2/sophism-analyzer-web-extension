# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-06-19

### Added
- Initial release of Sophism Analyzer
- AI-powered fallacy detection for YouTube videos using Google Gemini
- Visual timeline markers showing fallacy locations
- Real-time fallacy card notifications during playback
- Fallacy counter widget with detailed list view
- Support for multiple languages (English, Russian, Chinese Simplified, Spanish)
- Manifest V3 compliant browser extension
- TypeScript support with strict type checking
- Development mode with debug logging
- Retry logic and timeout handling for API requests

### Features
- **Analysis**: Detects logical fallacies, emotional manipulation, and rhetorical tricks
- **UI Components**: 
  - Analyze button in YouTube player controls
  - Timeline markers for fallacy locations
  - Real-time notification cards
  - Expandable fallacy list with severity indicators
  - Counter widget
- **Fallacy Detection**: Ad hominem, straw man, false dilemma, appeal to emotion, and more
- **User Control**: API key configuration through extension popup
- **SPA Support**: Seamless navigation between YouTube videos without page reload

### Technical
- Built with TypeScript and Vite
- Minimal dependencies (only @google/genai)
- Efficient content script injection
- Proper message passing between background and content scripts
- Clean type definitions and interfaces

## Future Roadmap

### Planned Features
- [ ] Caching of analysis results
- [ ] Browser persistence across sessions
- [ ] Video transcript analysis option
- [ ] Custom fallacy definitions
- [ ] Export analysis results
- [ ] Support for other video platforms
- [ ] Integration with fact-checking APIs
- [ ] Community-driven fallacy database

### Improvements
- [ ] Performance optimization for large videos
- [ ] Enhanced error messages and user guidance
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Settings panel with advanced options
