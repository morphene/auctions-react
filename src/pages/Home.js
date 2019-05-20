import React from 'react';
import '../assets/Home.css';
import AuctionList from '../components/AuctionList.js';
import NavBar from '../components/NavBar.js';

class Home extends React.Component {
    render() {
        return (
            <div id="home" className="home">
                <NavBar page="home" />
                <header className="home-header">
                    <AuctionList />
                </header>
            </div>
        );
    }
};

export default Home;
