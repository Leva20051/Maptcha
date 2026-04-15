import React, { useContext } from 'react';
import './CafePassport.css';
import { UserState } from './UserState';
import { generateMonthlyPassport } from '@/utils/passportLogic';

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
        description: "Leave 3 detailed reviews.",
        icon: "✍️",
        unlockRequirement: (stats) => stats.reviews >= 3
    },
    {
        id: 3, 
        title: "Patio Royalty", 
        description: "Check-in to 2 cafes with patios.",
        icon: "☀️",
        unlockRequirement: (stats) => stats.patioVisits >= 2
    }
];

function CafePassport() {
    // Get the user state
    const { user, loading, refreshUserStats } = useContext(UserState);

    if (loading) return <div>Loading Passport...</div>;
    if (!user) return <div>Please log in to view your passport.</div>;

    // Retreive check-ins
    const checkIns = user.checkInHistory || [];
    const passportGrid = generateMonthlyPassport(checkIns);

    return (
        <div className='JourneyDashboard'>
            <h2>{user.name}'s Journey</h2>

            {/* Render the passport card for the user */}
            <div className = "PassportCard">
                <h3 className = "PassportTitle">Explorer Passport</h3>
                <p className="PassportSubtext">There's a new cafe always waiting to be explored.</p>
                <div className="BeanGrid">
                    {passportGrid.map((slot, index) => (
                        <div key={index} className={`BeanSlot ${slot ? 'filled' : 'empty'}`}>
                            {slot ? (
                                <div className="SlotContent">
                                    <span className="BeanIcon">{slot.icon}</span>
                                    <span className="VenueName">{slot.venueName}</span>
                                    <span className="VisitDate">{slot.date}</span>
                                </div>
                            ) : (
                                <span className="EmptyNumber">{index + 1}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CafePassport;