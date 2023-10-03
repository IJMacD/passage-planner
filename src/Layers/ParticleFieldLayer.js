import { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap.js";
import React from "react";
import { getBounds, lonLat2XY } from "../util/projection.js";
import { latlon2nm } from "../util/geo.js";

/**
 * @typedef Particle
 * @property {number} lon
 * @property {number} lat
 * @property {number} animation
 */

/**
 * Layer to show many particles whose movement is controlled by weighted sum of
 * nearby points on a vector field.
 * @param {object} props
 * @param {import("./VectorFieldLayer.js").Field} props.field
 * @param {string} [props.particleFill]
 * @returns
 */
export function ParticleFieldLayer ({ field, particleFill = "#999" }) {
    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    /** @type {import("react").MutableRefObject<Particle[]>} */
    const particlesRef = useRef([]);

    const context = useContext(StaticMapContext);
    const { centre, zoom, width, height } = context;

    const bounds = getBounds(context);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    const particle_size = 3;
    const coef_speed = 3e-5;
    const coef_animation = 1e-4;

    if (particlesRef.current.length === 0) {
        particlesRef.current = makeParticles(400, bounds);
    }

    useEffect(() => {
        const dpr = devicePixelRatio;

        let active = true;
        let prevTime = performance.now();
        const particles = particlesRef.current;

        if (particles.length === 0) return;

        // No need to render an empty field
        if (field.length === 0) {
            return;
        }

        const bounds = getBounds({ centre, zoom, width, height });

        const dLon = bounds[2] - bounds[0];
        const dLat = bounds[3] - bounds[1];

        /**
         * @param {number} time
         */
        function step (time) {
            if (!active) {
                return;
            }

            requestAnimationFrame(step);

            if (!canvasRef.current) return;

            const ctx = canvasRef.current.getContext("2d");

            if (!ctx) return;

            ctx.canvas.width = pxWidth;
            ctx.canvas.height = pxHeight;

            // Draw Particles

            ctx.fillStyle = particleFill;
            ctx.strokeStyle = particleFill;
            ctx.lineWidth = particle_size * dpr;
            ctx.lineCap = "round";

            const delta = time - prevTime;
            prevTime = time;

            const desiredParticleCount = 3.2e6 * Math.exp(-0.74893 * zoom);
            let count = 0;

            for (const particle of particles) {
                if (count++ > desiredParticleCount) {
                    break;
                }

                // Move

                const fieldPoints = field.map(fp => {
                    const weight = 1 / latlon2nm(particle, fp);
                    return { ...fp, weight };
                });

                const sum = fieldPoints.reduce((sum, p) => sum + p.weight, 0);

                // 2 ---> x  <--------- 4
                // sum = 6
                // A: 0.66666
                // B: 0.33333
                // 1/2 + 1/4
                // 2/4 + 1/4 = 3/4
                // 2/4 / 3/4 = 0.666
                // 1/4 / 3/4 = 0.333
                const vector = fieldPoints.reduce((vector, p) => {
                    let x;
                    let y;
                    if ("vector" in p) {
                        [ x, y ] = p.vector;
                    }
                    else {
                        x = p.magnitude * Math.sin(p.direction * Math.PI / 180);
                        y = p.magnitude * Math.cos(p.direction * Math.PI / 180);
                    }
                    const t = p.weight / sum;
                    return [
                        vector[0] + t * x,
                        vector[1] + t * y,
                    ];
                }, [0,0]);

                // Don't render static dots
                if (vector[0] === 0 && vector[1] === 0) {
                    continue;
                }

                const f = delta * coef_speed * Math.pow(zoom, -2);

                particle.lon += vector[0] * f;
                particle.lat += -vector[1] * f;
                particle.animation -= delta * coef_animation * Math.random();

                if (vector[0] > 0) {
                    if (particle.lon > bounds[2]) {
                        particle.lon -= dLon;
                    }
                }
                else {
                    if (particle.lon < bounds[0]) {
                        particle.lon += dLon;
                    }
                }

                if (vector[1] > 0) {
                    if (particle.lat < bounds[1]) {
                        particle.lat += dLat;
                    }
                }
                else {
                    if (particle.lat > bounds[3]) {
                        particle.lat -= dLat;
                    }
                }

                // console.log({ delta, particle });

                if (particle.animation < 0) {
                    resetParticle(particle, bounds);
                }

                // Draw

                // https://www.geogebra.org/m/zt77cdbb
                const opacity = Math.sin(particle.animation * Math.PI);
                // const opacity = 1 - Math.pow(2 * particle.animation - 1, 2);
                // const opacity = 1 - Math.abs(2 * particle.animation - 1);

                const projection = lonLat2XY({ centre, zoom, width, height });

                const [ x, y ] = projection(particle.lon, particle.lat);

                // Debug

                // ctx.globalAlpha = 1;
                // ctx.beginPath();
                // ctx.arc(dpr * x, dpr * y, dpr * 5, 0, Math.PI * 2);
                // ctx.fillStyle = "red";
                // ctx.fill();

                // Trail

                ctx.globalAlpha = opacity / 3;
                ctx.beginPath();
                ctx.moveTo(dpr * x - vector[0] * 3, dpr * y - vector[1] * 3);
                ctx.lineTo(dpr * x, dpr * y);
                ctx.stroke();

                ctx.globalAlpha = opacity / 2;
                ctx.beginPath();
                ctx.moveTo(dpr * x - vector[0] * 2, dpr * y - vector[1] * 2);
                ctx.lineTo(dpr * x, dpr * y);
                ctx.stroke();

                // Outline

                // ctx.globalAlpha = opacity;
                // ctx.lineWidth = 1.5 * dpr * particle_size;
                // ctx.strokeStyle = "white";
                // ctx.beginPath();
                // ctx.moveTo(dpr * x - vector[0], dpr * y - vector[1]);
                // ctx.lineTo(dpr * x, dpr * y);
                // ctx.stroke();

                // Dot

                ctx.globalAlpha = opacity;
                ctx.lineWidth = dpr * particle_size;
                ctx.strokeStyle = particleFill;
                ctx.beginPath();
                ctx.moveTo(dpr * x - vector[0], dpr * y - vector[1]);
                ctx.lineTo(dpr * x, dpr * y);
                ctx.stroke();
            }
        }

        requestAnimationFrame(step);

        return () => { active = false; }

    }, [centre, zoom, width, height, pxWidth, pxHeight, field, particleFill]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}

/**
 * @param {number} n
 * @param {[minLon: number, minLat: number, maxLon: number, maxLat: number]} bounds
 * @returns {Particle[]}
 */
function makeParticles (n, bounds) {
    const dLon = bounds[2] - bounds[0];
    const dLat = bounds[3] - bounds[1];
    return Array.from({ length: n }).map(() => ({ lon: bounds[0] + Math.random() * dLon, lat: bounds[1] + Math.random() * dLat, animation: Math.random(), vector: [0,0] }));
}

function resetParticle (particle, bounds) {
    const dLon = bounds[2] - bounds[0];
    const dLat = bounds[3] - bounds[1];
    particle.lon = bounds[0] + Math.random() * dLon;
    particle.lat = bounds[1] + Math.random() * dLat;
    particle.animation = 1;
}