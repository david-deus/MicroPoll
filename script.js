// MicroPoll Application JavaScript

class MicroPoll {
    constructor() {
        this.polls = this.loadPolls();
        this.currentPoll = null;
        this.initializeEventListeners();
        this.showSection('create-section');
    }

    initializeEventListeners() {
        // Navigation
        document.getElementById('create-poll-btn').addEventListener('click', () => {
            this.showSection('create-section');
        });

        document.getElementById('view-polls-btn').addEventListener('click', () => {
            this.showSection('polls-section');
            this.displayPolls();
        });

        // Dark mode toggle
        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Load saved theme preference
        this.loadTheme();

        // Poll creation
        document.getElementById('add-option').addEventListener('click', () => {
            this.addOptionInput();
        });

        document.getElementById('poll-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPoll();
        });

        // Voting
        document.getElementById('vote-btn').addEventListener('click', () => {
            this.submitVote();
        });

        document.getElementById('view-results-btn').addEventListener('click', () => {
            this.showResults();
        });

        document.getElementById('back-to-polls').addEventListener('click', () => {
            this.showSection('polls-section');
            this.displayPolls();
        });

        // Export Results
document.getElementById('export-results-btn').addEventListener('click', () => {
    this.exportResults();
});

        // Dynamic option removal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-option')) {
                e.target.parentElement.remove();
            }
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active state from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');

        // Add active state to corresponding nav button
        const activeBtn = sectionId === 'create-section' ? 'create-poll-btn' : 'view-polls-btn';
        document.getElementById(activeBtn).classList.add('active');
    }

    addOptionInput() {
        const container = document.getElementById('options-container');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'option-input';
        input.placeholder = `Option ${container.children.length + 1}`;
        input.required = true;

        // Add remove button for options beyond the first two
        if (container.children.length >= 2) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.gap = '10px';

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-option';
            removeBtn.textContent = '×';
            removeBtn.style.background = '#e74c3c';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '50%';
            removeBtn.style.width = '30px';
            removeBtn.style.height = '30px';
            removeBtn.style.cursor = 'pointer';

            wrapper.appendChild(input);
            wrapper.appendChild(removeBtn);
            container.appendChild(wrapper);
        } else {
            container.appendChild(input);
        }
    }

    createPoll() {
        const question = document.getElementById('poll-question').value;
        const pollType = document.querySelector('input[name="poll-type"]:checked').value;
        const optionInputs = document.querySelectorAll('.option-input');

        const options = Array.from(optionInputs)
            .map(input => input.value)
            .filter(value => value.trim() !== '');

        if (options.length < 2) {
            alert('Please provide at least 2 options');
            return;
        }

        const poll = {
            id: Date.now().toString(),
            question,
            type: pollType,
            options: options.map(option => ({ text: option, votes: 0 })),
            createdAt: new Date().toISOString(),
            totalVotes: 0
        };

        this.polls.push(poll);
        this.savePolls();
        this.resetForm();

        alert('Poll created successfully!');
        this.showSection('polls-section');
        this.displayPolls();
    }

    resetForm() {
        document.getElementById('poll-form').reset();
        document.getElementById('options-container').innerHTML = `
            <input type="text" class="option-input" placeholder="Option 1" required>
            <input type="text" class="option-input" placeholder="Option 2" required>
        `;
    }

    displayPolls() {
        const pollsList = document.getElementById('polls-list');

        if (this.polls.length === 0) {
            pollsList.innerHTML = '<p>No polls created yet. Create your first poll!</p>';
            return;
        }

        pollsList.innerHTML = this.polls.map(poll => `
            <div class="poll-item">
                <h3>${this.escapeHtml(poll.question)}</h3>
                <div class="poll-meta">
                    Type: ${poll.type === 'single' ? 'Single Choice' : 'Multiple Choice'} |
                    Total Votes: ${poll.totalVotes} |
                    Created: ${new Date(poll.createdAt).toLocaleDateString()}
                </div>
                <div class="poll-actions">
                    <button class="btn-primary" onclick="app.loadPoll('${poll.id}')">Open Poll</button>
                    <button class="btn-secondary" onclick="app.deletePoll('${poll.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    loadPoll(pollId) {
        this.currentPoll = this.polls.find(poll => poll.id === pollId);
        if (!this.currentPoll) return;

        document.getElementById('vote-title').textContent = this.currentPoll.question;
        document.getElementById('vote-options').innerHTML = this.currentPoll.options.map((option, index) => `
            <label class="vote-option">
                <input type="${this.currentPoll.type === 'single' ? 'radio' : 'checkbox'}" name="vote" value="${index}">
                ${this.escapeHtml(option.text)}
            </label>
        `).join('');

        this.showSection('vote-section');
    }

    submitVote() {
        const selectedOptions = document.querySelectorAll('input[name="vote"]:checked');
        if (selectedOptions.length === 0) {
            alert('Please select at least one option');
            return;
        }

        selectedOptions.forEach(option => {
            const index = parseInt(option.value);
            this.currentPoll.options[index].votes++;
            this.currentPoll.totalVotes++;
        });

        this.savePolls();
        this.showResults();
    }

    showResults() {
    if (!this.currentPoll) return;

    document.getElementById('results-title').textContent = this.currentPoll.question;

    // Destroy previous chart if exists
    if (this.resultsChart) this.resultsChart.destroy();

    const ctx = document.getElementById('results-chart').getContext('2d');

    this.resultsChart = new Chart(ctx, {
        type: 'bar', // Change to 'pie' if you want a pie chart
        data: {
            labels: this.currentPoll.options.map(opt => opt.text),
            datasets: [{
                label: '# of Votes',
                data: this.currentPoll.options.map(opt => opt.votes),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.6)',
                    'rgba(46, 204, 113, 0.6)',
                    'rgba(231, 76, 60, 0.6)',
                    'rgba(241, 196, 15, 0.6)',
                    'rgba(155, 89, 182, 0.6)',
                    'rgba(26, 188, 156, 0.6)'
                ],
                borderColor: [
                    'rgba(52, 152, 219, 1)',
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)',
                    'rgba(241, 196, 15, 1)',
                    'rgba(155, 89, 182, 1)',
                    'rgba(26, 188, 156, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: this.currentPoll.question, font: { size: 18 } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    this.showSection('results-section');
}

exportResults() {
    if (!this.currentPoll) return;

    const exportData = {
        question: this.currentPoll.question,
        type: this.currentPoll.type,
        totalVotes: this.currentPoll.totalVotes,
        createdAt: this.currentPoll.createdAt,
        results: this.currentPoll.options.map(opt => ({
            option: opt.text,
            votes: opt.votes,
            percentage: this.currentPoll.totalVotes > 0 
                ? ((opt.votes / this.currentPoll.totalVotes) * 100).toFixed(2) + '%'
                : '0%'
        }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `poll-results-${Date.now()}.json`;
    link.click();
}


    deletePoll(pollId) {
        if (!confirm('Are you sure you want to delete this poll?')) return;

        this.polls = this.polls.filter(poll => poll.id !== pollId);
        this.savePolls();
        this.displayPolls();
    }

    loadPolls() {
        const polls = localStorage.getItem('micropoll-polls');
        return polls ? JSON.parse(polls) : [];
    }

    savePolls() {
        localStorage.setItem('micropoll-polls', JSON.stringify(this.polls));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Method to generate shareable link (for future enhancement)
    generateShareableLink(pollId) {
        return `${window.location.origin}${window.location.pathname}?poll=${pollId}`;
    }

    toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // Update icon
    const icon = document.querySelector('.theme-icon');
    icon.textContent = isDark ? '☀️' : '🌙';
    }

    loadTheme() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.querySelector('.theme-icon').textContent = '☀️';
        }
    }
}

// Initialize the application
const app = new MicroPoll();

// URL parameter handling for direct poll links (for future enhancement)
const urlParams = new URLSearchParams(window.location.search);
const pollId = urlParams.get('poll');
if (pollId) {
    app.loadPoll(pollId);
}
