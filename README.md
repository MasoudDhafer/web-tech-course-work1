# Web Tech Course Work 1

A collection of interactive web applications including flashcards, quizzes, memory games, and leaderboards.

## How to Run the Code

### Prerequisites
- Python 3.x installed on your system

### Running the Application

1. Navigate to the project directory:
   ```bash
   cd /workspaces/web-tech-course-work1
   ```

2. Start the local HTTP server:
   ```bash
   python3 -m http.server 8000
   ```

3. Open your web browser and go to:
   ```
   http://localhost:8000
   ```

4. Click on the different HTML files to access various features:
   - `index.html` - Main landing page
   - `flashcards.html` - Flashcard application
   - `quiz.html` - Quiz application
   - `memory.html` - Memory game
   - `leaderboard.html` - Leaderboard display

### Alternative: Using Node.js (if available)

If you have Node.js installed, you can also use a simple HTTP server:

```bash
npx http-server -p 8000
```

Then access the same URL as above.

## Project Structure

- `index.html` - Main entry point
- `flashcards.html` - Flashcard functionality
- `quiz.html` - Quiz functionality
- `memory.html` - Memory game
- `leaderboard.html` - Leaderboard display
- `css/style.css` - Main stylesheet
- `js/` - JavaScript files for each component
  - `common.js` - Shared utilities
  - `data.js` - Data management
  - `utils.js` - Utility functions