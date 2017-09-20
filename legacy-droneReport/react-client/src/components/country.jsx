import React from 'react';

const Country = (props) => (
   <a className="nav-link text-white" onClick={ () => props.onClick(props.name) }>{props.name}</a>
)

export default Country;