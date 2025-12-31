import "./TextArea.css";

const TextArea = ({ type, name, placeholder, autoComplete, required, rows, maxLength, error_message, value, onChange, extraClass }) => {
    return (
        <textarea
            type={type}
            name={name}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required={required ? true : undefined}
            rows={rows}
            maxLength={maxLength}
            value={value}      // ← přidej
            onChange={onChange} // ← přidej
            className={`form_textarea ${extraClass ? extraClass : ""}`}
        />
    )
}

export default TextArea
