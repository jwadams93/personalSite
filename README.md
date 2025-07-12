# Jake - Terminal Personal Website

A terminal-style personal website built with React and TypeScript.

## Features

- **Terminal Interface**: Authentic terminal window appearance with green text and blinking cursor
- **Typing Animation**: Matrix-style character-by-character typing effect for the introduction
- **Interactive Commands**: User can type commands and get responses
- **Draggable Terminal**: Users can drag the terminal window around the screen
- **Dynamic User Names**: Terminal remembers and displays user names
- **Responsive Design**: Works on desktop and mobile devices
- **ASCII Art**: Includes smile and thumbs up ASCII art in the introduction

## Available Commands

- `LINKEDIN` - Opens Jake's LinkedIn profile
- `MESSAGE -name <name> -message <message>` - Send Jake a message
- `WHOAMI` - Show current user name
- `SETNAME <name>` - Set your user name
- `HELP` - Shows available commands
- `CLEAR` - Clears the terminal

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personalSite
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Technologies Used

- React 18
- TypeScript
- Vite
- CSS3 with advanced animations

## Project Structure

```
src/
├── App.tsx          # Main terminal component
├── App.css          # Terminal styling
├── main.tsx         # Application entry point
└── index.css        # Global styles
```

## License

This project is open source and available under the MIT License.
