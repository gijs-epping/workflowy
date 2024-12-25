// Authentication utility for Workflowy
async function getWorkflowySession() {
    try {
        // First check if we already have a valid session
        const existingSession = await chrome.cookies.get({
            url: 'https://workflowy.com',
            name: 'sessionid'
        });

        if (existingSession?.value) {
            return existingSession.value;
        }

        // If no valid session, perform login
        const response = await fetch('https://workflowy.com/ajax_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                username: 'gijs.epping@shopworks.nl',
                password: '07Epping'
            }),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Login failed with status: ${response.status}`);
        }

        // Get the session cookie after successful login
        const sessionCookie = await chrome.cookies.get({
            url: 'https://workflowy.com',
            name: 'sessionid'
        });

        if (!sessionCookie?.value) {
            throw new Error('Session cookie not found after login');
        }

        return sessionCookie.value;
    } catch (error) {
        console.error('Failed to get Workflowy session:', error);
        throw error;
    }
}

// Export for use in other files
export { getWorkflowySession };
