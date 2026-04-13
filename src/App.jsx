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

export default App;