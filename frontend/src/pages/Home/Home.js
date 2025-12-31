import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, buildRoute } from "../../routes/RouteNames";

import Header from "../../components/Header"
import ButtonHomePage from "../../components/ButtonHomePage"
import { useAuth } from "../../context/AuthContext";

import "./Home.css"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-regular-svg-icons';

const Home = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    if (loading) return <div className="loader_container"><div className="loader"></div></div>;

    return (
        <>
            <Header />
            {user ? (
                <p>Vítej, <strong>{user.first_name} {user.last_name}</strong> ({user.email}) 👋</p>
            ) : (
                <p>Nejste přihlášený.</p>
            )}
            <div className="home_nav">
                <img className="home_logo" alt="logo" src={require("../../assets/img_not_compressed/techwatch_logo_1.png")} />
                <div className="home_buttons">
                    <ButtonHomePage
                        icon={<FontAwesomeIcon icon={faMessage} />}
                        text="PRACOVNÍCI"
                        onClick={() => navigate(buildRoute(ROUTES.WORKERS_CATEGORY, { subcategory: "" }))}
                    />
                    <ButtonHomePage
                        icon={<FontAwesomeIcon icon={faMessage} />}
                        text="TECHNIKA"
                        onClick={() => navigate(buildRoute(ROUTES.TECH_CATEGORY, { subcategory: "" }))}
                    />
                </div>

            </div>
        </>
    )
}

export default Home
