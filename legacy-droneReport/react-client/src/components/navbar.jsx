import React from 'react';
import Country from './country.jsx';

class NavBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render(props) {
    return (
      <div>
        <nav className="navbar navbar-expand-lg navbar-light bg-dark">
          <a className="navbar-brand text-white" href=".">Drone Report</a>
          <a className="navbar-brand text-white">&nbsp; |</a>
          {this.props.countries.map( 
              (location, i) => <Country onClick={this.props.clickHandler} name={location.name} key={i}/> )
            }
          <a className="navbar-brand text-white">&nbsp; |</a>
          <a className="nav-link text-white" href="https://github.com/j0nathanB/droneReport/blob/master/README.md">About</a>
        </nav>
      </div>
    )
  }
}

export default NavBar;