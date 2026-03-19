import "./InputLogin.css";

const InputLogin = ({
    type,
    name,
    placeholder,
    autoComplete,
    required,
    error_message,
    value,
    onChange,
    extraClass,
    disabled,
}) => {
    return (
        <input
            type={type}
            name={name}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required={required ? true : undefined}
            value={value || ""} // ← přidej
            onChange={onChange} // ← přidej
            disabled={disabled}
            className={`input-login ${extraClass ? extraClass : ""}`}
        />
    );
};

export default InputLogin;
