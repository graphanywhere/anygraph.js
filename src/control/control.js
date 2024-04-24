/**
 * 图形控件基础类
 */
class Control {
    constructor(options) {
        this.div = "";
    }

    setGraph(graph) {
        if (graph) {
            this.graph = graph;
            this.create();
        }
    }

    rebuild() {

    }

    show() {

    }

    hide() {

    }
}

export default Control;
