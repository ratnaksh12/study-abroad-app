// Universities Page Logic

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication and onboarding
    if (!requireAuth()) return;
    if (!checkOnboardingComplete()) return;

    const currentUser = localStorage.getItem('currentUser');
    const userData = getUserData(currentUser);

    if (userData && userData.shortlistedUniversities) {
        console.log(`DEBUG: Loaded UserData. Shortlist Length: ${userData.shortlistedUniversities.length}`, userData.shortlistedUniversities);
    } else {
        console.warn('DEBUG: UserData is missing or shortlist empty');
    }

    const universityGrid = document.getElementById('universityGrid');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const lockBtn = document.getElementById('lockUniversitiesBtn');
    const backBtn = document.getElementById('backBtn');
    const filterBtn = document.getElementById('filterBtn');

    // Budget helper
    function getBudgetMax(rangeString) {
        if (!rangeString) return 1000000; // Unlimited
        if (rangeString.includes('+')) return 1000000;
        const parts = rangeString.split('-');
        return parseInt(parts[1]) || 1000000;
    }

    let currentFilter = 'all';
    let universities = [];
    let activeFilters = {
        countries: [],
        maxBudget: 1000000
    };

    // Initialize universities
    if (!userData.shortlistedUniversities) {
        userData.shortlistedUniversities = [];
    }
    if (!userData.lockedUniversities) {
        userData.lockedUniversities = [];
    }

    // Clean shortlist on load (remove duplicates)
    const originalShortlistLength = userData.shortlistedUniversities.length;
    userData.shortlistedUniversities = cleanShortlist(userData.shortlistedUniversities);
    const cleanedShortlistLength = userData.shortlistedUniversities.length;

    // Check if field changed and shortlist was cleared
    const currentField = userData.profile.fieldOfStudy;
    const shortlistField = userData.shortlistField;

    if (shortlistField && currentField && shortlistField !== currentField && originalShortlistLength > 0) {
        // Show notification that shortlist was cleared
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 80px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; padding: 1rem 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 9999; animation: slideDown 0.3s ease;';
        notification.innerHTML = `<i class="fas fa-info-circle"></i> Your shortlist was cleared because you changed your field from "${shortlistField}" to "${currentField}"`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);

        userData.shortlistField = currentField;
    }

    // Only log if duplicates were found, but DON'T save here
    // Saving here would trigger field change detection!
    if (originalShortlistLength !== cleanedShortlistLength) {
        console.log(`Removed ${originalShortlistLength - cleanedShortlistLength} duplicate(s) from shortlist`);
    }

    // Initialize universities (async)
    async function init() {
        console.log('[INIT] Starting university initialization...');
        universities = await generateUniversities(userData);
        console.log('[INIT] Universities loaded:', universities.length, universities);
        displayUniversities();
        updateCounts();
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
        // Use active filters if provided, else fallback to profile prefs
        const preferredCountries = activeFilters && activeFilters.countries.length > 0
            ? activeFilters.countries
            : (userData.profile.preferredCountries || []);

        const field = userData.profile.fieldOfStudy || '';

        try {
            // Build query parameters
            const params = new URLSearchParams();

            // Add countries to search
            // If activeFilters are used, we trust that list. 
            // If falling back to profile, we exclude 'Other'.
            if (preferredCountries.length > 0) {
                preferredCountries.forEach(country => {
                    if (country !== 'Other') {
                        params.append('country', country);
                    }
                });
            }

            // Add field of study
            if (field) {
                params.append('field', field);
            }

            // If no filters at all, show a helpful message and load top universities
            const hasFilters = preferredCountries.length > 0 || field;

            // Fetch from API
            const response = await fetch(`https://study-abroad-app-1vfr.onrender.com/api/universities?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch universities');
            }

            const data = await response.json();
            console.log('[API] Response from backend:', data);
            console.log('[API] Has filters:', hasFilters, 'Field:', field, 'Countries:', preferredCountries);

            if (!data.success || data.universities.length === 0) {
                console.log('[API] No universities in response, loading fallback...');

                // Show appropriate message based on whether user has filters
                if (!hasFilters) {
                    universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Complete your profile (Field of Study & Preferred Countries) to see personalized university recommendations. Showing all universities below.</p>';
                } else {
                    // User has filters but they don't match - could be typo or no programs available
                    universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No exact matches found for your filters. Showing all available universities - you can filter them below.</p>';
                }

                // ALWAYS load all universities as fallback, regardless of filter state
                console.log('[API] Loading ALL universities as fallback');
                const allResponse = await fetch(`https://study-abroad-app-1vfr.onrender.com/api/universities`);
                const allData = await allResponse.json();
                console.log('[API] Fallback response:', allData);

                if (allData.success && allData.universities.length > 0) {
                    // Use all universities instead
                    data.success = true;
                    data.universities = allData.universities;
                    console.log('[API] Fallback successful, loaded', allData.universities.length, 'universities');
                } else {
                    console.error('[API] Fallback FAILED - no universities available at all');
                    universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Unable to load universities. Please check that the backend server is running.</p>';
                    return [];
                }
            }

            // Transform API data to match frontend format
            // If activeFilters has maxBudget, we filter here as well? 
            // Ideally we filter mainly on client for budget unless backend supports it.
            // Backend doesn't support budget query yet, so we filter below.

            let fetchedUniversities = data.universities.map(uni => ({
                id: uni.id,
                name: uni.name,
                location: uni.location,
                country: uni.country,
                tuition: uni.stats.tuitionUSD, // Add raw tuition for filtering
                category: determineCategoryByRanking(uni.ranking.qs),
                acceptanceRate: uni.stats.acceptanceRate,
                cost: formatCost(uni.stats.tuitionUSD),
                acceptanceChance: calculateAcceptanceChance(uni.stats.acceptanceRate, userData),
                reason: `Excellent ${field || 'programs'} at ${uni.name}`,
                risks: uni.stats.acceptanceRate.replace('%', '') < 20 ? 'Highly competitive' : 'Standard requirements'
            }));

            // Apply budget filter if present
            if (activeFilters && activeFilters.maxBudget < 100000) {
                fetchedUniversities = fetchedUniversities.filter(uni => (uni.tuition || 0) <= activeFilters.maxBudget);

                if (fetchedUniversities.length === 0) {
                    universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No universities found within your budget. Try strictly filtering by country only or increasing budget.</p>';
                }
            }

            return fetchedUniversities;

        } catch (error) {
            console.error('Error fetching universities:', error);

            // EMERGENCY FALLBACK: If API fails, return mock data to prevent empty screen
            // This ensures the user sees something even if the backend is unreachable or data is bad
            console.warn('[API] Using emergency mock data due to error');
            return [
                {
                    id: 'mock_1',
                    name: 'Stanford University (Backup)',
                    location: 'California, US',
                    country: 'United States',
                    category: 'dream',
                    acceptanceRate: '4%',
                    cost: '$70k/year',
                    acceptanceChance: '15%',
                    reason: 'Top tier research university',
                    risks: 'Highly competitive'
                },
                {
                    id: 'mock_2',
                    name: 'MIT (Backup)',
                    location: 'Massachusetts, US',
                    country: 'United States',
                    category: 'dream',
                    acceptanceRate: '7%',
                    cost: '$73k/year',
                    acceptanceChance: '18%',
                    reason: 'World class engineering',
                    risks: 'Highly competitive'
                },
                {
                    id: 'mock_3',
                    name: 'Harvard University (Backup)',
                    location: 'Massachusetts, US',
                    country: 'United States',
                    category: 'dream',
                    acceptanceRate: '5%',
                    cost: '$72k/year',
                    acceptanceChance: '16%',
                    reason: 'Ivy League excellence',
                    risks: 'Highly competitive'
                }
            ];
        }
    }

    // ... (Keep helper functions determineCategoryByRanking, formatCost, calculateAcceptanceChance)

    // ...

    // Apply Filters

    // Helper function to determine category based on QS ranking
    function determineCategoryByRanking(qsRank) {
        if (!qsRank) return 'safe';
        if (qsRank <= 50) return 'dream';
        if (qsRank <= 200) return 'target';
        return 'safe';
    }

    // Helper function to format cost
    function formatCost(tuitionUSD) {
        if (tuitionUSD === 0) return 'Free/Minimal';
        if (tuitionUSD < 10000) return `$${tuitionUSD.toLocaleString()}/year`;
        return `$${Math.round(tuitionUSD / 1000)}k/year`;
    }

    // Helper function to calculate acceptance chance
    function calculateAcceptanceChance(acceptanceRate, userData) {
        const baseRate = parseInt(acceptanceRate.replace('%', ''));
        // Add 10-15% boost based on profile strength
        const boost = userData.profile.gpa ? 10 : 5;
        return Math.min(baseRate + boost, 95) + '%';
    }

    async function displayUniversities() {
        console.log('[DISPLAY] Starting displayUniversities, current filter:', currentFilter, 'Universities array length:', universities.length);
        universityGrid.innerHTML = '';

        let filteredUniversities = universities;

        // Special handling for shortlisted filter - fetch by ID from API
        if (currentFilter === 'shortlisted' && userData.shortlistedUniversities.length > 0) {
            console.log('[Shortlist] Fetching shortlisted universities by ID:', userData.shortlistedUniversities);
            universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Loading shortlisted universities...</p>';

            try {
                // Fetch each shortlisted university by ID
                const promises = userData.shortlistedUniversities.map(id => {
                    console.log(`[Shortlist] Fetching university with ID: ${id}`);
                    return fetch(`https://study-abroad-app-1vfr.onrender.com/api/universities/${id}`)
                        .then(res => res.json())
                        .then(data => {
                            console.log(`[Shortlist] API response for ${id}:`, data);
                            return data.success ? data.university : null;
                        })
                        .catch(err => {
                            console.error(`[Shortlist] Error fetching ${id}:`, err);
                            return null;
                        });
                });

                const results = await Promise.all(promises);
                console.log('[Shortlist] All fetch results:', results);

                filteredUniversities = results.filter(uni => uni !== null).map(uni => ({
                    id: uni.id,
                    name: uni.name,
                    location: uni.location,
                    country: uni.country,
                    category: determineCategoryByRanking(uni.ranking.qs),
                    acceptanceRate: uni.stats.acceptanceRate,
                    cost: formatCost(uni.stats.tuitionUSD),
                    acceptanceChance: calculateAcceptanceChance(uni.stats.acceptanceRate, userData),
                    reason: `Excellent programs at ${uni.name}`,
                    risks: uni.stats.acceptanceRate.replace('%', '') < 20 ? 'Highly competitive' : 'Standard requirements'
                }));

                console.log('[Shortlist] Filtered universities to display:', filteredUniversities);
            } catch (error) {
                console.error('[Shortlist] Error fetching shortlisted universities:', error);
                universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Error loading shortlisted universities.</p>';
                return;
            }

            universityGrid.innerHTML = ''; // Clear loading message
        } else if (currentFilter === 'shortlisted' && userData.shortlistedUniversities.length === 0) {
            filteredUniversities = [];
        } else if (currentFilter !== 'all' && currentFilter !== 'shortlisted') {
            filteredUniversities = universities.filter(uni => uni.category === currentFilter);
        }

        // Apply Active Filters (Country & Budget)
        if (activeFilters.countries.length > 0) {
            filteredUniversities = filteredUniversities.filter(uni => {
                // Check if uni.country matches ANY of the activeFilters.countries (handling case/aliases)
                return activeFilters.countries.some(filterCountry => {
                    const c1 = uni.country.trim().toLowerCase();
                    const c2 = filterCountry.trim().toLowerCase();

                    if (c1 === c2) return true;

                    // Handle basic aliases
                    if ((c1 === 'usa' && c2 === 'united states') || (c1 === 'united states' && c2 === 'usa')) return true;
                    if ((c1 === 'uk' && c2 === 'united kingdom') || (c1 === 'united kingdom' && c2 === 'uk')) return true;
                    if ((c1 === 'uae' && c2 === 'united arab emirates') || (c1 === 'united arab emirates' && c2 === 'uae')) return true;

                    return false;
                });
            });
        }

        if (activeFilters.maxBudget < 100000) {
            filteredUniversities = filteredUniversities.filter(uni => {
                // Return true if tuition is undefined (e.g. data missing) or below max
                // Check if tuition exists, if not, try to parse? No, we added it.
                return (uni.tuition || 0) <= activeFilters.maxBudget;
            });
        }

        if (filteredUniversities.length === 0) {
            universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No universities found in this category.</p>';
            return;
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
                <div class="university-logo">
                    <i class="fas fa-university"></i>
                </div>
                <h3 class="university-name">${uni.name}</h3>
                <div class="university-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${uni.location}
                </div>
                <div class="university-stats">
                    <div class="stat-item">
                        <div class="stat-label">Acceptance Rate</div>
                        <div class="stat-value">${uni.acceptanceRate}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Your Chance</div>
                        <div class="stat-value">${uni.acceptanceChance}</div>
                    </div>
                </div>
                <div class="university-stats" style="margin-top: -10px; padding-top: 0;">
                    <div class="stat-item" style="grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: var(--spacing-sm);">
                        <div class="stat-label" style="margin: 0;">Est. Cost</div>
                        <div class="stat-value" style="font-size: var(--font-size-base);">${uni.cost}</div>
                    </div>
                </div>
                <div class="university-reason">
                    <div class="university-reason-title">Why this matches you:</div>
                    <div class="university-reason-text">${uni.reason}</div>
                </div>
                <div class="university-actions">
                    <button class="btn btn-secondary btn-shortlist ${isShortlisted ? 'active' : ''} ripple" data-id="${uni.id}">
                        <i class="fas ${isShortlisted ? 'fa-star' : 'fa-star'}"></i>
                        ${isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </button>
                    <button class="btn btn-secondary btn-lock ${isLocked ? 'active' : ''} ripple" data-id="${uni.id}">
                        <i class="fas ${isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                        ${isLocked ? 'Locked' : 'Lock'}
                    </button>
                </div>
            `;

            universityGrid.appendChild(card);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.btn-shortlist').forEach(btn => {
            btn.addEventListener('click', function () {
                const uniId = this.dataset.id;
                toggleShortlist(uniId);
            });
        });

        document.querySelectorAll('.btn-lock').forEach(btn => {
            btn.addEventListener('click', function () {
                const uniId = this.dataset.id;
                toggleLock(uniId);
            });
        });
    }

    function toggleShortlist(uniId) {
        const index = userData.shortlistedUniversities.indexOf(uniId);
        if (index > -1) {
            // REMOVING from shortlist
            userData.shortlistedUniversities.splice(index, 1);

            // If dropping below 3, mark task as incomplete
            if (userData.shortlistedUniversities.length < 3) {
                const shortlistTask = userData.tasks ? userData.tasks.find(t => t.id === 'shortlist_task') : null;
                if (shortlistTask && shortlistTask.completed) {
                    updateTaskCompletion(userData, 'shortlist_task', false);
                }
            }
        } else {
            // ADDING to shortlist
            userData.shortlistedUniversities.push(uniId);

            // Auto-complete shortlist task when reaching 3+ universities
            if (userData.shortlistedUniversities.length >= 3) {
                const shortlistTask = userData.tasks ? userData.tasks.find(t => t.id === 'shortlist_task') : null;
                if (shortlistTask && !shortlistTask.completed) {
                    updateTaskCompletion(userData, 'shortlist_task', true);

                    // Show notification
                    const toast = document.createElement('div');
                    toast.innerHTML = '<i class="fas fa-check-circle"></i> Task completed: Shortlist Universities';
                    toast.style.cssText = `
                        position: fixed; top: 80px; right: 20px;
                        background: var(--success-color); color: white;
                        padding: 12px 24px; border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        animation: slideDown 0.3s ease; z-index: 10000;
                        font-weight: 500;
                    `;
                    document.body.appendChild(toast);
                    setTimeout(() => {
                        toast.style.animation = 'slideUp 0.3s ease';
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                }
            }
        }
        saveUserData(currentUser, userData);
        displayUniversities();
        updateCounts();
    }

    function toggleLock(uniId) {
        // Add to shortlist if not already
        if (!userData.shortlistedUniversities.includes(uniId)) {
            userData.shortlistedUniversities.push(uniId);
        }

        const index = userData.lockedUniversities.indexOf(uniId);
        if (index > -1) {
            // UNLOCKING
            if (confirm('Unlocking this university will revert your application stage. Are you sure?')) {
                userData.lockedUniversities.splice(index, 1);

                // If no locked universities remain, revert stage and mark task incomplete
                if (userData.lockedUniversities.length === 0) {
                    userData.stage = 'finalize';

                    // Mark task as incomplete
                    const lockTask = userData.tasks ? userData.tasks.find(t => t.id === 'lock_final_list') : null;
                    if (lockTask) {
                        updateTaskCompletion(userData, 'lock_final_list', false);

                        // Show notification
                        const toast = document.createElement('div');
                        toast.innerHTML = '<i class="fas fa-info-circle"></i> Task moved back to To-Do: Lock Final University List';
                        toast.style.cssText = `
                            position: fixed; top: 80px; right: 20px;
                            background: #f59e0b; color: white;
                            padding: 12px 24px; border-radius: 12px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                            animation: slideDown 0.3s ease; z-index: 10000;
                            font-weight: 500;
                        `;
                        document.body.appendChild(toast);
                        setTimeout(() => {
                            toast.style.animation = 'slideUp 0.3s ease';
                            setTimeout(() => toast.remove(), 300);
                        }, 3000);
                    }
                }
            } else {
                // User cancelled - don't do anything
                return;
            }
        } else {
            userData.lockedUniversities.push(uniId);

            // Auto-complete "Lock Final University List" task when 1-3 universities are locked
            if (userData.lockedUniversities.length >= 1 && userData.lockedUniversities.length <= 3) {
                const lockTask = userData.tasks ? userData.tasks.find(t => t.id === 'lock_final_list') : null;
                if (lockTask && !lockTask.completed) {
                    updateTaskCompletion(userData, 'lock_final_list', true);

                    // Show success notification
                    const toast = document.createElement('div');
                    toast.textContent = `✓ Task completed: Lock ${userData.lockedUniversities.length} ${userData.lockedUniversities.length === 1 ? 'University' : 'Universities'}`;
                    toast.style.cssText = `
                        position: fixed; top: 80px; right: 20px;
                        background: var(--success-color); color: white;
                        padding: 12px 24px; border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        animation: slideDown 0.3s ease; z-index: 10000;
                        font-weight: 500;
                    `;
                    document.body.appendChild(toast);
                    setTimeout(() => {
                        toast.style.animation = 'slideUp 0.3s ease';
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                }
            }
        }

        saveUserData(currentUser, userData);
        displayUniversities();
        updateCounts();
        updateLockSection();
    }

    function updateCounts() {
        document.getElementById('allCount').textContent = universities.length;
        document.getElementById('dreamCount').textContent = universities.filter(u => u.category.toLowerCase() === 'dream').length;
        document.getElementById('targetCount').textContent = universities.filter(u => u.category.toLowerCase() === 'target').length;
        document.getElementById('safeCount').textContent = universities.filter(u => u.category.toLowerCase() === 'safe').length;

        // Use actual shortlist count from userData (includes all shortlisted, even from other countries)
        document.getElementById('shortlistedCount').textContent = userData.shortlistedUniversities ? userData.shortlistedUniversities.length : 0;
    }

    function updateLockSection() {
        // Always show the "Ready to Finalize" section
        const lockSection = document.getElementById('lockSection');
        lockSection.style.display = 'flex';

        // Get button elements
        const lockBtn = document.getElementById('lockUniversitiesBtn');
        const lockMoreBtn = document.getElementById('lockMoreBtn');
        const continueBtn = document.getElementById('continueGuidanceBtn');
        const title = document.getElementById('lockSectionTitle');
        const description = document.getElementById('lockSectionDescription');

        // Check if user is in apply stage (has already locked universities)
        const isInApplyStage = userData.stage === 'apply' && userData.lockedUniversities.length > 0;

        if (isInApplyStage) {
            // Show two buttons for users who have already locked universities
            lockBtn.classList.add('hidden');
            lockMoreBtn.classList.remove('hidden');
            continueBtn.classList.remove('hidden');

            title.textContent = 'Manage Your Applications';
            description.textContent = `${userData.lockedUniversities.length} ${userData.lockedUniversities.length === 1 ? 'university' : 'universities'} finalized`;
        } else {
            // Show single button for first-time lockers
            lockBtn.classList.remove('hidden');
            lockMoreBtn.classList.add('hidden');
            continueBtn.classList.add('hidden');

            title.textContent = 'Ready to finalize?';
            description.textContent = 'Lock at least one university to proceed to application preparation';
        }
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
        activeFilters = {
            countries: [],
            maxBudget: 100000
        };

        // Restore to default (Profile prefs)
        universityGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">Reseting results...</p>';
        universities = await generateUniversities(userData);
        budgetRange.value = 100000;
        updateBudgetValue(100000);

        // Uncheck all boxes
        document.querySelectorAll('#countryFilters input').forEach(cb => {
            cb.checked = false;
            cb.parentElement.classList.remove('checked');
        });

        displayUniversities();
        updateCounts();
        closeFilterModal();
    });
});
