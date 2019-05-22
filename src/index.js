import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import './assets/index.css';
import 'bootstrap/dist/css/bootstrap.css';

import Home from './pages/Home';

import Amplify from 'aws-amplify';
import awsmobile from './aws-exports';

import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faEye,
    faKey,
    faCoins,
    faPlus,
    faUserEdit,
    faCheck,
    faExclamation,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons'

library.add([
    faKey,
    faEye,
    faCoins,
    faPlus,
    faUserEdit,
    faCheck,
    faExclamation,
    faSignOutAlt
])

Amplify.configure(awsmobile);

ReactDOM.render(
    <Router>
        <Switch>
            <Route path="/auctions" exact component={Home} />
        </Switch>
    </Router>,
    document.getElementById('root')
);
