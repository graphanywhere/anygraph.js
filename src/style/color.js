import MathUtil from "../util/math.js";

const reHSLa = /^hsla?\(\s*(\d{1,3})\s*,\s*(\d{1,3}\%)\s*,\s*(\d{1,3}\%)\s*(?:\s*,\s*(\d+(?:\.\d+)?)\s*)?\)$/i;
const reRGBa = /^rgba?\(\s*(\d{1,3}(?:\.\d+)?\%?)\s*,\s*(\d{1,3}(?:\.\d+)?\%?)\s*,\s*(\d{1,3}(?:\.\d+)?\%?)\s*(?:\s*,\s*((?:\d*\.?\d+)?)\s*)?\)$/i;
let ___uniqueR = 255;
let ___uniqueG = 0;
let ___uniqueB = 0;
let ___uniqueList = [];

/**
 * 颜色工具类
 */
class Color {
    /**
     * 创建颜色
     * @param {number} r - red
     * @param {number} g - green
     * @param {number} b - blue
     * @param {number} a - alpha
     */
    constructor(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    /**
     * 修改透明度
     * @param {Number} a (0~1)
     * @returns this
     */
    setAlpha(a) {
        this.a = a;
        return this;
    }

    /**
     * 取透明度
     * @returns alaph
     */
    getAlpha() {
        return this.a;
    }

    /**
     * 获取命名色集合
     * @returns 命名色集合
     */
    static getSystemColor() {
        return ___colorNamesMap;
    }

    /**
     * 输出为rgb()字符串颜色值
     * @return {string} rgba
     */
    toString() {
        return this.toRgba();
    }

    /**
     * 转换为rgb()字符串颜色值
     * @returns {String} rgb String
     */
    toRgb() {
        // return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
        return this.toRgba();
    }

    /**
     * 转换为rgba()字符串颜色值
     * @returns {String} rgba String
     */
    toRgba() {
        return (this.a == 1 || this.a == null) ? "rgb(" + this.r + "," + this.g + "," + this.b + ")" : "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }

    /**
     * 转换为10进制数值颜色
     * @returns int // RGB = R + G * 256 + B * 256 * 256
     */
    toInt() {
        return this.r + this.g * 256 + this.b * 256 * 256;
    }

    /**
     * 转换为16进制字符串颜色值
     * @returns String
     */
    toHex() {
        let [red, green, blue, alpha] = [this.r, this.g, this.b, this.a];
        red = Number(red);
        green = Number(green);
        blue = Number(blue);
        alpha = Math.round(alpha * 255);

        if (red != (red & 255) || green != (green & 255) || blue != (blue & 255)) {
            throw Error('"(' + red + "," + green + "," + blue + '") is not a valid RGB color');
        }
        let prependZero = function (hex) {
            return hex.length == 1 ? "0" + hex : hex;
        }

        let hexR = prependZero(red.toString(16));
        let hexG = prependZero(green.toString(16));
        let hexB = prependZero(blue.toString(16));
        let hexA = prependZero(alpha.toString(16));
        let hexStr = "#" + hexR + hexG + hexB + (alpha < 255 ? hexA : "");
        return hexStr.toUpperCase();
    };

    /**
     * 转换为HSB颜色对象
     * @returns {Object} hsb Object { h: hue, s: saturation, b: brightness }
     */
    toHSB() {
        let [red, green, blue] = [this.r, this.g, this.b];
        let hue;
        let saturation;
        let brightness;

        let cmax = (red > green) ? red : green;
        if (blue > cmax) {
            cmax = blue;
        }
        let cmin = (red < green) ? red : green;
        if (blue < cmin) {
            cmin = blue;
        }
        brightness = cmax / 255.0;
        if (cmax != 0) {
            saturation = (cmax - cmin) / cmax;
        } else {
            saturation = 0;
        }
        if (saturation == 0) {
            hue = 0;
        } else {
            let redc = (cmax - red) / (cmax - cmin);
            let greenc = (cmax - green) / (cmax - cmin);
            let bluec = (cmax - blue) / (cmax - cmin);

            if (red == cmax) {
                hue = bluec - greenc;
            } else if (green == cmax) {
                hue = 2.0 + redc - bluec;
            } else {
                hue = 4.0 + greenc - redc;
            }
            hue = hue / 6.0;
            if (hue < 0) {
                hue = hue + 1.0;
            }
        }

        return { H: hue, S: saturation, B: brightness };
    }

    /**
     * 转换为HSV颜色对象
     * @returns {Object} hsv Object { h: hue, s: saturation, v: value };
     */
    toHSV() {
        let [red, green, blue] = [this.r, this.g, this.b];
        let max = Math.max(Math.max(red, green), blue);
        let min = Math.min(Math.min(red, green), blue);
        let hue;
        let saturation;
        let value = max;
        if (min == max) {
            hue = 0;
            saturation = 0;
        } else {
            let delta = max - min;
            saturation = delta / max;
            if (red == max) {
                hue = (green - blue) / delta;
            } else {
                if (green == max) {
                    hue = 2 + (blue - red) / delta;
                } else {
                    hue = 4 + (red - green) / delta;
                }
            }
            hue *= 60;
            if (hue < 0) {
                hue += 360;
            }
            if (hue > 360) {
                hue -= 360;
            }
        }
        return { H: hue, S: saturation, V: value };
    };

    /**
     * 转换为hsl颜色对象
     * @returns {Object} HSL Object { H: hue, S: saturation, L: lightness};
     */
    toHSL() {
        let [red, green, blue] = [this.r, this.g, this.b];
        red /= 255; green /= 255; blue /= 255;

        let h, s, l,
            max = Math.max(red, green, blue),
            min = Math.min(red, green, blue);

        l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case red:
                    h = (green - blue) / d + (green < blue ? 6 : 0);
                    break;
                case green:
                    h = (blue - red) / d + 2;
                    break;
                case blue:
                    h = (red - green) / d + 4;
                    break;
            }
            h /= 6;
        }

        return {
            H: Math.round(h * 360),
            S: Math.round(s * 100),
            L: Math.round(l * 100),
        };
    }

    /**
     * 转换为灰度
     * @return Color
     */
    toGrayscale() {
        let average = parseInt((this.r * 0.3 + this.g * 0.59 + this.b * 0.11).toFixed(0), 10);
        this.r = this.g = this.b = average;
        return this;
    }

    /**
     * 转换为黑白色
     * @param {Number} threshold
     * @return Color
     */
    toBlackWhite(threshold = 127) {
        let average = (this.r * 0.3 + this.g * 0.59 + this.b * 0.11).toFixed(0);
        average = (Number(average) < Number(threshold)) ? 0 : 255;
        this.r = this.g = this.b = average;
        return this;
    }

    /**
     * 10进制表示法颜色 转十进制 R G B
     * @param {Number} intVal 
     * @returns {Color} color
     */
    static fromInt(intVal) {
        let alpha = intVal >> 24 & 0xff;
        let red = intVal >> 16 & 0xff;
        let green = intVal >> 8 & 0xff;
        let blue = intVal & 0xff;
        return new Color(red, green, blue, alpha);
    }

    /**
     * 将字符串颜色转换为Color对象
     * @param {string} str 目前支持两种字符串格式：1、十六进制 #FFFFFF或#FFF   2、rgb(0,0,0)或(0,0,0)或0,0,0格式
     * @return {Color}
     */
    static fromString(str) {
        if (this.isValidColor(str) == false) return null;
        if (str.startsWith('hsl(')) {
            return this.fromHSL(str);
        } else {
            // 1 判断是否为16进制格式的字符串格式
            let color = this.fromHex(str);
            if (color == null) {
                // 2 判断是否为rgba()格式
                let reg = /\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(,\s*[0|1].?\d*)?\)/;
                if (reg.test(str)) {
                    let rgbStr = str.substring(str.indexOf("(") + 1, str.indexOf(")")).split(",");
                    return new Color(rgbStr[0], rgbStr[1], rgbStr[2], rgbStr[3]);
                } else {
                    // 3 判断是否为rgb()格式
                    reg = /(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(,\s*[0|1].?\d*)?/;
                    if (reg.test(str)) {
                        let rgbStr = str.substring(str.indexOf("(") + 1, str.indexOf(")")).split(",");
                        return new Color(rgbStr[0], rgbStr[1], rgbStr[2], rgbStr[3]);
                    } else {
                        // 4 判断是否为系统内置颜色
                        const namedColor = ___colorNamesMap[str];
                        return (namedColor == null ? null : this.fromString(namedColor));
                    }
                }
            }
            return color;
        }
    }

    /**
     * 将16进制颜色字符串 转换为Color对象
     * @param {string} hex - 十六进制 #FFFFFF
     * @return {Color} color
     */
    static fromHex(hex) {
        if (hex == null) return null;
        let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6}|[0-9a-fA-f]{8})$/;
        hex = hex.toLowerCase();
        if (reg.test(hex)) {
            //处理三位的颜色值 #FFF
            if (hex.length === 4) {
                let sColorNew = "#";
                for (let i = 1; i < 4; i += 1) {
                    sColorNew += hex.slice(i, i + 1).concat(hex.slice(i, i + 1));
                }
                hex = sColorNew;
            }
            //处理六位的颜色值 #FFFFFF
            if (hex.length === 7) {
                hex += "ff";
            }
            let sColorChange = [];
            for (let i = 1; i < 9; i += 2) {
                sColorChange.push(parseInt("0x" + hex.slice(i, i + 2)));
            }
            return new Color(sColorChange[0], sColorChange[1], sColorChange[2], sColorChange[3] / 255);
        } else {
            return null;
        }
    }

    /**
     * 将HSB的颜色转换为Color对象
     * @param {*} hue 
     * @param {*} saturation 
     * @param {*} brightness 
     * @returns Color
     */
    static fromHSB(hue, saturation, brightness) {
        let red = 0;
        let green = 0;
        let blue = 0;

        if (saturation == 0) {
            red = parseInt(brightness * 255.0 + 0.5);
            green = red;
            blue = red;
        }
        else {
            let h = (hue - Math.floor(hue)) * 6.0;
            let f = h - Math.floor(h);
            let p = brightness * (1.0 - saturation);
            let q = brightness * (1.0 - saturation * f);
            let t = brightness * (1.0 - (saturation * (1.0 - f)));

            switch (parseInt(h)) {
                case 0:
                    red = (brightness * 255.0 + 0.5);
                    green = (t * 255.0 + 0.5);
                    blue = (p * 255.0 + 0.5);
                    break;
                case 1:
                    red = (q * 255.0 + 0.5);
                    green = (brightness * 255.0 + 0.5);
                    blue = (p * 255.0 + 0.5);
                    break;
                case 2:
                    red = (p * 255.0 + 0.5);
                    green = (brightness * 255.0 + 0.5);
                    blue = (t * 255.0 + 0.5);
                    break;
                case 3:
                    red = (p * 255.0 + 0.5);
                    green = (q * 255.0 + 0.5);
                    blue = (brightness * 255.0 + 0.5);
                    break;
                case 4:
                    red = (t * 255.0 + 0.5);
                    green = (p * 255.0 + 0.5);
                    blue = (brightness * 255.0 + 0.5);
                    break;
                case 5:
                    red = (brightness * 255.0 + 0.5);
                    green = (p * 255.0 + 0.5);
                    blue = (q * 255.0 + 0.5);
                    break;
            }
        }
        return new Color(parseInt(red), parseInt(green), parseInt(blue));
    }

    /**
     * 将HSL的字符串颜色转换为Color对象
     * @param {*} color 
     * @returns Color Object
     */
    static fromHSL(hslColor) {
        let match = hslColor.match(reHSLa);
        if (!match) {
            return;
        }

        let h = (((parseFloat(match[1]) % 360) + 360) % 360) / 360,
            s = parseFloat(match[2]) / (/%$/.test(match[2]) ? 100 : 1),
            l = parseFloat(match[3]) / (/%$/.test(match[3]) ? 100 : 1),
            r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            let q = l <= 0.5 ? l * (s + 1) : l + s - l * s,
                p = l * 2 - q;

            r = this._hue2rgb(p, q, h + 1 / 3);
            g = this._hue2rgb(p, q, h);
            b = this._hue2rgb(p, q, h - 1 / 3);
        }

        //return new Color(r * 255, g * 255, b * 255, match[4] ? parseFloat(match[4]) : 1);
        return new Color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), match[4] ? parseFloat(match[4]) : 1);
    };

    /**
     * @private
     * @param {Number} p
     * @param {Number} q
     * @param {Number} t
     * @return {Number}
     */
    static _hue2rgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }

    /**
     * 生成色带
     * @param {Color} start - 色带起始色
     * @param {number} count - 随机颜色数，默认值10个
     * @return {Color} 生成随机色带
     */
    static band(color, count) {
        if (typeof (color) === "string") {
            color = this.fromString(color);
        }
        if (!color instanceof Color) {
            return null;
        }
        let interval = (count == null ? 10 : 100 / count);
        let colorSet = [];
        let hsl = color.toHSL();
        for (let l = 100; l >= 0; l -= interval) {
            let hslColor = "hsl(" + hsl.H + ", " + hsl.S + "%, " + Math.round(l) + "%)";
            let ncolor = this.fromHSL(hslColor);
            let hex = ncolor.toHex();
            colorSet.push(hex);
        }
        return colorSet;
    }

    /**
     * 获取常用的16色
     */
    static getColor16() {
        return ["black", "silver", "gray", "white", "maroon", "red", "purple", "fuchsia", "green", "lime", "olive", "yellow", "navy", "blue", "teal", "aqua"];
    }

    static resetUniqueColor() {
        ___uniqueR = 255;
        ___uniqueG = 0;
        ___uniqueB = 0;
    }

    static getUniqueColor() {
        let randomNum = MathUtil.getRandomNum(0, 255 * 255 * 255 * 255);
        while (true) {
            if (___uniqueList.indexOf(randomNum) >= 0) {
                randomNum = MathUtil.getRandomNum(0, 255 * 255 * 255 * 255);
            } else {
                break;
            }
        }
        return this.fromInt(randomNum);
    }

    /**
     * 生成随机色
     * @return {Color} 生成随机色
     */
    static random() {
        return new Color(Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255));
    }

    /**
     * 判断一个颜色值是否合法
     * @param {String} color 
     * @returns boolean
     */
    static isValidColor(color) {

        let _isValidateRGBNum = function (val) {
            if (isNaN(val) || val < 0 || val > 255) {
                return false;
            } else {
                return true;
            }
        }

        // 如果颜色值以 # 开头，则格式为 #000 或 #0000 或 #000000 或 #00000000
        if (color.startsWith('#')) {
            // 颜色值必须为3/4/6/8个字符，首字符为#
            let pattern = /^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i;
            return pattern.test(color);
        } else if ((color.startsWith('rgb(') || color.startsWith('rgba(')) && color.split(",").length > 2) {
            // 如果颜色值以 rgb 开头，则格式为 rgb(0,0,0) 或 rgba(0,0,0,0)
            if (color.startsWith('rgb(')) {
                color = color.substring(4, (color.lastIndexOf(")")));
                let seq = color.split(",")
                if (seq.length == 3) {
                    for (let i = 0; i < seq.length; i++) {
                        if (_isValidateRGBNum(seq[i]) === false) {
                            return false;
                        }
                    }
                    return true;
                }
            } else if (color.startsWith('rgba(')) {
                color = color.substring(5, (color.lastIndexOf(")")));
                let seq = color.split(",")
                if (seq.length == 4) {
                    for (let i = 0; i < seq.length; i++) {
                        let val = parseFloat(seq[i]);
                        if (i < 3) {
                            if (_isValidateRGBNum(seq[i]) === false) {
                                return false;
                            }
                        } else {
                            if (isNaN(val) || val < 0 || val > 1) {
                                return false;
                            }
                        }
                    }
                    return true;
                }
            } else {
                let seq = color.split(",")
                for (let i = 0; i < seq.length; i++) {
                    if (i < 3) {
                        if (_isValidateRGBNum(seq[i]) === false) {
                            return false;
                        }
                    } else {
                        if (isNaN(val) || val < 0 || val > 1) {
                            return false;
                        }
                    }
                }
                return true;
            }

            return false;
        } else if (color.startsWith('hsl(')) {
            let match = color.match(reHSLa);
            if (!match) {
                return false;
            } else {
                return true;
            }
        } else {
            // 检查颜色代码是否在颜色表中定义  
            const namedColor = ___colorNamesMap[color];
            return (namedColor == null ? false : true);
        }
    }
}

const ___colorNamesMap = {
    transparent: '#FFFFFF00',
    aliceblue: '#F0F8FF',
    antiquewhite: '#FAEBD7',
    aqua: '#00FFFF',
    aquamarine: '#7FFFD4',
    azure: '#F0FFFF',
    beige: '#F5F5DC',
    bisque: '#FFE4C4',
    black: '#000000',
    blanchedalmond: '#FFEBCD',
    blue: '#0000FF',
    blueviolet: '#8A2BE2',
    brown: '#A52A2A',
    burlywood: '#DEB887',
    cadetblue: '#5F9EA0',
    chartreuse: '#7FFF00',
    chocolate: '#D2691E',
    coral: '#FF7F50',
    cornflowerblue: '#6495ED',
    cornsilk: '#FFF8DC',
    crimson: '#DC143C',
    cyan: '#00FFFF',
    darkblue: '#00008B',
    darkcyan: '#008B8B',
    darkgoldenrod: '#B8860B',
    darkgray: '#A9A9A9',
    darkgrey: '#A9A9A9',
    darkgreen: '#006400',
    darkkhaki: '#BDB76B',
    darkmagenta: '#8B008B',
    darkolivegreen: '#556B2F',
    darkorange: '#FF8C00',
    darkorchid: '#9932CC',
    darkred: '#8B0000',
    darksalmon: '#E9967A',
    darkseagreen: '#8FBC8F',
    darkslateblue: '#483D8B',
    darkslategray: '#2F4F4F',
    darkslategrey: '#2F4F4F',
    darkturquoise: '#00CED1',
    darkviolet: '#9400D3',
    deeppink: '#FF1493',
    deepskyblue: '#00BFFF',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1E90FF',
    firebrick: '#B22222',
    floralwhite: '#FFFAF0',
    forestgreen: '#228B22',
    fuchsia: '#FF00FF',
    gainsboro: '#DCDCDC',
    ghostwhite: '#F8F8FF',
    gold: '#FFD700',
    goldenrod: '#DAA520',
    gray: '#808080',
    grey: '#808080',
    green: '#008000',
    greenyellow: '#ADFF2F',
    honeydew: '#F0FFF0',
    hotpink: '#FF69B4',
    indianred: '#CD5C5C',
    indigo: '#4B0082',
    ivory: '#FFFFF0',
    khaki: '#F0E68C',
    lavender: '#E6E6FA',
    lavenderblush: '#FFF0F5',
    lawngreen: '#7CFC00',
    lemonchiffon: '#FFFACD',
    lightblue: '#ADD8E6',
    lightcoral: '#F08080',
    lightcyan: '#E0FFFF',
    lightgoldenrodyellow: '#FAFAD2',
    lightgray: '#D3D3D3',
    lightgrey: '#D3D3D3',
    lightgreen: '#90EE90',
    lightpink: '#FFB6C1',
    lightsalmon: '#FFA07A',
    lightseagreen: '#20B2AA',
    lightskyblue: '#87CEFA',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#B0C4DE',
    lightyellow: '#FFFFE0',
    lime: '#00FF00',
    limegreen: '#32CD32',
    linen: '#FAF0E6',
    magenta: '#FF00FF',
    maroon: '#800000',
    mediumaquamarine: '#66CDAA',
    mediumblue: '#0000CD',
    mediumorchid: '#BA55D3',
    mediumpurple: '#9370DB',
    mediumseagreen: '#3CB371',
    mediumslateblue: '#7B68EE',
    mediumspringgreen: '#00FA9A',
    mediumturquoise: '#48D1CC',
    mediumvioletred: '#C71585',
    midnightblue: '#191970',
    mintcream: '#F5FFFA',
    mistyrose: '#FFE4E1',
    moccasin: '#FFE4B5',
    navajowhite: '#FFDEAD',
    navy: '#000080',
    oldlace: '#FDF5E6',
    olive: '#808000',
    olivedrab: '#6B8E23',
    orange: '#FFA500',
    orangered: '#FF4500',
    orchid: '#DA70D6',
    palegoldenrod: '#EEE8AA',
    palegreen: '#98FB98',
    paleturquoise: '#AFEEEE',
    palevioletred: '#DB7093',
    papayawhip: '#FFEFD5',
    peachpuff: '#FFDAB9',
    peru: '#CD853F',
    pink: '#FFC0CB',
    plum: '#DDA0DD',
    powderblue: '#B0E0E6',
    purple: '#800080',
    rebeccapurple: '#663399',
    red: '#FF0000',
    rosybrown: '#BC8F8F',
    royalblue: '#4169E1',
    saddlebrown: '#8B4513',
    salmon: '#FA8072',
    sandybrown: '#F4A460',
    seagreen: '#2E8B57',
    seashell: '#FFF5EE',
    sienna: '#A0522D',
    silver: '#C0C0C0',
    skyblue: '#87CEEB',
    slateblue: '#6A5ACD',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#FFFAFA',
    springgreen: '#00FF7F',
    steelblue: '#4682B4',
    tan: '#D2B48C',
    teal: '#008080',
    thistle: '#D8BFD8',
    tomato: '#FF6347',
    turquoise: '#40E0D0',
    violet: '#EE82EE',
    wheat: '#F5DEB3',
    white: '#FFFFFF',
    whitesmoke: '#F5F5F5',
    yellow: '#FFFF00',
    yellowgreen: '#9ACD32'
};

export default Color;

// console.info(Color.fromString("rgb(255,255,255)").toString());
// console.info(Color.fromString("#FFF").toString());
// console.info(Color.fromString("#FFFFFFDF").toString());
// console.info(Color.fromString("rgba(255,255,255,0.1)").toString());
// console.info(Color.fromString("(255,255,255)").toString());

// console.info(1, Color.isValidColor("#000"));
// console.info(1, Color.isValidColor("#0001"));
// console.info(2, Color.isValidColor("#000FFF"));
// console.info(3, Color.isValidColor("#000FFF00"));
// console.info(4, Color.isValidColor("rgb(0,0,0)"));
// console.info(5, Color.isValidColor("rgba(0,0,0)"));
// console.info(6, Color.isValidColor("rgba(0,0,0,0)"));
// console.info(7, Color.isValidColor("white"));
// console.info(8, Color.isValidColor("whitea"));

// let color = Color.fromString("rgb(0,128,0)");
// console.info(color);
// color = Color.fromString("rgba(0,128,0, 0.8)");
// console.info(color);

// let red = Color.fromString("red")
// console.info(red.toHSL(), red.toHSB(), red.toHSV(), red.toHex(), red.toRgb());
