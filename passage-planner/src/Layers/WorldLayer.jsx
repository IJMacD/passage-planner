import { ImageLayer } from "./ImageLayer.jsx";
import { useImage } from "../hooks/useImage.js";
import worldImageSrc from "../img/world.png";

export function WorldLayer () {
  const worldImage = useImage(worldImageSrc);
  return worldImage && <ImageLayer image={worldImage} bounds={[-180, -85.05, 180, 85.05]} />;
}
