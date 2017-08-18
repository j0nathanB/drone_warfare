import React from 'react';
import Country from './country.jsx'

const NavBar = (props) => (
  <nav className="navbar navbar-expand-lg navbar-light bg-dark">
    <a className="navbar-brand text-white" href="#">Drone Report &nbsp;&nbsp;&nbsp;&nbsp; |</a>
    <ul className="navbar-nav mr-auto">
      {props.countries.map( 
          (location, i) => <Country onClick={props.clickHandler} name={location.name} key={i}/> )}
    </ul>
  </nav>
)

export default NavBar;