import React from "react";

/**
 *
 * @param {object} props
 * @param {string[]} props.selectedValues
 * @param {(values: string[]) => void} props.onChange
 * @param {{value: string; label: string, disabled?: boolean }[]} props.options
 * @param {(value: string) => void} [props.onRemove]
 * @param {(value: string) => void} [props.onMoveUp]
 * @returns
 */
export function ToggleSelect ({ selectedValues, onChange, options, onRemove, onMoveUp }) {
    function handleChange (e) {
        if (e.target.checked) {
            onChange([ ...selectedValues, e.target.value ]);
        } else {
            onChange(selectedValues.filter(v => v !== e.target.value));
        }
    }

    const btnStyle = {
        fontSize: "0.8em",
        marginLeft: "1em",
    };

    return (
        <div>
            {
                options.map((option, i) => {
                    return (
                        <label key={option.value} style={{display: "flex"}} title={option.value}>
                            <input type="checkbox" value={option.value} onChange={handleChange} checked={selectedValues.includes(option.value)} disabled={option.disabled} />
                            <span style={{flex:1}}>{ option.label }</span>
                            <div style={btnStyle}>
                                { i > 0 && onMoveUp && <button onClick={e => { e.preventDefault(); onMoveUp(option.value); }} title="Move Layer Up">⬆️</button> }
                                { onRemove && <button onClick={e => { e.preventDefault(); onRemove(option.value); }} title="Remove Layer">❌</button> }
                            </div>
                        </label>
                    )
                })
            }
        </div>
    )
}