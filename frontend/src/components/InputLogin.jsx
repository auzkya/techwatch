import "./InputLogin.css";

const InputLogin = ({ type, name, placeholder, autoComplete, required, error_message, value, onChange, extraClass }) => {
    return (
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required={required ? true : undefined} // nebo jen required={required}
            value={value}      // ← přidej
            onChange={onChange} // ← přidej
            className={`input-login ${extraClass ? extraClass : ""}`}
        />
    )
}

export default InputLogin
