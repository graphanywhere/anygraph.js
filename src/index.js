export { default as Layer } from "./layer.js";
export { default as View } from "./view.js";
export { default as Graph } from "./graph.js";
export { default as EventType, EventKeyCode } from "./basetype/event.type.js";
export { default as Ladder } from "./ladder.js";
export { default as OperationManager } from "./edit/operationManager.js";
export { default as GeomFactory } from "./geom/factory.js";

export * from "./basetype/image.js";
export * from "./geom/index.js";
export * from "./spatial/index.js";
export * from "./renderer/index.js";
export * from "./source/index.js";
export * from "./format/index.js";
export * from "./style/index.js";
export * from "./event/index.js";
export * from "./util/index.js";
export * from "./control/index.js";
export { AxfgFormat, AxfgLoader } from "./format/axfg/index.js";

import app from './global.js';
const version = app.version;
export { version };

console.log(["   __    __  __ _  __  ___   ____   __  ___  _   _", "  /  |  / | / /| |/ / / __| / _  | /  ||   || |_| | ", " / ' | / /|/ / | ' / / /_^ / / _/ / ' ||  _||  _  |", "/_/|_|/_/ |_/  /__/  |___|/_/ \\_\\/_/|_||_|  |_| |_|", `AnyGraph.js v${version} - Dev by https://graphanywhere.com`].join("\n"));
