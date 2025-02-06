// Dark mode handling
document.addEventListener('DOMContentLoaded', function () {
    // Check for saved dark mode preference
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add copy button to code blocks
document.querySelectorAll('pre code').forEach((block) => {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';

    button.addEventListener('click', async () => {
        await navigator.clipboard.writeText(block.textContent);
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = 'Copy';
        }, 2000);
    });

    const pre = block.parentNode;
    pre.insertBefore(button, block);
});

// Add version selector handling
const versionSelector = document.querySelector('.version-selector');
if (versionSelector) {
    versionSelector.addEventListener('change', (e) => {
        const version = e.target.value;
        window.location.href = `/${version}/`;
    });
}

// Add feedback handling
document.querySelectorAll('.feedback-button').forEach(button => {
    button.addEventListener('click', function () {
        const feedback = this.getAttribute('data-feedback');
        // Send feedback to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'feedback', {
                'event_category': 'Documentation',
                'event_label': feedback
            });
        }
        // Show thank you message
        this.textContent = 'Thank you!';
        this.disabled = true;
    });
}); 