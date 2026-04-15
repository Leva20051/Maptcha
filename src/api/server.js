const express = require('express');
const cors = require('cors');
const database = require('./db');
const { error } = require('node:console');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Connect SQL to React
app.use(express.json()); // Allow API to read JSON data

// SERVER SQL QUERIES (READ)
// To use, make a new function with a path leading to 
// where you'd like the information stored in the API (e.g '/api/venues').
// Then, create the SQL query needed for the database, and send it to React

// Login for user
app.post('/api/login', async (request, result) => {
    const { email, password } = request.body;

    try {
        const sqlQuery = 'SELECT UserID, Username FROM User WHERE Email = ? AND Password = ?';
        const [user] = await database.execute(sqlQuery, [email, password]);

        // Check if user exists
        if (user.length > 0) {
            result.status(200).json({
                message: "Login successful",
                userID: user[0].UserID,
                username: users[0].Username
            });
        } else {
            result.status(401).json({ error: "Invalid email or password" });
        }
    } catch (error) {
        result.status(500).json({ error: "Server error during login"});
    }
});

// Get the relevant session info
app.get('/api/session', async (request, result) => {
    try {
        const userID = request.headers['x-user-id'];

        // Get basic info about the user
        const [userRows] = await database.execute(
            'SELECT UserID, Name, Username FROM User WHERE UserID = ?',
            [userID]
        );

        // Check if the user exists
        if (userRows.length === 0) return result.status(404).json({ error: "User not found" });
        const user = userRows[0];

        // Get user stats
        const [statRows] = await database.execute(
            'SELECT COUNT(*) as totalCheckIns FROM Check_In WHERE UserID = ?',
            [userID]
        )

        // Get check-in history
        const historyQuery = `
            SELECT checkIns.VenueID, venue.Name, checkIns.CheckInTime, checkIns.Notes
            FROM Check_In checkIns
            JOIN Venue venue ON checkIns.VenueID = venue.VenueID
            WHERE checkIns.UserID = ? 
                AND MONTH(checkIns.CheckInTime) = MONTH(CURRENT_DATE())
                AND YEAR(checkIns.CheckInTime) = YEAR(CURRENT_DATE())
            ORDER BY checkIns.CheckInTime ASC;
        `;
        const [checkInHistoryList] = await database.execute(historyQuery, [userID]);

        // Send all queried data
        const sessionData = {
            userID: user.UserID,
            name: user.Username,
            stats: {
                checkIns: statRows[0], totalCheckIns,
                reviews: 0  // Placeholder until review query is added
            },
            checkInHistory: checkInHistoryList
        };

        result.json(sessionData);
    } catch (error) {
        console.error("Database error: ", error);
        result.status(500).json({ error: "Server error"});
    }
});

// Retreive all venues with their ratings
app.get('/api/venues', async (request, result) => {
    try {
        // SQL Query
        const sqlQuery = `
            SELECT 
                v.VenueID,
                v.Name,
                v.City,
                COUNT(DISTINCT r.ReviewID) AS TotalReviews, 
                ROUND(AVG(a.RatingValue), 2) AS AvgRating 
            FROM Venue v 
            LEFT JOIN Review r ON v.VenueID = r.VenueID 
            LEFT JOIN Attribute a ON r.ReviewID = a.ReviewID 
            GROUP BY v.VenueID, v.Name, v.City 
            ORDER BY AvgRating DESC;
            `;

            // Run the query on the database
            const [rows] = await database.execute(sqlQuery);

            // Send the result to React using JSON
            result.status(200).json(rows);

    } catch (errors) {
        console.error("Error fetching venues: ", error);
        result.status(500).json({ error: "Failed to fetch venues from database!" });
    }
});

// SERVER SQL QUERIES (WRITE)
app.post('/api/checkin', async (request, result) => {
    // Break down JSON
    const { userID, venueID, notes } = request.body;

    // Validate data
    if (!userID || !venueID) {
        return result.status(400).json({ error: "Missing FK UserID or VenueID"});
    }

    try {
        // SQL Query
        const sqlQuery = `
        INSERT INTO Check_In (UserID, VenueID, CheckInTime, Notes)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?)
        `;

        // Execute the query (Array fills the question marks)
        const [result] = await database.execute(sqlQuery, [userID, venueID, notes || null]);

        // Respond with success status to React
        result.status(201).json({
            message: "Check-in successful!",
            insertedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Check-in error: ", error);
        result.status(500).json({ error: "Failed to log check-in to the database."});
    }
});

// Start the server to link React to SQL Database
app.listen(port, () => {
    console.log('Server is running on http://localhost:${port}');
})