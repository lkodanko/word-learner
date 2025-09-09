// in script.js

function flipRow(guess) {
    const tiles = document.querySelector(`.row:nth-child(${currentRow + 1})`).children;
    const guessArray = guess.split('');
    const secretArray = secretWord.split('');
    const keyColors = {};
    const rowResults = []; // To store result for each tile ('correct', 'present', 'absent')

    // --- NEW LOGIC: Determine results before animating ---

    // First pass: Find 'correct' letters
    for (let i = 0; i < wordLength; i++) {
        if (guessArray[i] === secretArray[i]) {
            rowResults[i] = 'correct';
            keyColors[guessArray[i]] = 'correct';
            secretArray[i] = null; // Mark as used
        }
    }

    // Second pass: Find 'present' and 'absent' letters
    for (let i = 0; i < wordLength; i++) {
        if (rowResults[i]) continue; // Skip if already marked as 'correct'

        if (secretArray.includes(guessArray[i])) {
            rowResults[i] = 'present';
            if (keyColors[guessArray[i]] !== 'correct') {
                keyColors[guessArray[i]] = 'present';
            }
            secretArray[secretArray.indexOf(guessArray[i])] = null; // Mark as used
        } else {
            rowResults[i] = 'absent';
            if (!keyColors[guessArray[i]]) {
                keyColors[guessArray[i]] = 'absent';
            }
        }
    }

    // --- NEW LOGIC: Animate with correct timing ---

    let delay = 0;
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const result = rowResults[i];

        setTimeout(() => {
            // 1. Start the flip animation
            tile.classList.add('flip');
            
            // 2. Halfway through the flip, change the color
            setTimeout(() => {
                tile.classList.add(result);
            }, 300); // 300ms is half of the 0.6s animation

        }, delay);
        delay += 200; // Stagger the animation of each tile
    }

    // Check game end after the last tile has finished its animation
    setTimeout(() => {
        checkGameEnd(guess);
        updateKeyColors(keyColors);
    }, delay + 600);
}
