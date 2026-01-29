// Profile Management Logic

document.addEventListener('DOMContentLoaded', function () {
    // Check authentication and onboarding
    if (!requireAuth()) return;
    if (!checkOnboardingComplete()) return;

    const currentUser = localStorage.getItem('currentUser');
    const userData = getUserData(currentUser);

    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const editNameBtn = document.getElementById('editNameBtn');
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');

    let currentSection = null;

    // Display user info
    document.getElementById('profileName').textContent = userData.name;
    document.getElementById('profileEmail').textContent = userData.email;

    // Display profile sections
    displayAcademicSection();
    displayGoalsSection();
    displayBudgetSection();
    displayExamsSection();

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
        const funding = userData.profile.fundingPlan ? userData.profile.fundingPlan.join(', ') : '<span class="empty">Not specified</span>';
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
                <span class="field-value">${userData.profile.sopStatus || '<span class="empty">Not started</span>'}</span>
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
                <div class="input-group">
                    <label>Education Level</label>
                    <select class="input-field" id="edit_educationLevel">
                        <option value="highschool" ${userData.profile.educationLevel === 'highschool' ? 'selected' : ''}>High School</option>
                        <option value="bachelors" ${userData.profile.educationLevel === 'bachelors' ? 'selected' : ''}>Bachelor's</option>
                        <option value="masters" ${userData.profile.educationLevel === 'masters' ? 'selected' : ''}>Master's</option>
                        <option value="phd" ${userData.profile.educationLevel === 'phd' ? 'selected' : ''}>PhD</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Degree/Major</label>
                    <input type="text" class="input-field" id="edit_degreeMajor" value="${userData.profile.degreeMajor || ''}">
                </div>
                <div class="input-group">
                    <label>Graduation Year</label>
                    <input type="number" class="input-field" id="edit_graduationYear" value="${userData.profile.graduationYear || ''}">
                </div>
                <div class="input-group">
                    <label>GPA</label>
                    <input type="text" class="input-field" id="edit_gpa" value="${userData.profile.gpa || ''}">
                </div>
            `;
        } else if (section === 'goals') {
            modalTitle.textContent = 'Edit Study Goals';
            formHTML = `
                <div class="input-group">
                    <label>Intended Degree</label>
                    <select class="input-field" id="edit_intendedDegree">
                        <option value="bachelors" ${userData.profile.intendedDegree === 'bachelors' ? 'selected' : ''}>Bachelor's</option>
                        <option value="masters" ${userData.profile.intendedDegree === 'masters' ? 'selected' : ''}>Master's</option>
                        <option value="phd" ${userData.profile.intendedDegree === 'phd' ? 'selected' : ''}>PhD</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Field of Study</label>
                    <input type="text" class="input-field" id="edit_fieldOfStudy" value="${userData.profile.fieldOfStudy || ''}">
                </div>
                <div class="input-group">
                    <label>Intake Year</label>
                    <input type="number" class="input-field" id="edit_intakeYear" value="${userData.profile.intakeYear || ''}">
                </div>
                <div class="input-group">
                    <label>Preferred Countries (comma separated)</label>
                    <input type="text" class="input-field" id="edit_preferredCountries" value="${userData.profile.preferredCountries ? userData.profile.preferredCountries.join(', ') : ''}" placeholder="e.g. USA, Germany, Canada">
                </div>
            `;
        } else if (section === 'budget') {
            modalTitle.textContent = 'Edit Budget & Funding';
            formHTML = `
                <div class="input-group">
                    <label>Budget Range (USD/year)</label>
                    <select class="input-field" id="edit_budgetRange">
                        <option value="0-10000" ${userData.profile.budgetRange === '0-10000' ? 'selected' : ''}>$0 - $10,000</option>
                        <option value="10000-20000" ${userData.profile.budgetRange === '10000-20000' ? 'selected' : ''}>$10,000 - $20,000</option>
                        <option value="20000-30000" ${userData.profile.budgetRange === '20000-30000' ? 'selected' : ''}>$20,000 - $30,000</option>
                        <option value="30000-50000" ${userData.profile.budgetRange === '30000-50000' ? 'selected' : ''}>$30,000 - $50,000</option>
                        <option value="50000+" ${userData.profile.budgetRange === '50000+' ? 'selected' : ''}>$50,000+</option>
                    </select>
                </div>
            `;
        } else if (section === 'exams') {
            modalTitle.textContent = 'Edit Exams & Readiness';
            formHTML = `
                <div class="input-group">
                    <label>English Test</label>
                    <select class="input-field" id="edit_englishTest">
                        <option value="ielts" ${userData.profile.englishTest === 'ielts' ? 'selected' : ''}>IELTS</option>
                        <option value="toefl" ${userData.profile.englishTest === 'toefl' ? 'selected' : ''}>TOEFL</option>
                        <option value="pte" ${userData.profile.englishTest === 'pte' ? 'selected' : ''}>PTE</option>
                        <option value="none" ${userData.profile.englishTest === 'none' ? 'selected' : ''}>Not taken</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>English Score</label>
                    <input type="text" class="input-field" id="edit_englishScore" value="${userData.profile.englishScore || ''}">
                </div>
                <div class="input-group">
                    <label>SOP Status</label>
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

    saveEditBtn.addEventListener('click', function () {
        if (currentSection === 'academic') {
            userData.profile.educationLevel = document.getElementById('edit_educationLevel').value;
            userData.profile.degreeMajor = document.getElementById('edit_degreeMajor').value;
            userData.profile.graduationYear = document.getElementById('edit_graduationYear').value;
            userData.profile.gpa = document.getElementById('edit_gpa').value;
            displayAcademicSection();
        } else if (currentSection === 'goals') {
            userData.profile.intendedDegree = document.getElementById('edit_intendedDegree').value;
            userData.profile.fieldOfStudy = document.getElementById('edit_fieldOfStudy').value;
            userData.profile.intakeYear = document.getElementById('edit_intakeYear').value;
            userData.profile.intakeYear = document.getElementById('edit_intakeYear').value;
            userData.profile.preferredCountries = document.getElementById('edit_preferredCountries').value.split(',').map(c => c.trim()).filter(c => c);
            displayGoalsSection();
        } else if (currentSection === 'budget') {
            userData.profile.budgetRange = document.getElementById('edit_budgetRange').value;
            displayBudgetSection();
        } else if (currentSection === 'exams') {
            userData.profile.englishTest = document.getElementById('edit_englishTest').value;
            userData.profile.englishScore = document.getElementById('edit_englishScore').value;
            userData.profile.sopStatus = document.getElementById('edit_sopStatus').value;
            displayExamsSection();
        }

        // Save and recalculate dependent data
        saveUserData(currentUser, userData, { isProfileUpdate: true });

        // Trigger recalculations
        alert('Profile updated successfully! Your profile strength and recommendations will be refreshed.');

        closeModal();
    });

    // Edit name button
    editNameBtn.addEventListener('click', function () {
        const newName = prompt('Enter your new name:', userData.name);
        if (newName && newName.trim()) {
            userData.name = newName.trim();
            saveUserData(currentUser, userData);
            document.getElementById('profileName').textContent = userData.name;
        }
    });

    // Back button
    backBtn.addEventListener('click', function () {
        window.location.href = 'dashboard.html';
    });

    // Logout button
    logoutBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    });
});
