// Common JavaScript Functions - Shared Across All Pages

const API_BASE_URL = 'https://study-abroad-app-ivfr.onrender.com/api';

// Initialize localStorage if not exists
function initializeLocalStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify({}));
    }
}

// Global cached user data
let g_userData = null;

// Get user data from backend (Async)
async function fetchUserRemote(uid) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${uid}`);
        const result = await response.json();
        if (result.success) {
            g_userData = result.user;
            // Sync to local as backup/cache
            localStorage.setItem(`user_cache_${uid}`, JSON.stringify(g_userData));
            return g_userData;
        }
    } catch (error) {
        console.error('Error fetching user from backend:', error);
        // Fallback to cache
        const cache = localStorage.getItem(`user_cache_${uid}`);
        if (cache) return JSON.parse(cache);
    }
    return null;
}

// Sync user data to backend
async function saveUserRemote(uid, data) {
    try {
        // Sync profile
        if (data.profile) {
            await fetch(`${API_BASE_URL}/user/${uid}/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data.profile)
            });
        }

        // Sync shortlist/locks
        // This is simplified - in production we'd delta sync
        if (data.shortlistedUniversities || data.lockedUniversities) {
            // Note: server endpoint handles one at a time or batch
            // For now, we'll implement a simple batch sync if needed
        }

        // Sync tasks
        if (data.tasks) {
            await fetch(`${API_BASE_URL}/user/${uid}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: data.tasks })
            });
        }

        console.log('🔄 Data synced to PostgreSQL');
    } catch (error) {
        console.error('Error syncing to backend:', error);
    }
}

// Get user data (legacy wrapper - returns cached or null)
function getUserData(email) {
    // If we have a global UID, we should use it. 
    // This function is still used by auth.js for email lookup.
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    return users[email] || null;
}

// Save user data (legacy wrapper - also triggers remote sync if uid present)
async function saveUserData(email, data, options = {}) {
    console.log(`[Global Save] Saving data for ${email}.`);

    // Auto-deduplicate shortlist
    if (data.shortlistedUniversities) {
        data.shortlistedUniversities = cleanShortlist(data.shortlistedUniversities);
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[email] = data;
    localStorage.setItem('users', JSON.stringify(users));

    // Remote sync if we have a UID stored
    const uid = localStorage.getItem('currentUID');
    if (uid) {
        await saveUserRemote(uid, data);
    }
}

// Clean and deduplicate shortlist array
function cleanShortlist(shortlistedIds) {
    if (!Array.isArray(shortlistedIds)) return [];
    return [...new Set(shortlistedIds.filter(id => id && String(id).trim()))];
}

// Get current logged in user
function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;
    return getUserData(currentUser);
}

// Toggle University (Shortlist/Lock) with Remote Sync
async function toggleUniversityRemote(universityId, action, isLocked = false) {
    const uid = localStorage.getItem('currentUID');
    if (!uid) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/user/${uid}/universities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ universityId, action, isLocked })
        });
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error toggling university remotely:', error);
        return false;
    }
}

// Check authentication and redirect if needed
function requireAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'auth.html?mode=login';
        return false;
    }
    return true;
}

// ... (Rest of UI calculations: calculateProfileStrength, etc. remain unchanged)


// Check if onboarding is complete
function checkOnboardingComplete() {
    const user = getCurrentUser();
    if (user && !user.profileComplete) {
        window.location.href = 'onboarding.html';
        return false;
    }
    return true;
}

// Ripple effect for buttons
function addRippleEffect(event, element) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple-effect');

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add ripple effect to all elements with .ripple class
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.ripple').forEach(element => {
        element.addEventListener('click', function (e) {
            addRippleEffect(e, this);
        });
    });
});

// Calculate profile strength based on user data
function calculateProfileStrength(userData) {
    let score = 0;
    const weights = {
        academic: 20,
        goals: 25,
        budget: 15,
        exams: 25,
        additional: 15
    };

    // Academic background
    if (userData.profile?.educationLevel) score += weights.academic * 0.3;
    if (userData.profile?.degreeMajor) score += weights.academic * 0.3;
    if (userData.profile?.graduationYear) score += weights.academic * 0.3;
    if (userData.profile?.gpa) score += weights.academic * 0.1;

    // Study goals
    if (userData.profile?.intendedDegree) score += weights.goals * 0.3;
    if (userData.profile?.fieldOfStudy) score += weights.goals * 0.3;
    if (userData.profile?.intakeYear) score += weights.goals * 0.2;
    if (userData.profile?.preferredCountries?.length > 0) score += weights.goals * 0.2;

    // Budget
    if (userData.profile?.budgetRange) score += weights.budget * 0.6;
    if (userData.profile?.fundingPlan?.length > 0) score += weights.budget * 0.4;

    // Exams
    if (userData.profile?.englishTest && userData.profile.englishTest !== 'none') {
        score += weights.exams * 0.4;
        if (userData.profile?.englishScore) score += weights.exams * 0.1;
    }
    // Check if task completed OR score present
    const gmatTask = userData.tasks ? userData.tasks.find(t => t.id === 'gmat_task' && t.completed) : false;
    if ((userData.profile?.standardizedTest && userData.profile.standardizedTest !== 'none') || gmatTask) {
        score += weights.exams * 0.3;
        if (userData.profile?.standardizedScore || gmatTask) score += weights.exams * 0.2; // Award full points if task done
    }
    if (userData.profile?.sopStatus === 'completed') score += weights.exams * 0.1;

    // Additional completeness - DATA-DRIVEN SCORING (Trusted Source)
    // We check the ACTUAL count. If count > 0, we award points representing the task being "done".
    // This ensures that un-shortlisting (count -> 0) immediately removes the points.

    const hasShortlisted = userData.shortlistedUniversities && userData.shortlistedUniversities.length > 0;
    const hasLocked = userData.lockedUniversities && userData.lockedUniversities.length > 0;

    // Check tasks for UI consistency, but score is based on reality
    const shortlistTask = userData.tasks ? userData.tasks.find(t => t.id === 'shortlist_task') : null;
    const lockTask = userData.tasks ? userData.tasks.find(t => t.id === 'lock_final_list') : null;

    // Shortlist Points: 15% * 0.4 = 6 points
    if (hasShortlisted) {
        score += weights.additional * 0.4;
    }

    // Lock Points: 15% * 0.4 = 6 points
    if (hasLocked) {
        score += weights.additional * 0.4;
    }

    // Remaining 10% (1.5 pts) - Just a small bonus for having "started" if valid
    // Only if not already fully rewarded above (logic kept from original but simplified)
    if (hasShortlisted && !hasLocked) {
        score += weights.additional * 0.1;
    }

    // Task Completion Bonus
    // Check for specific application tasks
    if (userData.tasks) {
        const completedTasks = userData.tasks.filter(t => t.completed).length;
        if (completedTasks > 0) {
            // Allocate remaining 20% of 'additional' weight + bonus
            const taskBonus = Math.min(completedTasks * 3, 15); // Increased bonus weight
            score += taskBonus;
        }
    }

    // Cap at 100
    return Math.min(Math.round(score), 100);
}

// Get profile strength label
function getProfileStrengthLabel(score) {
    if (score >= 95) return { label: 'Excellent', color: '#22c55e' }; // Stricter for 100%
    if (score >= 80) return { label: 'Very Good', color: '#4ade80' };
    if (score >= 60) return { label: 'Good', color: '#f59e0b' };
    if (score >= 40) return { label: 'Fair', color: '#f97316' };
    return { label: 'Needs Improvement', color: '#ef4444' };
}

// Determine current stage
function getCurrentStage(userData) {
    if (!userData.profileComplete) return 'profile';
    if (!userData.lockedUniversities || userData.lockedUniversities.length === 0) {
        if (!userData.shortlistedUniversities || userData.shortlistedUniversities.length === 0) {
            return 'discover';
        }
        return 'finalize';
    }
    // If locked universities exist, we are at least in apply stage.
    // Check if all essential application tasks are done to mark as fully complete (or stay in apply)
    // For the UI, we just return 'apply' to show that section active. 
    // To show "Complete" on the dashboard for 'apply', the dashboard logic handles that check.
    return 'apply';
}

// Generate profile tips based on user data
function generateProfileTips(userData) {
    const tips = [];

    if (!userData.profile.gpa) {
        tips.push('Add your GPA to improve university matching');
    }

    if (!userData.profile.englishScore) {
        // Check if task exists and is done
        const engTask = userData.tasks?.find(t => t.id === 'eng_test' && t.completed);
        if (!engTask) tips.push('Complete your English proficiency test');
    }

    if (!userData.profile.standardizedScore) {
        // Check if task exists and is done
        const gmatTask = userData.tasks?.find(t => t.id === 'gmat_task' && t.completed);
        if (!gmatTask) tips.push('Take GRE/GMAT for better opportunities');
    }

    if (userData.profile.sopStatus !== 'completed') {
        tips.push('Complete your Statement of Purpose');
    }

    if (!userData.shortlistedUniversities || userData.shortlistedUniversities.length === 0) {
        tips.push('Start exploring and shortlisting universities');
    }

    if (tips.length === 0) {
        tips.push('Your profile looks great! Keep it updated.');
    }

    return tips.slice(0, 3);
}

// Navigate using bottom nav
function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const page = this.dataset.page;
            if (page) {
                window.location.href = `${page}.html`;
            }
        });
    });
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function () {
    initializeLocalStorage();

    // Setup bottom navigation if present
    if (document.querySelector('.bottom-nav')) {
        setupBottomNavigation();

        // Highlight current page
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.page === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ========================================
// Task Management - Single Source of Truth
// ========================================

// Dynamic Task Generation - Used by both Dashboard and AI Chat
function generateTasks(userData) {
    const tasks = [];
    const stage = getCurrentStage(userData);

    // Ensure userData has required fields
    if (!userData.shortlistedUniversities) userData.shortlistedUniversities = [];
    if (!userData.lockedUniversities) userData.lockedUniversities = [];

    // Stage 1: Profile (Implicitly done if here, but check gaps)
    if (!userData.profile.englishTest || userData.profile.englishTest === 'none') {
        tasks.push({ title: 'Take English Proficiency Test', description: 'Register for IELTS/TOEFL', priority: 'high', completed: false, id: 'eng_test' });
    }
    if (userData.profile.sopStatus !== 'completed') {
        tasks.push({ title: 'Write Statement of Purpose', description: 'Draft your SOP', priority: 'high', completed: false, id: 'sop_task' });
    }

    // Add GRE/GMAT task if score is missing
    if (!userData.profile.standardizedScore) {
        tasks.push({ title: 'Take Standardized Test (GRE/GMAT)', description: 'Required for top universities', priority: 'medium', completed: false, id: 'gmat_task' });
    }


    // Stage 2: Discovery - Always show shortlist task
    tasks.push({
        title: 'Shortlist 8-12 Universities',
        description: 'Use AI Counsellor to find matches',
        priority: 'high',
        completed: userData.shortlistedUniversities.length >= 3,
        id: 'shortlist_task'
    });

    // Stage 3: Finalization - Always show lock task
    tasks.push({
        title: 'Lock Final University List',
        description: 'Select 1-3 universities to apply to',
        priority: 'critical',
        completed: userData.lockedUniversities.length > 0,
        id: 'lock_final_list'
    });


    // Stage 4: Application (Only if Locked)
    if (stage === 'apply') {
        tasks.push({ title: 'Order Official Transcripts', description: 'Request from your high school/college', priority: 'high', completed: false, id: 'transcripts' });
        tasks.push({ title: 'Request Letters of Recommendation', description: 'Contact 2-3 professors', priority: 'high', completed: false, id: 'lors' });
        tasks.push({ title: 'Start Online Applications', description: 'Creating accounts on university portals', priority: 'critical', completed: false, id: 'apply_online' });
    }

    // Merge with existing task status from userData
    // EXCEPT for shortlist and lock tasks - these should ALWAYS use calculated status
    if (userData.tasks && userData.tasks.length > 0) {
        tasks.forEach(t => {
            const existing = userData.tasks.find(ut => ut.id === t.id);
            if (existing) {
                // For shortlist and lock tasks, always use the freshly calculated completion status
                // For other tasks, use the stored completion status
                if (t.id !== 'shortlist_task' && t.id !== 'lock_final_list') {
                    t.completed = existing.completed;
                }
            }
        });
    }

    // Update userData.tasks to reflect the current calculated status for shortlist and lock tasks
    if (!userData.tasks) userData.tasks = [];

    // Update or add shortlist task
    const shortlistTaskIndex = userData.tasks.findIndex(t => t.id === 'shortlist_task');
    const shortlistTask = tasks.find(t => t.id === 'shortlist_task');
    if (shortlistTask) {
        if (shortlistTaskIndex >= 0) {
            userData.tasks[shortlistTaskIndex].completed = shortlistTask.completed;
        } else {
            userData.tasks.push(shortlistTask);
        }
    }

    // Update or add lock task
    const lockTaskIndex = userData.tasks.findIndex(t => t.id === 'lock_final_list');
    const lockTask = tasks.find(t => t.id === 'lock_final_list');
    if (lockTask) {
        if (lockTaskIndex >= 0) {
            userData.tasks[lockTaskIndex].completed = lockTask.completed;
        } else {
            userData.tasks.push(lockTask);
        }
    }

    return tasks;
}

// Get only pending (incomplete) tasks
function getPendingTasks(userData) {
    const allTasks = generateTasks(userData);
    return allTasks.filter(task => !task.completed);
}

// Get only completed tasks
function getCompletedTasks(userData) {
    const allTasks = generateTasks(userData);
    return allTasks.filter(task => task.completed);
}

// Add task to user task list (if not already exists)
function addTaskIfNotExists(userData, task) {
    if (!userData.tasks) userData.tasks = [];

    const exists = userData.tasks.some(t => t.id === task.id);
    if (!exists) {
        userData.tasks.push({
            id: task.id || 'task_' + Date.now(),
            title: task.title,
            description: task.description,
            priority: task.priority || 'medium',
            completed: false
        });
        return true; // Task was added
    }
    return false; // Task already exists
}

// Update task completion status
function updateTaskCompletion(userData, taskId, completed) {
    if (!userData.tasks) userData.tasks = [];

    const task = userData.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = completed;
        return true;
    }
    return false;
}
