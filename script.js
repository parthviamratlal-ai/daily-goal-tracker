document.addEventListener('DOMContentLoaded', () => {
    // --- Global State & Utilities ---
    let quests = JSON.parse(localStorage.getItem('magicQuests')) || [];
    let settings = JSON.parse(localStorage.getItem('magicSettings')) || {
        darkMode: false,
        dailyWhispers: true,
        weeklySpells: false,
        monthlyVisions: false,
        hapticFeedback: false,
        volume: 75
    };

    /**
     * Saves the current quests array to localStorage.
     */
    function saveQuests() {
        localStorage.setItem('magicQuests', JSON.stringify(quests));
        // After saving, re-render relevant parts if on Home or Summary screen
        if (document.body.classList.contains('home-screen')) {
            renderQuestsHome();
            updateProgressCircleHome();
        }
        if (document.body.classList.contains('summary-screen')) {
            updateSummaryProgress();
            updateWeeklyArcanaChart();
        }
    }

    /**
     * Saves the current settings object to localStorage.
     */
    function saveSettings() {
        localStorage.setItem('magicSettings', JSON.stringify(settings));
        applyTheme(); // Apply theme settings immediately after saving
    }

    /**
     * Applies the saved theme settings to the document body and updates theme buttons.
     */
    function applyTheme() {
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Update theme buttons' active state if on the settings page
        if (document.body.classList.contains('settings-screen')) {
            const lightModeBtn = document.getElementById('lightModeBtn');
            const darkModeBtn = document.getElementById('darkModeBtn');
            if (lightModeBtn && darkModeBtn) {
                if (settings.darkMode) {
                    lightModeBtn.classList.remove('active');
                    darkModeBtn.classList.add('active');
                } else {
                    lightModeBtn.classList.add('active');
                    darkModeBtn.classList.remove('active');
                }
            }
        }
    }

    // Apply theme on initial load for any page
    applyTheme();

    // --- Home/Dashboard Screen Logic ---
    if (document.body.classList.contains('home-screen')) {
        const homeQuestList = document.getElementById('homeQuestList');
        const progressPercentageText = document.querySelector('.progress-card .progress-percentage');
        const progressBar = document.querySelector('.progress-card .progress-bar');
        const circleCircumference = 2 * Math.PI * 54; // r=54 from CSS

        // Set current date
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);

        /**
         * Renders the list of quests on the home screen.
         * Clears existing list and re-populates from the 'quests' array.
         */
        function renderQuestsHome() {
            homeQuestList.innerHTML = ''; // Clear existing quests
            if (quests.length === 0) {
                homeQuestList.innerHTML = '<li class="quest-item no-quests-message">No quests yet! Add a new one to begin your magic journey.</li>';
            } else {
                quests.forEach(quest => {
                    const listItem = document.createElement('li');
                    listItem.classList.add('quest-item');
                    if (quest.completed) {
                        listItem.classList.add('completed');
                    }
                    listItem.dataset.id = quest.id; // Store quest ID for event handling

                    const iconType = quest.type === 'Health' ? 'favorite' :
                                     quest.type === 'Career' ? 'settings' :
                                     quest.type === 'Hobby' ? 'brush' : 'category'; // Default icon

                    listItem.innerHTML = `
                        <span class="material-symbols-rounded quest-icon">${iconType}</span>
                        <p>${quest.name}</p>
                        <span class="material-symbols-rounded quest-status-toggle" data-quest-id="${quest.id}">
                            ${quest.completed ? 'task_alt' : 'radio_button_unchecked'}
                        </span>
                    `;
                    homeQuestList.appendChild(listItem);
                });
            }
        }

        /**
         * Updates the progress circle percentage and fill based on completed quests.
         */
        function updateProgressCircleHome() {
            const totalQuests = quests.length;
            const completedQuests = quests.filter(q => q.completed).length;
            const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

            if (progressBar && progressPercentageText) {
                progressBar.style.strokeDashoffset = circleCircumference - (circleCircumference * progress) / 100;
                progressPercentageText.textContent = `${progress}%`;
            }
        }

        // Event delegation for toggling quest completion
        homeQuestList.addEventListener('click', (event) => {
            const toggleElement = event.target.closest('.quest-status-toggle');
            if (toggleElement) {
                const questId = toggleElement.dataset.questId;
                const questIndex = quests.findIndex(q => q.id === questId);

                if (questIndex > -1) {
                    quests[questIndex].completed = !quests[questIndex].completed;
                    saveQuests(); // This will trigger re-rendering via saveQuests
                }
            }
        });

        // Initial render for home screen components
        renderQuestsHome();
        updateProgressCircleHome();
        console.log('Home screen scripts initialized.');
    }

    // --- Add Quest Screen Logic ---
    if (document.body.classList.contains('add-quest-screen')) {
        const reminderToggle = document.getElementById('reminderToggle');
        const reminderOptions = document.querySelector('.reminder-options');
        const reminderButtons = document.querySelectorAll('.reminder-btn');
        const craftQuestBtn = document.getElementById('craftQuestBtn');
        const questNameInput = document.getElementById('questName');

        // Initial state for reminder options visibility
        if (!reminderToggle.checked) {
            reminderOptions.style.display = 'none';
        }

        // Toggle reminder options visibility
        reminderToggle.addEventListener('change', () => {
            if (reminderToggle.checked) {
                reminderOptions.style.display = 'flex';
                // Automatically select 'Daily' if no other option is active
                if (!document.querySelector('.reminder-btn.active')) {
                    const dailyBtn = document.querySelector('.reminder-btn[data-frequency="daily"]');
                    if (dailyBtn) dailyBtn.classList.add('active');
                }
            } else {
                reminderOptions.style.display = 'none';
                reminderButtons.forEach(btn => btn.classList.remove('active'));
            }
        });

        // Handle reminder frequency button selection
        reminderButtons.forEach(button => {
            button.addEventListener('click', () => {
                reminderButtons.forEach(btn => btn.classList.remove('active')); // Deactivate all
                button.classList.add('active'); // Activate clicked button
            });
        });

        // Handle "Craft & Begin Quest" button click
        craftQuestBtn.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default form submission

            const questName = questNameInput.value.trim();
            const typeOfMagic = document.querySelector('input[name="typeOfMagic"]:checked')?.value;
            const difficulty = document.querySelector('input[name="difficulty"]:checked')?.value;
            const reminderEnabled = reminderToggle.checked;
            const reminderFrequency = reminderEnabled ? document.querySelector('.reminder-btn.active')?.dataset.frequency : 'none';

            // Basic form validation
            if (questName === '') {
                alert('Please enter a Quest Name!');
                return;
            }
            if (!typeOfMagic) {
                alert('Please select a Type of Magic!');
                return;
            }
            if (!difficulty) {
                alert('Please select a Difficulty!');
                return;
            }

            // Create new quest object
            const newQuest = {
                id: crypto.randomUUID(), // More robust unique ID for modern browsers
                name: questName,
                type: typeOfMagic,
                difficulty: difficulty,
                reminder: reminderEnabled,
                reminderFrequency: reminderFrequency,
                completed: false,
                createdAt: new Date().toISOString() // Store creation date for stats
            };

            quests.push(newQuest); // Add to global quests array
            saveQuests(); // Save to localStorage and trigger Home/Summary updates
            alert(`Quest "${questName}" crafted!`);

            // Reset form
            questNameInput.value = '';
            document.getElementById('typeHealth').checked = true; // Default Type of Magic
            document.getElementById('diffApprentice').checked = true; // Default Difficulty
            reminderToggle.checked = false;
            reminderOptions.style.display = 'none';
            reminderButtons.forEach(btn => btn.classList.remove('active'));
            if (reminderButtons[0]) reminderButtons[0].classList.add('active'); // Re-activate default daily if needed

            // Navigate back to the home screen
            window.location.href = 'index.html';
        });
        console.log('Add Quest screen scripts initialized.');
    }

    // --- Summary/Progress Screen Logic ---
    if (document.body.classList.contains('summary-screen')) {
        const summaryProgressPercentageText = document.querySelector('.summary-screen .progress-card .progress-percentage');
        const summaryProgressBar = document.querySelector('.summary-screen .progress-card .progress-bar');
        const circleCircumference = 2 * Math.PI * 54;

        const questsCreatedCount = document.getElementById('questsCreatedCount');
        const questsCompletedCount = document.getElementById('questsCompletedCount');
        const weeklyArcanaChart = document.getElementById('weeklyArcanaChart');

        /**
         * Updates the overall progress circle and achievement counts on the Summary screen.
         */
        function updateSummaryProgress() {
            const totalQuests = quests.length;
            const completedQuests = quests.filter(q => q.completed).length;
            const progress = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

            if (summaryProgressBar && summaryProgressPercentageText) {
                summaryProgressBar.style.strokeDashoffset = circleCircumference - (circleCircumference * progress) / 100;
                summaryProgressPercentageText.textContent = `${progress}%`;
            }

            if (questsCreatedCount) questsCreatedCount.textContent = totalQuests;
            if (questsCompletedCount) questsCompletedCount.textContent = completedQuests;
        }

        /**
         * Dynamically updates the weekly bar chart based on quest completion dates.
         * A simplified approach for demo purposes.
         */
        function updateWeeklyArcanaChart() {
            const dayValues = new Array(7).fill(0); // Mo-Su, representing activity score

            quests.forEach(quest => {
                if (quest.completed) {
                    const questDate = new Date(quest.createdAt);
                    // Adjust to make Monday=0, Tuesday=1, ..., Sunday=6
                    const dayOfWeek = (questDate.getDay() + 6) % 7;
                    // Add points for completion, cap at 100% for bar height
                    dayValues[dayOfWeek] = Math.min(100, dayValues[dayOfWeek] + 20); // Each quest adds 20%
                }
            });

            const barColumns = weeklyArcanaChart.querySelectorAll('.bar-column .bar');
            barColumns.forEach((bar, index) => {
                bar.style.height = `${dayValues[index]}%`;
            });
        }

        // Initial render for summary screen components
        updateSummaryProgress();
        updateWeeklyArcanaChart();
        console.log('Summary screen scripts initialized.');
    }

    // --- Settings Screen Logic ---
    if (document.body.classList.contains('settings-screen')) {
        const dailyWhispersToggle = document.getElementById('dailyWhispers');
        const weeklySpellsToggle = document.getElementById('weeklySpells');
        const monthlyVisionsToggle = document.getElementById('monthlyVisions');
        const hapticFeedbackToggle = document.getElementById('hapticFeedback');
        const volumeSlider = document.getElementById('volumeSlider');
        const lightModeBtn = document.getElementById('lightModeBtn');
        const darkModeBtn = document.getElementById('darkModeBtn');
        const editProfileItem = document.querySelector('.clickable-item'); // Assuming this is for edit profile

        // Load saved settings and update UI elements
        dailyWhispersToggle.checked = settings.dailyWhispers;
        weeklySpellsToggle.checked = settings.weeklySpells;
        monthlyVisionsToggle.checked = settings.monthlyVisions;
        hapticFeedbackToggle.checked = settings.hapticFeedback;
        volumeSlider.value = settings.volume;
        applyTheme(); // Updates theme buttons as well

        // Event Listeners for settings changes
        dailyWhispersToggle.addEventListener('change', () => {
            settings.dailyWhispers = dailyWhispersToggle.checked;
            saveSettings();
        });
        weeklySpellsToggle.addEventListener('change', () => {
            settings.weeklySpells = weeklySpellsToggle.checked;
            saveSettings();
        });
        monthlyVisionsToggle.addEventListener('change', () => {
            settings.monthlyVisions = monthlyVisionsToggle.checked;
            saveSettings();
        });
        hapticFeedbackToggle.addEventListener('change', () => {
            settings.hapticFeedback = hapticFeedbackToggle.checked;
            saveSettings();
            // In a real app, you'd trigger actual haptic feedback here if supported by the platform
            if (settings.hapticFeedback && 'vibrate' in navigator) {
                navigator.vibrate(50); // Small vibration
            }
        });
        volumeSlider.addEventListener('input', () => {
            settings.volume = volumeSlider.value;
            saveSettings();
            // In a real app, you'd adjust app sounds based on this value
        });

        lightModeBtn.addEventListener('click', () => {
            settings.darkMode = false;
            saveSettings();
        });
        darkModeBtn.addEventListener('click', () => {
            settings.darkMode = true;
            saveSettings();
        });

        if (editProfileItem) {
            editProfileItem.addEventListener('click', () => {
                alert('Edit Profile feature (design only in this demo. Implement your user profile logic here!)');
            });
        }
        console.log('Settings screen scripts initialized.');
    }
});