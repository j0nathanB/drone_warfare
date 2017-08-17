import React from 'react';
import ReactDOM from 'react-dom';
import GoogleMap from './components/map.jsx';
import CountryList from './components/card.jsx'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
    }
  }

  render() {
    return (
        <div> 
        <CountryList />
        <GoogleMap />
        </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));