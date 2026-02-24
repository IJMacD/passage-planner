import React from "react";

/**
 * @typedef {[dx: number, dy: number]} DragContextValue
 */

export const DragContext = React.createContext(/** @type {DragContextValue} */([0, 0]));
