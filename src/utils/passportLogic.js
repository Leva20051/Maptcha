/**
 * Processes check-ins into a 15-slot monthly passport
 * Will not allow more than 4 check-ins for the passport per month
 * @param {Array} monthlyCheckIns - Check-in data from SQL
 * @returns {Array} An array of 15 slots containing venue data or NULL
 */

export const generateMonthlyPassport = (monthlyCheckIns) => {
    const MAX_PASSPORT_SLOTS = 15;
    const MAX_BEANS_PER_VENUE = 4;

    const venueVisitCounts = {};
    const passportSlots = [];

    // Sort check-ins by date
    const sortedCheckIns = [...monthlyCheckIns].sort(
        (lastElement, firstElement) => new Date(firstElement.CheckInTime) - new Date (lastElement.CheckInTime)
    );

    for (const visit of sortedCheckIns) {
        // Stop filling passport if it's maxed out
        if (passportSlots.length >= MAX_PASSPORT_SLOTS) break;


        // Track amount of times venue has already been visited
        const venueCount = venueVisitCounts[visit.VenueID] || 0;

        // Check if maximum for this venue has been reached, if not, add bean
        if (venueCount < MAX_BEANS_PER_VENUE) {
            passportSlots.push({
                venueID: visit.VenueID,
                venueName: visit.Name,  // Joined with Venue table
                date: new Date(visit.CheckInTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric'}),
                icon: '🫘'
            });
            venueVisitCounts[visit.VenueID] = venueCount + 1;
        }
    }

    // Fill remaining array with NULL
    while (passportSlots.length < MAX_PASSPORT_SLOTS) {
        passportSlots.push(null);
    }
    return passportSlots;
}