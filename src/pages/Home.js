import React from 'react';
import '../assets/Home.css';
import AuctionList from '../components/AuctionList.js';
import NavBar from '../components/NavBar.js';

import Amplify, { Auth, Hub, Logger } from 'aws-amplify';
import awsmobile from '../aws-exports';
import { withOAuth } from 'aws-amplify-react';

import axios from 'axios';

import morpheneJS from '@boone-development/morphene-js';

Amplify.configure(awsmobile);

class Home extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
          activeKey: false,
          chainName: false,
          authData: null,
          authError: null,
          authState: 'loading',
          authIntervalId: false
        }
    }

    componentWillMount() {
      var intervalId = setInterval(function(){
        if(!this.state.activeKey) {
          this.storeUserInfo();
        }
      }.bind(this), 6000);
      this.setState({authIntervalId: intervalId})
    }

    componentDidMount() {
      this.storeUserInfo();
      const logger = new Logger('Cognito-Event');
      Hub.listen('auth', (data) => {
        switch (data.payload.event) {
          case 'signIn':
            logger.info('User signed in');
            this.storeUserInfo({
              authState: 'signedIn',
              authData: data.payload.data
            });
            break;
          case 'signIn_failure':
            logger.error('User sign in failure. Error: ' + data.payload.data);
            this.storeUserInfo({
              authState: 'signIn',
              authData: null,
              authError: data.payload.data}
            );
            break;
          default:
            break;
        }
      });
    }

    componentDidUpdate(prevProps, prevState) {
      if(!prevState.activeKey && this.state.activeKey){
        clearInterval(this.state.authIntervalId);
        this.setState({authIntervalId: false})
      }
    }

    componentWillUnmount() {
      clearInterval(this.state.intervalId);
      this.setState({authIntervalId: false})
    }

    storeUserInfo(loginData={}) {
      Auth.currentAuthenticatedUser().then(user => {
        Auth.userAttributes(user).then((attrs) => {
          var newState = {}
          const activeKey = attrs.find((obj)=>{return obj.Name === "custom:activeKey"});
          const chainName = attrs.find((obj)=>{return obj.Name === "custom:chainName"});
          if(activeKey && chainName){
            morpheneJS.api.getAccountsAsync([chainName.Value])
            .then((result) => {
              if(result.length === 0) {
                this.createChainUser(user);
              }
            })
            .catch((error) => {
              console.log(error)
            })
            newState = {activeKey: activeKey.Value, chainName: chainName.Value}
          } else {
            try {
              this.createChainUser(user);
            } catch(e) { console.log(e) }
          }
          this.setState({...loginData, ...newState, authState: "signedIn"})
        })
        .catch((error) => console.log(error))
      })
      .catch((error) => console.log(error))
    }

    createChainUser(user) {
      const data = {
        userPoolId: user.pool.userPoolId,
        userAccessToken: user.signInUserSession.accessToken.jwtToken
      }
      axios.post("https://morphene.io/createAccount", data);
    }

    render() {
        return (
            <div id="home" className="home">
                <NavBar page="home" Auth={Auth} {...this.state} {...this.props} />
                <header className="home-header">
                    <AuctionList {...this.state} />
                </header>
            </div>
        );
    }
};

export default withOAuth(Home);
