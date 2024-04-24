/**
 * 事件类型
 */
const EventType = {
    RenderBefore: 201,          // graph, 图形渲染之前触发
    RenderAfter: 202,           // graph, 图形渲染之后触发
    ComposeBefore: 211,         // layer, 图层渲染之前触发
    ComposeAfter: 212,          // layer, 图层渲染之后触发
    LayerModified:213,          // layer, 图层发生变化
    Loader: 221,                // source
};

/**
 * 按键代码
 */
const EventKeyCode = {

    /**
     * Constant: KEY_SPACE
     * {int}
     */
    KEY_SPACE: 32,
    
    /** 
     * Constant: KEY_BACKSPACE 
     * {int} 
     */
    KEY_BACKSPACE: 8,

    /** 
     * Constant: KEY_TAB 
     * {int} 
     */
    KEY_TAB: 9,

    /** 
     * Constant: KEY_ENTER 
     * {int} 
     */
    KEY_ENTER: 13,

    /** 
     * Constant: KEY_ESC 
     * {int} 
     */
    KEY_ESC: 27,

    /** 
     * Constant: KEY_LEFT 
     * {int} 
     */
    KEY_LEFT: 37,

    /** 
     * Constant: KEY_UP 
     * {int} 
     */
    KEY_UP: 38,

    /** 
     * Constant: KEY_RIGHT 
     * {int} 
     */
    KEY_RIGHT: 39,

    /** 
     * Constant: KEY_DOWN 
     * {int} 
     */
    KEY_DOWN: 40,

    /** 
     * Constant: KEY_DELETE 
     * {int} 
     */
    KEY_DELETE: 46,

    /** 
     * Constant: KEY_A 
     * {int} 
     */
    KEY_A: 65
}

export default EventType;
export { EventKeyCode };
