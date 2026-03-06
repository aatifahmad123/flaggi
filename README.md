# Flaggi

Flaggi is a lightweight, responsive, two-page web application built with pure HTML, CSS, and Vanilla JavaScript. It features a retro/vintage aesthetic, utilizing custom color palettes and the "Space Grotesk" font.

## Features

- **Flag Directory (`index.html`)**: Browse through 254 country flags arranged alphabetically in a modern, responsive CSS grid.
- **Guessing Game (`game.html`)**: Test your geography knowledge! A random flag is displayed, and you must guess the country. 
   - **Autocomplete Suggestions**: Start typing to see matching country names.
   - **Auto-Submit**: Clicking a suggestion instantly validates your answer.
   - **Reveal Answer**: Stuck? Click the reveal button to see the correct answer.
   - **Confetti**: Enjoy a satisfying confetti animation upon guessing correctly!
- **Fully Responsive**: The layout and grid automatically adjust to look perfect on laptops, tablets, and mobile devices.
- **Optimized Performance**: Uses scaled-down `w640` images (640x426) instead of ultra-high-resolution files to ensure butter-smooth rendering and scrolling.

## Technologies Used

- **HTML5** (Semantic structure)
- **CSS3** (CSS Variables, Flexbox, CSS Grid, Media Queries)
- **Vanilla JavaScript** (DOM manipulation, event handling, game logic)
- **canvas-confetti** (External lightweight library for celebrations)

## Data Sources

- `codes.json`: Provides the mapping of country codes to full country names.
- Images and original codes proudly sourced from [flagpedia.net](https://flagpedia.net).

## Getting Started

Because Flaggi is completely static, no strict build step or backend server is required! 

1. Clone the repository:
   ```bash
   git clone https://github.com/aatifahmad123/flaggi.git
   ```
2. Navigate to the project folder:
   ```bash
   cd flaggi
   ```
3. Open `index.html` in your favorite web browser.
   *(Optional: Use a local development server like VSCode Live Server or `python3 -m http.server` for the best experience).*

## Author

Made by [Aatif Ahmad](https://aatifahmad123.dev/).
