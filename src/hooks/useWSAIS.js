import { useEffect, useRef, useState } from "react";
import { WSAIS } from "../util/ais";

export function useWSAIS () {
    /** @type {import("react").MutableRefObject<WSAIS>} */
    const aisRef = useRef();
    const vesselMapRef = useRef(/** @type {Map<number, import("../util/ais").Vessel>} */(new Map()));

    const [ vessels, setVessels ] = useState(/** @type {import("../util/ais").Vessel[]} */([]));

    if (!aisRef.current) {
        aisRef.current = new WSAIS();
    }

    useEffect(() => {
        /**
         *
         * @param {import("../util/ais").Vessel & { type: number }} message
         */
        function cb (message) {
            console.log(message);

            if (message.type === 1) {
                vesselMapRef.current.set(message.mmsi, message);
                setVessels([...vesselMapRef.current.values()]);
            }
        }

        aisRef.current.addListener(cb);

        return () => aisRef.current.removeListener(cb);
    }, []);

    return vessels;
}