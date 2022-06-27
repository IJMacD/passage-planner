import { useContext } from "react";
import { lat2tile, lon2tile } from "../geo";
import { StaticMapContext } from "../Components/StaticMap";

const TILE_SIZE = 256;

export function TileMapLayer ({ layer }) {
    const { centre, zoom, width, height } = useContext(StaticMapContext);

    const tileCountX = width / TILE_SIZE;
    const tileCountY = height / TILE_SIZE;

    const tileOffsetX = lon2tile(centre[0], zoom) - tileCountX / 2;
    const tileOffsetY = lat2tile(centre[1], zoom) - tileCountY / 2;

    return (
        <div style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, lineHeight: 0, }}>
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 0}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 1}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 2}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 0}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 1}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 2}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
            <img src={`${layer.baseURL}/${zoom}/${tileOffsetX + 3}/${tileOffsetY + 3}.png`} style={{ width: TILE_SIZE, height: TILE_SIZE }} alt="" />
        </div>
    );
}
