export function HeadingIndicator ({ heading, fill = "red", stroke = "darkred" }) {
    const s = 15;
    return (
        <svg viewBox={`${-2*s} ${-2*s} ${s*4} ${s*4}`} style={{width:16,height:16}}>
            <path d={`M 0 ${-2*s} L ${s} ${s} L 0 0 L ${-s} ${s} Z`} transform={`rotate(${heading})`} fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
        </svg>
    )
}