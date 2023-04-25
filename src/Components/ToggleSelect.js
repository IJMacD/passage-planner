import React from "react";

/**
 *
 * @param {object} props
 * @param {string[]} props.values
 * @param {(values: string[]) => void} props.onChange
 * @param {{value: string; label: string }[]} props.options
 * @param {(index: number) => void} [props.onRemove]
 * @returns
 */
export function ToggleSelect ({ values, onChange, options, onRemove }) {
    function handleChange (e) {
        if (e.target.checked) {
            onChange([ ...values, e.target.value ]);
        } else {
            onChange(values.filter(v => v !== e.target.value));
        }
    }

    const removeStyle = {
        fontSize: "0.8em",
        marginLeft: "1em",
    };

    return (
        <div>
            {
                options.map((option, i) => {
                    return (
                        <label key={option.value} style={{display: "flex"}}>
                            <input type="checkbox" value={option.value} onChange={handleChange} checked={values.includes(option.value)} />
                            <span style={{flex:1}}>{ option.label }</span>
                            { onRemove && <button onClick={e => { e.preventDefault(); onRemove(i); }} style={removeStyle}>❌</button> }
                        </label>
                    )
                })
            }
        </div>
    )
}