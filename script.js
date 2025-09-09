document.addEventListener('DOMContentLoaded', () => {

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('ServiceWorker registration successful: ', registration.scope))
                .catch(err => console.log('ServiceWorker registration failed: ', err));
        });
    }

    // --- DOM Elements ---
    const languageSelect = document.getElementById('language-select');
    const lengthSelect = document.getElementById('length-select');
    const newGameBtn = document.getElementById('new-game-btn');
    const gameBoard = document.getElementById('game-board');
    const keyboardContainer = document.getElementById('keyboard');
    const messageCenter = document.getElementById('message-center');

    // --- Game State ---
    let wordLength = 5;
    let currentRow = 0;
    let currentTile = 0;
    let secretWord = '';
    let guesses = [];
    let isGameOver = false;
    let currentLang = 'en';

    // --- UI Strings for Internationalization (i18n) ---
    const uiStrings = {
        en: { title: "Word Learner", newGame: "New Game", notInList: "Not in word list", win: "Awesome!", lose: "Nice try! The word was:" },
        es: { title: "Aprende Palabras", newGame: "Nuevo Juego", notInList: "No está en la lista", win: "¡Genial!", lose: "¡Buen intento! La palabra era:" },
        fr: { title: "Apprenti Mot", newGame: "Nouveau Jeu", notInList: "Pas dans la liste", win: "Formidable!", lose: "Bien essayé! Le mot était:" }
    };
    
    // --- Word Data ---
    const wordData = {
        en: WORDS_EN,
        es: WORDS_ES,
        fr: WORDS_FR
    };

    // --- Keyboards for each language ---
    const keyboards = {
        en: ["qwertyuiop", "asdfghjkl", "zxcvbnm"],
        es: ["qwertyuiop", "asdfghjklñ", "zxcvbnm"],
        fr: ["azertyuiop", "qsdfghjklm", "wxcvbn"]
    };

    // --- Functions ---

    function updateUIStrings() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = uiStrings[currentLang][key];
        });
    }

    function createBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;
        guesses = Array(6).fill(null).map(() => Array(wordLength).fill(''));
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.classList.add('row');
            row.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;
            for (let j = 0; j < wordLength; j++) {
                const tile = document.createElement('div');
                tile.classList.add('tile');
                tile.id = `tile-${i}-${j}`;
                row.appendChild(tile);
            }
            gameBoard.appendChild(row);
        }
    }

    function createKeyboard() {
        keyboardContainer.innerHTML = '';
        const keyboardLayout = keyboards[currentLang];
        keyboardLayout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('keyboard-row');
            row.split('').forEach(key => {
                const keyBtn = document.createElement('button');
                keyBtn.classList.add('key');
                keyBtn.textContent = key;
                keyBtn.dataset.key = key;
                rowDiv.appendChild(keyBtn);
            });
            keyboardContainer.appendChild(rowDiv);
        });

        // Add Enter and Backspace
        const lastRow = keyboardContainer.children[keyboardContainer.children.length - 1];
        const enterBtn = document.createElement('button');
        enterBtn.classList.add('key', 'large');
        enterBtn.textContent = 'Enter';
        enterBtn.dataset.key = 'Enter';
        lastRow.prepend(enterBtn);
        
        const backspaceBtn = document.createElement('button');
        backspaceBtn.classList.add('key', 'large');
        backspaceBtn.textContent = '⌫';
        backspaceBtn.dataset.key = 'Backspace';
        lastRow.appendChild(backspaceBtn);
    }
    
    function startNewGame() {
        isGameOver = false;
        currentRow = 0;
        currentTile = 0;
        currentLang = languageSelect.value;
        wordLength = parseInt(lengthSelect.value);

        // Select a random word
        const wordList = wordData[currentLang][wordLength];
        secretWord = wordList[Math.floor(Math.random() * wordList.length)];
        console.log(`Secret Word: ${secretWord}`); // For debugging

        updateUIStrings();
        createBoard();
        createKeyboard();
        updateKeyColors();
        messageCenter.textContent = '';
    }

    function handleKeyPress(key) {
        if (isGameOver) return;
        key = key.toLowerCase();

        if (key === 'backspace') {
            deleteLetter();
        } else if (key === 'enter') {
            submitGuess();
        } else if (/^[a-zñçàéèùâêîôûäëïöüÿ]$/.test(key) && currentTile < wordLength) {
            addLetter(key);
        }
    }

    function addLetter(letter) {
        const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
        tile.textContent = letter;
        tile.classList.add('filled');
        guesses[currentRow][currentTile] = letter;
        currentTile++;
    }

    function deleteLetter() {
        if (currentTile > 0) {
            currentTile--;
            const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
            tile.textContent = '';
            tile.classList.remove('filled');
            guesses[currentRow][currentTile] = '';
        }
    }

    function submitGuess() {
        if (currentTile < wordLength) return; // Not a full word

        const guess = guesses[currentRow].join('');
        
        // Simple check if word is in list (optional but good for real game)
        // For this kids version, we can allow any word to encourage trying.
        
        flipRow(guess);
    }

    function flipRow(guess) {
        const tiles = document.querySelector(`.row:nth-child(${currentRow + 1})`).children;
        const guessArray = guess.split('');
        const secretArray = secretWord.split('');
        const keyColors = {};

        // First pass: Check for correct letters (green)
        guessArray.forEach((letter, index) => {
            if (letter === secretArray[index]) {
                tiles[index].classList.add('correct');
                keyColors[letter] = 'correct';
                secretArray[index] = null; // Mark as used
            }
        });

        // Second pass: Check for present letters (yellow)
        guessArray.forEach((letter, index) => {
            if (tiles[index].classList.contains('correct')) return;

            if (secretArray.includes(letter)) {
                tiles[index].classList.add('present');
                if (keyColors[letter] !== 'correct') {
                    keyColors[letter] = 'present';
                }
                secretArray[secretArray.indexOf(letter)] = null; // Mark as used
            } else {
                tiles[index].classList.add('absent');
                 if (!keyColors[letter]) {
                    keyColors[letter] = 'absent';
                }
            }
        });
        
        // Apply flip animation
        let delay = 0;
        for (let tile of tiles) {
            setTimeout(() => {
                tile.classList.add('flip');
            }, delay);
            delay += 250;
        }
        
        setTimeout(() => checkGameEnd(guess), delay + 250);
        updateKeyColors(keyColors);
    }
    
    function updateKeyColors(newColors = {}) {
        const keys = keyboardContainer.querySelectorAll('.key');
        keys.forEach(key => {
            const letter = key.dataset.key;
            if (newColors[letter]) {
                const currentStatus = key.className;
                // Don't downgrade a key color (e.g., from correct to present)
                if (currentStatus.includes('correct')) return;
                if (currentStatus.includes('present') && newColors[letter] === 'absent') return;
                
                key.classList.remove('present', 'absent'); // Clear old status
                key.classList.add(newColors[letter]);
            }
        });
    }

    function checkGameEnd(guess) {
        if (guess === secretWord) {
            messageCenter.textContent = uiStrings[currentLang].win;
            messageCenter.style.color = 'var(--correct-bg)';
            isGameOver = true;
        } else if (currentRow === 5) {
            messageCenter.textContent = `${uiStrings[currentLang].lose} ${secretWord.toUpperCase()}`;
            messageCenter.style.color = '#333';
            isGameOver = true;
        } else {
            currentRow++;
            currentTile = 0;
        }
    }

    // --- Event Listeners ---
    newGameBtn.addEventListener('click', startNewGame);
    languageSelect.addEventListener('change', startNewGame);
    lengthSelect.addEventListener('change', startNewGame);

    keyboardContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('key')) {
            handleKeyPress(e.target.dataset.key);
        }
    });

    document.addEventListener('keydown', (e) => {
        handleKeyPress(e.key);
    });

    // --- Initial Load ---
    startNewGame();
});
