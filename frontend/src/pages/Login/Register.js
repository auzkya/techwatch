import { useState } from "react";

import "./Page.css"

import FormRegister from "../../components/FormRegister"

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';

const Register = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [titleText, setTitleText] = useState("REGISTRACE"); // dynamický titul
    const [infoText, setInfoText] = useState("");


    return (
        <>
            {loading && <div className="loader_container"><div className="loader"></div></div>}
            <div className="login_page">
                <div className="login_page_child">
                    <img className="login_logo" alt="logo" src={require("../../assets/img_not_compressed/techwatch_logo_1.png")} />
                    <div className="login_section">
                        <h2 className="strong">{titleText}</h2>
                        {infoText && (<p className="login_section_info body_base" dangerouslySetInnerHTML={{ __html: infoText }} />)}
                        <FormRegister setLoading={setLoading}
                            setSuccess={setSuccess}
                            setTitleText={setTitleText} setInfoText={setInfoText}></FormRegister>
                        {setTitleText === "REGISTRACE" && (
                            <>
                                <div className="oauth_divider"><span className="body_base">nebo</span></div>
                                <div className="oauth_container">
                                    <button className="oauth_button" onClick={() => window.location.href = "http://127.0.0.1:8000/auth/google/redirect"}>
                                        <FontAwesomeIcon icon={faGoogle} className="oauth_icon" /><p className="oauth_text strong">Pokračovat přes Google</p>
                                    </button>
                                    <button className="oauth_button" onClick={() => window.location.href = "http://127.0.0.1:8000/auth/facebook/redirect"}>
                                        <FontAwesomeIcon icon={faFacebookF} className="oauth_icon" /><p className="oauth_text strong">Pokračovat přes Facebook</p>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <p className="login_link">Už máš účet?
                    <a href="./Login" className="login_a strong"> Přihlas se!</a>
                </p>

            </div>

        </>
    )
}

export default Register
