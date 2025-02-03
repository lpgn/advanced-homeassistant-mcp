const check = async () => {
    try {
        const response = await fetch('http://localhost:3000/health');
        if (!response.ok) {
            console.error('Health check failed:', response.status);
            process.exit(1);
        }
        console.log('Health check passed');
        process.exit(0);
    } catch (error) {
        console.error('Health check failed:', error);
        process.exit(1);
    }
};

check(); 