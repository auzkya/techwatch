import { useState } from "react";

import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


import "./Page.css";

import ForgotPasswordForm from "../../components/FormForgotPassword";

import { ASSETS } from "../../config/assets";
import { useScrollLock } from "../../hooks/useScrollLock";

const ForgotPassword = () => {
    const [infoText, setInfoText] = useState("Zadejte e-mailovou adresu svého účtu");

    const [loading, setLoading] = useState(false);
    useScrollLock(loading);
    const [errorTop, setErrorTop] = useState("");

    const showMessage = loading;

    const hideMessage = () => {
        if (loading === false){
            setLoading(false);
        }
    }

    return (
        <>
            {showMessage && (
                <div className="message_container" onClick={hideMessage}>
                    {loading && <div className="loader"></div>}
                </div>
            )}

            <div className="login_page">
                <div className="login_page_child">
                    <img className="login_logo" alt="logo" src={ASSETS.logo_top} />
                    <div className="login_section">
                        <h2 className="strong">ZAPOMENUTÉ HESLO</h2>
                        <p className="login_section_info body_base" dangerouslySetInnerHTML={{ __html: infoText }} />
                        {errorTop && <div className="error_all error_all_center"><FontAwesomeIcon icon={faCircleXmark} className="error_icon" /><p className="error_text strong" dangerouslySetInnerHTML={{ __html: errorTop }}/><FontAwesomeIcon icon={faCircleXmark} className="error_icon_right" /></div>}
                        <ForgotPasswordForm setLoading={setLoading} setErrorTop={setErrorTop} setInfoText={setInfoText}></ForgotPasswordForm>
                    </div>
                </div>
            </div>

        </>
    )
}

export default ForgotPassword
