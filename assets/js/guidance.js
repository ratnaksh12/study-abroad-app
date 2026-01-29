// Application Guidance Logic

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication and onboarding
    if (!requireAuth()) return;
    if (!checkOnboardingComplete()) return;

    const currentUser = localStorage.getItem('currentUser');
    const userData = getUserData(currentUser);

    // Check if user has locked universities
    if (!userData.lockedUniversities || userData.lockedUniversities.length === 0) {
        alert('Please lock at least one university before accessing application guidance.');
        window.location.href = 'universities.html';
        return;
    }

    const backBtn = document.getElementById('backBtn');
    const downloadGuideBtn = document.getElementById('downloadGuideBtn');

    // Initialize document checklist state if not exists
    if (!userData.documentChecklist) {
        userData.documentChecklist = [
            { id: 'doc_1', title: 'Transcripts', description: 'Official academic transcripts', completed: false },
            { id: 'doc_2', title: 'Statement of Purpose', description: 'Personalized SOP for each university', completed: false },
            { id: 'doc_3', title: 'Letters of Recommendation', description: '2-3 letters from professors/employers', completed: false },
            { id: 'doc_4', title: 'Resume/CV', description: 'Updated academic and professional CV', completed: false },
            { id: 'doc_5', title: 'English Proficiency Test', description: 'IELTS/TOEFL score report', completed: false },
            { id: 'doc_6', title: 'Standardized Test Scores', description: 'GRE/GMAT scores if required', completed: false },
            { id: 'doc_7', title: 'Financial Documents', description: 'Bank statements, sponsorship letters', completed: false },
            { id: 'doc_8', title: 'Passport Copy', description: 'Valid passport photocopy', completed: false }
        ];
        saveUserData(currentUser, userData);
    }

    // Display locked universities
    displayLockedUniversities();

    // Display document checklist
    displayDocumentChecklist();

    // Display timeline
    displayTimeline();

    // Display guidance tasks
    displayGuidanceTasks();

    async function displayLockedUniversities() {
        const list = document.getElementById('lockedUniversitiesList');
        list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Loading universities...</p>';

        try {
            // Fetch each locked university from the API
            const promises = userData.lockedUniversities.map(uniId => {
                return fetch(`https://study-abroad-app-1vfr.onrender.com/api/universities/${uniId}`)
                    .then(res => res.json())
                    .then(data => data.success ? data.university : null)
                    .catch(err => {
                        console.error(`Error fetching university ${uniId}:`, err);
                        return null;
                    });
            });

            const universities = await Promise.all(promises);
            list.innerHTML = '';

            universities.forEach(uni => {
                if (uni) {
                    const item = document.createElement('div');
                    item.className = 'locked-university-item';
                    item.innerHTML = `
                        <div class="locked-university-icon">
                            <i class="fas fa-university"></i>
                        </div>
                        <div class="locked-university-info">
                            <h4>${uni.name}</h4>
                            <p>Application in progress</p>
                        </div>
                        <button class="remove-university-btn ripple" data-university-id="${uni.id}" title="Remove University">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    `;

                    // Add event listener for remove button
                    const removeBtn = item.querySelector('.remove-university-btn');
                    removeBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        removeUniversity(uni.id, uni.name);
                    });

                    list.appendChild(item);
                }
            });

            // If no universities loaded, show error
            if (list.children.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No locked universities found.</p>';
            }
        } catch (error) {
            console.error('Error loading locked universities:', error);
            list.innerHTML = '<p style="text-align: center; color: var(--error-color);">Error loading universities. Please refresh the page.</p>';
        }
    }

    function displayDocumentChecklist() {
        const checklist = document.getElementById('documentChecklist');
        const completionBadge = document.getElementById('documentCompletion');

        checklist.innerHTML = '';

        let completedCount = 0;

        userData.documentChecklist.forEach(doc => {
            if (doc.completed) completedCount++;

            const item = document.createElement('div');
            item.className = 'checklist-item' + (doc.completed ? ' completed' : '');
            item.innerHTML = `
                <div class="checklist-checkbox">
                    <i class="fas fa-check"></i>
                </div>
                <div class="checklist-text">
                    <div class="checklist-title">${doc.title}</div>
                    <div class="checklist-description">${doc.description}</div>
                </div>
            `;

            item.addEventListener('click', function () {
                doc.completed = !doc.completed;
                saveUserData(currentUser, userData);
                displayDocumentChecklist();
            });

            checklist.appendChild(item);
        });

        completionBadge.textContent = `${completedCount}/${userData.documentChecklist.length}`;
    }

    function displayTimeline() {
        const timeline = document.getElementById('applicationTimeline');
        timeline.innerHTML = '';

        // Get intake from profile, default to Fall 2026 if missing
        const intakeSeason = userData.profile.intakeSeason || 'Fall';
        const intakeYear = userData.profile.intakeYear || '2026';

        const milestones = generateMilestones(intakeSeason, intakeYear);

        milestones.forEach(milestone => {
            const item = document.createElement('div');
            item.className = 'timeline-item' + (milestone.completed ? ' completed' : '');
            item.innerHTML = `
                <div class="timeline-date">${milestone.date}</div>
                <div class="timeline-title">${milestone.title}</div>
                <div class="timeline-description">${milestone.description}</div>
            `;
            timeline.appendChild(item);
        });
    }

    function generateMilestones(season, year) {
        // Parse year
        const targetYear = parseInt(year);
        let startMonth = 7; // August (0-indexed) for Fall

        if (season.toLowerCase() === 'spring') startMonth = 0; // January
        if (season.toLowerCase() === 'summer') startMonth = 4; // May

        const startDate = new Date(targetYear, startMonth, 1);

        // Helper to subtract months
        const subMonths = (date, months) => {
            const d = new Date(date);
            d.setMonth(d.getMonth() - months);
            return d;
        };

        // Helper to format date range
        const formatRange = (start, end) => {
            const getMonth = d => d.toLocaleString('default', { month: 'long' });
            if (start.getFullYear() === end.getFullYear()) {
                if (start.getMonth() === end.getMonth()) {
                    return `${getMonth(start)} ${start.getFullYear()}`;
                }
                return `${getMonth(start)}-${getMonth(end)} ${start.getFullYear()}`;
            }
            return `${getMonth(start)} ${start.getFullYear()} - ${getMonth(end)} ${end.getFullYear()}`;
        };

        return [
            {
                date: formatRange(subMonths(startDate, 11), subMonths(startDate, 10)),
                title: 'Research & Shortlist',
                description: 'Explore universities and create your shortlist',
                completed: true
            },
            {
                date: formatRange(subMonths(startDate, 9), subMonths(startDate, 8)),
                title: 'Prepare Documents',
                description: 'Gather all required application materials',
                completed: false
            },
            {
                date: formatRange(subMonths(startDate, 7), subMonths(startDate, 6)),
                title: 'Submit Applications',
                description: 'Complete and submit all applications',
                completed: false
            },
            {
                date: formatRange(subMonths(startDate, 5), subMonths(startDate, 4)),
                title: 'Await Decisions',
                description: 'Universities review and send admission decisions',
                completed: false
            },
            {
                date: formatRange(subMonths(startDate, 3), subMonths(startDate, 3)),
                title: 'Accept Offer',
                description: 'Choose your university and accept the offer',
                completed: false
            },
            {
                date: formatRange(subMonths(startDate, 2), subMonths(startDate, 1)),
                title: 'Visa Process',
                description: 'Apply for student visa and prepare for departure',
                completed: false
            }
        ];
    }

    function removeUniversity(uniId, uniName) {
        // Confirm before removing
        if (confirm(`Are you sure you want to remove ${uniName} from your application list? This action cannot be undone.`)) {
            // Remove from locked universities
            userData.lockedUniversities = userData.lockedUniversities.filter(id => id !== uniId);
            saveUserData(currentUser, userData);

            // Check if any universities remain
            if (userData.lockedUniversities.length === 0) {
                alert('You have removed all universities. Redirecting to the Universities page.');
                window.location.href = 'universities.html';
            } else {
                // Refresh the display
                displayLockedUniversities();
            }
        }
    }

    function displayGuidanceTasks() {
        const tasksList = document.getElementById('guidanceTasksList');
        tasksList.innerHTML = '';

        const appTasks = userData.tasks.filter(task =>
            task.title.includes('Application') ||
            task.title.includes('Document') ||
            task.title.includes('Transcript') ||
            task.title.includes('Recommendation')
        );

        if (appTasks.length === 0) {
            tasksList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">All application tasks completed!</p>';
            return;
        }

        appTasks.forEach(task => {
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

            taskDiv.addEventListener('click', function () {
                task.completed = !task.completed;
                saveUserData(currentUser, userData);
                displayGuidanceTasks();
            });

            tasksList.appendChild(taskDiv);
        });
    }

    // Back button
    backBtn.addEventListener('click', function () {
        window.location.href = 'dashboard.html';
    });

    // Download guide button
    downloadGuideBtn.addEventListener('click', function () {
        alert('Application guide download coming soon!');
    });

    // Add task button
    document.getElementById('addTaskBtn').addEventListener('click', function () {
        const taskTitle = prompt('Enter task title:');
        if (taskTitle) {
            const newTask = {
                id: 'task_' + Date.now(),
                title: taskTitle,
                description: 'Custom task',
                priority: 'medium',
                completed: false
            };
            userData.tasks.push(newTask);
            saveUserData(currentUser, userData);
            displayGuidanceTasks();
        }
    });
});
