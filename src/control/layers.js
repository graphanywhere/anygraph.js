import { default as GraphControl } from "./control.js";
import { default as EventType } from "../basetype/event.type.js";
import DomUtil from "../util/dom.js";

/**
 * 图层控制控件
 */
class LayerControl extends GraphControl {
    constructor(options = {}) {
        super(options);
        this.containerId = "div_LayerControl";
    }

    create() {
        let container = DomUtil.get(this.containerId);
        if (container) {
            DomUtil.remove(container);
        }

        // create layer container
        container = DomUtil.create("div", "layerControl", this.graph.getRenderObject().getWrapObj().parentElement);
        container.id = this.containerId;

        // create title
        let title = DomUtil.create("div", "title", container); // document.createElement('div');
        let label = DomUtil.create("label", null, title);
        label.innerHTML = "图层列表";

        // create layer list
        let divlayerList = DomUtil.create("div", "list", container);
        let layerList = DomUtil.create("ul", "layerTree", divlayerList);

        // append layer to list
        let layers = this.graph.getLayers(); //获取地图中所有图层
        for (let i = 0; i < layers.length; i++) {
            //获取每个图层的名称、是否可见属性
            let layer = layers[i];
            let layerName = layer.getName();
            let visible = layer.getVisible();

            //新增li元素，用来承载图层项
            let elementLi = document.createElement('li');
            layerList.appendChild(elementLi); // 添加子节点

            //创建复选框元素
            let checkBox = document.createElement('input');
            checkBox.type = "checkbox";
            checkBox.name = "layers";

            //创建label元素
            let elementLable = document.createElement('label');
            elementLable.className = "layer";
            elementLable.appendChild(checkBox);
            elementLable.append(layerName);
            elementLi.appendChild(elementLable);

            //设置图层默认显示状态
            if (visible) {
                checkBox.checked = true;
            }
            this._addChangeEvent(checkBox, layer);  //为checkbox添加变更事件                                         
        }
    }

    setGraph(graph) {
        super.setGraph(graph);
        let that = this;
        graph.on(EventType.RenderBefore, function (args) {
            that.create();
        });
    }

    /**
     * 为checkbox元素绑定变更事件
     */
    _addChangeEvent(element, layer) {
        let that = this;
        DomUtil.on(element, "click", function (e) {
            if (element.checked) {
                layer.setVisible(true); //显示图层
            } else {
                layer.setVisible(false); //不显示图层
            }
            that.graph.render();
        });
    }

    show() {
        let container = DomUtil.get(this.containerId);
        if (container) {
            container.style.display = "block";
        }
    }

    hide() {
        let container = DomUtil.get(this.containerId);
        if (container) {
            container.style.display = "none";
        }
    }
}

export default LayerControl;