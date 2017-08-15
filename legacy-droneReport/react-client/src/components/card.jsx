//AIzaSyAWh923QwLcLQGjH1w4OYOG0_CX8jGHbmE
import React from 'react';

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
    }
  }

  render() {
    return (
      <div>
        <pre>IMG placeholder</pre>
        <h1> {this.props.strike.location} </h1><p />
        <h3> Deaths: {this.props.strike.deaths} </h3><p />
        <h3> Injuries: {this.props.strike.injuries} </h3><p />
        <h3> Civilians: {this.props.strike.civilians} </h3><p />
        <h3> Children: {this.props.strike.children} </h3><p />
      </div>
    )
  }
}

export default Card;