// Wait until DOM loads
document.addEventListener("DOMContentLoaded", function () {

    // DOM Elements
    const newsText = document.getElementById('newsText');
    const charCount = document.getElementById('charCount');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsSection = document.getElementById('resultsSection');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = themeToggle.querySelector('span');
    const themeIcon = themeToggle.querySelector('i');

    // API URL (change if your backend runs on different port)
    const API_URL = 'http://localhost:5000/api';

    // Theme handling
    function setTheme(theme) {
        const isLight = theme === 'light';
        document.body.classList.toggle('light-mode', isLight);
        themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        themeLabel.textContent = isLight ? 'Light' : 'Dark';
        localStorage.setItem('truthscope-theme', theme);
    }

    setTheme(localStorage.getItem('truthscope-theme') || 'dark');

    themeToggle.addEventListener('click', () => {
        const nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
        setTheme(nextTheme);
    });

    // Character counter
    newsText.addEventListener('input', function () {
        const count = this.value.length;
        charCount.textContent = count;

        if (count > 4500) {
            charCount.style.color = '#ef4444';
        } else if (count > 4000) {
            charCount.style.color = '#f59e0b';
        } else {
            charCount.style.color = '#6366f1';
        }
    });

    // Submit on Enter (use Shift + Enter for a new line)
    newsText.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            analyzeBtn.click();
        }
    });

    // Analyze button - Connects to backend
    analyzeBtn.addEventListener('click', async () => {

        const text = newsText.value.trim();

        if (text.length < 20) {
            showNotification('Please enter at least 20 characters', 'warning');
            return;
        }

        // Show loading
        analyzeBtn.style.display = 'none';
        loadingSpinner.style.display = 'block';

        try {
            // Call the backend API
            const response = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Analysis failed');
            }

            // Hide loading
            loadingSpinner.style.display = 'none';
            analyzeBtn.style.display = 'flex';

            // Show results
            resultsSection.classList.add('visible');

            // Update verdict using data from model
            document.getElementById('verdict').textContent = data.prediction;
            document.getElementById('verdict').className = `verdict ${data.is_fake ? 'fake' : 'real'}`;

            // Update confidence bar
            const confidenceBar = document.getElementById('confidenceBar');
            const confidenceText = document.getElementById('confidenceText');
            
            if (data.is_fake) {
                confidenceBar.style.width = `${data.confidence}%`;
                confidenceText.textContent = `${data.confidence}% Fake`;
            } else {
                confidenceBar.style.width = `${data.confidence}%`;
                confidenceText.textContent = `${data.confidence}% Real`;
            }

            // Update stats based on prediction
            document.getElementById('category').textContent = 'News Article';
            document.getElementById('riskLevel').textContent = data.is_fake ? 'High' : 'Low';
            document.getElementById('sentiment').textContent = data.is_fake ? 'Suspicious' : 'Balanced';
            document.getElementById('manipulation').textContent = data.is_fake ? 
                `${data.confidence}%` : `${(100 - data.confidence).toFixed(2)}%`;

            // ===========================================
            // DYNAMIC HIGHLIGHTING - FIXED VERSION
            // ===========================================
            const highlightedContent = document.getElementById('highlightedContent');
            const originalText = newsText.value;

            // If model says FAKE, highlight suspicious patterns
            if (data.is_fake) {
                let highlighted = originalText;
                
                // Comprehensive list of suspicious patterns across all topics
                const suspiciousPatterns = [
                    // Emotional words (Red)
                    { pattern: /\b(shocking|unbelievable|outrageous|heartbreaking|mind.?blowing|jaw.?dropping|epic|insane|crazy)\b/gi, 
                      className: 'highlight-emotional', type: 'emotional' },
                    
                    // Clickbait phrases (Yellow)
                    { pattern: /\b(you won't believe|what happens next|the reason why|doctors hate this|they don't want you to know|must read|viral|goes viral)\b/gi,
                      className: 'highlight-clickbait', type: 'clickbait' },
                    
                    // Manipulative phrases (Purple)
                    { pattern: /\b(share before|big (pharma|media|government|tech)|they delete|secret they don't want|hidden truth|wake up sheeple)\b/gi,
                      className: 'highlight-manipulative', type: 'manipulative' },
                    
                    // Exaggerated claims (Green)
                    { pattern: /\b(miracle|perfect|amazing|incredible|best ever|life.?changing|guaranteed|proven|scientific proof|doctors recommend|9 out of 10)\b/gi,
                      className: 'highlight-exaggerated', type: 'exaggerated' },
                    
                    // Sports-specific exaggerated terms (for cricket/football)
                    { pattern: /\b(unbeaten|brilliant|spectacular|dominant|thrashing|demolish|annihilate|unstoppable|legendary|greatest)\b/gi,
                      className: 'highlight-exaggerated', type: 'exaggerated' },
                    
                    // Sports-specific emotional terms
                    { pattern: /\b(adjudged|acclaimed|celebrated|heroic|miracle|historic|dramatic)\b/gi,
                      className: 'highlight-emotional', type: 'emotional' },
                    
                    // Urgency/Fear tactics
                    { pattern: /\b(act now|limited time|before it's too late|urgent|warning|danger|risk|deadline)\b/gi,
                      className: 'highlight-manipulative', type: 'manipulative' },
                    
                    // Absolute/Extreme words
                    { pattern: /\b(never|always|everyone|nobody|completely|totally|absolutely|definitely|certainly)\b/gi,
                      className: 'highlight-exaggerated', type: 'exaggerated' }
                ];
                
                // Apply all highlights
                suspiciousPatterns.forEach(item => {
                    highlighted = highlighted.replace(item.pattern, 
                        `<span class="${item.className}" title="Potentially ${item.type} language">$&</span>`);
                });
                
                highlightedContent.innerHTML = highlighted;
            } else {
                // If REAL, just show the original text without highlights
                highlightedContent.innerHTML = originalText;
            }

            showNotification('Analysis complete!', 'success');

        } catch (error) {
            // Hide loading on error
            loadingSpinner.style.display = 'none';
            analyzeBtn.style.display = 'flex';
            
            showNotification(error.message || 'Failed to analyze text', 'error');
            console.error('Analysis error:', error);
        }
    });

    // Feedback buttons
    document.getElementById('feedbackReal').addEventListener('click', () => {
        showNotification('Thank you for your feedback!', 'success');
    });

    document.getElementById('feedbackFake').addEventListener('click', () => {
        showNotification('Thank you for your feedback!', 'success');
    });

    // Notification system
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            background: ${
                type === 'success'
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : type === 'error'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #f59e0b, #d97706)'
            };
            color: white;
            border-radius: 12px;
            font-weight: 500;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

});