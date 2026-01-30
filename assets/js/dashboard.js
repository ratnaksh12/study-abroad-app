// Dashboard Logic

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (!requireAuth()) return;

    // Get current user and UID
    const currentUser = localStorage.getItem('currentUser');
    const currentUID = localStorage.getItem('currentUID');

    let userData = null;

    // If we have a UID, fetch the latest from cloud
    if (currentUID) {
        console.log('Fetching remote user state for UID:', currentUID);
        userData = await fetchUserRemote(currentUID);
    } else {
        // Fallback to local data for Email/Password users (local-only)
        console.log('No currentUID found, using local data for:', currentUser);
        userData = getCurrentUser();
    }

    if (!userData) {
        console.error('Failed to load user data');
        // If no user data at all, redirect to login
        window.location.href = 'auth.html';
        return;
    }

    // Check onboarding after we have the data
    if (!checkOnboardingComplete()) return;

    // Display user name and dynamic welcome message
    const userName = userData.name.split(' ')[0];
    document.getElementById('userName').textContent = userName;

    // Update welcome heading
    const welcomeHeading = document.querySelector('.welcome-section h1');
    welcomeHeading.innerHTML = `Welcome back, <span class="highlight" id="userName">${userName}</span>`;

    // CRITICAL: Force sync and local cache update
    generateTasks(userData);
    await saveUserData(currentUser, userData);

    // Initialize UI
    displayProfileStrength(userData);
    displayCurrentStage(userData);
    displayTasks(userData);

    // Initial check (sync frontend logic tasks with profile data)
    await checkTaskCompletion(userData);

    // Refresh buttons
    document.getElementById('refreshStrengthBtn').addEventListener('click', function () {
        displayProfileStrength(userData);
    });

    document.getElementById('refreshTodoBtn').addEventListener('click', async function () {
        const updatedUser = await fetchUserRemote(currentUID);
        await checkTaskCompletion(updatedUser);
        displayTasks(updatedUser);
    });

    // Quick actions
    document.getElementById('counsellorActionBtn').addEventListener('click', () => window.location.href = 'counsellor.html');
    document.getElementById('universitiesActionBtn').addEventListener('click', () => {
        if (userData.stage === 'profile') alert('Please complete your profile first.');
        else window.location.href = 'universities.html';
    });
    document.getElementById('profileActionBtn').addEventListener('click', () => window.location.href = 'profile.html');

    // User menu
    document.getElementById('userMenuBtn').addEventListener('click', () => {
        if (confirm('Do you want to logout?')) logout();
    });

    async function checkTaskCompletion(userData) {
        let changed = false;
        if (userData.profile && userData.profile.sopStatus === 'completed') {
            const sopTask = userData.tasks.find(t => t.title.includes('Statement of Purpose'));
            if (sopTask && !sopTask.completed) {
                sopTask.completed = true;
                changed = true;
            }
        }
        if (userData.profile && userData.profile.englishTest && userData.profile.englishTest !== 'none') {
            const engTask = userData.tasks.find(t => t.title.includes('English Proficiency'));
            if (engTask && !engTask.completed) {
                engTask.completed = true;
                changed = true;
            }
        }
        if (changed) {
            await saveUserData(currentUser, userData);
        }
    }

    // Initial display
    displayProfileStrength(userData);

    // Listen for profile updates from other components (Universities, AI Chat)
    window.addEventListener('profileUpdated', function () {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const freshData = getUserData(currentUser);
            displayProfileStrength(freshData);
        }
    });

    function displayProfileStrength(userData) {
        const score = calculateProfileStrength(userData);
        const strengthInfo = getProfileStrengthLabel(score);

        const circle = document.getElementById('strengthProgressCircle');
        const percentage = document.getElementById('strengthPercentage');
        const label = document.getElementById('strengthLabel');
        const tipsContainer = document.getElementById('strengthTips');

        // Circle animation
        const circumference = 314;
        const offset = circumference - (score / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        percentage.textContent = score + '%';
        label.textContent = strengthInfo.label;
        label.style.color = strengthInfo.color;

        tipsContainer.innerHTML = '';
        generateProfileTips(userData).forEach(tip => {
            const tipDiv = document.createElement('div');
            tipDiv.className = 'strength-tip';
            tipDiv.innerHTML = `<i class="fas fa-lightbulb"></i> ${tip}`;
            tipsContainer.appendChild(tipDiv);
        });
    }

    function displayCurrentStage(userData) {
        const currentStage = getCurrentStage(userData);
        const stageItems = document.querySelectorAll('.stage-item');

        stageItems.forEach(item => {
            const stage = item.dataset.stage;
            item.classList.remove('active', 'locked');

            if (stage === 'profile') {
                item.querySelector('.stage-status').textContent = 'Complete';
            } else if (stage === 'discover') {
                if (currentStage === 'discover') {
                    item.classList.add('active');
                    item.querySelector('.stage-status').textContent = 'In Progress';
                } else if (['finalize', 'apply'].includes(currentStage)) {
                    item.querySelector('.stage-status').textContent = 'Complete';
                } else {
                    item.classList.add('locked');
                    item.querySelector('.stage-status').textContent = 'Locked';
                }
            } else if (stage === 'finalize') {
                if (currentStage === 'finalize') {
                    item.classList.add('active');
                    item.querySelector('.stage-status').textContent = 'In Progress';
                } else if (currentStage === 'apply') {
                    item.querySelector('.stage-status').textContent = 'Complete';
                } else {
                    item.classList.add('locked');
                    item.querySelector('.stage-status').textContent = 'Locked';
                }
            } else if (stage === 'apply') {
                if (currentStage === 'apply') {
                    const appTasks = ['transcripts', 'lors', 'apply_online'];
                    const allDone = appTasks.every(id => {
                        const task = userData.tasks.find(t => t.id === id);
                        return task && task.completed;
                    });
                    if (allDone) {
                        item.querySelector('.stage-status').textContent = 'Complete';
                    } else {
                        item.classList.add('active');
                        item.querySelector('.stage-status').textContent = 'In Progress';
                    }
                } else {
                    item.classList.add('locked');
                    item.querySelector('.stage-status').textContent = 'Locked';
                }
            }
        });
    }

    function displayTasks(userData) {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';

        const tasks = generateTasks(userData);

        if (tasks.length === 0) {
            todoList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No active tasks.</p>';
            return;
        }

        tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'todo-item' + (task.completed ? ' completed' : '');
            taskDiv.innerHTML = `
                <div class="todo-checkbox"><i class="fas fa-check"></i></div>
                <div class="todo-content">
                    <div class="todo-title">${task.title}</div>
                    <div class="todo-description">${task.description}</div>
                </div>
                <div class="todo-priority ${task.priority}">${task.priority}</div>
            `;

            taskDiv.addEventListener('click', async function () {
                if (task.id === 'lock_final_list' || task.id === 'shortlist_task') {
                    window.location.href = 'universities.html';
                } else if (['sop_task', 'eng_test'].includes(task.id)) {
                    // Direct user to the specific section to update status
                    window.location.href = 'profile.html?open=exams';
                } else {
                    const isComplete = !task.completed;
                    task.completed = isComplete;
                    this.classList.toggle('completed', isComplete);

                    // Update task in userData
                    if (!userData.tasks) userData.tasks = [];
                    const existingIndex = userData.tasks.findIndex(t => t.id === task.id);
                    if (existingIndex > -1) userData.tasks[existingIndex].completed = isComplete;
                    else userData.tasks.push(task);

                    // Sync to cloud - AWAIT to ensure persistence
                    await saveUserData(currentUser, userData);
                    displayProfileStrength(userData);
                }
            });
            todoList.appendChild(taskDiv);
        });
    }
});

