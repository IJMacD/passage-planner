import { useContext, useEffect, useRef } from "react";
import { StaticMapContext } from "../Components/StaticMap.jsx";

/**
 * @typedef Particle
 * @property {number} x
 * @property {number} y
 * @property {number} animation
 */

/**
 * Layer to show many particles all following a single vector
 * @param {object} props
 * @param {[number,number]} props.vector
 * @returns
 */
export function ParticleLayer({ vector }) {
    /** @type {import("react").MutableRefObject<HTMLCanvasElement?>} */
    const canvasRef = useRef(null);

    /** @type {import("react").MutableRefObject<Particle[]>} */
    const particlesRef = useRef([]);

    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const pxWidth = width * devicePixelRatio;
    const pxHeight = height * devicePixelRatio;

    const particle_size = 3;
    const coef_speed = 5e-3;
    const coef_animation = 5e-4;
    const particle_fill = "#CCC";

    if (!particlesRef.current) {
        particlesRef.current = makeParticles(400, pxWidth, pxHeight);;
    }

    useEffect(() => {
        const dpr = devicePixelRatio;

        let active = true;
        let prevTime = NaN;
        const particles = particlesRef.current;

        if (!particles) return;

        /**
         * @param {number} time
         */
        function step(time) {
            if (active) {
                requestAnimationFrame(step);
            }

            if (!canvasRef.current) return;

            const ctx = canvasRef.current.getContext("2d");

            if (!ctx) return;

            ctx.canvas.width = pxWidth;
            ctx.canvas.height = pxHeight;

            ctx.fillStyle = particle_fill;
            ctx.strokeStyle = particle_fill;
            ctx.lineWidth = particle_size * dpr;

            const delta = time - prevTime;
            prevTime = time;

            // Move
            if (!isNaN(delta)) {
                for (const particle of particles) {
                    particle.x += vector[0] * delta * coef_speed;
                    particle.y += vector[1] * delta * coef_speed;
                    particle.animation -= delta * coef_animation * Math.random();

                    // console.log({ delta, particle });

                    if (particle.animation < 0) {
                        resetParticle(particle, pxWidth, pxHeight);
                    }
                }
            }

            // Draw
            for (const particle of particles) {
                const opacity = Math.sin(particle.animation * Math.PI);

                ctx.globalAlpha = opacity / 3;
                ctx.beginPath();
                ctx.moveTo(particle.x - vector[0] * 3, particle.y - vector[1] * 3);
                ctx.lineTo(particle.x, particle.y);
                ctx.stroke();

                ctx.globalAlpha = opacity / 2;
                ctx.beginPath();
                ctx.moveTo(particle.x - vector[0], particle.y - vector[1]);
                ctx.lineTo(particle.x, particle.y);
                ctx.stroke();

                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.moveTo(particle.x - vector[0] / 2, particle.y - vector[1] / 2);
                ctx.lineTo(particle.x, particle.y);
                ctx.stroke();

                // ctx.beginPath();
                // ctx.arc(particle.x, particle.y, particle_size * dpr, 0, Math.PI * 2);

                // ctx.fill();
            }
        }

        requestAnimationFrame(step);

        return () => { active = false; }

    }, [centre, zoom, pxWidth, pxHeight, vector]);

    return <canvas ref={canvasRef} width={pxWidth} height={pxHeight} style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }} />;
}

function makeParticles(n, width, height) {
    return Array.from({ length: n }).map(() => ({ x: Math.random() * width, y: Math.random() * height, animation: Math.random() }));
}

function resetParticle(particle, width, height) {
    particle.x = Math.random() * width;
    particle.y = Math.random() * height;
    particle.animation = 1;
}