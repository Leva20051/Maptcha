import React from 'react';
import { UserState } from './components/UserState';

function App() {
  return (
    <UserProvider>
      <div className="App">
        <main>
        </main>
      </div>
    </UserProvider>
  );
}

const checkInHandler = async (currentUserID, currentVenueID) => {
  try {
    const response = await fetch('http://localhost:5000/api/checkin', {
      method: 'POST', // Send check-in data
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userID: currentUserID,
        venueID: currentVenueID,
        notes: "Just grabbing a quick espresso!"
      })
    });

    // Wait for server reply
    const data = await response.json();

    // Receive result
    if (response.ok) {
      console.log("Success! Server came back with ", data.message);
      // Log passport bean here
    } else {
      console.error("Server refused: ", data.error);
    }

  } catch (error) {
    console.error("Couldn't access the API: ", error);
  }
}

export default App;