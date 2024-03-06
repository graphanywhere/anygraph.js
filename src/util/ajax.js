/**
 * ajax请求工具类
 * @class
 */
const AjaxUtil = {};

(function () {
    /**
     * 发送GET请求
     * @method
     * @param {Object} args 
     */
    AjaxUtil.get = function (args) {
        return this.send(Object.assign({}, args, { "method": "GET" }));
    }

    /**
     * 发送POST请求
     * @method
     * @param {Object} args 
     */
    AjaxUtil.post = function (args) {
        return this.send(Object.assign({}, args, { "method": "POST" }));
    }

    /**
     * 发送AJAX请求
     * @method
     * @param {Object} args {url, data, dataType, async, success, error, method, header, timeout, username, password}
     */
    AjaxUtil.send = function (args = {}) {

        Object.assign(args, { "async": true, "debug": false });
        if (args.method == null) {
            args.method = "GET";
        }

        const xhr = new XMLHttpRequest();

        // 请求方法， 默认值为GET
        const method = (args.method == null ? "GET" : args.method.toUpperCase());
        // true:异步， false:同步
        const async = (args.async == null ? true : args.async);


        // XML类型需指定为document
        if (args.dataType != null && args.dataType.toLowerCase() == "xml") {
            args.dataType = "document";
        }

        // 设置响应返回的数据格式
        if (async === true) {
            xhr.responseType = args.dataType != null ? args.dataType : "text";
        }

        // 设置xhr请求的超时时间, 当xhr为一个sync同步请求时，xhr.timeout必须置为0
        xhr.timeout = args.timeout == null ? 0 : args.timeout;   //0为不超时, 单位：milliseconds 毫秒

        //判断是否超时
        if (args.timeout) {
            setTimeout(function () {
                if (typeof (args.error) === "function") {
                    args.error({ "errorMsg": "timeout" });
                }
                xhr.abort();
            }, args.timeout);
        }

        // 注册相关事件回调处理函数
        let errorCallback = function (error) {
            if (typeof (args.error) === "function") {
                args.error({ "status": xhr.status, "statusText": xhr.statusText, "errorMsg": error });
            } else {
                console.error("发送ajax请求失败", e);
            }
        };
        xhr.onabort = function () {
            errorCallback("abort");
        }
        xhr.onerror = function () {
            errorCallback("error");
        }
        xhr.ontimeout = function () {
            errorCallback("timeout");
        }
        xhr.onload = function (e) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                if (typeof (args.success) === "function") {
                    if (args.dataType.toLowerCase() === "document") {
                        return args.success(xhr.responseXML);
                    } else if (args.dataType.toLowerCase() === "json" || args.dataType.toLowerCase() === "arraybuffer") {
                        return args.success(xhr.response);
                    } else {
                        return args.success(xhr.responseText);
                    }
                }
                console.debug("发送ajax请求结束");
            }
        }

        xhr.onloadend = function (e) {
            if (xhr.status == 404) {
                errorCallback("404 error");
            }
        }

        // 请求Header
        let header = args.header || {};

        if (method === "GET") {
            let url = args.url;

            // 将url中?后的数据和args.data合并为查询字符串
            let qs = _getParam(Object.assign(_url2Object(url), args.data));
            if (url.indexOf("?") > 0) {
                url = url.substr(0, args.url.indexOf("?"));
            }

            // 创建一个 get 请求, 
            xhr.open("GET", url + "?" + qs, async);
            // 设置request header
            _addHeader(xhr, header);

            //发送数据
            try {
                xhr.send();
            } catch (e) {
                errorCallback(e);
            }
        } else {
            // 创建一个 get 请求, 
            xhr.open("POST", args.url, async);
            // 设置request header
            header["Content-Type"] = "application/x-www-form-urlencoded";
            _addHeader(xhr, header);

            //发送数据
            try {
                xhr.send(args.data);
            } catch (e) {
                errorCallback(e);
            }
        }
    }

    /**
     * 把url中的查询字符串转为对象，主要是想当方式为get时，用data对象的参数覆盖掉url中的参数
     */
    function _url2Object(url) {
        let urlSplit = url.split("?");
        let queryArr = (urlSplit.length > 1 ? urlSplit[1].split("&") : []);
        let obj = {};
        for (let i = 0, ii = queryArr.length; i < ii; i++) {
            let segs = queryArr[i].split("=");
            let key = segs[0];
            let value = segs[1];
            obj[key] = value;
        }
        return obj;
    }

    // 序列化参数, 参考自jquery
    function _getParam(obj, traditional = false) {

        var rbracket = /\[\]$/;
        function isFunction(it) {
            return Object.prototype.toString.call(it) === "[object Function]";
        }

        function isObject(it) {
            return Object.prototype.toString.call(it) === "[object Object]";
        }

        function buildParams(prefix, obj, traditional, add) {
            if (Array.isArray(obj)) {
                // Serialize array item.
                obj.forEach(function (v, i) {
                    if (traditional || rbracket.test(prefix)) {
                        // Treat each array item as a scalar.
                        add(prefix, v);
                    } else {
                        // Item is non-scalar (array or object), encode its numeric index.
                        buildParams(
                            prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
                            v,
                            traditional,
                            add
                        );
                    }
                });
            } else if (!traditional && isObject(obj)) {
                // Serialize object item.
                for (let name in obj) {
                    buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
                }
            } else {
                // Serialize scalar item.
                add(prefix, obj);
            }
        }

        // Serialize an array of form elements or a set of key/values into a query string
        function jollyparam(a, traditional) {
            var prefix,
                s = [],
                add = function (key, valueOrFunction) {
                    // If value is a function, invoke it and use its return value
                    var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
                    s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
                };
            // If an array was passed in, assume that it is an array of form elements.
            if (Array.isArray(a)) {
                // Serialize the form elements
                a.forEach(function (item) {
                    add(item.name, item.value);
                });
            } else {
                // If traditional, encode the "old" way (the way 1.3.2 or older did it), otherwise encode params recursively.
                for (prefix in a) {
                    buildParams(prefix, a[prefix], traditional, add);
                }
            }
            s.push("accTimeId=" + Date.now());
            // Return the resulting serialization
            return s.join("&");
        }

        return jollyparam(obj, traditional);
    }

    // 增加请求Header
    function _addHeader(xhr, headers) {
        for (let i in headers) {
            xhr.setRequestHeader(i, headers[i]);
        }
    }
    // function uploadFile() {
    //     var formData = new FormData();
    //     for (var i = 0; i < files.length; i++) {
    //         formData.append('files[]', files[i]);
    //     }
    //     xhr.send(formData);
    // }
}());

export default AjaxUtil;

// 使用XMLHttpRequest对象来发送一个Ajax请求 （XMLHttpRequest Level 2）
//
// 参考1： http://www.ruanyifeng.com/blog/2012/09/xmlhttprequest_level_2.html
// 参考2： https://www.jb51.net/article/185800.htm
//
// 使用 responseType 设置响应返回的数据格式
//    *  ""             String字符串    默认值
//    *  "text"         String字符串
//    *  "document"     Document对象    希望返回 XML 格式数据时使用
//    *  "json"         javascript 对象    存在兼容性问题，IE10/IE11不支持
//    *  "blob"         Blob对象，接收二进制数据, 接收示例：let blob = new Blob([xhr.response], {type: 'image/png'});
//    *  "arrayBuffer"  ArrayBuffer对象， 接收二进制数据（把二进制数据装在一个数组里），接收数据的时候，需要遍历这个数组
//     var arrayBuffer = xhr.response;
//     if (arrayBuffer) {
//         var byteArray = new Uint8Array(arrayBuffer);
//         for (var i = 0; i < byteArray.byteLength; i++) {
//             // do something
//         }
//      }
//
// xhr.statusText     服务器返回的状态文本
// xhr.status         服务器返回的状态码，等于200表示一切正常。
//
// xhr提供了3个属性来获取请求返回的数据，分别是：xhr.response、xhr.responseText、xhr.responseXML
// xhr.responseType   用来指定xhr.response的数据类型
// xhr.response       默认值为空字符串， 当请求完成时此属性才有正确的值， 请求未完成时responseType为""或"text"，responseType为其他值时，值为 null
// xhr.responseText   服务器返回的文本数据, 当responseType 为"text"、""时，xhr对象上才有此属性，此时才能调用xhr.responseText
// xhr.responseXML    服务器返回的XML格式的数据, 当responseType 为"text"、""、"document"时，xhr对象上才有此属性，此时才能调用xhr.responseXML，否则抛错
//
//
// xhr.open(method, url, async), 创建一个 post 请求,
//    *  第一个参数：请求的方式，如GET/POST/HEADER等，这个参数不区分大小写
//    *  第二个参数：请求的地址， 可以是相对地址或绝对地址
//    *  第三个参数：异步/同步，默认值: true。默认设置下，所有请求均为异步请求。如果需要发送同步请求，请将此选项设置为 false
//       当xhr为同步请求时，有如下限制：
//         xhr.timeout必须为0
//         xhr.withCredentials必须为 false
//         xhr.responseType必须为""（注意置为"text"也不允许）
//
// xhr.open()只是创建了一个连接，但并没有真正开始数据的传输，而xhr.send()才是真正开始了数据的传输过程
//
// xhr.setRequestHeader(name, value), 设置request header
//     1、该方法必须在open()方法之后，send()方法之前调用，否则会抛错;
//     2、该方法可以调用多次，最终的值不会采用覆盖override的方式，而是采用追加append的方式
//
// xhr.send(data)的参数data可以是以下几种类型：
//    *  ArrayBuffer
//    *  Blob
//    *  Document
//    *  DOMString
//    *  FormData
//    *  null
// 如果是 GET/HEAD请求，send()方法一般不传参或传 null。不过即使你真传入了参数，参数也最终被忽略
//
// xhr.send(data)中data参数的数据类型会影响请求头部content-type的默认值：
//    *  如果data是 Document 类型，同时也是HTML Document类型，则content-type默认值为text/html;charset=UTF-8;否则为application/xml;charset=UTF-8；
//    *  如果data是 DOMString 类型，content-type默认值为text/plain;charset=UTF-8；
//    *  如果data是 FormData 类型，content-type默认值为multipart/form-data; boundary=[xxx]
//    *  如果data是其他类型，则不会设置content-type的默认值
//
// 使用"跨域资源共享"的前提，是浏览器必须支持这个功能，而且服务器端必须同意这种"跨域"。
//   在跨域请求中，client端必须手动设置xhr.withCredentials=true，且server端也必须允许request能携带认证信息（即response header中包含Access-Control-Allow-Credentials:true），这样浏览器才会自动将cookie加在request header中。
//   另外，要特别注意一点，一旦跨域request能够携带认证信息，server端一定不能将Access-Control-Allow-Origin设置为*，而必须设置为请求页面的域名。
//
//
// 进度信息
// 1、下载触发的是xhr对象的onprogress事件
//     xhr.onprogress = updateProgress;
// 2、上传触发的是xhr.upload对象的 onprogress事件
//     xhr.upload.onprogress = updateProgress;
//
// function updateProgress(event) {
//     if (event.lengthComputable) {
//         var percentComplete = event.loaded / event.total;
//     }
// }
// event.total是需要传输的总字节，event.loaded是已经传输的字节
//
// 与progress事件相关的，还有其他五个事件，可以分别指定回调函数
// * load事件：传输成功完成。
// * abort事件：传输被用户取消。
// * error事件：传输中出现错误。
// * loadstart事件：传输开始。
// * loadEnd事件：传输结束，但是不知道成功还是失败。
//
// onreadystatechange是XMLHttpRequest独有的事件
// xhr.onreadystatechange = function () {
//     switch(xhr.readyState){
///        case 0: // 未初始化，尚未调用open()方法
//         case 1://OPENED  已经调用open()，尚未调用send()
//         //do something
//          break;
//         case 2://HEADERS_RECEIVED  已经调用send()，尚未接收到响应
//         //do something
//         break;
//         case 3://LOADING  已经接收到部分响应数据
//         //do something
//         break;
//         case 4://DONE 已经接收到全部响应数据，请求完成
//         //do something
//         break;
//     }
// 相关事件触发条件说明：
// * onreadystatechange    每当xhr.readyState改变时触发；但xhr.readyState由非0值变为0时不触发。
// * onloadstart           调用xhr.send()方法后立即触发，若xhr.send()未被调用则不会触发此事件。
// * onprogress            xhr.upload.onprogress在上传阶段(即xhr.send()之后，xhr.readystate=2之前)触发，每50ms触发一次；xhr.onprogress在下载阶段（即xhr.readystate=3时）触发，每50ms触发一次。
// * onload                当请求成功完成时触发，此时xhr.readystate=4
// * onloadend             当请求结束（包括请求成功和请求失败）时触发
// * onabort               当调用xhr.abort()后触发
// * ontimeout             xhr.timeout不等于0，由请求开始即onloadstart开始算起，当到达xhr.timeout所设置时间请求还未结束即onloadend，则触发此事件。
// * onerror               在请求过程中，若发生Network error则会触发此事件（若发生Network error时，上传还没有结束，则会先触发xhr.upload.onerror，再触发xhr.onerror；若发生Network error时，上传已经结束，则只会触发xhr.onerror）。注意，只有发生了网络层级别的异常才会触发此事件，对于应用层级别的异常，如响应返回的xhr.statusCode是4xx时，并不属于Network error，所以不会触发onerror事件，而是会触发onload事件。
//
// 当请求一切正常时，相关的事件触发顺序如下：
//     1、触发xhr.onreadystatechange(之后每次readyState变化时，都会触发一次)
//     2、触发xhr.onloadstart
//     //上传阶段开始：
//     3、触发xhr.upload.onloadstart
//     4、触发xhr.upload.onprogress
//     5、触发xhr.upload.onload
//     6、触发xhr.upload.onloadend
//     //上传结束，下载阶段开始：
//     7、触发xhr.onprogress
//     8、触发xhr.onload
//     9、触发xhr.onloadend
// 若xhr请求成功，就会触发xhr.onreadystatechange和xhr.onload两个事件
