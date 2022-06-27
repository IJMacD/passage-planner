export function ToggleSelect ({ values, onChange, options }) {
    function handleChange (e) {
        if (e.target.checked) {
            onChange([ ...values, e.target.value ]);
        } else {
            onChange(values.filter(v => v !== e.target.value));
        }
    }

    return (
        <div>
            {
                options.map(option => {
                    return (
                        <label key={option.value}>
                            <input type="checkbox" value={option.value} onChange={handleChange} checked={values.includes(option.value)} />
                            { option.label }
                        </label>
                    )
                })
            }
        </div>
    )
}