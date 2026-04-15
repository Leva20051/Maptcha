const express = require('express');
const cors = require('cors');
const database = require('./db');
const { error } = require('node:console');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // Connect SQL to React
app.use(express.json()); // Allow API to read JSON data

// SERVER SQL QUERIES
// To use, make a new function with a path leading to 
// where you'd like the information stored in the API (e.g '/api/venues').
// Then, create the SQL query needed for the database, and send it to React

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

// Start the server to link React to SQL Database
app.listen(port, () => {
    console.log('Server is running on http://localhost:${port}');
})