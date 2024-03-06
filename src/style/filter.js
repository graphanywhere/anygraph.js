import Black from "./filter/black.js"
import Blur from "./filter/blur.js";
import Brighten from "./filter/brighten.js";
import Casting from "./filter/casting.js";
import Contrast from "./filter/contrast.js";
import Emboss from "./filter/emboss.js";
import Enhance from "./filter/enhance.js";
import Grayscale from "./filter/grayscale.js";
import HSL from "./filter/hsl.js";
import HSV from "./filter/hsv.js";
import Invert from "./filter/invert.js";
import Kaleidoscope from "./filter/kaleidoscope.js";
import Mask from "./filter/mask.js";
import Noise from "./filter/noise.js";
import Pixelate from "./filter/pixelate.js";
import Posterize from "./filter/posterize.js";
import { RGBA, RGB, RGBMask } from "./filter/rgba.js";
import Sepia from "./filter/sepia.js";
import Solarize from "./filter/solarize.js";
import Threshold from "./filter/threshold.js";

/**
 * 滤镜名称空间
 */
const Filter = {
    /**
     * 取指定名称的滤镜
     * @param {String} name 
     * @returns Filter function
     */
    getFilter: function (name) {
        name = name.toLowerCase();
        let filter;
        switch (name) {
            case "black":
                filter = Black;
                break;
            case "blur":
                filter = Blur;
                break;
            case "brighten":
                filter = Brighten;
                break;
            case "castingd":
                filter = Casting;
                break;
            case "contrast":
                filter = Contrast;
                break;
            case "emboss":
                filter = Emboss;
                break;
            case "enhancea":
                filter = Enhance;
                break;
            case "grayscale":
                filter = Grayscale;
                break;
            case "hsl":
                filter = HSL;
                break;
            case "hsv":
                filter = HSV;
                break;
            case "invert":
                filter = Invert;
                break;
            case "kaleidoscope":
                filter = Kaleidoscope;
                break;
            case "mask":
                filter = Mask;
                break;
            case "noise":
                filter = Noise;
                break;
            case "pixelate":
                filter = Pixelate;
                break;
            case "posterize":
                filter = Posterize;
                break;
            case "rgba":
                filter = RGBA;
                break;
            case "rgb":
                filter = RGB;
                break;
            case "rgbmask":
                filter = RGBMask;
                break;
            case "sepia":
                filter = Sepia;
                break;
            case "solarize":
                filter = Solarize;
                break;
            case "threshold":
                filter = Threshold;
                break;
            default:
                filter = null;
                break;
        }
        return filter;
    }
};

export default Filter;
