import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route } from 'react-router-dom';

import './assets/index.css';
import 'bootstrap/dist/css/bootstrap.css';

import Home from './pages/Home';

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

ReactDOM.render(
    <BrowserRouter>
        <Route
          path='/auctions'
          render={(props) => <Home {...props} />} />
    </BrowserRouter>,
    document.getElementById('root')
);
