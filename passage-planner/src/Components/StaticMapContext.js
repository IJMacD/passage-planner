import React from "react";

/**
 * @typedef StaticMapContextValue
 * @prop {[number, number]} centre
 * @prop {number} zoom
 * @prop {number} width
 * @prop {number} height
 */

export const StaticMapContext = React.createContext({
    centre: /** @type {[number, number]} */ ([0, 0]),
    zoom: 8,
    width: 1024,
    height: 1024,
});
/**
 * @typedef {[dx: number, dy: number]} DragContextValue
 */

export const DragContext = React.createContext(/** @type {DragContextValue} */([0, 0]));
