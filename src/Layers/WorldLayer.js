import React from "react";
import { ImageLayer } from "./ImageLayer";
import { useImage } from "../hooks/useImage";
import worldImageSrc from "../img/world.png";

export function WorldLayer () {
  const worldImage = useImage(worldImageSrc);
  return worldImage && <ImageLayer image={worldImage} bounds={[-180, -85.05, 180, 85.05]} />;
}
