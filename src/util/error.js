/**
 * Error类
 * @class
 */
const Error = {};

(function () {

    /**
     * 错误代码
     */
    Error.Code = {
        /** 坐标错误 */
        COORD_ERROR: 0,

        /** 图层错误 */
        LAYER_ERROR: 1
    }

    Message = {
        /**
         * ERROR_IS_NOT_FOUND
         */
        0: "坐标错误",
        /**
         * STAGE_TYPE_NOT_SUPPORTED
         */
        1: "图层错误"
    }

    /**
     * 取错误消息
     * @param {int} errorCode 
     * @returns {String} 错误消息
     */
    Error.getErrorMessage = function (errorCode) {
        return Message[errorCode] || '未知错误';
    }
}());
