// Dashboard Logic

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication and onboarding
    if (!requireAuth()) return;
    if (!checkOnboardingComplete()) return;

    const currentUser = localStorage.getItem('currentUser');
    const userData = getUserData(currentUser);

    // Display user name and dynamic welcome message
    const userName = userData.name.split(' ')[0];
    document.getElementById('userName').textContent = userName;

    // Update welcome heading based on first login status
    const welcomeHeading = document.querySelector('.welcome-section h1');
    if (userData.firstLogin === true) {
        welcomeHeading.innerHTML = `Welcome, <span class="highlight" id="userName">${userName}</span>`;
        // Mark as no longer first login and save
        userData.firstLogin = false;
        saveUserData(currentUser, userData);
    } else {
        welcomeHeading.innerHTML = `Welcome back, <span class="highlight" id="userName">${userName}</span>`;
    }

    // Calculate and display profile strength
    displayProfileStrength(userData);

    // Display current stage
    displayCurrentStage(userData);

    // Display tasks
    displayTasks(userData);

    // Quick actions
    document.getElementById('counsellorActionBtn').addEventListener('click', function () {
        window.location.href = 'counsellor.html';
    });

    document.getElementById('universitiesActionBtn').addEventListener('click', function () {
        if (userData.stage === 'profile') {
            alert('Please complete your profile first before exploring universities.');
        } else {
            window.location.href = 'universities.html';
        }
    });

    document.getElementById('profileActionBtn').addEventListener('click', function () {
        window.location.href = 'profile.html';
    });

    // Refresh buttons
    document.getElementById('refreshStrengthBtn').addEventListener('click', function () {
        displayProfileStrength(userData);
    });

    document.getElementById('refreshTodoBtn').addEventListener('click', function () {
        checkTaskCompletion(userData); // Sync tasks with profile
        displayTasks(userData);
    });

    // Initial check
    checkTaskCompletion(userData);
    displayTasks(userData);

    function checkTaskCompletion(userData) {
        if (userData.profile.sopStatus === 'completed') {
            // Find SOP task and mark complete
            const sopTask = userData.tasks.find(t => t.title.includes('Statement of Purpose'));
            if (sopTask && !sopTask.completed) {
                sopTask.completed = true;
                saveUserData(currentUser, userData);
            }
        }
        // Add other checks here if needed (e.g. English test)
        if (userData.profile.englishTest && userData.profile.englishTest !== 'none') {
            const engTask = userData.tasks.find(t => t.title.includes('English Proficiency'));
            if (engTask && !engTask.completed) {
                engTask.completed = true;
                saveUserData(currentUser, userData);
            }
        }
    }

    // User menu
    document.getElementById('userMenuBtn').addEventListener('click', function () {
        if (confirm('Do you want to logout?')) {
            logout();
        }
    });

    function displayProfileStrength(userData) {
        const score = calculateProfileStrength(userData);
        const strengthInfo = getProfileStrengthLabel(score);

        // Update circular progress
        const circle = document.getElementById('strengthProgressCircle');
        const percentage = document.getElementById('strengthPercentage');
        const label = document.getElementById('strengthLabel');
        const tipsContainer = document.getElementById('strengthTips');

        // Add gradient definition if not exists
        if (!document.querySelector('#strengthGradient')) {
            const svg = circle.closest('svg');
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `
                <linearGradient id="strengthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b35;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
                </linearGradient>
            `;
            svg.insertBefore(defs, svg.firstChild);
        }

        // Animate circle
        const circumference = 314;
        const offset = circumference - (score / 100) * circumference;
        circle.style.strokeDashoffset = offset;

        percentage.textContent = score + '%';
        label.textContent = strengthInfo.label;
        label.style.color = strengthInfo.color;

        // Generate tips
        tipsContainer.innerHTML = '';
        const tips = generateProfileTips(userData);
        tips.forEach(tip => {
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
                // Profile is always complete if on dashboard
                item.querySelector('.stage-status').textContent = 'Complete';
            } else if (stage === 'discover') {
                if (currentStage === 'discover') {
                    item.classList.add('active');
                    item.querySelector('.stage-status').textContent = 'In Progress';
                } else if (currentStage === 'finalize' || currentStage === 'apply') {
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
                    // Check if all critical application tasks are done
                    const appTasks = ['transcripts', 'lors', 'apply_online'];
                    const allDone = appTasks.every(id => {
                        const task = userData.tasks ? userData.tasks.find(t => t.id === id) : null;
                        return task && task.completed;
                    });

                    if (allDone) {
                        item.classList.remove('active');
                        item.querySelector('.stage-status').textContent = 'Complete';
                        // Optional: Add a 'finished' class for styling if needed
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

        // Use shared generateTasks function from common.js
        const tasks = generateTasks(userData);

        // Save updated task completion status
        saveUserData(currentUser, userData);

        // Refresh profile strength with updated task completion
        displayProfileStrength(userData);

        if (tasks.length === 0) {
            todoList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No active tasks. You are up to date!</p>';
            return;
        }

        tasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = 'todo-item' + (task.completed ? ' completed' : '');
            taskDiv.innerHTML = `
                <div class="todo-checkbox">
                    <i class="fas fa-check"></i>
                </div>
                <div class="todo-content">
                    <div class="todo-title">${task.title}</div>
                    <div class="todo-description">${task.description}</div>
                </div>
                <div class="todo-priority ${task.priority}">${task.priority}</div>
            `;
            // Task click handler
            taskDiv.addEventListener('click', function () {
                // Special handling for lock university task - redirect without marking complete
                if (task.id === 'lock_final_list') {
                    window.location.href = 'universities.html';
                    return; // Don't mark as complete yet
                }

                if (task.id === 'sop_task' || task.id === 'eng_test') {
                    alert("Update your profile to complete this task!");
                    window.location.href = 'profile.html';
                } else if (task.id === 'shortlist_task') {
                    window.location.href = 'universities.html';
                } else {
                    // Toggle completion
                    const isComplete = !task.completed;
                    task.completed = isComplete;

                    // Update visual immediately
                    this.classList.toggle('completed', isComplete);

                    // Update userData using shared function
                    updateTaskCompletion(userData, task.id, isComplete);

                    // If task doesn't exist in userData.tasks yet, add it
                    if (!userData.tasks) userData.tasks = [];
                    const existingIndex = userData.tasks.findIndex(t => t.id === task.id);
                    if (existingIndex > -1) {
                        userData.tasks[existingIndex].completed = isComplete;
                    } else {
                        userData.tasks.push(task);
                    }

                    saveUserData(currentUser, userData);

                    // Update Profile Strength immediately
                    displayProfileStrength(userData);

                    // Show small toast notification
                    if (isComplete) {
                        const toast = document.createElement('div');
                        toast.textContent = "Profile Strength Updated!";
                        toast.style.cssText = `
                            position: fixed; bottom: 20px; right: 20px; 
                            background: var(--success-color); color: white; 
                            padding: 10px 20px; border-radius: 8px; 
                            box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
                            animation: slideUp 0.3s ease; z-index: 1000;
                        `;
                        document.body.appendChild(toast);
                        setTimeout(() => {
                            toast.style.opacity = '0';
                            setTimeout(() => toast.remove(), 300);
                        }, 2000);
                    }
                }
            });
            todoList.appendChild(taskDiv);
        });
    }

    // Refresh Logic override
    document.getElementById('refreshTodoBtn').addEventListener('click', function () {
        // Re-read user data to get latest profile updates
        const updatedUser = getUserData(currentUser);
        displayTasks(updatedUser);
    });

    // Initial Load
    displayTasks(userData);
});
