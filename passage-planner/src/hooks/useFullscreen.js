import { useState, useEffect } from "react";

/**
 *
 * @param {HTMLElement?} element
 * @param {() => void} [onChange]
 * @returns {[ isFullscreen: boolean, setIsFullscreen: (fullscreen: boolean) => void ]}
 */
export function useFullscreen (element, onChange) {
    const [ isFullscreen, setIsFullscreen ] = useState(false);

    useEffect(() => {
        if (isFullscreen) {
            const cb = () => {
                if (document.fullscreenElement === null) {
                    setIsFullscreen(false);
                    onChange && onChange();
                }
            };
            document.addEventListener("fullscreenchange", cb);
            return () => document.removeEventListener("fullscreenchange", cb);
        }
    }, [isFullscreen, onChange]);

    /**
     *
     * @param {boolean} fullscreen
     */
    function setFullscreen (fullscreen) {
        if (fullscreen) {
            element?.requestFullscreen().then(() => {
                // Takes time for the element size to adjust
                onChange && setTimeout(onChange, 100);
            });
        }
        else {
            document.exitFullscreen().then(onChange);
        }

        setIsFullscreen(fullscreen);
    }

    return [ isFullscreen, setFullscreen ];
}