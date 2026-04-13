import React, { createContext, userState, useEffect } from 'react';

export const UserState = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // When the app loads, grab the session data from the backend session
    useEffect(() => {
        
        const fetchSession = async () => {
            try {
                const databaseData = {
                    userID: 2474,
                    name: "Brian Byrd",
                    stats: {
                        checkIns: 4,
                        reviews: 2, 
                        patioVisits: 1
                    }
                };
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