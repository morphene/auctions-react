import React from 'react';
import CardDeck from 'react-bootstrap/CardDeck';
import AuctionCard from './AuctionCard.js';
import moment from 'moment';
import morpheneJS from '@boone-development/morphene-js';

class FetchData extends React.Component {
  state = {
    auctions: [],
    error: false,
    loading: false,
    intervalId: false
  }
  
  clearState = () => {
    this.setState({
      auctions: [],
      error: false,
      loading: false,
      intervalId: false
    });
  }

  changeStatus = (status) => {
    this.setState({status})
    this.fetchData("get_auctions_by_status", {status, limit: 20})
  }

  componentDidMount() {
    this.fetchData({status: ["pending","active"], limit: 20})
    var intervalId = setInterval(function(){
      this.fetchData({status: ["pending","active"], limit: 20})
    }.bind(this), 3000)
    this.setState({intervalId: intervalId})
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }

  fetchData = (params) => {
    this.setState({ loading: true })

    morpheneJS.api.getAuctionsByStatusAsync(params.status, params.limit)
      .then(result => {
        this.setState({ loading: false, auctions: result })
      })
      .catch(error => {
        this.setState({ loading: false })
      })
  }

  renderAuctions = (auctions) => {
    var auctionsData = auctions.sort((a,b) => {
      return moment.utc(a.start_time).diff(moment.utc(b.start_time))
    }).sort((a,b) => {
      return moment.utc(a.end_time).diff(moment.utc(b.end_time))
    })
    .map((auction) => {
      return (
        <AuctionCard
          key={`auction-${auction['id']}`}
          status={auction['status']}
          consigner={auction['consigner']}
          permlink={auction['permlink']}
          bids_count={auction['bids_count']}
          total_payout={auction['total_payout']}
          last_bidder={auction['last_bidder']}
          start_time={auction['start_time']}
          end_time={auction['end_time']}
        />)
      })

    if( auctionsData.length > 0) {
      return (
        <CardDeck>
          {auctionsData}
        </CardDeck>
      )
    } else {
      return (
        <div>
          No auctions.
        </div>
      )
    }

  }
  
  render() {
    const { auctions } = this.state;

    return (
      <div>
        {this.renderAuctions(auctions)}
      </div>
    )
  }
}

export default FetchData;
