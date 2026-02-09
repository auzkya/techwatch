import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, buildRoute } from "../../routes/RouteNames";

import Header from "../../components/Header"
import ButtonHomePage from "../../components/ButtonHomePage"
import { useAuth } from "../../context/AuthContext";
import { useScrollLock } from "../../hooks/useScrollLock";

import "./Home.css"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPeopleGroup, faGears } from '@fortawesome/free-solid-svg-icons';

import { ASSETS } from "../../config/assets";

const Home = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    useScrollLock(loading);

    return (
        <>
            {/*user ? (
                <p>Vítej, <strong>{user.first_name} {user.last_name}</strong> ({user.email}) 👋</p>
            ) : (
                <p>Nejste přihlášený.</p>
            )*/}
            <div className="home_nav">
                <img className="home_logo" alt="logo" src={ASSETS.logo_top} />
                <div className="home_buttons">
                    <ButtonHomePage
                        icon={<FontAwesomeIcon icon={faPeopleGroup} />}
                        text="PRACOVNÍCI"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS, { subcategory: "" }))}
                    />
                    <ButtonHomePage
                        icon={<FontAwesomeIcon icon={faGears} />}
                        text="TECHNIKA"
                        onClick={() => navigate(buildRoute(ROUTES.TECH, { subcategory: "" }))}
                    />
                </div>

            </div>
        </>
    )
}

export default Home
