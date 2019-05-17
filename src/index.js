import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import './assets/index.css';
import App from './App';
import 'bootstrap/dist/css/bootstrap.css';

ReactDOM.render(
  <Router>
      <Route path="/" exact component={App} />
  </Router>,
  document.getElementById('root')
);
