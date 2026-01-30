// Profile Management Logic

document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    if (!requireAuth()) return;

    // Get current user and UID
    const currentUser = localStorage.getItem('currentUser');
    const currentUID = localStorage.getItem('currentUID');

    let userData = null;

    // If we have a UID, fetch the latest from cloud
    if (currentUID) {
        userData = await fetchUserRemote(currentUID);
    } else {
        // Fallback to local data
        userData = getCurrentUser();
    }

    if (!userData) {
        window.location.href = 'auth.html';
        return;
    }

    // Check onboarding
    if (!checkOnboardingComplete()) return;

    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const editNameBtn = document.getElementById('editNameBtn');
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');

    let currentSection = null;

    // Display user info
    function displayProfileHeader() {
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileEmail').textContent = userData.email;
    }

    displayProfileHeader();

    // Display profile sections
    function refreshUI() {
        displayAcademicSection();
        displayGoalsSection();
        displayBudgetSection();
        displayExamsSection();
    }

    refreshUI();

    function displayAcademicSection() {
        const section = document.getElementById('academicSection');
        section.innerHTML = `
            <div class="profile-field">
                <span class="field-label">Education Level</span>
                <span class="field-value">${userData.profile.educationLevel || '<span class="empty">Not specified</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Degree/Major</span>
                <span class="field-value">${userData.profile.degreeMajor || '<span class="empty">Not specified</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Graduation Year</span>
                <span class="field-value">${userData.profile.graduationYear || '<span class="empty">Not specified</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">GPA</span>
                <span class="field-value">${userData.profile.gpa || '<span class="empty">Not specified</span>'}</span>
            </div>
        `;
    }

    function displayGoalsSection() {
        const section = document.getElementById('goalsSection');
        const countries = userData.profile.preferredCountries ? userData.profile.preferredCountries.join(', ') : '<span class="empty">Not specified</span>';
        section.innerHTML = `
            <div class="profile-field">
                <span class="field-label">Intended Degree</span>
                <span class="field-value">${userData.profile.intendedDegree || '<span class="empty">Not specified</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Field of Study</span>
                <span class="field-value">${userData.profile.fieldOfStudy || '<span class="empty">Not specified</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Intake</span>
                <span class="field-value">${userData.profile.intakeSeason || ''} ${userData.profile.intakeYear || '<span class="empty">Not specified</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Preferred Countries</span>
                <span class="field-value">${countries}</span>
            </div>
        `;
    }

    function displayBudgetSection() {
        const section = document.getElementById('budgetSection');
        const funding = userData.profile.fundingPlan ? (Array.isArray(userData.profile.fundingPlan) ? userData.profile.fundingPlan.join(', ') : userData.profile.fundingPlan) : '<span class="empty">Not specified</span>';
        section.innerHTML = `
            <div class="profile-field">
                <span class="field-label">Budget Range</span>
                <span class="field-value">${userData.profile.budgetRange || '<span class="empty">Not specified</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Funding Plan</span>
                <span class="field-value">${funding}</span>
            </div>
        `;
    }

    function displayExamsSection() {
        const section = document.getElementById('examsSection');
        section.innerHTML = `
            <div class="profile-field">
                <span class="field-label">English Test</span>
                <span class="field-value">${userData.profile.englishTest || '<span class="empty">Not taken</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">English Score</span>
                <span class="field-value">${userData.profile.englishScore || '<span class="empty">N/A</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Standardized Test</span>
                <span class="field-value">${userData.profile.standardizedTest || '<span class="empty">Not taken</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">Test Score</span>
                <span class="field-value">${userData.profile.standardizedScore || '<span class="empty">N/A</span>'}</span>
            </div>
            <div class="profile-field">
                <span class="field-label">SOP Status</span>
                <span class="field-value" style="text-transform: capitalize;">${(userData.profile.sopStatus || 'not-started').replace('-', ' ')}</span>
            </div>
        `;
    }

    // Edit section buttons
    document.querySelectorAll('.edit-section-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            currentSection = this.dataset.section;
            openEditModal(currentSection);
        });
    });

    function openEditModal(section) {
        const modalTitle = document.getElementById('editModalTitle');
        const modalBody = document.getElementById('editModalBody');

        let formHTML = '';

        if (section === 'academic') {
            modalTitle.textContent = 'Edit Academic Background';
            formHTML = `
                <div class="input-group"><label>Education Level</label><input type="text" class="input-field" id="edit_educationLevel" value="${userData.profile.educationLevel || ''}"></div>
                <div class="input-group"><label>Degree/Major</label><input type="text" class="input-field" id="edit_degreeMajor" value="${userData.profile.degreeMajor || ''}"></div>
                <div class="input-group"><label>Graduation Year</label><input type="number" class="input-field" id="edit_graduationYear" value="${userData.profile.graduationYear || ''}"></div>
                <div class="input-group"><label>GPA</label><input type="text" class="input-field" id="edit_gpa" value="${userData.profile.gpa || ''}"></div>
            `;
        } else if (section === 'goals') {
            modalTitle.textContent = 'Edit Study Goals';
            formHTML = `
                <div class="input-group"><label>Intended Degree</label><input type="text" class="input-field" id="edit_intendedDegree" value="${userData.profile.intendedDegree || ''}"></div>
                <div class="input-group"><label>Field of Study</label><input type="text" class="input-field" id="edit_fieldOfStudy" value="${userData.profile.fieldOfStudy || ''}"></div>
                <div class="input-group"><label>Intake Year</label><input type="number" class="input-field" id="edit_intakeYear" value="${userData.profile.intakeYear || ''}"></div>
                <div class="input-group"><label>Preferred Countries</label><input type="text" class="input-field" id="edit_preferredCountries" value="${userData.profile.preferredCountries ? userData.profile.preferredCountries.join(', ') : ''}"></div>
            `;
        } else if (section === 'budget') {
            modalTitle.textContent = 'Edit Budget';
            formHTML = `
                <div class="input-group"><label>Budget Range</label><input type="text" class="input-field" id="edit_budgetRange" value="${userData.profile.budgetRange || ''}"></div>
                <div class="input-group"><label>Funding Plan</label><input type="text" class="input-field" id="edit_fundingPlan" value="${userData.profile.fundingPlan || ''}"></div>
            `;
        } else if (section === 'exams') {
            modalTitle.textContent = 'Edit Exams';
            formHTML = `
                <div class="input-group"><label>English Test</label><input type="text" class="input-field" id="edit_englishTest" value="${userData.profile.englishTest || ''}" placeholder="e.g. IELTS, TOEFL"></div>
                <div class="input-group"><label>English Score</label><input type="text" class="input-field" id="edit_englishScore" value="${userData.profile.englishScore || ''}"></div>
                <div class="input-group"><label>Standardized Test</label><input type="text" class="input-field" id="edit_standardizedTest" value="${userData.profile.standardizedTest || ''}" placeholder="e.g. GRE, GMAT"></div>
                <div class="input-group"><label>Test Score</label><input type="text" class="input-field" id="edit_standardizedScore" value="${userData.profile.standardizedScore || ''}"></div>
                <div class="input-group"><label>SOP Status</label>
                    <select class="input-field" id="edit_sopStatus">
                        <option value="not-started" ${userData.profile.sopStatus === 'not-started' ? 'selected' : ''}>Not Started</option>
                        <option value="in-progress" ${userData.profile.sopStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${userData.profile.sopStatus === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            `;
        }

        modalBody.innerHTML = formHTML;
        editModal.classList.remove('hidden');
    }

    function closeModal() {
        editModal.classList.add('hidden');
        currentSection = null;
    }

    closeEditModal.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);

    saveEditBtn.addEventListener('click', async function () {
        if (currentSection === 'academic') {
            userData.profile.educationLevel = document.getElementById('edit_educationLevel').value;
            userData.profile.degreeMajor = document.getElementById('edit_degreeMajor').value;
            userData.profile.graduationYear = document.getElementById('edit_graduationYear').value;
            userData.profile.gpa = document.getElementById('edit_gpa').value;
        } else if (currentSection === 'goals') {
            userData.profile.fieldOfStudy = document.getElementById('edit_fieldOfStudy').value;
            userData.profile.intendedDegree = document.getElementById('edit_intendedDegree').value;
            userData.profile.intakeYear = document.getElementById('edit_intakeYear').value;
            userData.profile.preferredCountries = document.getElementById('edit_preferredCountries').value.split(',').map(c => c.trim()).filter(c => c);
        } else if (currentSection === 'budget') {
            userData.profile.budgetRange = document.getElementById('edit_budgetRange').value;
            userData.profile.fundingPlan = document.getElementById('edit_fundingPlan').value;
        } else if (currentSection === 'exams') {
            userData.profile.englishTest = document.getElementById('edit_englishTest').value;
            userData.profile.englishScore = document.getElementById('edit_englishScore').value;
            userData.profile.standardizedTest = document.getElementById('edit_standardizedTest').value;
            userData.profile.standardizedScore = document.getElementById('edit_standardizedScore').value;
            userData.profile.sopStatus = document.getElementById('edit_sopStatus').value;
        }

        // Sync to cloud
        await saveUserData(currentUser, userData);
        refreshUI();
        closeModal();
    });

    editNameBtn.addEventListener('click', async function () {
        const newName = prompt('Enter name:', userData.name);
        if (newName) {
            userData.name = newName;
            await saveUserData(currentUser, userData);
            displayProfileHeader();
        }
    });

    backBtn.addEventListener('click', () => window.location.href = 'dashboard.html');
    logoutBtn.addEventListener('click', () => { if (confirm('Logout?')) logout(); });
});

