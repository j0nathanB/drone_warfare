import React from 'react';
import ReactDOM from 'react-dom';
import Map from './components/map.jsx'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
    }
  }

  render() {
    return (
      <div>
        Map should be below:
        <Map />
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));