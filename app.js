const state = {
    allCountries: [],
    sovereignCountries: [],
    currentList: [],
    isSovereignMode: false
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Setup header toggle
    const headerToggle = document.getElementById('header-toggle');
    const header = document.getElementById('main-header');
    if (headerToggle && header) {
        headerToggle.addEventListener('click', () => {
            header.classList.toggle('collapsed');
        });
    }

    Promise.all([
        fetch('codes.json').then(res => res.json()),
        fetch('codes_sovereign.json').then(res => res.json())
    ]).then(([allData, sovereignData]) => {

        state.allCountries = Object.keys(allData).map(code => ({
            code: code,
            name: allData[code]
        })).sort((a, b) => a.name.localeCompare(b.name));

        state.sovereignCountries = Object.keys(sovereignData).map(code => ({
            code: code,
            name: sovereignData[code]
        })).sort((a, b) => a.name.localeCompare(b.name));

        // Determine which page we are on
        if (document.getElementById('flag-grid')) {
            initFlagGrid();
        } else if (document.getElementById('guessing-flag')) {
            state.isSovereignMode = true; // Game mode defaults to sovereign only
            initGame();
        }
    }).catch(err => console.error('Error loading data:', err));
});

/* --- Page 1: Flag Grid --- */
function initFlagGrid() {
    const grid = document.getElementById('flag-grid');
    const filterAll = document.getElementById('filter-all');
    const filterSovereign = document.getElementById('filter-sovereign');

    if (filterAll && filterSovereign) {
        filterAll.addEventListener('click', () => {
            state.isSovereignMode = false;
            filterAll.classList.add('active');
            filterSovereign.classList.remove('active');
            renderGrid(grid);
        });

        filterSovereign.addEventListener('click', () => {
            state.isSovereignMode = true;
            filterSovereign.classList.add('active');
            filterAll.classList.remove('active');
            renderGrid(grid);
        });
    }

    renderGrid(grid);
}

function renderGrid(grid) {
    grid.innerHTML = ''; // Clear existing
    state.currentList = state.isSovereignMode ? state.sovereignCountries : state.allCountries;

    state.currentList.forEach(country => {
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
    state.currentList = state.isSovereignMode ? state.sovereignCountries : state.allCountries;
    const randomIndex = Math.floor(Math.random() * state.currentList.length);
    currentTargetCountry = state.currentList[randomIndex];

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
    state.currentList = state.isSovereignMode ? state.sovereignCountries : state.allCountries;
    const matches = state.currentList.filter(country =>
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
