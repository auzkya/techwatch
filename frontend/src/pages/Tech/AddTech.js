//Pro přidávání a edit nabídky zařízení
import { useState } from "react";
import FormAddTech from "../../components/FormAddTech";
import { useScrollLock } from "../../hooks/useScrollLock";

const AddTech = ({ isEdit }) => {
    const [loading, setLoading] = useState(false);
    useScrollLock(loading);
    const [setSuccess] = useState("");
    const [setError] = useState("");
    return (
        <>
            {loading && (
                <div className="loader_container">
                    <div className="loader"></div>
                </div>
            )}
            <div className="general_form">
                <h1>
                    {isEdit ? "Úprava nabídky techniky" : "Nabídka techniky"}
                </h1>
                <FormAddTech
                    setLoading={setLoading}
                    setSuccess={setSuccess}
                    setError={setError}
                    isEdit={isEdit}
                />
            </div>
        </>
    );
};

export default AddTech;
