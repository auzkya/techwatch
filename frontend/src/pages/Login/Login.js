import "./Page.css"

import InputLogin from "../../components/InputLogin"
import SubmitLogin  from "../../components/SubmitLogin"

const Login = () => {
    return (
        <>
            <div className="login_page"><img className="login_logo" alt="logo" src={require("../../assets/img_not_compressed/techwatch_logo_2.png")} />
                <div className="login_section">
                    <h2 className="strong">PŘIHLÁŠENÍ</h2>
                <form>
                    <InputLogin type={"email"} placeholder={"Email"} required={true}></InputLogin>
                    <InputLogin type={"password"} placeholder={"Heslo"} autocomplete={"current-password"} required={true}></InputLogin>
                    <a href="../">Zapomenuté heslo?</a>
                    <SubmitLogin value={"Přihlásit se"}></SubmitLogin>
                </form>
                </div>
            </div>

        </>
    )
}

export default Login
