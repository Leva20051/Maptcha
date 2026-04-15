import React, { useContext } from 'react';
import './CafePassport.css';
import { UserState } from './UserState';

// Placeholder data
const placeholderUser = {
    name: "Brian Byrd",
    totalCheckIns: 4, // Would normally be calculated by SELECT COUNT from CHECK_IN
};

/* 
    id: A unique ID for the acheivement
    title: The name of the acheivement
    description: A description of the acheivement
    icon: The icon for the acheivement
    unlockRequirement: A boolean that evaluates if the acheivement has been unlocked
*/
const acheivements = [
    { 
        id: 1, 
        title: "First Sip",
        description: "Visit your very first cafe.",
        icon: "☕",
        unlockRequirement: (stats) => stats.checkIns >= 1
    },
    {
        id: 2, 
        title: "The Critic", 
        desc: "Leave 3 detailed reviews.",
        icon: "✍️",
        isUnlocked: (stats) => stats.reviews >= 3
    },
    {
        id: 3, 
        title: "Patio Royalty", 
        desc: "Check-in to 2 cafes with patios.",
        icon: "☀️",
        isUnlocked: (stats) => stats.patioVisits >= 2
    }
];

function CafePassport() {
    // Get the user state
    const { user, loading, refreshUserStats } = useContext(UserState);

    if (loading) return <div>Loading Passport...</div>;
    if (!user) return <div>Please log in to view your passport.</div>;

    return (
        <div className='PassportDashboard'>
            <h2>{user.name}'s Journey</h2>
            <p>Total Beans: {user.stats.checkIns} / 10</p>

            {/* Acheivements and Bean Passport would go here */}
        </div>
    );
}

export default CafePassport;