/**
 * Url工具类
 * @class
 */
const UrlUtil = {};

(function () {
    /**
     * 在非浏览器环境下初始化该类时，返回空对象
     */
    if (typeof window === "undefined") return;

    /**
     * 获取url上携带的参数
     * @returns {Array}
     */
    UrlUtil.getUrlArgs = function() {
        if (location.search === "") return [];
        let searchString = location.search.split("?"),  param = [];
        let seg = searchString[1].split("&");
        for (let i = 0; i < seg.length; i++) {
            let val = seg[i].split("=");
            if (val.length <= 1) continue;
            param[i] = val[1];
        }
        return param;
    };

    /**
     * 获取通过Url传递的参数
     * @param {String} sHref 
     * @param {String} sArgName 
     * @returns param
     */
    UrlUtil.getArgsFromHref = function(sHref, sArgName) {
        var args = sHref.split("?");
        var retval = null;
        var str;

        if (args[0] === sHref) { /*参数为空*/
            return retval;
            /*无需做任何处理*/
        } else {
            args = args[1].split("&");
            for (var i = 0; i < args.length; i++) {
                str = args[i];
                var arg = str.split("=");
                if (arg.length <= 1) continue;
                if (arg[0] == sArgName) {
                    retval = arg[1];
                    break;
                }
            }
            return decodeURIComponent(retval);
        }
    };

    /**
     * 获取web路径 2016-7-18 
     * @returns String
     * @example 
     * 当前服务地址为：http://localhost:8080/web/frame/frame.jsp时，该方法返回： "http://localhost:8080/web"
     */
    UrlUtil.getRootPathOfWeb = function() {
        //获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
        var currentPath = window.document.location.href;
        //获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
        var pathName = window.document.location.pathname;
        var pos = currentPath.indexOf(pathName);
        //获取主机地址，如： http://localhost:8083
        var localhostPaht = currentPath.substring(0, pos);
        //获取带"/"的项目名，如：/uimcardprj
        var projectName = pathName.substring(0, pathName.substring(1).indexOf('/') + 1);
        return (localhostPaht + projectName);
    };

    /**
     * 获取根路径
     * @returns {string} 
     * @example 
     * 当前服务地址为：http://localhost:8080/web/frame/frame.jsp时，该方法返回： "/web"
     */
    UrlUtil.getContextPath = function() {
        let pathName = document.location.pathname;
        let index = pathName.substring(1).indexOf("/");
        return pathName.substring(0, index + 1);
    }
}());

export default UrlUtil;
