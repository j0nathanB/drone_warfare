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
          <a className="navbar-brand text-white" href="#">Drone Report &nbsp;&nbsp;&nbsp;&nbsp; |</a>
          <ul className="navbar-nav mr-auto">
            {this.props.countries.map( 
                (location, i) => <Country onClick={this.props.clickHandler} name={location.name} key={i}/> )
              }
              <li className="nav-item text-white" ><a className="navbar-brand text-white">&nbsp; |</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="http://github.com/j0nathanB/droneReport">About</a></li>
          </ul>
        </nav>
      </div>
    )
  }
}

export default NavBar;