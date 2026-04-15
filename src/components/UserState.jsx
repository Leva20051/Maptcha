import React, { createContext, userState, useEffect } from 'react';

export const UserState = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // When the app loads, grab the session data from the backend session
    useEffect(() => {
        
        const fetchSession = async () => {
            try {
                // Check if user has already been cached
                const storedUserId = localStorage.getItem('cafe_curator_userid') || '1';    // Default to 1 for debugging
        
                if (!storedUserId) {
                    throw new Error('No user stored locally');
                }

                // Pass the ID to the API via headers
                const sessionData = await fetch('http://localhost:5000/api/session', {
                headers: {
                    // Store the UserID
                    'x-user-id': storedUserId
                }
                });
        
                // Set the users session
                if (!sessionData.ok) throw new Error('Session fetch failed');
                const databaseData = await sessionData.json();
                setUser(databaseData);
            } catch (error) {
                console.error("No active session found")
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, []);
    
    // Function to update stats if SQL was updated
    const refreshUserStats = async () => {
        // Implement once API is done
        console.log("Refreshing from SQL database...");
    };

    return (
        // Make the state and state refresh function global
        <UserState.Provider value = {{ user, setUser, loading, refreshUserStats }}> 
            {children}
        </UserState.Provider>
    )
}