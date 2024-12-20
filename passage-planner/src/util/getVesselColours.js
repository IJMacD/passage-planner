import { NavigationStatus } from "./ais/ais.js";

/**
 * Vessel Colour by Navigation status
 * @param {import("./ais/ais.js").Vessel} vessel
 * @returns {[ stroke: string, fill: string ]}
 */

export function getVesselColours(vessel) {
  switch (vessel.navigationStatus) {
    case NavigationStatus.UNDERWAY_USING_ENGINE:
      return ["#080", "#8f8"];
    case NavigationStatus.AT_ANCHOR:
      return ["#F00", "#DA6"];
    case NavigationStatus.NOT_UNDER_COMMAND:
      return ["#808", "#f8f"];
    case NavigationStatus.RESTRICTED_MANOEUVRABILITY:
      return ["#F00", "#FCC"];
    case NavigationStatus.CONSTRAINED_BY_DRAUGHT:
      return ["#848", "#fcf"];
    case NavigationStatus.MOORED:
      return ["#840", "#fC8"];
    case NavigationStatus.AGROUND:
      return ["#F00", "#fF4"];
    case NavigationStatus.ENGAGED_IN_FISHING:
      return ["#00F", "#4FF"];
    case NavigationStatus.UNDERWAY_SAILING:
      return ["#00f", "#88f"];
    case NavigationStatus.RESERVED_HSC:
      return ["#080", "#8f0"];
    case NavigationStatus.NOT_DEFINED:
      return ["#333", "white"];
    default:
      return ["black", "#333"];
  }
}
