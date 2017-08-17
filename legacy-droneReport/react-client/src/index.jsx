import React from 'react';
import ReactDOM from 'react-dom';
import GoogleMap from './components/map.jsx';
import CountryList from './components/countryList.jsx'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      countries: ["Pakistan", "Somalia", "Yemen"],
      activeCountry: ""
    }
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(selection) {
    console.log('selection: ' + selection)
    this.setState({
      activeCountry: selection
    }, () => console.log('state: ' + this.state.activeCountry))
    
  }

  render() {
    return (
        <div> 
        <CountryList clickHandler={this.handleClick} countries={this.state.countries}/>
        <GoogleMap country={this.state.activeCountry}/>
        </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));