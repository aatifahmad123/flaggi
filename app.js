const state = {
    allCountries: [],
    sovereignCountries: [],
    currentList: [],
    isSovereignMode: false,
    streak: 0,
    globeInstance: null,
    geoJsonData: null,
    initialTargetTransform: null // Stores the exact zoom coordinates of the current country
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
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
        } else if (document.getElementById('map-container')) {
            state.isSovereignMode = true;
            initMapGameSetup();
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

        if (typeof updateStreak === 'function') updateStreak(true);

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
        if (typeof updateStreak === 'function') updateStreak(false);
        feedback.textContent = `Correct! It's ${currentTargetCountry.name}.`;
        feedback.className = 'feedback success';

        // Trigger confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#EBEBEB', '#FF6700', '#004E98', '#C0C0C0', '#3A6EA5'] // New theme colors
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
        if (typeof updateStreak === 'function') updateStreak(true);
        feedback.textContent = `Incorrect. Try again!`;
        feedback.className = 'feedback error';

        // Re-enable input focus for trying again
        input.value = '';
        input.focus();
    }
}

function updateStreak(reset = false) {
    if (reset) {
        state.streak = 0;
    } else {
        state.streak++;
    }
    const streakCounter = document.getElementById('streak-counter');
    if (streakCounter) {
        streakCounter.textContent = state.streak;

        // Apply color based on magnitude
        let color = 'grey'; // Default for 0-5
        if (state.streak >= 50) color = 'red';
        else if (state.streak >= 31) color = 'orange';
        else if (state.streak >= 21) color = 'purple';
        else if (state.streak >= 11) color = 'blue';
        else if (state.streak >= 6) color = 'green';

        streakCounter.style.color = color;
    }
}

/* --- Page 3: MapGuessr --- */
function initMapGameSetup() {
    const input = document.getElementById('country-input');
    const suggestionsList = document.getElementById('suggestions');
    const nextBtn = document.getElementById('next-btn');
    const revealBtn = document.getElementById('reveal-btn');

    // Fetch TopoJSON data
    fetch('world_topo.json')
        .then(res => res.json())
        .then(topology => {
            // Convert TopoJSON to GeoJSON array for D3
            state.geoJsonData = topojson.feature(topology, topology.objects.world);

            // Fetch Sovereign Codes
            fetch('codes_sovereign.json')
                .then(res => res.json())
                .then(data => {
                    state.sovereignCountries = Object.keys(data).map(code => ({ code, name: data[code] }));
                    initMap();
                    loadRandomCountryOnMap();
                })
                .catch(err => console.error('Error loading country codes:', err));
        })
        .catch(err => console.error('Error loading GeoJSON:', err));

    // Event Listeners (Same as FlagGuessr)
    input.addEventListener('input', handleInput);
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggestionsList) {
            suggestionsList.classList.remove('active');
        }
    });

    revealBtn.addEventListener('click', () => {
        const feedback = document.getElementById('feedback');
        feedback.textContent = `The answer is ${currentTargetCountry.name}.`;
        feedback.className = 'feedback error';

        if (typeof updateStreak === 'function') updateStreak(true);

        input.disabled = true;
        revealBtn.style.display = 'none';

        nextBtn.style.display = 'inline-block';
        setTimeout(() => nextBtn.classList.add('visible'), 10);
    });

    nextBtn.addEventListener('click', () => {
        loadRandomCountryOnMap();
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

function initMap() {
    const container = document.getElementById('map-container');
    const width = container.clientWidth;
    // Keep a standard 2:1 aspect ratio for world maps
    const height = width / 2;

    // Use a projection that looks good for a full world view
    state.projection = d3.geoNaturalEarth1()
        .fitSize([width, height], state.geoJsonData);

    state.pathGenerator = d3.geoPath().projection(state.projection);

    // Create SVG
    state.svg = d3.select('#map-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`);

    // Create a group that will hold the paths and receive zoom transformations
    state.svgGroup = state.svg.append('g');

    // Setup zoom behavior
    state.zoom = d3.zoom()
        .scaleExtent([1, 50]) // Zoom levels: 1x to 50x (so microstates are visible)
        .translateExtent([[0, 0], [width, height]])
        .on('zoom', (event) => {
            state.svgGroup.attr('transform', event.transform);
        });

    state.svg.call(state.zoom);

    // Draw generic paths
    state.mapPaths = state.svgGroup.selectAll('path')
        .data(state.geoJsonData.features)
        .enter()
        .append('path')
        .attr('d', state.pathGenerator)
        .attr('class', 'country-path');

    // Make map responsive based on container width
    window.addEventListener('resize', () => {
        if (!document.getElementById('map-container')) return;
        const newWidth = document.getElementById('map-container').clientWidth;
        const newHeight = newWidth / 2;
        
        state.svg.attr('viewBox', `0 0 ${newWidth} ${newHeight}`);
        state.projection.fitSize([newWidth, newHeight], state.geoJsonData);
        state.mapPaths.attr('d', state.pathGenerator);
        
        // Update zoom extent based on new dimensions
        state.zoom.translateExtent([[0, 0], [newWidth, newHeight]]);
    });

    // Setup reset zoom button
    const resetZoomBtn = document.getElementById('reset-zoom-btn');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            if (state.svg && state.zoom && state.initialTargetTransform) {
                state.svg.transition()
                    .duration(1000)
                    .call(state.zoom.transform, state.initialTargetTransform);
            }
        });
    }
}

function loadRandomCountryOnMap() {
    // Pick a random feature
    const randomIndex = Math.floor(Math.random() * state.geoJsonData.features.length);
    const selectedFeature = state.geoJsonData.features[randomIndex];

    // Find the matching currentTargetCountry
    currentTargetCountry = state.sovereignCountries.find(c => c.code === selectedFeature.properties.code);

    if (!currentTargetCountry) {
        // Fallback incase of matching error
        return loadRandomCountryOnMap();
    }

    // Update visuals - reset all paths to default class, highlight the selected one
    state.mapPaths.attr('class', feat => 
        feat === selectedFeature ? 'country-path highlight' : 'country-path'
    );

    // Auto-zoom to the selected country
    const bounds = state.pathGenerator.bounds(selectedFeature);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;

    const container = document.getElementById('map-container');
    const width = container.clientWidth;
    const height = width / 2;

    // Calculate how much space the country natively occupies
    const maxRatio = Math.max(dx / width, dy / height);
    
    // Determine dynamic padding based on country size
    let paddingFactor;
    const isMobile = window.innerWidth <= 768;

    if (maxRatio > 0.2) {
        // Large countries (e.g. Russia, Canada, Brazil) -> Need LOTS of padding so the user sees the continent context
        paddingFactor = isMobile ? 0.3 : 0.15;
    } else if (maxRatio > 0.02) {
        // Medium countries (e.g. France, Spain) -> Standard padding but still zoomed out somewhat
        paddingFactor = isMobile ? 0.5 : 0.25;
    } else {
        // Microstates (e.g. Vatican, Monaco) -> Need minimal padding to zoom in as tight as mathematically possible
        paddingFactor = isMobile ? 0.95 : 0.7;
    }

    // Determine absolute max zoom limit based on size
    // For normal countries 50x is fine, but microstates need up to 150x to even be visible
    const maxZoomLimit = maxRatio < 0.01 ? 150 : 50;
    
    // Calculate final scale
    const scale = Math.max(1, Math.min(maxZoomLimit, paddingFactor / maxRatio));
    
    // Calculate translation vector to center the country
    const translate = [width / 2 - scale * x, height / 2 - scale * y];
    
    // Save the exact transform so the reset button can snap back to it later
    state.initialTargetTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    if (state.svg && state.zoom) {
        state.svg.transition()
            .duration(1500)
            .call(state.zoom.transform, state.initialTargetTransform);
    }
}


