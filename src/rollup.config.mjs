// rollup config.js
export default [{
    input: "index.js",
    output: {
        file: "../dist/anygraph.esm.js",
        format: "es"
    }
}]

// 2023/06 按两个文件分解导出
// // rollup config.js
// export default [{
//     input: "format/axfg/index.js",
//     output: {
//         file: "../../../gbWeb/WebRoot/adam.lib/ge/graph/cg.axfg.js",
//         format: "es"
//     },
//     external: ex
// }, {
//     input: "index.js",
//     output: {
//         file: "../../../gbWeb/WebRoot/adam.lib/ge/graph/cg.graph.js",
//         format: "es"
//     }
// }]

const reserve = [
    "awb.js", "awg.js", "symbol.js", "format.js", "format_s.js", "background.js", "maintopo.js", "maintopo_s.js",
    "loader.js", "dataset.js", "nodetype.js", "style.js", "layer.style.js",
];

function ex(id, parent, isResolved) {
    console.info(id, parent, isResolved)

    for (let i = 0, ii = reserve.length; i < ii; i++) {
        let fileName = reserve[i];
        if (id.indexOf(fileName) >= 0) {
            return false;
        }
    }

    return true;
}
