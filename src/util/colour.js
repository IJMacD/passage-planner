/**
 * @param {number} h 0 ≤ H < 360
 * @param {number} s 0 ≤ S ≤ 1
 * @param {number} l 0 ≤ L ≤ 1
 */
export function hsl2rgb (h, s, l) {
    // C = (1 - |2L - 1|) × S
    // X = C × (1 - |(H / 60°) mod 2 - 1|)
    // m = L - C/2
    // (R,G,B) = ((R'+m)×255, (G'+m)×255,(B'+m)×255)

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let [_r, _g, _b] = (
        (h <  60) ? [c, x, 0] :
        (h < 120) ? [x, c, 0] :
        (h < 180) ? [0, c, x] :
        (h < 240) ? [0, x, c] :
        (h < 300) ? [x, 0, c] :
                    [c, 0, x]
    );

    return [
        (_r + m) * 255,
        (_g + m) * 255,
        (_b + m) * 255,
    ];
}