import React from 'react';

import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import ReactTooltip from 'react-tooltip'

import logo from '../assets/logo.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import moment from 'moment';
import * as Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

import morpheneJS from '@boone-development/morphene-js';

class NavBar extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.toggleShowUpdateUser = this.toggleShowUpdateUser.bind(this);
    this.toggleShowCreateAuction = this.toggleShowCreateAuction.bind(this);
    this.validateUserKey = this.validateUserKey.bind(this);

    this.state = {
      showUpdateUser: false,
      showCreateAuction: false
    };
  }

  toggleShowUpdateUser() {
    this.setState({showUpdateUser: !this.state.showUpdateUser})
  }

  toggleShowCreateAuction() {
    this.setState({showCreateAuction: !this.state.showCreateAuction})
  }

  updateUser() {
    const username = document.getElementById("username").value
    const activeKey = document.getElementById("activeKey").value
    localStorage.setItem("morph-key-storage", JSON.stringify({username, activeKey}))
    this.setState({showUpdateUser: false})
  }

  createAuction() {
    const fee = parseInt(document.getElementById("fee").value);
    const startTime = document.getElementById("startTime").value.replace(" ", "T");
    const endTime = document.getElementById("endTime").value.replace(" ", "T");
    const localKeyStore = JSON.parse(localStorage["morph-key-storage"] || "{}")
    if(localKeyStore && localKeyStore.username && localKeyStore.activeKey) {
        morpheneJS.broadcast.createAuctionAsync(
          localKeyStore.activeKey,
          localKeyStore.username,
          `${localKeyStore.username}-${moment().unix()}`,
          startTime,
          endTime,
          `${fee}.000 TESTS`
        )
        .then((result) => {console.log(result)})
        .catch((error) => {console.log(error)})
    }
    this.setState({showCreateAuction: false})
  }

  validateUserKey() {
    const newKey = document.getElementById("activeKey").value;
    try{
      const pubKey = morpheneJS.auth.wifToPublic(newKey);
      const username = document.getElementById("username").value;
      morpheneJS.api.getAccountsAsync([username])
      .then((result) => {
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
      })
      .catch((error) => {console.log(error)})
    } catch {
        document.getElementById("validKey").style.display = "none"
        document.getElementById("invalidKey").style.display = "block"
    }
  }

  render() {
    const localKeyStore = JSON.parse(
      localStorage.getItem("morph-key-storage") || "{\"username\": false, \"activeKey\": false}")

    const currentUser = localKeyStore.username ? localKeyStore.username : ""
    const currentKey = localKeyStore.activeKey ? localKeyStore.activeKey : ""

    return (
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand href="#home">
          <img
            alt=""
            src={logo}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />
          &nbsp;<em>Powered by Morphene Blockchain</em>
        </Navbar.Brand>
        
        <Nav className="ml-auto">
          <ReactTooltip id='createAuction' type='info'>
            <span>Create Auction</span>
          </ReactTooltip>
          <Button
            onClick={this.toggleShowCreateAuction}
            data-tip data-for="createAuction"
            style={{margin: '0 10px'}}>
              <FontAwesomeIcon icon="plus" size="lg" />
          </Button>
          <ReactTooltip id='editUser' type='info'>
            <span>Edit User Profile</span>
          </ReactTooltip>
          <Button
            variant="info"
            onClick={this.toggleShowUpdateUser}
            data-tip data-for="editUser"
            style={{margin: '0 10px'}}>
              <FontAwesomeIcon icon="user-edit" />
          </Button>
        </Nav>

        <Modal show={this.state.showUpdateUser} onShow={this.validateUserKey} onHide={this.toggleShowUpdateUser} style={{textAlign: 'center', fontSize: '.9em'}} centered>
          <Modal.Header closeButton>
            <h5>Update User</h5><hr/>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group form-inline">
              <label style={{width: '5rem'}}htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                defaultValue={currentUser}
                placeholder={`username: ${currentUser}`}
                style={{width: "75%", marginLeft: "10px"}}
                className="form-control"
                autoComplete="off" />
            </div>
            <div className="form-group form-inline">
              <label style={{width: '5rem'}}htmlFor="activeKey">Active Key</label>
              <input
                id="activeKey"
                name="activeKey"
                defaultValue={currentKey}
                onChange={this.validateUserKey}
                placeholder={`activeKey: ${currentKey}`}
                style={{width: "75%", marginLeft: "10px"}}
                className="form-control"
                autoComplete="off" />
              <FontAwesomeIcon id="validKey" icon="check" style={{display: 'none', marginLeft: '10px', color: 'green'}}/>
              <FontAwesomeIcon id="invalidKey" icon="exclamation" style={{display: 'none', marginLeft: '10px', color: 'red'}}/>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => this.updateUser()}
              className="App-link"
            >Save Changes</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showCreateAuction} onHide={this.toggleShowCreateAuction} style={{textAlign: 'center', fontSize: '.9em'}} centered>
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
            <Button variant="secondary" onClick={() => this.createAuction()}
              className="App-link"
            >Create Auction</Button>
          </Modal.Footer>
        </Modal>
      </Navbar>
    )
  }
}

export default NavBar;
