import { useState } from "react";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';

import "./Page.css"

import ResetPasswordForm from "../../components/FormResetPassword";

import { ASSETS } from "../../config/assets";
import { useScrollLock } from "../../hooks/useScrollLock";

const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    useScrollLock(loading);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [errorTop, setErrorTop] = useState("");

    const hideMessage = () => {
        if (loading === false){
            setLoading(false);
            setError("");
            setSuccess("");
        }
    }

    const showMessage = success || error || loading; // kdy se má zobrazit message_container

    return (
        <>
            {showMessage && (<div className="message_container" onClick={hideMessage}>
                {loading && (<div className="loader"></div>)}

                {!loading && (
                    <div className="message_container_text body_base">
                        {success && <p className="body_base success-message" dangerouslySetInnerHTML={{ __html: success}} />}
                        {error && <p className="body_base error-message" dangerouslySetInnerHTML={{ __html: error}} />}
                    </div>
                )}
            </div>
            )}
            <div className="login_page">
                <div className="login_page_child">
                    <img className="login_logo" alt="logo" src={ASSETS.logo_top} />
                    <div className="login_section">
                        <h2 className="strong">NOVÉ HESLO</h2>
                        {errorTop && <div className="error_all error_all_center"><FontAwesomeIcon icon={faCircleXmark} className="error_icon" /><p className="error_text strong" dangerouslySetInnerHTML={{ __html: errorTop }}/><FontAwesomeIcon icon={faCircleXmark} className="error_icon_right" /></div>}
                        <ResetPasswordForm setLoading={setLoading} setSuccess={setSuccess} setError={setError} setErrorTop={setErrorTop}></ResetPasswordForm>
                    </div>
                </div>
            </div>

        </>
    )
}

export default ResetPassword
