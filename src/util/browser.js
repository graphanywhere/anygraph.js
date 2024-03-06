/**
 * 浏览器信息工具类
 * (source: leftlet)
 * @class
 */
const BrowserUtil = {};

(function () {

    /**
     * 在非浏览器环境下初始化该类时，返回空对象
     */
    if (typeof window === "undefined") {
        return {};
    }

    BrowserUtil.style = document.documentElement.style;

    // @property ie: Boolean; `true` for all Internet Explorer versions (not Edge).
    BrowserUtil.ie = 'ActiveXObject' in window;

    // @property ielt9: Boolean; `true` for Internet Explorer versions less than 9.
    BrowserUtil.ielt9 = BrowserUtil.ie && !document.addEventListener;

    // @property edge: Boolean; `true` for the Edge web browser.
    BrowserUtil.edge = 'msLaunchUri' in navigator && !('documentMode' in document);

    // @property webkit: Boolean;
    // `true` for webkit-based browsers like Chrome and Safari (including mobile versions).
    BrowserUtil.webkit = userAgentContains('webkit');

    // @property android: Boolean
    // **Deprecated.** `true` for any browser running on an Android platform.
    BrowserUtil.android = userAgentContains('android');

    // @property android23: Boolean; **Deprecated.** `true` for browsers running on Android 2 or Android 3.
    BrowserUtil.android23 = userAgentContains('android 2') || userAgentContains('android 3');

    /* See https://stackoverflow.com/a/17961266 for details on detecting stock Android */
    BrowserUtil.webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10); // also matches AppleWebKit
    // @property androidStock: Boolean; **Deprecated.** `true` for the Android stock browser (i.e. not Chrome)
    BrowserUtil.androidStock = BrowserUtil.android && userAgentContains('Google') && BrowserUtil.webkitVer < 537 && !('AudioNode' in window);

    // @property opera: Boolean; `true` for the Opera browser
    BrowserUtil.opera = !!window.opera;

    // @property chrome: Boolean; `true` for the Chrome browser.
    BrowserUtil.chrome = !BrowserUtil.edge && userAgentContains('chrome');

    // @property gecko: Boolean; `true` for gecko-based browsers like Firefox.
    BrowserUtil.gecko = userAgentContains('gecko') && !BrowserUtil.webkit && !BrowserUtil.opera && !BrowserUtil.ie;

    // @property safari: Boolean; `true` for the Safari browser.
    BrowserUtil.safari = !BrowserUtil.chrome && userAgentContains('safari');

    BrowserUtil.phantom = userAgentContains('phantom');

    // @property opera12: Boolean
    // `true` for the Opera browser supporting CSS transforms (version 12 or later).
    BrowserUtil.opera12 = 'OTransition' in BrowserUtil.style;

    // @property win: Boolean; `true` when the browser is running in a Windows platform
    BrowserUtil.win = navigator.platform.indexOf('Win') === 0;

    // @property ie3d: Boolean; `true` for all Internet Explorer versions supporting CSS transforms.
    BrowserUtil.ie3d = BrowserUtil.ie && ('transition' in BrowserUtil.style);

    // @property webkit3d: Boolean; `true` for webkit-based browsers supporting CSS transforms.
    BrowserUtil.webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !BrowserUtil.android23;

    // @property gecko3d: Boolean; `true` for gecko-based browsers supporting CSS transforms.
    BrowserUtil.gecko3d = 'MozPerspective' in BrowserUtil.style;

    // @property any3d: Boolean
    // `true` for all browsers supporting CSS transforms.
    BrowserUtil.any3d = !window.L_DISABLE_3D && (BrowserUtil.ie3d || BrowserUtil.webkit3d || BrowserUtil.gecko3d) && !BrowserUtil.opera12 && !BrowserUtil.phantom;

    // @property mobile: Boolean; `true` for all browsers running in a mobile device.
    BrowserUtil.mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');

    // @property mobileWebkit: Boolean; `true` for all webkit-based browsers in a mobile device.
    BrowserUtil.mobileWebkit = BrowserUtil.mobile && BrowserUtil.webkit;

    // @property mobileWebkit3d: Boolean
    // `true` for all webkit-based browsers in a mobile device supporting CSS transforms.
    BrowserUtil.mobileWebkit3d = BrowserUtil.mobile && BrowserUtil.webkit3d;

    // @property msPointer: Boolean
    // `true` for browsers implementing the Microsoft touch events model (notably IE10).
    BrowserUtil.msPointer = !window.PointerEvent && window.MSPointerEvent;

    // @property pointer: Boolean
    // `true` for all browsers supporting [pointer events]
    // (https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
    BrowserUtil.pointer = !!(window.PointerEvent || BrowserUtil.msPointer);

    // @property touchNative: Boolean
    // `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
    // **This does not necessarily mean** that the browser is running in a computer with
    // a touchscreen, it only means that the browser is capable of understanding
    // touch events.
    BrowserUtil.touchNative = 'ontouchstart' in window || !!window.TouchEvent;

    // @property touch: Boolean
    // `true` for all browsers supporting either [touch](#browser-touch) or [pointer](#browser-pointer) events.
    // Note: pointer events will be preferred (if available), and processed for all `touch*` listeners.
    BrowserUtil.touch = !window.L_NO_TOUCH && (BrowserUtil.touchNative || BrowserUtil.pointer);

    // @property mobileOpera: Boolean; `true` for the Opera browser in a mobile device.
    BrowserUtil.mobileOpera = BrowserUtil.mobile && BrowserUtil.opera;

    // @property mobileGecko: Boolean
    // `true` for gecko-based browsers running in a mobile device.
    BrowserUtil.mobileGecko = BrowserUtil.mobile && BrowserUtil.gecko;

    // @property retina: Boolean
    // `true` for browsers on a high-resolution "retina" screen or on any screen when browser's display zoom is more than 100%.
    BrowserUtil.retina = (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1;

    // @property passiveEvents: Boolean
    // `true` for browsers that support passive events.
    BrowserUtil.passiveEvents = (function () {
        let supportsPassiveOption = false;
        try {
            let opts = Object.defineProperty({}, 'passive', {
                get: function () { // eslint-disable-line getter-return
                    supportsPassiveOption = true;
                }
            });
            window.addEventListener('testPassiveEventSupport', falseFn, opts);
            window.removeEventListener('testPassiveEventSupport', falseFn, opts);
        } catch (e) {
            // Errors can safely be ignored since this is only a browser support test.
        }
        return supportsPassiveOption;
    }());

    // @property mac: Boolean; `true` when the browser is running in a Mac platform
    BrowserUtil.mac = navigator.platform.indexOf('Mac') === 0;

    // @property mac: Boolean; `true` when the browser is running in a Linux platform
    BrowserUtil.linux = navigator.platform.indexOf('Linux') === 0;

    function userAgentContains(str) {
        return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
    }
}());

export default BrowserUtil;
