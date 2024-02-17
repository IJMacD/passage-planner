import { useContext, useEffect, useRef } from "react";
import { DragContext, StaticMapContext } from "../Components/StaticMapContext.js";
import React from "react";
import { getBounds, lonLat2XY } from "../util/projection.js";
import { latlon2nm } from "../util/geo.js";

const MAX_PARTICLE_COUNT = 400;
const debugInfluenceCircle = false;
const debugMask = false;

/**
 * @typedef Particle
 * @property {number} lon
 * @property {number} lat
 * @property {number} animation
 * @property {number} rotation
 * @property {number} opacity
 */

/**
 * Layer to show many particles whose movement is controlled by weighted sum of
 * nearby points on a vector field.
 * @param {object} props
 * @param {import("./VectorFieldLayer.js").Field} props.field
 * @param {string} [props.particleFill]
 * @param {number} [props.rangeLimit] In nautical miles. Default = 1 nm
 * @param {number} [props.speed] Arbitrary units. 1 is slow. 10 is fast.
 * @param {number} [props.density] Arbitrary units. 1 is few. 10 is many.
 * @param {number} [props.particleSize]
 * @param {"rod"|"dot"|"bar"} [props.particleStyle]
 * @param {number} [props.particleLifetime] Lifetime in seconds
 * @param {HTMLCanvasElement?} [props.mask]
 * @returns
 */
export function ParticleFieldLayer({
    field,
    particleFill = "#999",
    rangeLimit = 10,
    speed = 3,
    density = 1,
    particleSize = 3,
    particleStyle = "dot",
    particleLifetime = 10,
    mask = null,
}) {

    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    /** @type {import("react").MutableRefObject<Particle[]>} */
    const particlesRef = useRef([]);

    const context = useContext(StaticMapContext);
    const { centre, zoom, width, height } = context;

    const [left, top] = useContext(DragContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    const bounds = getBounds(context);

    if (particlesRef.current.length === 0) {
        particlesRef.current = makeParticles(MAX_PARTICLE_COUNT, bounds);
    }

    const [west, south, east, north] = bounds;

    // Clear canvas when bounds change
    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });

        if (!ctx) return;

        ctx.canvas.width = pxWidth;
        ctx.canvas.height = pxHeight;
    }, [west, south, east, north, pxWidth, pxHeight]);

    useEffect(() => {
        const dpr = devicePixelRatio;

        const coef_speed = 3e-5 * speed;

        let active = true;
        let prevTime = NaN;
        const particles = particlesRef.current;

        if (particles.length === 0) return;

        // No need to render an empty field
        if (field.length === 0) {
            return;
        }

        const bounds = getBounds({ centre, zoom, width, height });

        /**
         * @param {number} time
         */
        function step(time) {
            if (!active) {
                return;
            }

            requestAnimationFrame(step);

            if (isNaN(prevTime)) {
                prevTime = time;
                return;
            }

            const delta = time - prevTime;
            prevTime = time;

            if (delta < 0) {
                console.error("Negative delta: ", delta);
                return;
            }

            if (!canvasRef.current) return;

            const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });

            if (!ctx) return;

            ctx.globalCompositeOperation = "source-over";

            // Fade previous render
            changeAlpha(ctx, 0, 0, pxWidth, pxHeight, -16);

            const desiredParticleCount = 3.2e6 * Math.exp(-0.74893 * zoom) * density;
            let count = 0;

            const weightLimit = 1 / rangeLimit;

            const projection = lonLat2XY({ centre, zoom, width, height });

            for (const particle of particles) {
                if (count++ > desiredParticleCount) {
                    break;
                }

                const [x, y] = projection(particle.lon, particle.lat);

                /** @type {((import("./VectorFieldLayer.js").PolarFieldPoint|import("./VectorFieldLayer.js").VectorFieldPoint)&{weight:number})[]} */
                // @ts-ignore
                const fieldPoints = field.map(fp => {
                    const weight = 1 / latlon2nm(particle, fp);
                    return (weight > weightLimit) ? { ...fp, weight } : null;
                }).filter(fp => fp);

                // Debug influence circle
                if (debugInfluenceCircle) {
                    ctx.globalAlpha = Math.sin(particle.animation * Math.PI);
                    ctx.beginPath();
                    // range is in nautical miles
                    const distInDegrees = rangeLimit / 60;
                    const [, y2] = projection(particle.lon, particle.lat + distInDegrees);
                    ctx.arc(x * dpr, y * dpr, (y - y2) * dpr, 0, Math.PI * 2);
                    ctx.strokeStyle = "red";
                    ctx.stroke();
                }

                const sum = fieldPoints.reduce((sum, p) => sum + p.weight, 0);

                // 2 ---> x <--------- 4
                // sum = 6
                // A: 0.66666
                // B: 0.33333
                // 1/2 + 1/4
                // 2/4 + 1/4 = 3/4
                // 2/4 / 3/4 = 0.666
                // 1/4 / 3/4 = 0.333
                /** @type {[number, number]} */
                const vector = fieldPoints.reduce((vector, p) => {
                    let x;
                    let y;
                    if ("vector" in p) {
                        [x, y] = p.vector;
                    }
                    else {
                        x = p.magnitude * Math.sin(p.direction * Math.PI / 180);
                        y = p.magnitude * -Math.cos(p.direction * Math.PI / 180);
                    }
                    const t = p.weight / sum;
                    return [
                        vector[0] + t * x,
                        vector[1] + t * y,
                    ];
                }, [0, 0]);

                const rotation = Math.atan2(vector[1], vector[0]);
                const magnitude = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

                const f = delta * coef_speed * Math.pow(zoom, -2);

                if (isNaN(particle.rotation)) {
                    particle.rotation = rotation;
                }

                particle.rotation = interpolateAngle(0.9, particle.rotation, rotation);
                const dx = magnitude * Math.cos(particle.rotation);
                const dy = magnitude * Math.sin(particle.rotation);
                particle.lon += dx * f;
                particle.lat += -dy * f;

                if (isOutOfBounds(particle, vector, bounds)) {
                    resetParticle(particle, bounds);
                    continue;
                }

                // console.log({ delta, particle });

                // Draw

                // particle.animation is animation phase offset
                const animation = ((time / 1000 + particle.animation * particleLifetime) % particleLifetime) / particleLifetime;

                // https://www.geogebra.org/m/zt77cdbb
                // let opacity = Math.sin(animation * Math.PI);
                // let opacity = 1 - Math.pow(2 * animation - 1, 2);
                let opacity = 1 - Math.abs(2 * animation - 1);

                if (particleStyle === "bar") {
                    opacity *= Math.min(1, magnitude);
                }

                // Interpolate opacity
                const t = 0.1;
                const oldOpacity = particle.opacity;
                particle.opacity *= (1 - t);
                particle.opacity += opacity * t;
                const d = particle.opacity - oldOpacity;

                // let d = 0;
                // // particle.opacity + d = particle.opacity * (1-t) + opacity * t;
                // // d = particle.opacity * (1-t) + opacity * t - particle.opacity;
                // // d = (1-t) + opacity * t / particle.opacity - 1;
                // // d = -t + opacity * t / particle.opacity;
                // // d = opacity / particle.opacity * t - t;
                // // d = (opacity / particle.opacity - 1) * t;
                // if (particle.opacity > 0) {
                //     d = (opacity / particle.opacity - 1) * t;
                // }
                // else {
                //     d = opacity * t;
                // }

                // particle.opacity += d;

                // Don't render static dots or nearly faded dots
                if (magnitude < 0.001 || (d <= 0 && particle.opacity < 0.1)) {
                    // Move randomly and hope new position has movement
                    resetParticle(particle, bounds);

                    continue;
                }

                // Debug

                // ctx.globalAlpha = 1;
                // ctx.beginPath();
                // ctx.arc(dpr * x, dpr * y, dpr * 5, 0, Math.PI * 2);
                // ctx.fillStyle = "red";
                // ctx.fill();

                // Draw

                // 0 deg points to right
                // --->O

                ctx.save();
                ctx.translate(x * dpr, y * dpr);
                ctx.rotate(particle.rotation);

                ctx.fillStyle = particleFill;
                ctx.strokeStyle = particleFill;
                ctx.lineWidth = particleSize * dpr;
                ctx.lineCap = "round";
                ctx.globalAlpha = particle.opacity;

                if (particleStyle === "rod") {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(-dpr * magnitude, 0);
                    ctx.stroke();
                }
                else if (particleStyle === "bar") {
                    ctx.beginPath();
                    ctx.moveTo(0, -particleSize * dpr);
                    ctx.lineTo(0, particleSize * dpr);
                    ctx.stroke();
                }
                else {
                    ctx.beginPath();
                    ctx.arc(0, 0, particleSize, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.restore();
            }

            if (mask) {
                ctx.globalCompositeOperation = "destination-in";
                if (debugMask) {
                    ctx.globalCompositeOperation = "copy";
                }
                ctx.drawImage(mask, 0, 0);
            }
        }

        requestAnimationFrame(step);

        return () => { active = false; }

    }, [
        centre, zoom,
        width, height,
        pxWidth, pxHeight,
        field,
        rangeLimit, speed, density,
        particleFill,
        particleStyle,
        particleLifetime,
        particleSize,
        mask,
    ]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top, left }} />;
}

/**
 * @param {number} t
 * @param {number} currentRotation
 * @param {number} targetRotation
 */
function interpolateAngle(t, currentRotation, targetRotation) {
    // Naive implementation
    // return t * currentRotation + (1 - t) * targetRotation;

    // θ0:=(θ0mod2π)
    // then if (θ0>π)
    // then θ0:=θ0−2π
    // θ1:=(θ1mod2π)
    // then if (θ1>π)
    // then θ1:=θ1−2π
    // ε=sgn(θ1−θ0)
    // [sign function, -1 if <0 and +1 if >0 else 0]

    // Our angles are now correct and we can interpolate :

    // If |θ1−θ0|≤π
    // then θ(r)=θ0+r(θ1−θ0)
    // If |θ1−θ0|≥π
    // then θ(r)=θ0+r(θ1−θ0−2επ)
    // const two_pi = Math.PI * 2;

    // let theta0 = currentRotation % two_pi;
    // if (theta0 > Math.PI) theta0 -= two_pi;

    // let theta1 = targetRotation % two_pi;
    // if (theta1 > Math.PI) theta1 -= two_pi;

    // const delta = theta1 - theta0;

    // if (Math.abs(delta) <= Math.PI) {
    //     return theta0 + t * delta;
    // }

    // const sign = Math.sign(delta);
    // return theta0 + t * (delta - sign * two_pi);

    // https://stackoverflow.com/a/30129248/1228394
    const CS = (1 - t) * Math.cos(targetRotation) + t * Math.cos(currentRotation);
    const SN = (1 - t) * Math.sin(targetRotation) + t * Math.sin(currentRotation);
    const C = Math.atan2(SN, CS);

    return C;
}

/**
 * @param {number} n
 * @param {[minLon: number, minLat: number, maxLon: number, maxLat: number]} bounds
 * @returns {Particle[]}
 */
function makeParticles(n, bounds) {
    const dLon = bounds[2] - bounds[0];
    const dLat = bounds[3] - bounds[1];
    return Array.from({ length: n }).map(() => ({
        lon: bounds[0] + Math.random() * dLon,
        lat: bounds[1] + Math.random() * dLat,
        animation: Math.random(),
        vector: [0, 0],
        rotation: NaN,
        opacity: 0,
    }));
}

/**
 * @param {Particle} particle
 * @param {[number, number, number, number]} bounds
 */
function resetParticle(particle, bounds) {
    const dLon = bounds[2] - bounds[0];
    const dLat = bounds[3] - bounds[1];
    particle.lon = bounds[0] + Math.random() * dLon;
    particle.lat = bounds[1] + Math.random() * dLat;
    // animation phase
    particle.animation = Math.random();
    particle.rotation = NaN;
    particle.opacity = 0;
}

/**
 * @param {CanvasRenderingContext2D} c
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {number} dA
 */
function changeAlpha(c, x, y, w, h, dA) {
    let imageData = c.getImageData(x, y, w, h);
    for (let i = 3; i < imageData.data.length; i += 4) {
        imageData.data[i] += dA;
    }
    c.putImageData(imageData, x, y);
}

/**
 * @param {Particle} particle
 * @param {[i: number, j: number]} vector
 * @param {[west: number, south: number, east: number, north: number]} bounds
 */
function isOutOfBounds(particle, vector, bounds) {
    const dLon = bounds[2] - bounds[0];
    const dLat = bounds[3] - bounds[1];

    if (vector[0] > 0) {
        if (particle.lon > bounds[2] + dLon * 0.1) {
            return true;
        }
    }
    else {
        if (particle.lon < bounds[0] - dLon * 0.1) {
            return true;
        }
    }

    if (vector[1] > 0) {
        if (particle.lat < bounds[1] - dLat * 0.1) {
            return true;
        }
    }
    else {
        if (particle.lat > bounds[3] + dLat * 0.1) {
            return true;
        }
    }

    return false;
}