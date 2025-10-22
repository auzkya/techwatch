import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, buildRoute } from "../../routes/RouteNames";

import Header from "../../components/Header"
import ButtonHomePage from "../../components/ButtonHomePage"

import "./Home.css"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMessage } from '@fortawesome/free-regular-svg-icons';

const Home = () => {
    const navigate = useNavigate();

    //Zkouším backend
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("http://localhost/techwatch-backend/api/hello.php")
            .then(res => res.json())
            .then(data => setMessage(data.message))
            .catch(err => console.error(err));
    }, []);

    return (
        <>
            <Header />
            <div>
                <h1>React + PHP backend</h1>
                <p>{message}</p>
            </div>
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