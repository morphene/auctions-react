import React from 'react';

import ReactTooltip from 'react-tooltip'
import Countdown from 'react-countdown-now';

import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';

import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import morpheneJS from '@boone-development/morphene-js';

class AuctionCard extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.handleShowBids = this.handleShowBids.bind(this);
    this.handleCloseBids = this.handleCloseBids.bind(this);
    this.placeBid = this.placeBid.bind(this);

    this.state = {
      bids: [],
      error: false,
      loading: false,
      intervalId: false,
      showViewBids: false
    };
  }

  handleShowBids() {
    this.fetchData({"permlink":this.props.permlink,"limit":10})
    var intervalId = setInterval(function(){
      this.fetchData({"permlink":this.props.permlink,"limit":10})
    }.bind(this), 3000)
    this.setState({ showViewBids: true, intervalId });
  }

  handleCloseBids() {    
    clearInterval(this.state.intervalId)
    this.setState({showViewBids: false, intervalId: false})
  }

  placeBid(permlink) {
    const localKeyStore = JSON.parse(localStorage["morph-key-storage"] || "{}")
    if(localKeyStore && localKeyStore.username && localKeyStore.activeKey) {
      const { username, activeKey } = localKeyStore
      morpheneJS.broadcast.placeBidAsync(activeKey, username, permlink)
        .then((result) => {console.log(result)})
        .catch((error) => {console.log(error)})
    }
  }

  fetchData = (params) => {
    this.setState({ loading: true })

    morpheneJS.api.getBidsAsync(params.permlink, params.limit)
      .then(result => {
        this.setState({ loading: false, bids: result })
      })
      .catch(error => {
        this.setState({ loading: false })
      })
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

    return (
      <Card className="mx-auto card-style" id={`card-${this.props.permlink}`}>
        <Card.Header style={{backgroundColor}}>
          {header}
        </Card.Header>
        <Card.Body>
          <Card.Text>
            <span style={{lineHeight: '1.75em'}}><b>Consigner:</b><br/>{this.props.consigner}<br/></span>
            <span style={{lineHeight: '1.75em'}}><b>Duration:</b><br/>
              {moment(this.props.end_time+'Z').diff(moment(this.props.start_time+'Z')) / 1000} seconds<br/></span>
            <span style={{lineHeight: '1.75em'}}><b>Value:</b><br/>{this.props.total_payout}&nbsp;({this.props.bids_count} bids)<br/></span>
            <span style={{display: 'block', lineHeight: '1.75em'}}><b>Current Bid:</b><br/>{this.props.last_bidder}<br/></span>
          </Card.Text>
          <Button data-tip data-for='viewBids' className="auction-button" onClick={() => this.handleShowBids("viewBids")}>
            <FontAwesomeIcon icon="eye" />
          </Button>
          <ReactTooltip id='viewBids' type='info'>
            <span>View Bids</span>
          </ReactTooltip>
          <Button data-tip data-for='placeBid' className="auction-button" variant="info" onClick={() => this.placeBid(this.props.permlink)}>
            <FontAwesomeIcon icon="coins" />
          </Button>
          <ReactTooltip id='placeBid' type='info'>
            <span>Place Bid</span>
          </ReactTooltip>
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
                    <tr key={`bid-info-${index}`}>
                      <td>{bid.bidder}</td>
                      <td>{moment(bid.created+'Z').valueOf()/1000}</td>
                    </tr>
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
