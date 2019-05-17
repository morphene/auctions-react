import React from 'react';
import './assets/App.css';
import AuctionList from './components/AuctionList.js';
import NavBar from './components/NavBar.js';

import { library } from '@fortawesome/fontawesome-svg-core'
import { faEye, faCoins, faPlus, faUserEdit, faCheck, faExclamation } from '@fortawesome/free-solid-svg-icons'

library.add([faEye, faCoins, faPlus, faUserEdit, faCheck, faExclamation])

const App = () => {
  return (
    <div id="app" className="App">
      <NavBar />
      <header className="App-header">
        <AuctionList />
      </header>
    </div>
  );
};

export default App;
