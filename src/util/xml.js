
/**
 * XML文件操作工具类
 * @class
 */
const XmlUtil = {};

(function () {
    let prefix = null;

    /**
     * 加载XML字符串，可支持IE7+和FF等，IE9使用该方法返回的Document对象不支持Xpath
     * @param {String} str 
     * @returns Document
     */
    XmlUtil.loadXML = function(str) {
        var xmlDoc;
        if (window.DOMParser) { // IE9+, Firefox, Chrome
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(str, "text/xml");
        } else {                // IE7
            xmlDoc = _createXmlDocument();
            xmlDoc.async = false;
            xmlDoc.loadXML(str);                 // IE9无此方法
        };
        return xmlDoc;
    }
    
    /**
     * 加载XML文件(可支持IE7+和FF等)
     * @param {String} url 
     * @param {Object} args {async, success}
     */
    XmlUtil.load = function(url, args = {}) {
        var xhr = _createXmlHttp();
        let async = args.async === true ? true : false;
        xhr.open("GET", url, async);
        xhr.send();
        if (async === true) {
            xhr.onload = function (e) {
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                    if (typeof (args.success) === "function") {
                        return args.success(xhr.responseXML);
                    }
                    console.debug("发送ajax请求结束");
                }
            }
        } else {
            return xhr.responseXML;
        }
    }

    /**
     * 获取Xml节点的值
     * @param {XmlElement} node 
     * @returns String
     */
    XmlUtil.getNodeValue = function(node) {
        var val;
        if (node == null) return null;
        if (window.DOMParser) {      //IE
            val = (node.childNodes.length > 0 ? node.childNodes[0].nodeValue : "");
        } else {                      //Mozilla
            try {
                val = node.text;
                if (!val) {
                    val = node.textContent;
                }
                if (!val) {
                    val = node.firstChild.nodeValue;
                }
            } catch (e) {
                val = node.textContent;
            }

        };
        return val;
    }
    
    /**
     * 获取子节点
     * @param {XmlNode} node 
     * @param {String} childElementName 
     * @returns XmlNode
     */
    XmlUtil.getChildNode = function(node, childElementName) {
        if (node == null) return null;
        //var childNode= selectSingleNode(node, childElementName);             // 该方式需XPath支持
        var childNode = node.getElementsByTagName(childElementName);           // 该方式支持各种浏览器
        return childNode;
    }

    /**
     * 获取子节点的值
     * @param {XmlNode} node 
     * @param {String} childElementName 
     * @returns String nodeValue
     */
    XmlUtil.getChildNodeValue = function(node, childElementName) {
        var childNode = getChildNode(node, childElementName);
        if (childNode.length == 0) { return null; };
        return getNodeValue(childNode[0]);
    };

    /**
     * 将XmlNode节点转换为字符串
     * @param {XmlNode} node 
     * @returns String
     */
    XmlUtil.getString = function(node) {
        if (typeof (node.xml) != "undefined") {
            return node.xml;
        } else {
            return (new XMLSerializer()).serializeToString(node);
        }
    }

    /**
     * 使用XPath搜索节点集
     * @param {XmlNode} node 
     * @param {String} xpath 
     * @param {String} nsr 
     * @returns Array 节点集
     */
    XmlUtil.selectNodes = function(node, xpath, nsr) {
        if (node == null || xpath == null) return [];
        if (typeof (node.selectNodes) != "undefined") {         // IE7,  IE9+（XmlHttp.responseXML）, （IE9使用createXmlDocument和DOMParser的loadXML时，无此方法）
            return node.selectNodes(xpath);
        } else {                                                // FF
            var output = [];
            var xpe = new XPathEvaluator();
            var nsResolver = xpe.createNSResolver(node.ownerDocument == null ? node.documentElement : node.ownerDocument.documentElement);
            var oResult = xpe.evaluate(xpath, node, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            if (oResult != null) {
                var oElement = oResult.iterateNext();
                while (oElement) {
                    output.push(oElement);
                    oElement = oResult.iterateNext();
                }
            };
            return output;
        }
    }

    /**
     * 使用XPath搜索节点
     * @param {XmlNode} node 
     * @param {String} xpath 
     * @param {String} nsr 
     * @returns XmlNode 节点
     */
    XmlUtil.selectSingleNode = function(node, xpath, nsr) {
        if (node == null || xpath == null) return null;
        if (typeof (node.selectSingleNode) != "undefined") {
            return node.selectSingleNode(xpath);
        } else {
            var xpe = new XPathEvaluator();
            //var nsResolver = xpe.createNSResolver( node.ownerDocument == null ? node.documentElement : node.ownerDocument.documentElement);

            var ns = node.ownerDocument == null ? node.documentElement : node.ownerDocument.documentElement
            var nsResolver = nsr ? nsr : xpe.createNSResolver(ns);

            var xPathNode = xpe.evaluate(xpath, node, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return (xPathNode != null) ? xPathNode.singleNodeValue : null;
        }
    }

    /**
     * 使用XSLT转换XML文档
     * @param {Document} xmlSource 
     * @param {String} xslFileName 
     * @returns Document
     */
    XmlUtil.transform = function(xmlSource, xslFileName) {
        if (window.ActiveXObject) {    //支持IE6、IE7， 不支持IE9
            try {
                var xslt = new ActiveXObject(_getDomDocumentPrefix() + ".XSLTemplate");
                var xslDoc = new ActiveXObject(_getDomDocumentPrefix() + ".FreeThreadedDOMDocument");
                xslDoc.async = false;
                xslDoc.loadXML(loadXmlDocument(xslFileName));
                xslt.stylesheet = xslDoc;
                var xslProc = xslt.createProcessor();
                xslProc.input = xmlSource;
                xslProc.transform();

                var stroutput = xslProc.output;
                var docTarget = new ActiveXObject(_getDomDocumentPrefix() + ".DomDocument");
                docTarget.setProperty("SelectionLanguage", "XPath");
                docTarget.loadXML(stroutput);
                return docTarget;
            } catch (exp) {
                alert(exp.name + ": " + exp.message);
            };
        } else {                      //支持FF
            try {
                var myXMLHTTPRequest = new XMLHttpRequest();
                myXMLHTTPRequest.open("GET", xslFileName, false);
                myXMLHTTPRequest.send(null);
                var xslStylesheet = myXMLHTTPRequest.responseXML;
                var xsltProcessor = new XSLTProcessor();
                xsltProcessor.importStylesheet(xslStylesheet);
                //xsltProcessor.setParameter(null, "parameter", null);
                //var fragment = xsltProcessor.transformToFragment(xmlSource, document);
                var docTarget = xsltProcessor.transformToDocument(xmlSource);
                return docTarget;
            } catch (exp) {
                alert(exp.name + ": " + exp.message);
            }
        }
    }

    function _getDomDocumentPrefix() {
        if (prefix) {
            return prefix;
        };
        var prefixes = ["MSXML6", "MSXML5", "MSXML4", "MSXML3", "MSXML2", "MSXML", "Microsoft"];
        var o;
        for (var i = 0; i < prefixes.length; i++) {
            try {
                o = new ActiveXObject(prefixes[i] + ".DomDocument");
                prefix = prefixes[i];
                return prefix;
            }
            catch (ex) { };
        };
        throw new Error("Could not find an installed XML parser");
    }
    /**
     * 创建XMLHttpRequest对象
     * @returns XMLHttpRequest
     */
    function _createXmlHttp() {
        try {
            if (window.XMLHttpRequest) {    // ie9+, FF
                var req = new XMLHttpRequest();
                // some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
                if (req.readyState == null) {
                    req.readyState = 1;
                    req.addEventListener("load", function () {
                        req.readyState = 4;
                        if (typeof req.onreadystatechange == "function") {
                            req.onreadystatechange();
                        };
                    }, false);
                };
                return req;
            } else if (window.ActiveXObject) {
                return new ActiveXObject(_getDomDocumentPrefix() + ".XmlHttp");
            };
        } catch (ex) { };
        throw new Error("Your browser does not support XmlHttp objects");
    }

    // 可支持IE7+和FF等，IE9使用该方法返回的Document对象不支持LoadXML和Xpath
    function _createXmlDocument() {
        try {
            if (document.implementation && document.implementation.createDocument) {   // IE9+, FF
                var doc = document.implementation.createDocument("", "", null);

                // some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
                if (doc.readyState == null) {
                    doc.readyState = 1;
                    doc.addEventListener("load", function () {
                        doc.readyState = 4;
                        if (typeof doc.onreadystatechange == "function") {
                            doc.onreadystatechange();
                        };
                    }, false);
                };
                return doc;
            } else if (window.ActiveXObject) {                                           // IE7
                var doc = new ActiveXObject(_getDomDocumentPrefix() + ".DomDocument");
                doc.setProperty("SelectionLanguage", "XPath");
                return doc;
            };
        } catch (ex) { };
        throw new Error("Your browser does not support XmlDocument objects");
    }
}());

export default XmlUtil;
