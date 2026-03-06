// Global state
let codesData = {};
let allCountriesList = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    fetch('codes.json')
        .then(response => response.json())
        .then(data => {
            codesData = data;

            // Create an array sorted alphabetically by country name
            allCountriesList = Object.keys(data).map(code => ({
                code: code,
                name: data[code]
            })).sort((a, b) => a.name.localeCompare(b.name));

            // Determine which page we are on
            if (document.getElementById('flag-grid')) {
                initFlagGrid();
            } else if (document.getElementById('guessing-flag')) {
                initGame();
            }
        })
        .catch(err => console.error('Error loading codes.json:', err));
});

/* --- Page 1: Flag Grid --- */
function initFlagGrid() {
    const grid = document.getElementById('flag-grid');
    grid.innerHTML = ''; // Clear loading state if any

    allCountriesList.forEach(country => {
        const card = document.createElement('div');
        card.className = 'flag-card';

        const img = document.createElement('img');
        img.src = `w640/${country.code}.png`;
        img.alt = `Flag of ${country.name}`;
        img.loading = 'lazy'; // Improve performance

        const title = document.createElement('h3');
        title.textContent = country.name;

        card.appendChild(img);
        card.appendChild(title);
        grid.appendChild(card);
    });
}

/* --- Page 2: Guessing Game --- */
let currentTargetCountry = null;

function initGame() {
    const input = document.getElementById('country-input');
    const suggestionsList = document.getElementById('suggestions');
    const nextBtn = document.getElementById('next-btn');
    const revealBtn = document.getElementById('reveal-btn');

    // Load first flag
    loadRandomFlag();

    // Event Listeners
    input.addEventListener('input', handleInput);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggestionsList) {
            suggestionsList.classList.remove('active');
        }
    });

    revealBtn.addEventListener('click', () => {
        const feedback = document.getElementById('feedback');
        feedback.textContent = `The answer is ${currentTargetCountry.name}.`;
        feedback.className = 'feedback error'; // using error class for the red color

        input.disabled = true;
        revealBtn.style.display = 'none';

        nextBtn.style.display = 'inline-block';
        setTimeout(() => {
            nextBtn.classList.add('visible');
        }, 10);
    });

    nextBtn.addEventListener('click', () => {
        loadRandomFlag();
        // Reset UI
        input.value = '';
        input.disabled = false;

        revealBtn.style.display = 'block';

        nextBtn.style.display = 'none';
        nextBtn.classList.remove('visible');
        const feedback = document.getElementById('feedback');
        feedback.textContent = '';
        feedback.className = 'feedback';
    });
}

function loadRandomFlag() {
    const randomIndex = Math.floor(Math.random() * allCountriesList.length);
    currentTargetCountry = allCountriesList[randomIndex];

    const img = document.getElementById('guessing-flag');
    img.src = `w640/${currentTargetCountry.code}.png`;
}

function handleInput(e) {
    const value = e.target.value.toLowerCase().trim();
    const suggestionsList = document.getElementById('suggestions');

    if (value.length === 0) {
        suggestionsList.classList.remove('active');
        return;
    }

    // Filter countries matching input
    const matches = allCountriesList.filter(country =>
        country.name.toLowerCase().includes(value)
    ).slice(0, 5); // Limit to top 5 suggestions

    // Render suggestions
    suggestionsList.innerHTML = '';

    if (matches.length > 0) {
        matches.forEach(match => {
            const li = document.createElement('li');
            li.textContent = match.name;
            li.addEventListener('click', () => selectSuggestion(match.name));
            suggestionsList.appendChild(li);
        });
        suggestionsList.classList.add('active');
    } else {
        suggestionsList.classList.remove('active');
    }
}

function selectSuggestion(countryName) {
    const input = document.getElementById('country-input');
    const suggestionsList = document.getElementById('suggestions');

    input.value = countryName;
    suggestionsList.classList.remove('active');

    // Automatically check answer
    checkAnswer();
}

function checkAnswer() {
    const input = document.getElementById('country-input');
    const feedback = document.getElementById('feedback');
    const nextBtn = document.getElementById('next-btn');

    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = currentTargetCountry.name.toLowerCase();

    if (userAnswer === correctAnswer) {
        feedback.textContent = `Correct! It's ${currentTargetCountry.name}.`;
        feedback.className = 'feedback success';

        // Trigger confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F4EBD0', '#C1121F', '#3A3A3A', '#FFF8E7'] // Theme colors
            });
        }

        // Update UI
        input.disabled = true;
        document.getElementById('reveal-btn').style.display = 'none';

        nextBtn.style.display = 'inline-block';
        setTimeout(() => {
            nextBtn.classList.add('visible');
        }, 10);
    } else {
        feedback.textContent = `Incorrect. Try again!`;
        feedback.className = 'feedback error';

        // Re-enable input focus for trying again
        input.value = '';
        input.focus();
    }
}
