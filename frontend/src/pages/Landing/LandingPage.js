import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Předpokládám, že máš AuthContext
import { ROUTES } from "../../routes/RouteNames";

import "./LandingPage.css";

import { ASSETS } from "../../config/assets";

const LandingPage = () => {
    const { user } = useAuth();

    const navigate = useNavigate();

    const handleNavigation = () => {
        if (user) {
            navigate(ROUTES.HOME);
        } else {
            navigate(ROUTES.LOGIN);
        }
    };

    return (
        <div className="landing-container">
            <div className="landing">
                <img className="home_logo" alt="logo" src={ASSETS.logo_top} />

                <h2>Platforma pro technické pracovníky v kultuře</h2>
                <p className="body_base">
                    TechWatch je webová platforma pro techniky v kulturním
                    sektoru, včetně divadel, koncertů a festivalů. Náš systém
                    usnadňuje sdílení technického vybavení a propojuje
                    kvalifikované techniky s krátkodobými pracovními
                    příležitostmi.
                </p>

                <button
                    type="button"
                    className="enter-app-button smaller_scale"
                    onClick={handleNavigation}
                >
                    <h3>Vstoupit do aplikace</h3>
                </button>
            </div>
            <footer className="login-footer">
                <Link to="/privacy" className="body_smallest">
                    Privacy Policy
                </Link>
            </footer>
        </div>
    );
};

export default LandingPage;
