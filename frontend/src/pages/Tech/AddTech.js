//Pro přidávání a edit nabídky zařízení
import { useState } from "react";
import FormAddTech from "../../components/FormAddTech"
import Header from "../../components/Header"

const AddTech = () => {
        const [loading, setLoading] = useState(false);
        const [success, setSuccess] = useState("");
        const [error, setError] = useState("");
    return (
        <>
            <Header />
            {loading && <div className="loader_container"><div className="loader"></div></div>}
            <div className="general_form">
                <h1>Nabídka techniky</h1>
                <FormAddTech setLoading={setLoading}
                            setSuccess={setSuccess}
                            setError={setError}/>
            </div>

        </>
    )
}

export default AddTech
