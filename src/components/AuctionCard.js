import React from 'react';

import ReactTooltip from 'react-tooltip'
import Countdown from 'react-countdown-now';

import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';

import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

import morpheneJS from '@boone-development/morphene-js';

import { Auth, Hub } from 'aws-amplify';

class AuctionCard extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleShowBids = this.handleShowBids.bind(this);
    this.handleCloseBids = this.handleCloseBids.bind(this);
    this.placeBid = this.placeBid.bind(this);

    this.state = {
      bids: [],
      user: false,
      error: false,
      activeKey: false,
      intervalId: false,
      showViewBids: false,
      authState: 'loading',
      authData: null,
      authError: null
    };

    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signIn':
          this.setState({
            authState: 'signedIn',
            authData: data.payload.data
          });
          this.checkUserAuth()
          break;
        case 'signIn_failure':
          this.setState({
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

  checkUserAuth() {
    Auth.currentAuthenticatedUser().then(user => {
      Auth.userAttributes(user).then((attrs) => {
        const activeKey = attrs.find((obj)=>{return obj.Name === "custom:activeKey"});
        const chainName = attrs.find((obj)=>{return obj.Name === "custom:chainName"});
        if(activeKey && chainName) {
          this.setState({authState: 'signedIn', user, chainName: chainName.Value, activeKey: activeKey.Value});
        } else {
          this.setState({authState: 'signedIn', user, chainName, activeKey});
        }
      })
    }).catch(e => {
      this.setState({authState: 'signIn', user: false, activeKey: false});
    });
    this.forceUpdate()
  }

  componentDidMount() {
    this.checkUserAuth()
  }

  handleShowBids() {
    this.fetchData({"permlink":this.props.permlink,"limit":20})
    var intervalId = setInterval(function(){
      this.fetchData({"permlink":this.props.permlink,"limit":20})
    }.bind(this), 3000)
    this.setState({ showViewBids: true, intervalId });
  }

  handleCloseBids() {    
    clearInterval(this.state.intervalId)
    this.setState({showViewBids: false, intervalId: false})
  }

  placeBid(permlink) {
    Auth.currentAuthenticatedUser().then(user => {
      Auth.userAttributes(user).then((attrs) => {
        const activeKey = attrs.find((obj)=>{return obj.Name === "custom:activeKey"});
        const chainName = attrs.find((obj)=>{return obj.Name === "custom:chainName"});
        if(chainName && activeKey) {
          morpheneJS.broadcast.placeBidAsync(activeKey.Value, chainName.Value, permlink)
            .then((result) => {toast.success("Bid successfully placed")})
            .catch((error) => {toast.error(`${error}`)})
        } else {
          toast.error("Add active private key first")
        }
      })
    })
  }

  fetchData = (params) => {
    morpheneJS.api.getBidsAsync(params.permlink, params.limit)
      .then(result => { this.setState({ bids: result }) })
      .catch(error => { console.log(error) })
  }

  render() {
    var backgroundColor, header;
    if(this.props.status === "pending") {
      backgroundColor = "#E3E1F7";
      header = (
        <><b>Starts In:</b><br/>
          <Countdown date={this.props.start_time+'Z'}>
            <span>Auction already started</span>
          </Countdown></>
      )
    } else if(this.props.status === "active") {
      backgroundColor = "#7EE998";
      header = (
        <><b>Ends In:</b><br/>
          <Countdown date={this.props.end_time+'Z'}>
            <span>Auction already ended</span>
          </Countdown></>
      )
    } else if(this.props.status === "ended") {
      backgroundColor = "#E26B6E";
      header = (
        <><b>Auction Has Ended</b></>
      )
    }

    function secondsToDhms(seconds) {
      seconds = Number(seconds);
      var d = Math.floor(seconds / (3600*24));
      var h = Math.floor(seconds % (3600*24) / 3600);
      var m = Math.floor(seconds % 3600 / 60);
      var s = Math.floor(seconds % 60);

      var dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
      var hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m === 1 ? ` min${s > 0 ? "," : ""} ` : ` mins${s > 0 ? "," : ""} `) : "";
      var sDisplay = s > 0 ? s + (s === 1 ? " sec" : " secs") : "";
      return dDisplay + hDisplay + mDisplay + sDisplay;
    }

    const lastBidder = this.props.last_bidder === "" ? "no bids yet" : this.props.last_bidder
    const durationSeconds = moment(this.props.end_time+'Z').diff(moment(this.props.start_time+'Z')) / 1000

    return (
      <Card className="mx-auto card-style" id={`card-${this.props.permlink}`}>
        <Card.Header style={{backgroundColor}}>
          {header}
        </Card.Header>
        <Card.Body>
          <Card.Text>
            <span style={{lineHeight: '1.75em'}}><b>Consigner:</b><br/>{this.props.consigner}<br/></span>
            <span style={{lineHeight: '1.75em'}}><b>Duration:</b><br/>
              {secondsToDhms(durationSeconds)}<br/></span>
            <span style={{lineHeight: '1.75em'}}><b>Value:</b><br/>{this.props.total_payout}<br/>({this.props.bids_count} bids)<br/></span>
            <span style={{display: 'block', lineHeight: '1.75em'}}><b>Current Bid:</b><br/>{lastBidder}<br/></span>
          </Card.Text>
          <Button data-tip data-for='viewBids' className="auction-button" onClick={() => this.handleShowBids("viewBids")}>
            <FontAwesomeIcon icon="eye" size="2x" />
          </Button>
          <ReactTooltip id='viewBids' type='info'>
            <span>Recent Bids</span>
          </ReactTooltip>
          {this.state.user ? 
          <><Button data-tip data-for='placeBid' className="auction-button" variant="warning" onClick={() => this.placeBid(this.props.permlink)}>
            <FontAwesomeIcon icon="coins" size="2x" />
          </Button>
          <ReactTooltip id='placeBid' type='info'>
            <span>Place Bid</span>
          </ReactTooltip></> : ""}
        </Card.Body>

        <Modal show={this.state.showViewBids} onHide={() => this.handleCloseBids("viewBids")} style={{textAlign: 'center', fontSize: '.9em'}} centered>
          <Modal.Header closeButton>
            <h5>{this.props.permlink}</h5><hr/>
          </Modal.Header>
          <Modal.Body>
            <Table striped bordered hover>
              <thead>
                <tr key="bid-header">
                  <th>Bidder</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {this.state.bids.sort((a,b) => {return moment(b.created).diff(a.created)}).map((bid, index) => {
                  return (
                    <><tr key={`bid-info-${index}`}>
                      <td>{bid.bidder}</td>
                      <td data-tip data-for={`bid-info-${index}`}>{moment(bid.created+'Z').fromNow()}</td>
                    </tr>
                    <ReactTooltip id={`bid-info-${index}`} type='info'>
                      <span>{moment(bid.created+'Z').valueOf()/1000}</span>
                    </ReactTooltip></>
                  )
                })}
              </tbody>
            </Table>
          </Modal.Body>
        </Modal>
      </Card>
    )
  }
}

export default AuctionCard;
