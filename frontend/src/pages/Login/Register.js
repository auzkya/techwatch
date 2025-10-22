import "./Page.css"

import FormRegister from "../../components/FormRegister"

const Register = () => {

        return (
            <>
                <div className="login_page"><img className="login_logo" alt="logo" src={require("../../assets/img_not_compressed/techwatch_logo_2.png")} />
                    <div className="login_section">
                        <h2 className="strong">REGISTRACE</h2>
                        <FormRegister></FormRegister>
                    </div>
                </div>

            </>
        )
    }

    export default Register
