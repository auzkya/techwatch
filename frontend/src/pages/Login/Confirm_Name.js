import { useState } from "react";

import "./Page.css";

import FormConfirmName from "../../components/FormConfirmName";

import { ASSETS } from "../../config/assets";
import { useScrollLock } from "../../hooks/useScrollLock";

const ConfirmName = () => {
    const [loading, setLoading] = useState(false);
    useScrollLock(loading);
    const [error, setError] = useState("");

    const hideMessage = () => {
        if (loading === false) {
            setLoading(false);
            setError("");
        }
    };

    const showMessage = error || loading; // kdy se má zobrazit message_container

    return (
        <>
            {showMessage && (
                <div className="message_container" onClick={hideMessage}>
                    {loading && <div className="loader"></div>}

                    {!loading && (
                        <div className="message_container_text body_base">
                            {error && (
                                <p
                                    className="body_base error-message"
                                    dangerouslySetInnerHTML={{ __html: error }}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="login_page">
                <div className="login_page_child">
                    <img
                        className="login_logo"
                        alt="logo"
                        src={ASSETS.logo_top}
                    />
                    <div className="login_section">
                        <h2 className="strong">POTVRZENÍ JMÉNA</h2>
                        <p className="login_section_info body_base">
                            Doplňte své jméno a příjmení
                        </p>
                        <FormConfirmName
                            setLoading={setLoading}
                            setError={setError}
                        ></FormConfirmName>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmName;
