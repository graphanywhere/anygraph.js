# Change Log

该项目的所有显著更改都将记录在该文件中。 

## 4.3.1 (2024-03-08)
- RenderObject类改进了Canvas容器对象高度的计算方法；
- 移除了源代码中的 opbox.js、scaleline.js、tooltip.js、geom.edit.js、wheel.js等几个未完成的文件；
- Text类修复了初始化字体大小时的缺陷；

## 4.3.1 (2024-03-10)
- 增加了GeomFactory类，该类的create()方法来源于原createGeom()方法，且能够支持在外部扩展Geometry类后，不用修改anygraph源代码；
- Geometry类增加了layer属性和对应的get()及set()方法；
- Geometry类增加了removeCB()方法，用于graph.removeGeom()时调用，删除节点前调用
- 增加了数据编辑时的undo()和redo()支持，并增加了OperationManager类和Operation类；
- Arrow类增加了交叉箭头类型；
- polyline类增加了更多的箭头类型；
- QuadTree类增加了delete()方法；
- Measure类增加了genCircleVtx()、genArcVtx()、solveCrossPointSegment()、calculateAngle()、solveOffsetPoint()等方法；

## 4.3.2 (2024-03-15)
- 增加在初始化AnyGraph时，在控制台打印字符LOGO的功能；
- 增加对图形使用useTransform进行缩放的功能，并保留对图层使用useTransform进行缩放的功能；
- 统一浮动层，在Graph类增加getOverLayer()方法，由该方法统一创建浮动层，在需要访问该层时统一通过该方法创建浮动层；
- 图层控制控件中，不显示浮动层；
- Graph类增加showCenterView()方法，可不改变高度，居中显示某个坐标；
- Geometry类中strokeAndFill()中，强制不对LINE类型的对象进行填充；
- 对于具有焦点的Geometry对象，在对其进行drawBorder()时，对于LINE类型的几何对象不绘制外框，仅绘制折点；

## 4.4.1 (2024-04-03)
- Geometry类prop()方法支持通过key-value对象批量修改属性;
- Geometry类增加了lockState属性，控制焦点框是否可修改对象大小;
- GeomControl类支持鼠标左键漫游，支持通过ctrl/shift多选对象；
- RenderObject对象支持通过mouse属性控制鼠标滚轮缩放和漫游，通过eventable属性控制是否触发事件;


## 4.4.1 (2024-04-24)
- Geometry类增加isVisible()和setVisible(bool)方法；
- Geometry类增加isLock()和setLockState(bool)方法；
- GeomControl类增加双击、鼠标右键单击的事件功能；
- GeomControl类keyDown事件支持shift和Ctrl多选功能；
- 