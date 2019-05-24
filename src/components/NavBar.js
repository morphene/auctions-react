import React from 'react';

import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import ReactTooltip from 'react-tooltip'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import logo from '../assets/logo.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import moment from 'moment';
import * as Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

import morpheneJS from '@boone-development/morphene-js';

import '../assets/NavBar.css';

class NavBar extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.toggleShowUpdateKey = this.toggleShowUpdateKey.bind(this);
    this.toggleShowCreateAuction = this.toggleShowCreateAuction.bind(this);
    this.validateUserKey = this.validateUserKey.bind(this);

    this.state = {
      showUpdateKey: false,
      showCreateAuction: false
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevState.authState !== this.props.authState || prevState.activeKey !== this.props.activeKey) {
      this.setState({...this.props})
    }
  }

  toggleShowUpdateKey() {
    this.setState({showUpdateKey: !this.state.showUpdateKey})
  }

  toggleShowCreateAuction() {
    this.setState({showCreateAuction: !this.state.showCreateAuction})
  }

  updateKey() {
    const activeKey = document.getElementById("activeKey").value
    this.state.Auth.currentAuthenticatedUser().then(user => {
      this.state.Auth.updateUserAttributes(user, {'custom:activeKey': activeKey})
    })
    this.setState({showUpdateKey: false})
  }

  createAuction() {
    const fee = parseInt(document.getElementById("fee").value);
    const startTime = document.getElementById("startTime").value.replace(" ", "T");
    const endTime = document.getElementById("endTime").value.replace(" ", "T");

    const { authState, activeKey, chainName } = this.state;

    if(authState === "signedIn" && activeKey && chainName) {
        morpheneJS.broadcast.createAuctionAsync(
          activeKey,
          chainName,
          `${chainName}-${moment().unix()}`,
          startTime,
          endTime,
          `${fee}.000 MORPH`
        )
        .then((result) => {toast.success("Auction created successfully")})
        .catch((error) => {toast.error(`Error creating auction: ${error}`)})
    }

    this.setState({showCreateAuction: false})
  }

  validateUserKey() {
    morpheneJS.api.getAccountsAsync([this.state.chainName])
        .then((result) => {
            if(result.length > 0) {
                const newKey = document.getElementById("activeKey").value;
                try{
                  const pubKey = morpheneJS.auth.wifToPublic(newKey);
                  // morpheneJS.api.getAccountsAsync([chainName.Value])
                  // .then((result) => {
                    var possibleKeys = []
                    const user = result[0]
                    user.owner.key_auths.forEach((auth) => {possibleKeys.push(auth[0])})
                    user.active.key_auths.forEach((auth) => {possibleKeys.push(auth[0])})
                    if(possibleKeys.includes(pubKey)){
                        document.getElementById("invalidKey").style.display = "none"
                        document.getElementById("validKey").style.display = "block"
                    } else {
                        document.getElementById("validKey").style.display = "none"
                        document.getElementById("invalidKey").style.display = "block"
                    }
                  // })
                  // .catch((error) => {console.log(error)})
                } catch {
                    document.getElementById("validKey").style.display = "none"
                    document.getElementById("invalidKey").style.display = "block"
                }
            } else {
                document.getElementById("activeKey").disabled = true;
                document.getElementById("user-submit").disabled = true;
                document.getElementById("activeKey").placeholder = "User not created. Please check back later";
            }
      })
      .catch((error) => console.log(error))
  }

  render() {
    return (
      <><Navbar bg="dark" variant="dark">
        <Navbar.Brand tabIndex="-1" href="//github.com/morphene/morphene" target="_blank" rel="nofollow">
          <img
            alt=""
            src={logo}
            width="75"
            height="75"
            className="d-inline-block align-top"
          />
          <span className="hidden-sm" style={{lineHeight: '75px'}}>&nbsp;Morphene Auctions</span>
        </Navbar.Brand>
        
        <Nav className="ml-auto">
          {this.state.authState === "signedIn" ? 
            <><ReactTooltip id='createAuction' type='info'>
              <span>Create Auction</span>
            </ReactTooltip>
            <Button
              onClick={this.toggleShowCreateAuction}
              data-tip data-for="createAuction"
              style={{margin: '0 10px'}}>
                <FontAwesomeIcon icon="plus" size="lg" />
            </Button>
            <ReactTooltip id='updateKey' type='info'>
              <span>Update Key</span>
            </ReactTooltip>
            <Button
              onClick={this.toggleShowUpdateKey}
              data-tip data-for="updateKey"
              style={{margin: '0 10px'}}>
                <FontAwesomeIcon icon="key" size="lg" />
            </Button>
            <ReactTooltip id='signOut' type='info'>
              <span>Sign Out</span>
            </ReactTooltip>
            <Button
              variant="warning"
              onClick={() => this.state.Auth.signOut()}
              data-tip data-for="signOut"
              style={{margin: '0 10px'}}>
                <FontAwesomeIcon icon="sign-out-alt" size="lg" />
            </Button></> :
            <><ReactTooltip id='signIn' type='info'>
              <span>Sign In</span>
            </ReactTooltip>
            <Button

              onClick={this.props.OAuthSignIn}
              data-tip data-for="signIn"
              style={{margin: '0 10px'}}>
                <FontAwesomeIcon icon="user-edit" size="lg" />
            </Button></>}
        </Nav>

        <Modal
            show={this.state.showUpdateKey}
            onShow={this.validateUserKey}
            onHide={this.toggleShowUpdateKey}
            style={{textAlign: 'center', fontSize: '.9em'}}
            centered>
          <Modal.Header closeButton>
            <h5>Update Key For - {this.state.chainName ? this.state.chainName : "Unknown User"}</h5><hr/>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group form-inline">
              <label style={{width: '5rem'}}htmlFor="activeKey">Active Key</label>
              <input
                id="activeKey"
                name="activeKey"
                onChange={this.validateUserKey}
                placeholder={"enter active key and click save"}
                defaultValue={this.state.activeKey ? this.state.activeKey : undefined}
                style={{width: "75%", marginLeft: "10px"}}
                className="form-control"
                autoComplete="off" />
              <FontAwesomeIcon id="validKey" icon="check" style={{display: 'none', marginLeft: '10px', color: 'green'}}/>
              <FontAwesomeIcon id="invalidKey" icon="exclamation" style={{display: 'none', marginLeft: '10px', color: 'red'}}/>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button id="user-submit" variant="secondary" onClick={() => this.updateKey()}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
            show={this.state.showCreateAuction}
            onHide={this.toggleShowCreateAuction}
            style={{textAlign: 'center', fontSize: '.9em'}}
            centered>
          <Modal.Header closeButton>
            <h5>Create Auction</h5><hr/>
          </Modal.Header>
          <Modal.Body style={{margin: '0 auto'}}>
            <div className="form-group form-inline">
              <label style={{width: '6rem'}} htmlFor="fee">Initial Fee</label>
              <input
                id="fee"
                name="fee"
                type="number"
                defaultValue="10"
                className="form-control"
                autoComplete="off" />
            </div>
            <div className="form-group form-inline">
              <label style={{width: '6rem'}} htmlFor="startTime">Start Time</label>
              <Datetime utc={true} defaultValue={moment().add(1, 'minutes')} dateFormat="YYYY-MM-DD" timeFormat="HH:mm:ss" inputProps={{id:"startTime", name:"startTime"}} />
            </div>
            <div className="form-group form-inline">
              <label style={{width: '6rem'}} htmlFor="endTime">End Time</label>
              <Datetime utc={true} defaultValue={moment().add(6, 'minutes')} dateFormat="YYYY-MM-DD" timeFormat="HH:mm:ss" inputProps={{id:"endTime", name:"endTime"}} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => this.createAuction()}>
              Create Auction
            </Button>
          </Modal.Footer>
        </Modal>
      </Navbar>
      <ToastContainer /></>
    )
  }
}

export default NavBar;
