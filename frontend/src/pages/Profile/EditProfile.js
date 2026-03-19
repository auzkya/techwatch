//Pro edit profilu
import { useState } from "react";
import FormEditProfile from "../../components/FormEditProfile";
import { useAuth } from "../../context/AuthContext";
import { useScrollLock } from "../../hooks/useScrollLock";

const EditProfile = () => {
    const [loading, setLoading] = useState(false);
    useScrollLock(loading);
    const { loading: authLoading } = useAuth();
    return (
        <>
            {(authLoading || loading) && (
                <div className="loader_container_fullscreen">
                    <div className="loader" />
                </div>
            )}

            <div
                style={{
                    display: authLoading || loading ? "none" : "block",
                }}
            >
                <div className="general_form">
                    <h1>Profil</h1>
                    <FormEditProfile setLoading={setLoading} />
                </div>
            </div>
        </>
    );
};

export default EditProfile;
