import React from 'react';

const Country = (props) => (
   <li className="nav-item"><a className="nav-link text-white" href="#" onClick={ () => props.onClick(props.name) }>{props.name}</a></li>
)

export default Country;