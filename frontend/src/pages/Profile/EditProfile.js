//Pro edit profilu
import { useState } from "react";
import FormEditProfile from "../../components/FormEditProfile"
import Header from "../../components/Header"
import { useAuth } from "../../context/AuthContext";

const EditProfile = () => {
    const [loading, setLoading] = useState(false);
    const { loading: authLoading } = useAuth();
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    return (
        <>
            <Header />
            {(authLoading || loading) && (
                <div className="loader_container">
                    <div className="loader" />
                </div>
            )}

            <div
                style={{
                    display: authLoading || loading ? "none" : "block"
                }}
            >
                <div className="general_form">
                    <h1>Profil</h1>
                    <FormEditProfile
                        setLoading={setLoading}
                    />
                </div>
            </div>
        </>
    )
}

export default EditProfile
