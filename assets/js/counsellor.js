document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication and onboarding
    if (!requireAuth()) return;
    if (!checkOnboardingComplete()) return;

    const currentUser = localStorage.getItem('currentUser');
    const currentUID = localStorage.getItem('currentUID');
    let userData = null;

    // Initialization
    if (currentUID) {
        userData = await fetchUserRemote(currentUID);
    }

    if (!userData) {
        userData = getUserData(currentUser);
    }

    if (!userData) {
        window.location.href = 'auth.html';
        return;
    }

    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const clearChatBtn = document.getElementById('clearChatBtn');
    const backBtn = document.getElementById('backBtn');

    // Restore chat history from fresh data
    renderChatHistory();

    function renderChatHistory() {
        const welcomeMsgHTML = `
            <div class="message ai welcome-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <h3>Welcome! I'm your AI Study Abroad Counsellor 🎓</h3>
                    <p>I can help you with:</p>
                    <ul>
                        <li>Finding the perfect universities based on your profile</li>
                        <li>Understanding your strengths and areas to improve</li>
                        <li>Creating personalized tasks and action plans</li>
                        <li>Answering questions about the application process</li>
                    </ul>
                    <p>Ask me anything or try these suggestions:</p>
                    <div class="quick-suggestions">
                        <button class="suggestion-chip ripple" data-suggestion="What universities match my profile?"><i class="fas fa-university"></i> Recommend universities</button>
                        <button class="suggestion-chip ripple" data-suggestion="What should I work on next?"><i class="fas fa-tasks"></i> Next steps</button>
                        <button class="suggestion-chip ripple" data-suggestion="Analyze my profile strength"><i class="fas fa-chart-line"></i> Profile analysis</button>
                    </div>
                </div>
            </div>`;

        chatMessages.innerHTML = welcomeMsgHTML;

        if (userData.chatHistory && userData.chatHistory.length > 0) {
            userData.chatHistory.forEach(msg => {
                // If we have history, we might want to hide the welcome message or keep it.
                // User said "Not disappear". So we keep it.
                if (msg.type === 'user') addUserMessage(msg.text, false);
                else addAIMessage(msg.text, false, false);
            });
            // Scroll to bottom if history exists
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Re-attach suggestion listeners
        attachSuggestionListeners();
    }

    function attachSuggestionListeners() {
        console.log('Counsellor: Attaching suggestion listeners...');
        document.querySelectorAll('.suggestion-chip').forEach(btn => {
            // Defensive check to prevent double attachment
            if (btn.dataset.listenerAttached === 'true') return;

            btn.addEventListener('click', function () {
                const text = this.dataset.suggestion;
                chatInput.value = text;
                sendMessage();
            });

            btn.dataset.listenerAttached = 'true';
        });
    }

    // Action handler
    window.handleChatAction = function (action, id, name) {
        // Reload fresh userData to avoid stale data
        const currentUser = localStorage.getItem('currentUser');
        const freshData = getUserData(currentUser);
        Object.assign(userData, freshData);

        console.log('[Chat Action] Action:', action, 'ID:', id, 'Name:', name);

        let text = '';
        if (action === 'shortlist') {
            if (!userData.shortlistedUniversities) userData.shortlistedUniversities = [];
            if (!userData.shortlistedUniversities.includes(id)) {
                userData.shortlistedUniversities.push(id);
                console.log('[Chat Action] Added to shortlist. New shortlist:', userData.shortlistedUniversities);

                // --- TASK SYNC START ---
                if (!userData.tasks) userData.tasks = [];
                let shortlistTask = userData.tasks.find(t => t.id === 'shortlist_task');

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

                // Set true if > 0
                shortlistTask.completed = userData.shortlistedUniversities.length > 0;
                // --- TASK SYNC END ---

                saveUserData(currentUser, userData);  // Auto-deduplicates
                console.log('[Chat Action] Saved to localStorage');

                // Dispatch event so Dashboard updates strength immediately
                window.dispatchEvent(new CustomEvent('profileUpdated', {
                    detail: { shortlistCount: userData.shortlistedUniversities.length }
                }));

                text = `I've added ${name} to your shortlist.`;
            } else {
                console.log('[Chat Action] Already in shortlist');
                text = `${name} is already in your shortlist.`;
            }
        } else if (action === 'lock') {
            // Basic lock logic hook
            text = `To lock ${name}, please go to the Universities page and click the Lock button.`;
        }
        addAIMessage(text);
    };

    // Clean shortlist on counsellor page load
    if (userData.shortlistedUniversities) {
        const originalLength = userData.shortlistedUniversities.length;
        userData.shortlistedUniversities = cleanShortlist(userData.shortlistedUniversities);
        // DON'T save here - would trigger field change detection!
        if (originalLength !== userData.shortlistedUniversities.length) {
            console.log(`Counsellor: Removed ${originalLength - userData.shortlistedUniversities.length} duplicate(s)`);
        }
    }



    // Suggestion chips listeners are handled by attachSuggestionListeners() called in renderChatHistory()

    // Send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addUserMessage(message);
        chatInput.value = '';

        // Show typing indicator
        showTypingIndicator();

        setTimeout(async () => {
            hideTypingIndicator();
            const response = await generateAIResponse(message);
            addAIMessage(response);
        }, 1000 + Math.random() * 1000);
    }

    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function addUserMessage(text, save = true) {
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

        if (save) {
            userData.chatHistory.push({ type: 'user', text: text, timestamp: new Date().toISOString() });
            saveUserData(currentUser, userData);
        }
    }

    function addAIMessage(text, save = true) {
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

        if (save) {
            userData.chatHistory.push({ type: 'ai', text: text, timestamp: new Date().toISOString() });
            saveUserData(currentUser, userData);
        }
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message ai typing-message';
        indicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.querySelector('.typing-message');
        if (indicator) {
            indicator.remove();
        }
    }

    // Rule-based AI response generation
    async function generateAIResponse(message) {
        // Reload user data to get latest profile changes
        const currentUser = localStorage.getItem('currentUser');
        const userData = getUserData(currentUser);

        const lowerMessage = message.toLowerCase();

        // Greeting Handler
        if (lowerMessage.match(/^(hi|hello|hey|greetings|how are you|good morning|good afternoon)/i)) {
            const greetings = [
                `Hello! I'm your AI Study Abroad Counsellor. How can I help you today?`,
                `Hi there! Ready to take the next step in your education? What's on your mind?`,
                `Hey! I've been reviewing your profile. You're making great progress. How can I assist you?`,
                `Greetings! I can help you with university matches, SOP tips, or general advice. What do you need?`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // University recommendations
        if (lowerMessage.includes('university') || lowerMessage.includes('universities') || lowerMessage.includes('recommend') || lowerMessage.includes('match') || lowerMessage.includes('where')) {
            // Detect country in message
            let countryQuery = null;
            const countriesList = [
                'usa', 'united states', 'canada', 'germany', 'uk', 'united kingdom',
                'australia', 'france', 'italy', 'new zealand', 'ukraine', 'india',
                'japan', 'singapore', 'russia', 'ireland', 'netherlands', 'spain',
                'south korea', 'korea', 'uae', 'emirates', 'austria', 'poland',
                'georgia', 'malaysia'
            ];
            countriesList.forEach(c => {
                // Exact word match to avoid 'uk' matching 'ukraine'
                const regex = new RegExp(`\\b${c}\\b`, 'i');
                if (lowerMessage.match(regex)) countryQuery = c;
            });

            const universities = await generateUniversityRecommendations(countryQuery, userData);
            let response = countryQuery
                ? `I've found some excellent universities in <strong>${countryQuery.toUpperCase()}</strong> for your ${userData.profile.fieldOfStudy} journey:\n\n`
                : `Based on your profile (${userData.profile.fieldOfStudy} in ${userData.profile.intendedDegree}), here are my top recommendations:\n\n`;

            universities.slice(0, 3).forEach((uni, index) => {
                response += `${index + 1}. <strong>${uni.name}</strong> (${uni.category})\n   - ${uni.reason}\n   - Acceptance: ${uni.acceptanceChance}\n`;
                response += `<button class='chat-action-btn ripple' onclick="handleChatAction('shortlist', '${uni.id}', '${uni.name}')">Shortlist</button>\n\n`;
            });
            response += `You can explore all verified universities on the Universities page.`;
            return response;
        }

        // Profile analysis
        if (lowerMessage.includes('profile') || lowerMessage.includes('strength') || lowerMessage.includes('analyze')) {
            // CRITICAL: Reload user data to ensure we use the latest state
            // This matches the pattern used in the rest of generateAIResponse
            const currentUser = localStorage.getItem('currentUser');
            const currentUID = localStorage.getItem('currentUID');
            let freshUserData = null;

            // Fetch the most recent data (same logic as top of page)
            if (currentUID) {
                freshUserData = await fetchUserRemote(currentUID);
            }

            if (!freshUserData) {
                freshUserData = getUserData(currentUser);
            }

            // CRITICAL: Regenerate tasks to sync "trusted source" tasks (like dashboard does)
            // This ensures shortlist_task, lock_final_list, eng_test, sop_task have correct completion status
            if (freshUserData) {
                generateTasks(freshUserData);
            }

            // Use fresh data for calculation to ensure sync with dashboard
            const score = calculateProfileStrength(freshUserData);
            const strengthInfo = getProfileStrengthLabel(score);
            const tips = generateProfileTips(freshUserData);

            let response = `Your profile strength is <strong>${score}%</strong> - ${strengthInfo.label}. Here's what I found:\n\n`;
            response += `<strong>Strengths:</strong>\n`;
            if (freshUserData.profile.gpa) response += `✓ Strong GPA of ${freshUserData.profile.gpa}\n`;
            if (freshUserData.profile.englishScore) response += `✓ English proficiency test completed\n`;
            if (freshUserData.profile.sopStatus === 'completed') response += `✓ SOP ready\n`;

            response += `\n<strong>Areas to improve:</strong>\n`;
            tips.forEach(tip => {
                response += `• ${tip}\n`;
            });

            return response;
        }

        // Next steps / tasks - READ FROM TO-DO LIST (SINGLE SOURCE OF TRUTH)
        if (lowerMessage.includes('next') || lowerMessage.includes('task') || lowerMessage.includes('do') || lowerMessage.includes('should')) {
            // Get pending tasks from the To-Do list using shared function from common.js
            const pendingTasks = getPendingTasks(userData);

            if (pendingTasks.length === 0) {
                return `✅ Great news! You've completed all your current tasks. You're on track! Keep up the excellent work and check back after you make progress on your applications.`;
            }

            let response = `Here are your  pending tasks from your To-Do list:\n\n`;

            // Display up to 5 pending tasks
            pendingTasks.slice(0, 5).forEach((task, index) => {
                const priorityEmoji = task.priority === 'critical' || task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢';
                response += `${index + 1}. ${priorityEmoji} <strong>${task.title}</strong>\n`;
                response += `   ${task.description}\n\n`;
            });

            if (pendingTasks.length > 5) {
                response += `...and ${pendingTasks.length - 5} more task(s). Check your dashboard for the complete list.\n\n`;
            }

            response += `These tasks are synced with your dashboard. Mark them complete there to track your progress!`;
            return response;
        }

        // Budget / funding
        if (lowerMessage.includes('budget') || lowerMessage.includes('cost') || lowerMessage.includes('funding') || lowerMessage.includes('scholarship')) {
            const budgetRange = userData.profile.budgetRange || 'not specified';
            return `Your budget range is <strong>${budgetRange}</strong>. Here are some tips:\n\n• Look for universities with scholarship opportunities\n• Consider countries with lower living costs (Germany, Canada)\n• Apply for external scholarships (Fulbright, Chevening, etc.)\n• Research assistantships can significantly reduce costs\n\nWould you like me to recommend universities within your budget?`;
        }

        // SOP / documents
        if (lowerMessage.includes('sop') || lowerMessage.includes('statement') || lowerMessage.includes('document')) {
            const sopStatus = userData.profile.sopStatus || 'not started';
            let response = `Your SOP status is: <strong>${sopStatus}</strong>.\n\n`;
            response += `Tips for a strong SOP:\n`;
            response += `• Start with a compelling story\n`;
            response += `• Clearly state your goals and motivations\n`;
            response += `• Connect your past experiences to future aspirations\n`;
            response += `• Tailor each SOP to the specific university\n`;
            response += `• Keep it concise (typically 500-1000 words)\n\n`;
            response += `Would you like me to create a task reminder for SOP completion?`;
            return response;
        }

        // Default / fallback
        const defaultResponses = [
            `That's a great question! Based on your profile in ${userData.profile.fieldOfStudy}, I'd recommend focusing on strengthening your application materials. What specific aspect would you like help with?`,
            `I'm here to help with your study abroad journey. You can ask me about university recommendations, profile improvements, application deadlines, or any other questions you have!`,
            `Let me help you with that. Could you be more specific? For example, you can ask about universities, next steps, budget planning, or document preparation.`,
            `I understand you're looking for guidance. Feel free to ask me about:\n• University recommendations\n• Profile analysis\n• Application timeline\n• Required documents\n• Scholarship opportunities`
        ];

        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    function addTaskIfNotExists(title, description, priority) {
        const taskExists = userData.tasks.some(task => task.title === title);
        if (!taskExists) {
            userData.tasks.push({
                id: 'task_' + Date.now(),
                title: title,
                description: description,
                priority: priority,
                completed: false
            });
            saveUserData(currentUser, userData);
        }
    }

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

    async function generateUniversityRecommendations(queryCountry = null, userDataParam = null) {
        // Use passed userData or fall back to module-level userData
        const currentUserData = userDataParam || userData;
        const field = currentUserData.profile.fieldOfStudy || '';
        const prefs = queryCountry ? [queryCountry] : (currentUserData.profile.preferredCountries || []);

        try {
            // Build query parameters
            const params = new URLSearchParams();

            // Add countries to search
            if (prefs.length > 0) {
                prefs.forEach(country => {
                    if (country && country !== 'Other') {
                        params.append('country', country);
                    }
                });
            }

            // Add field of study
            if (field) {
                params.append('field', field);
            }

            // Check if we have any filters at all
            const hasFilters = prefs.length > 0 || field;

            // Limit to 5 recommendations for chat
            params.append('limit', '5');

            // Fetch from API - Using global API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/universities?${params.toString()}`);

            if (!response.ok) {
                throw new Error('Failed to fetch universities');
            }

            const data = await response.json();

            if (!data.success || data.universities.length === 0) {
                // When filtered query fails, try fallback WITH country filter if user specified one
                let fallbackParams = new URLSearchParams();

                // IMPORTANT: If user asked for specific country, preserve it in fallback
                if (queryCountry) {
                    // User explicitly asked for a country (e.g., "universities in Russia")
                    fallbackParams.append('country', queryCountry);
                } else if (prefs.length > 0) {
                    // User has countries in profile
                    prefs.forEach(country => {
                        if (country && country !== 'Other') {
                            fallbackParams.append('country', country);
                        }
                    });
                }

                fallbackParams.append('limit', '5');

                const fallbackResponse = await fetch(`${API_BASE_URL}/universities?${fallbackParams.toString()}`);
                const fallbackData = await fallbackResponse.json();

                if (fallbackData.success && fallbackData.universities.length > 0) {
                    // Use fallback data
                    data.success = true;
                    data.universities = fallbackData.universities;
                } else {
                    // If even country-specific fallback fails, it means no universities in that country
                    const countryName = queryCountry || (prefs.length > 0 ? prefs.join(', ') : 'your selected countries');
                    return [{
                        id: 'no-match',
                        name: 'No universities found',
                        category: 'info',
                        reason: queryCountry
                            ? `No universities available in ${queryCountry.toUpperCase()} in our database. Try another country?`
                            : hasFilters
                                ? 'No matches for your filters. Try adjusting your field of study or preferred countries.'
                                : 'Complete your profile (Field of Study & Preferred Countries) for personalized recommendations',
                        acceptanceChance: 'N/A'
                    }];
                }
            }

            // Transform API data to match chat format - Using Prisma field names
            return data.universities.map(uni => ({
                id: uni.id,
                name: uni.name,
                country: uni.country,
                category: determineCategoryByRanking(uni.rankingQS),
                reason: `Top-ranked for ${field || 'your field'} with ${uni.internationalStudents} international students`,
                acceptanceChance: uni.acceptanceRate
            }));

        } catch (error) {
            console.error('Error fetching university recommendations:', error);
            return [{
                id: 'error',
                name: 'Unable to load recommendations',
                category: 'error',
                reason: 'Data synchronization issue with the backend server',
                acceptanceChance: 'N/A'
            }];
        }
    }

    // Helper function to determine category based on QS ranking
    function determineCategoryByRanking(qsRank) {
        if (!qsRank) return 'Safe';
        if (qsRank <= 50) return 'Dream';
        if (qsRank <= 200) return 'Target';
        return 'Safe';
    }

    // Clear chat
    clearChatBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to clear the chat history?')) {
            userData.chatHistory = [];
            saveUserData(currentUser, userData);

            // Remove all messages except welcome
            const messages = chatMessages.querySelectorAll('.message:not(.welcome-message)');
            messages.forEach(msg => msg.remove());
        }
    });

    // Back button
    backBtn.addEventListener('click', function () {
        window.location.href = 'dashboard.html';
    });
});
