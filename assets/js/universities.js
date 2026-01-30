// Universities Page Logic

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (!requireAuth()) return;

    const currentUser = localStorage.getItem('currentUser');
    const currentUID = localStorage.getItem('currentUID');
    let userData = null;

    const universityGrid = document.getElementById('universityGrid');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const lockBtn = document.getElementById('lockUniversitiesBtn');
    const backBtn = document.getElementById('backBtn');
    const filterBtn = document.getElementById('filterBtn');

    let currentFilter = 'all';
    let universities = [];
    let activeFilters = {
        countries: [],
        maxBudget: 1000000
    };

    // Initialize universities (async)
    async function init() {
        try {
            console.log('[Universities] Syncing remote state & initializing...');

            // 1. Prioritize remote data if UID exists
            if (currentUID) {
                const remoteData = await fetchUserRemote(currentUID);
                if (remoteData) {
                    userData = remoteData;
                    console.log('[Universities] Remote data loaded successfully');
                } else {
                    console.warn('[Universities] Remote fetch failed, falling back to local');
                }
            }

            // 2. Final fallback
            if (!userData) {
                userData = getCurrentUser();
            }

            if (!userData) {
                console.error('[Universities] No user data available, redirecting to auth');
                window.location.href = 'auth.html';
                return;
            }

            // Ensure critical arrays exist
            userData.shortlistedUniversities = userData.shortlistedUniversities || [];
            userData.lockedUniversities = userData.lockedUniversities || [];

            console.log(`[Universities] User data ready. Shortlisted: ${userData.shortlistedUniversities.length}, Locked: ${userData.lockedUniversities.length}`);

            // 3. Populate universities list
            universities = await generateUniversities(userData);

            if (!universities || universities.length === 0) {
                console.warn('[Universities] No universities generated');
                universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No universities found. Please check your profile settings.</p>';
                return;
            }

            console.log(`[Universities] Generated ${universities.length} universities`);

            // 4. Render UI
            displayUniversities();
            updateCounts();
            updateLockSection();
        } catch (error) {
            console.error('[Universities] CRITICAL ERROR in init():', error);
            universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-error); grid-column: 1/-1;">Failed to load universities. Please refresh the page.</p>';
        }
    }

    // Start initialization
    init();

    // Filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.category;
            displayUniversities();
        });
    });

    // Fetch real universities from backend API
    async function generateUniversities(userData, activeFilters = null) {
        // ALWAYS use Study Goals countries unless explicitly overridden by user
        // activeFilters.countries can be undefined (not set), empty array (user chose none), or populated
        const preferredCountries = activeFilters?.countries !== undefined
            ? activeFilters.countries  // User explicitly chose via filter (could be empty for "all")
            : (userData.profile.preferredCountries || []);  // Default to Study Goals

        const field = userData.profile.fieldOfStudy || '';

        try {
            const params = new URLSearchParams();

            // Only add country filters if we have countries to filter by
            if (preferredCountries.length > 0) {
                preferredCountries.forEach(country => {
                    if (country !== 'Other') params.append('country', country);
                });
            }

            if (field) params.append('field', field);

            const response = await fetch(`${API_BASE_URL}/universities?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch universities');

            const data = await response.json();

            if (!data.success || data.universities.length === 0) {
                // If no results, try without field filter
                const fallbackParams = new URLSearchParams();
                if (preferredCountries.length > 0) {
                    preferredCountries.forEach(country => {
                        if (country !== 'Other') fallbackParams.append('country', country);
                    });
                }

                const allResponse = await fetch(`${API_BASE_URL}/universities?${fallbackParams.toString()}`);
                const allData = await allResponse.json();
                if (allData.success) {
                    data.universities = allData.universities;
                }
            }

            let fetchedUniversities = data.universities.map(uni => ({
                id: uni.id,
                name: uni.name,
                location: uni.location,
                country: uni.country,
                tuition: uni.tuitionUSD,
                category: determineCategoryByRanking(uni.rankingQS),
                acceptanceRate: uni.acceptanceRate,
                cost: formatCost(uni.tuitionUSD),
                acceptanceChance: calculateAcceptanceChance(uni.acceptanceRate, userData),
                reason: `Excellent ${field || 'programs'} at ${uni.name}`,
                risks: (uni.acceptanceRate || '').replace('%', '') < 20 ? 'Highly competitive' : 'Standard requirements'
            }));

            if (activeFilters && activeFilters.maxBudget < 100000) {
                fetchedUniversities = fetchedUniversities.filter(uni => (uni.tuition || 0) <= activeFilters.maxBudget);
            }

            return fetchedUniversities;

        } catch (error) {
            console.error('Error fetching universities:', error);
            return []; // Return empty or mock
        }
    }

    function determineCategoryByRanking(qsRank) {
        if (!qsRank) return 'safe';
        if (qsRank <= 50) return 'dream';
        if (qsRank <= 200) return 'target';
        return 'safe';
    }

    function formatCost(tuitionUSD) {
        if (!tuitionUSD) return 'Variable';
        if (tuitionUSD === 0) return 'Free/Minimal';
        if (tuitionUSD < 10000) return `$${tuitionUSD.toLocaleString()}/year`;
        return `$${Math.round(tuitionUSD / 1000)}k/year`;
    }

    function calculateAcceptanceChance(acceptanceRate, userData) {
        const baseRate = parseInt((acceptanceRate || '50%').replace('%', ''));
        const boost = userData.profile.gpa ? 10 : 5;
        return Math.min(baseRate + boost, 95) + '%';
    }

    async function displayUniversities() {
        console.log('[Universities] Rendering grid. Shortlisted:', userData.shortlistedUniversities?.length, 'Locked:', userData.lockedUniversities?.length);

        universityGrid.innerHTML = '';
        let filteredUniversities = universities;

        // Ensure arrays exist before use
        userData.shortlistedUniversities = userData.shortlistedUniversities || [];
        userData.lockedUniversities = userData.lockedUniversities || [];

        if (currentFilter === 'shortlisted') {
            universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Loading shortlisted...</p>';

            const shortlistIds = userData.shortlistedUniversities;

            if (shortlistIds.length === 0) {
                universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No shortlisted universities.</p>';
                return;
            }

            // Fetch full university details from backend
            const promises = shortlistIds.map(id => fetch(`${API_BASE_URL}/universities/${id}`).then(res => res.json()));
            const results = await Promise.all(promises);

            filteredUniversities = results.filter(r => r.success).map(r => {
                const uni = r.university;
                return {
                    id: uni.id,
                    name: uni.name,
                    location: uni.location,
                    country: uni.country,
                    category: determineCategoryByRanking(uni.rankingQS),
                    acceptanceRate: uni.acceptanceRate,
                    cost: formatCost(uni.tuitionUSD),
                    acceptanceChance: calculateAcceptanceChance(uni.acceptanceRate, userData),
                    reason: `Excellent programs at ${uni.name}`,
                    risks: (uni.acceptanceRate || '').replace('%', '') < 20 ? 'Highly competitive' : 'Standard'
                };
            });
            universityGrid.innerHTML = '';
        } else if (currentFilter !== 'all') {
            filteredUniversities = universities.filter(uni => uni.category === currentFilter);
        }

        filteredUniversities.forEach(uni => {
            const isShortlisted = userData.shortlistedUniversities.includes(uni.id);
            const isLocked = userData.lockedUniversities.includes(uni.id);

            const card = document.createElement('div');
            card.className = 'university-card';
            if (isShortlisted) card.classList.add('shortlisted');
            if (isLocked) card.classList.add('locked');

            card.innerHTML = `
                <div class="category-badge ${uni.category}">${uni.category}</div>
                <div class="university-logo"><i class="fas fa-university"></i></div>
                <h3 class="university-name">${uni.name}</h3>
                <div class="university-location"><i class="fas fa-map-marker-alt"></i> ${uni.location}</div>
                <div class="university-stats">
                    <div class="stat-item"><div class="stat-label">Acceptance</div><div class="stat-value">${uni.acceptanceRate}</div></div>
                    <div class="stat-item"><div class="stat-label">Your Chance</div><div class="stat-value">${uni.acceptanceChance}</div></div>
                </div>
                <div class="university-actions">
                    <button class="btn btn-secondary btn-shortlist ${isShortlisted ? 'active' : ''}" data-id="${uni.id}">
                        <i class="fas fa-star"></i> ${isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </button>
                    <button class="btn btn-secondary btn-lock ${isLocked ? 'active' : ''}" data-id="${uni.id}">
                        <i class="fas ${isLocked ? 'fa-lock' : 'fa-lock-open'}"></i> ${isLocked ? 'Locked' : 'Lock'}
                    </button>
                </div>
            `;
            universityGrid.appendChild(card);
        });

        document.querySelectorAll('.btn-shortlist').forEach(btn => btn.addEventListener('click', e => toggleShortlist(e.currentTarget.dataset.id)));
        document.querySelectorAll('.btn-lock').forEach(btn => btn.addEventListener('click', e => toggleLock(e.currentTarget.dataset.id)));
    }

    async function toggleShortlist(uniId) {
        const isCurrentlyShortlisted = userData.shortlistedUniversities.includes(uniId);

        // Update local data immediately (local-first)
        if (!isCurrentlyShortlisted) {
            userData.shortlistedUniversities.push(uniId);
        } else {
            userData.shortlistedUniversities = userData.shortlistedUniversities.filter(id => id !== uniId);
        }

        // --- TASK SYNC START ---
        // Ensure "Shortlist Universities" task reflects actual state (>0 items)
        if (!userData.tasks) userData.tasks = [];
        let shortlistTask = userData.tasks.find(t => t.id === 'shortlist_task');

        // Create if missing
        if (!shortlistTask) {
            shortlistTask = {
                id: 'shortlist_task',
                title: 'Shortlist Universities',
                description: 'Shortlist 8-12 universities for your application',
                priority: 'high',
                completed: false
            };
            userData.tasks.push(shortlistTask);
        }

        // Set completed if ANY universities are shortlisted
        // This ensures un-shortlisting below 1 reversibly un-completes the task
        const hasUnis = userData.shortlistedUniversities.length > 0;
        if (shortlistTask.completed !== hasUnis) {
            shortlistTask.completed = hasUnis;
        }
        // --- TASK SYNC END ---

        // Save to localStorage (primary source of truth)
        await saveUserData(currentUser, userData);

        // Attempt remote sync only if user has UID (optional, non-blocking)
        if (currentUID) {
            const action = isCurrentlyShortlisted ? 'remove' : 'add';
            toggleUniversityRemote(uniId, action).catch(err =>
                console.warn('Remote sync failed (non-critical):', err)
            );
        }

        // Update UI
        displayUniversities();
        updateCounts();

        // Notify other pages (Dashboard) to update Profile Strength immediately
        window.dispatchEvent(new CustomEvent('profileUpdated', {
            detail: { shortlistCount: userData.shortlistedUniversities.length }
        }));
    }

    async function toggleLock(uniId) {
        const isCurrentlyLocked = userData.lockedUniversities.includes(uniId);

        if (isCurrentlyLocked && !confirm('Unlock this university?')) return;

        // Update local data immediately (local-first)
        if (!isCurrentlyLocked) {
            // Auto-shortlist when locking
            if (!userData.shortlistedUniversities.includes(uniId)) {
                userData.shortlistedUniversities.push(uniId);
            }
            userData.lockedUniversities.push(uniId);
        } else {
            userData.lockedUniversities = userData.lockedUniversities.filter(id => id !== uniId);
        }

        // Save to localStorage (primary source of truth)
        await saveUserData(currentUser, userData);

        // Attempt remote sync only if user has UID (optional, non-blocking)
        if (currentUID) {
            toggleUniversityRemote(uniId, 'add', !isCurrentlyLocked).catch(err =>
                console.warn('Remote sync failed (non-critical):', err)
            );
        }

        // Update UI
        displayUniversities();
        updateCounts();
        updateLockSection();
    }

    function updateCounts() {
        document.getElementById('allCount').textContent = universities.length;
        document.getElementById('dreamCount').textContent = universities.filter(u => u.category === 'dream').length;
        document.getElementById('targetCount').textContent = universities.filter(u => u.category === 'target').length;
        document.getElementById('safeCount').textContent = universities.filter(u => u.category === 'safe').length;
        document.getElementById('shortlistedCount').textContent = userData.shortlistedUniversities.length;
    }

    function updateLockSection() {
        const lockSection = document.getElementById('lockSection');
        if (!lockSection) return;

        // Defensive check: ensure userData exists
        if (!userData || !userData.lockedUniversities) {
            console.warn('[Universities] updateLockSection called but userData is not ready');
            lockSection.style.display = 'none';
            return;
        }

        lockSection.style.display = 'flex';
        const isInApplyStage = userData.lockedUniversities.length > 0;

        document.getElementById('lockUniversitiesBtn').classList.toggle('hidden', isInApplyStage);
        document.getElementById('lockMoreBtn').classList.toggle('hidden', !isInApplyStage);
        document.getElementById('continueGuidanceBtn').classList.toggle('hidden', !isInApplyStage);
    }


    // Lock universities button
    lockBtn.addEventListener('click', function () {
        console.log('Lock button clicked');
        console.log('Shortlisted:', userData.shortlistedUniversities);
        console.log('Locked:', userData.lockedUniversities);

        if (userData.shortlistedUniversities.length === 0) {
            alert('Please shortlist at least one university first.');
            return;
        }

        if (userData.lockedUniversities.length === 0) {
            alert('Please lock at least one university using the Lock button on individual cards before finalizing.');
            return;
        }

        const lockedCount = userData.lockedUniversities.length;

        if (confirm(`Finalize ${lockedCount} locked ${lockedCount === 1 ? 'university' : 'universities'} and proceed to application preparation?`)) {
            console.log('User confirmed, proceeding...');
            userData.stage = 'apply';

            // Generate application tasks
            generateApplicationTasks();

            saveUserData(currentUser, userData);
            alert('Universities finalized! Proceeding to application guidance.');
            window.location.href = 'guidance.html';
        }
    });

    // Lock More Universities button
    const lockMoreBtn = document.getElementById('lockMoreBtn');
    lockMoreBtn.addEventListener('click', function () {
        if (userData.lockedUniversities.length === 0) {
            alert('Please lock at least one university using the Lock button on individual cards before finalizing.');
            return;
        }

        const lockedCount = userData.lockedUniversities.length;

        if (confirm(`Finalize ${lockedCount} additional locked ${lockedCount === 1 ? 'university' : 'universities'}?`)) {
            saveUserData(currentUser, userData);
            alert('Universities finalized! Your application guidance has been updated.');
            window.location.href = 'guidance.html';
        }
    });

    // Continue to Application Guidance button
    const continueGuidanceBtn = document.getElementById('continueGuidanceBtn');
    continueGuidanceBtn.addEventListener('click', function () {
        window.location.href = 'guidance.html';
    });

    // Initial update of lock section
    updateLockSection();

    function generateApplicationTasks() {
        // Add tasks for application preparation
        const tasks = [
            {
                id: 'task_app_' + Date.now() + '_1',
                title: 'Complete Online Applications',
                description: 'Fill out application forms for all locked universities',
                priority: 'high',
                completed: false
            },
            {
                id: 'task_app_' + Date.now() + '_2',
                title: 'Request Transcripts',
                description: 'Order official transcripts from your institution',
                priority: 'high',
                completed: false
            },
            {
                id: 'task_app_' + Date.now() + '_3',
                title: 'Prepare Letters of Recommendation',
                description: 'Contact professors for recommendation letters',
                priority: 'high',
                completed: false
            }
        ];

        tasks.forEach(task => {
            if (!userData.tasks.some(t => t.title === task.title)) {
                userData.tasks.push(task);
            }
        });
    }

    // Back button
    backBtn.addEventListener('click', function () {
        window.location.href = 'dashboard.html';
    });

    // Filter Modal Logic
    const filterModal = document.getElementById('filterModal');
    const closeFilterBtn = document.getElementById('closeFilterBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const countryFiltersContainer = document.getElementById('countryFilters');
    const budgetRange = document.getElementById('budgetRange');
    const budgetValue = document.getElementById('budgetValue');



    // Open Filter Modal
    filterBtn.addEventListener('click', function () {
        populateCountryFilters();
        // Set current values
        budgetRange.value = activeFilters.maxBudget;
        updateBudgetValue(activeFilters.maxBudget);

        // Restore checked countries
        document.querySelectorAll('.checkbox-item input').forEach(input => {
            input.checked = activeFilters.countries.includes(input.value);
            if (input.checked) input.parentElement.classList.add('checked');
        });

        filterModal.classList.remove('hidden');
    });

    // Close Modal
    function closeFilterModal() {
        filterModal.classList.add('hidden');
    }

    closeFilterBtn.addEventListener('click', closeFilterModal);

    // Close on outside click
    filterModal.addEventListener('click', function (e) {
        if (e.target === filterModal) closeFilterModal();
    });

    // Budget Slider
    budgetRange.addEventListener('input', function () {
        updateBudgetValue(this.value);
    });

    function updateBudgetValue(value) {
        if (value >= 100000) {
            budgetValue.textContent = 'Any';
        } else {
            budgetValue.textContent = `$${parseInt(value).toLocaleString()}/year`;
        }
    }

    // Populate Countries (Profile + Top Destinations)
    function populateCountryFilters() {
        countryFiltersContainer.innerHTML = '';

        // Full list of supported countries as requested
        const targetCountries = [
            'United States', 'United Kingdom', 'Canada', 'Germany', 'Australia',
            'New Zealand', 'France', 'Ireland', 'Singapore', 'Netherlands',
            'United Arab Emirates', 'Italy', 'Spain', 'Russia', 'Georgia',
            'Austria', 'Malaysia', 'Japan', 'South Korea', 'Poland'
        ];

        // Helper to normalize country names for display vs value
        // value = what we expect in API/Data, label = display text
        // Assuming API returns 'United States', 'United Kingdom', etc.
        // If data has 'USA', we need to check. But standardizing on full names is safer if API matches.

        targetCountries.sort().forEach(country => {
            const label = document.createElement('label');
            label.className = 'checkbox-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = country;

            const span = document.createElement('span');
            span.textContent = country;

            label.appendChild(checkbox);
            label.appendChild(span);

            // Toggle checked class
            checkbox.addEventListener('change', function () {
                if (this.checked) this.parentElement.classList.add('checked');
                else this.parentElement.classList.remove('checked');
            });

            countryFiltersContainer.appendChild(label);
        });
    }

    // Enhance displayUniversities to handle loose country matching (e.g. USA vs United States)

    // Apply Filters
    // Apply Filters
    applyFiltersBtn.addEventListener('click', async function () {
        // Get selected countries
        const selectedCountries = Array.from(document.querySelectorAll('#countryFilters input:checked')).map(cb => cb.value);
        const maxBudget = parseInt(budgetRange.value);

        activeFilters = {
            countries: selectedCountries,
            maxBudget: maxBudget
        };

        // Show loading state
        universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Updating results...</p>';

        // FETCH NEW DATA based on filters
        universities = await generateUniversities(userData, activeFilters);

        // Update display
        displayUniversities();
        updateCounts(); // Update counts based on new set

        closeFilterModal();
    });

    // Reset Filters
    resetFiltersBtn.addEventListener('click', async function () {
        // Reset to Study Goals defaults (not empty/all)
        activeFilters = {
            countries: userData.profile.preferredCountries || [],
            maxBudget: 100000
        };

        // Restore to default (Profile prefs)
        universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Resetting to your Study Goals...</p>';
        universities = await generateUniversities(userData);
        budgetRange.value = 100000;
        updateBudgetValue(100000);

        // Uncheck all boxes (will be rechecked if needed when filter modal reopens)
        document.querySelectorAll('#countryFilters input').forEach(cb => {
            cb.checked = false;
            cb.parentElement.classList.remove('checked');
        });

        displayUniversities();
        updateCounts();
        closeFilterModal();
    });
});
