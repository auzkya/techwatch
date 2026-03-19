import "./TextArea.css";

const TextArea = ({
    type,
    name,
    placeholder,
    autoComplete,
    required,
    rows,
    maxLength,
    error_message,
    value,
    onChange,
    extraClass,
}) => {
    const currentLength = value ? value.length : 0;
    const remaining = maxLength ? maxLength - currentLength : null;

    // Kontrola, zda jsme překročili limit
    const isOverLimit = maxLength && remaining < 0;

    return (
        <>
            <textarea
                type={type}
                name={name}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required={required ? true : undefined}
                rows={rows}
                //maxLength={maxLength}
                value={value} // ← přidej
                onChange={onChange} // ← přidej
                className={`form_textarea ${extraClass ? extraClass : ""}`}
            />
            {maxLength && (
                <div
                    className={`textarea-char-counter ${isOverLimit ? "textarea-at-limit" : ""}`}
                >
                    {remaining}
                </div>
            )}
        </>
    );
};

export default TextArea;
