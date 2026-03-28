//AIzaSyAWh923QwLcLQGjH1w4OYOG0_CX8jGHbmE
import React from 'react';
import Country from './country.jsx';


class CountryList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        {this.props.countries.map( 
          (location, i) => <Country onClick={this.props.clickHandler} name={location.name} key={i}/> )}
      </div>
    )
  }
}

export default CountryList;