// Onboarding Logic with Form and AI Modes

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (!requireAuth()) return;

    const currentUserEmail = localStorage.getItem('currentUser');
    const currentUID = localStorage.getItem('currentUID');
    let user = null;

    if (currentUID) {
        user = await fetchUserRemote(currentUID);
    }

    if (!user) {
        user = getUserData(currentUserEmail);
    }

    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    if (user.profileComplete) {
        window.location.href = 'dashboard.html';
        return;
    }

    let currentScreen = 'modeSelection';
    let onboardingMode = null; // 'form' or 'ai'
    let formData = user.profile || {};

    const progressBar = document.getElementById('progressBar');

    // Mode selection
    const modeCards = document.querySelectorAll('.mode-card');
    modeCards.forEach(card => {
        card.addEventListener('click', function () {
            onboardingMode = this.dataset.mode;
            if (onboardingMode === 'form') {
                navigateToScreen('academicBackground');
                updateProgress(20);
            } else {
                navigateToScreen('aiConversation');
                updateProgress(10);
                startAIConversation();
            }
        });
    });

    // Navigate between screens
    function navigateToScreen(screenId) {
        document.querySelectorAll('.onboarding-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        currentScreen = screenId;
    }

    // Update progress bar
    function updateProgress(percentage) {
        progressBar.style.width = percentage + '%';
    }

    // Form mode navigation
    const nextButtons = document.querySelectorAll('.next-btn');
    const backButtons = document.querySelectorAll('.back-btn');

    nextButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            if (validateCurrentScreen()) {
                saveCurrentScreenData();
                const nextScreen = this.dataset.next;
                if (nextScreen) {
                    navigateToScreen(nextScreen);
                    updateProgressByScreen(nextScreen);
                }
            }
        });
    });

    backButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const prevScreen = this.dataset.back;
            if (prevScreen) {
                navigateToScreen(prevScreen);
                updateProgressByScreen(prevScreen);
            }
        });
    });

    // Validate current screen
    function validateCurrentScreen() {
        const currentForm = document.querySelector(`#${currentScreen} form`);
        if (!currentForm) return true;

        const requiredFields = currentForm.querySelectorAll('[required]');
        for (let field of requiredFields) {
            if (!field.value) {
                alert('Please fill in all required fields.');
                field.focus();
                return false;
            }
        }

        // Special validation for checkboxes
        if (currentScreen === 'studyGoal') {
            const checkedCountries = currentForm.querySelectorAll('input[name="countries"]:checked');
            if (checkedCountries.length === 0) {
                alert('Please select at least one preferred country.');
                return false;
            }
        }

        if (currentScreen === 'budget') {
            const checkedFunding = currentForm.querySelectorAll('input[name="funding"]:checked');
            if (checkedFunding.length === 0) {
                alert('Please select at least one funding option.');
                return false;
            }
        }

        return true;
    }

    // Save current screen data
    function saveCurrentScreenData() {
        if (currentScreen === 'academicBackground') {
            formData.educationLevel = document.getElementById('educationLevel').value;
            formData.degreeMajor = document.getElementById('degreeMajor').value;
            formData.graduationYear = document.getElementById('graduationYear').value;
            formData.gpa = document.getElementById('gpa').value;
        } else if (currentScreen === 'studyGoal') {
            formData.intendedDegree = document.getElementById('intendedDegree').value;
            formData.fieldOfStudy = document.getElementById('fieldOfStudy').value;
            formData.intakeYear = document.getElementById('intakeYear').value;
            formData.intakeSeason = document.getElementById('intakeSeason').value;

            const selectedCountries = [];
            document.querySelectorAll('input[name="countries"]:checked').forEach(cb => {
                selectedCountries.push(cb.value);
            });
            formData.preferredCountries = selectedCountries;
        } else if (currentScreen === 'budget') {
            formData.budgetRange = document.getElementById('budgetRange').value;

            const selectedFunding = [];
            document.querySelectorAll('input[name="funding"]:checked').forEach(cb => {
                selectedFunding.push(cb.value);
            });
            formData.fundingPlan = selectedFunding;
        } else if (currentScreen === 'examsReadiness') {
            formData.englishTest = document.getElementById('englishTest').value;
            formData.englishScore = document.getElementById('englishScore').value;
            formData.standardizedTest = document.getElementById('standardizedTest').value;
            formData.standardizedScore = document.getElementById('standardizedScore').value;
            formData.sopStatus = document.getElementById('sopStatus').value;
        }

        // Save to localStorage
        const userData = getUserData(currentUserEmail);
        userData.profile = formData;
        saveUserData(currentUserEmail, userData);
    }

    // Update progress based on screen
    function updateProgressByScreen(screenId) {
        const progressMap = {
            'modeSelection': 0,
            'academicBackground': 20,
            'studyGoal': 40,
            'budget': 60,
            'examsReadiness': 80
        };
        updateProgress(progressMap[screenId] || 0);
    }

    // Complete onboarding
    document.getElementById('completeOnboardingBtn').addEventListener('click', async function () {
        if (validateCurrentScreen()) {
            saveCurrentScreenData();

            const userData = getUserData(currentUserEmail);
            userData.profileComplete = true;
            userData.stage = 'discover';

            // Generate initial tasks
            userData.tasks = generateInitialTasks(userData);

            await saveUserData(currentUserEmail, userData, { isProfileUpdate: true });

            updateProgress(100);

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }
    });

    // AI Conversation Mode
    let conversationState = {
        step: 0,
        data: {}
    };

    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');

    function startAIConversation() {
        conversationState.step = 0;
        chatMessages.innerHTML = '';
        addAIMessage("Hi! I'm your AI counsellor. I'll help you build your profile through a friendly conversation. Let's start with your educational background. What is your current education level?");
    }

    function addAIMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">${text}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">${text}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function processAIResponse(userMessage) {
        const step = conversationState.step;

        // Simple rule-based conversation flow
        if (step === 0) {
            conversationState.data.educationLevel = userMessage;
            conversationState.step++;
            addAIMessage("Great! What is your major or degree subject?");
            updateProgress(15);
        } else if (step === 1) {
            conversationState.data.degreeMajor = userMessage;
            conversationState.step++;
            addAIMessage("When did or will you graduate? (Year)");
            updateProgress(25);
        } else if (step === 2) {
            conversationState.data.graduationYear = userMessage;
            conversationState.step++;
            addAIMessage("Great! What is your GPA or percentage? (e.g., 3.5/4.0 or 85%)");
            updateProgress(22);
        } else if (step === 3) {
            conversationState.data.gpa = userMessage;
            conversationState.step++;
            addAIMessage("Perfect! Now, what degree are you planning to pursue abroad?");
            updateProgress(30);
        } else if (step === 4) {
            conversationState.data.intendedDegree = userMessage;
            conversationState.step++;
            addAIMessage("What field of study interests you?");
            updateProgress(38);
        } else if (step === 5) {
            conversationState.data.fieldOfStudy = userMessage;
            conversationState.step++;
            addAIMessage("When do you plan to start? Please provide the intake year (e.g., 2026, 2027).");
            updateProgress(46);
        } else if (step === 6) {
            conversationState.data.intakeYear = userMessage;
            conversationState.step++;
            addAIMessage("And which intake season? (Fall, Spring, or Summer)");
            updateProgress(54);
        } else if (step === 7) {
            conversationState.data.intakeSeason = userMessage;
            conversationState.step++;
            addAIMessage("Which countries are you considering? (You can list multiple, separated by commas)");
            updateProgress(62);
        } else if (step === 8) {
            conversationState.data.preferredCountries = userMessage.split(',').map(c => c.trim());
            conversationState.step++;
            addAIMessage("What is your yearly budget range in USD? (e.g., 10000-20000)");
            updateProgress(70);
        } else if (step === 9) {
            conversationState.data.budgetRange = userMessage;
            conversationState.step++;
            addAIMessage("How do you plan to fund your education? (e.g., self-funded, scholarship, loan)");
            updateProgress(76);
        } else if (step === 10) {
            conversationState.data.fundingPlan = userMessage.split(',').map(f => f.trim());
            conversationState.step++;
            addAIMessage("Have you taken any English proficiency tests like IELTS or TOEFL? If yes, please mention your score.");
            updateProgress(82);
        } else if (step === 11) {
            conversationState.data.englishTest = userMessage;
            conversationState.step++;
            addAIMessage("Last question! What is the status of your Statement of Purpose (SOP)? (Not started, In progress, or Completed)");
            updateProgress(90);
        } else if (step === 12) {
            conversationState.data.sopStatus = userMessage;

            // Complete onboarding
            const userData = getUserData(currentUserEmail);
            userData.profile = conversationState.data;
            userData.profileComplete = true;
            userData.stage = 'discover';
            userData.tasks = generateInitialTasks(userData);

            // Sync and wait
            await saveUserData(currentUserEmail, userData, { isProfileUpdate: true });

            addAIMessage("Awesome! Your profile is now complete. I've gathered all the information I need to help you find the perfect universities. Redirecting you to your dashboard...");
            updateProgress(100);

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    }

    // Send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addUserMessage(message);
        chatInput.value = '';

        setTimeout(async () => {
            await processAIResponse(message);
        }, 800);
    }

    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Voice Recognition
    const voiceBtn = document.getElementById('voiceBtn');
    let recognition = null;
    let isListening = false;

    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            sendMessage();
        };

        recognition.onend = function () {
            isListening = false;
            voiceBtn.style.color = 'var(--text-primary)';
            voiceBtn.style.animation = 'none';
        };

        recognition.onerror = function (event) {
            console.error('Voice error', event.error);
            isListening = false;
            voiceBtn.style.color = 'var(--text-primary)';
        };
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', function () {
            if (!recognition) {
                alert('Voice recognition not supported in this browser. Try Chrome.');
                return;
            }
            if (isListening) {
                recognition.stop();
            } else {
                recognition.start();
                isListening = true;
                this.style.color = '#ef4444';
                this.style.animation = 'pulse 1.5s infinite';
            }
        });
    }

    // Switch to form mode from AI mode
    document.getElementById('switchToFormBtn').addEventListener('click', function () {
        if (confirm('Are you sure you want to switch to form mode? Your conversation progress will be saved.')) {
            // Save whatever data was collected
            const userData = getUserData(currentUserEmail);
            userData.profile = { ...userData.profile, ...conversationState.data };
            saveUserData(currentUserEmail, userData, { isProfileUpdate: true });

            navigateToScreen('academicBackground');
            updateProgress(20);
        }
    });

    // Generate initial tasks based on profile
    function generateInitialTasks(userData) {
        const tasks = [];

        if (!userData.profile.englishTest || userData.profile.englishTest === 'none') {
            tasks.push({
                id: 'task_' + Date.now() + '_1',
                title: 'Take English Proficiency Test',
                description: 'Register for IELTS or TOEFL',
                priority: 'high',
                completed: false
            });
        }

        if (userData.profile.sopStatus !== 'completed') {
            tasks.push({
                id: 'task_' + Date.now() + '_2',
                title: 'Write Statement of Purpose',
                description: 'Draft your SOP highlighting your goals',
                priority: 'high',
                completed: false
            });
        }

        tasks.push({
            id: 'task_' + Date.now() + '_3',
            title: 'Research Universities',
            description: 'Explore AI-recommended universities',
            priority: 'medium',
            completed: false
        });

        tasks.push({
            id: 'task_' + Date.now() + '_4',
            title: 'Prepare Financial Documents',
            description: 'Gather bank statements and sponsorship letters',
            priority: 'medium',
            completed: false
        });

        return tasks;
    }
});
