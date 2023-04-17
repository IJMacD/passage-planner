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
 *
 * @param {object} props
 * @param {import("./VectorFieldLayer.js").Field} props.field
 * @returns
 */
export function ParticleFieldLayer ({ field }) {
    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    /** @type {import("react").MutableRefObject<Particle[]>} */
    const particlesRef = useRef([]);

    const context = useContext(StaticMapContext);
    const { width, height } = context;

    const bounds = getBounds(context);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    const particle_size = 3;
    const coef_speed = 3e-5;
    const coef_animation = 1e-4;
    const coef_fade = 0.9;
    const particle_fill = "#DDD";

    if (particlesRef.current.length === 0) {
        particlesRef.current = makeParticles(400, bounds);
    }

    useEffect(() => {
        const dpr = devicePixelRatio;

        let active = true;
        let prevTime = NaN;
        const particles = particlesRef.current;

        if (particles.length === 0) return;

        // No need to render an empty field
        if (field.length === 0) {
            return;
        }

        const bounds = getBounds(context);

        const { zoom } = context;

        const dLon = bounds[2] - bounds[0];
        const dLat = bounds[3] - bounds[1];

        /**
         * @param {number} time
         */
        function step (time) {
            if (active) {
                requestAnimationFrame(step);
            }

            if (!canvasRef.current) return;

            const ctx = canvasRef.current.getContext("2d");

            if (!ctx) return;

            // ctx.canvas.width = pxWidth;
            // ctx.canvas.height = pxHeight;

            // Fade previous frames
            ctx.globalCompositeOperation = "destination-in";
            ctx.globalAlpha = 1;
            ctx.fillStyle = `rgba(0,0,0,${coef_fade})`;
            ctx.fillRect(0, 0, pxWidth, pxHeight);

            ctx.globalCompositeOperation = "source-over";

            ctx.fillStyle = particle_fill;
            ctx.strokeStyle = particle_fill;
            ctx.lineWidth = particle_size * dpr;
            ctx.lineCap = "round";

            const delta = time - prevTime;
            prevTime = time;

            const desiredParticleCount = 3.2e6 * Math.exp(-0.74893 * zoom);
            let count = 0;

            if (!isNaN(delta)) {

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

                    const projection = lonLat2XY(context);

                    const [ x, y ] = projection(particle.lon, particle.lat);

                    // Debug
                    // ctx.globalAlpha = 1;
                    // ctx.beginPath();
                    // ctx.arc(dpr * x, dpr * y, dpr * 5, 0, Math.PI * 2);
                    // ctx.fillStyle = "red";
                    // ctx.fill();

                    // ctx.globalAlpha = opacity / 3;
                    // ctx.beginPath();
                    // ctx.moveTo(dpr * x - vector[0] * 3, dpr * y - vector[1] * 3);
                    // ctx.lineTo(dpr * x, dpr * y);
                    // ctx.stroke();

                    // ctx.globalAlpha = opacity;
                    // ctx.lineWidth = 1.5 * dpr * particle_size;
                    // ctx.strokeStyle = "white";
                    // ctx.beginPath();
                    // ctx.moveTo(dpr * x - vector[0], dpr * y - vector[1]);
                    // ctx.lineTo(dpr * x, dpr * y);
                    // ctx.stroke();

                    // ctx.globalAlpha = opacity;
                    // ctx.lineWidth = dpr * particle_size;
                    // ctx.strokeStyle = particle_fill;
                    // ctx.beginPath();
                    // ctx.moveTo(dpr * x - vector[0], dpr * y - vector[1]);
                    // ctx.lineTo(dpr * x, dpr * y);
                    // ctx.stroke();

                    ctx.globalAlpha = opacity;

                    // ctx.lineWidth = 1.5 * dpr * particle_size;
                    // ctx.fillStyle = "white";
                    // ctx.beginPath();
                    // ctx.arc(dpr * x, dpr * y, 1.5 * particle_size * dpr, 0, Math.PI * 2);
                    // ctx.fill();

                    ctx.lineWidth = dpr * particle_size;
                    ctx.fillStyle = particle_fill;
                    ctx.beginPath();
                    ctx.arc(dpr * x, dpr * y, particle_size * dpr, 0, Math.PI * 2);
                    ctx.fill();

                }
            }
        }

        requestAnimationFrame(step);

        return () => { active = false; }

    }, [context, pxWidth, pxHeight, field]);

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