import React from 'react';

const Country = (props) => (
   <pre onClick={ () => props.onClick(props.name) }>{props.name}</pre>
)

export default Country;