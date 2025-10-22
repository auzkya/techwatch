import React from "react";
import { Link } from "react-router-dom";

import {categoryMap} from "../config/CategoryMap"

import "./Path.css"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-regular-svg-icons';

const Path = (props) => {

  return (
    <div className="all-path">
      <div className="path">
        <p className="home"><Link className="path-a" to={`/`}><FontAwesomeIcon icon={faHouse} /></Link></p>
        {/* Pokud props.type existuje, zobrazí se šipka a type */}
        {props.type && (
          <>
            <p>&gt;</p>
            <p><Link className="path-a" to={`/${props.type}`}>{categoryMap[props.type] || props.type}</Link></p> {/* fallback na URL, pokud nenajde */}
          </>
        )}
        {/* Pokud props.subcategory existuje, zobrazí se šipka a subcategory */}
        {props.subcategory && (
          <>
            <p>&gt;</p>
            <p><Link className="path-a" to={`/${props.type}/${props.subcategory}`}>{categoryMap[props.subcategory] || props.subcategory}</Link></p>
          </>
        )}        
      </div>

    </div>
  )
}

export default Path