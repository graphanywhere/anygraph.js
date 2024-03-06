
/**
 * 工具箱（放大、缩小、左移、右移、上移、下移）
 */
function OpBox(containerId_, moveCallback_, zoomCallback_, defaultViewCallback_) {
    let me = {};
    let containerObj_ = (typeof (containerId_) === "object") ? containerId_ : document.getElementById(containerId_);
    let panelid = (typeof (containerId_) === "object") ? containerId_.id + "_OpBox" : containerId_ + "_OpBox";

    me.enabled = function (enabled) {
        if ($(containerObj_).find("#" + panelid).length == 0) {
            let boxBorder = $("<div style=\"position: absolute; top:0px; left:0px;\"></div>");
            $(containerObj_).append(boxBorder);

            let strdivpanel = "<div id=\"" + panelid + "\" class=\"map_panel\" style=\"position:absolute; top:20pt; left:20pt; z-index:210;\">" +
                "<div class=\"map_panel_button\" style=\"left:21px; top:1px;\" title=\"向北平移\"></div>" +
                "<div class=\"map_panel_button\" style=\"left:21px; top:40px;\" title=\"向南平移\"></div>" +
                "<div class=\"map_panel_button\" style=\"left:1px; top:20px;\" title=\"向西平移\"></div>" +
                "<div class=\"map_panel_button\" style=\"left:40px; top:20px;\" title=\"向东平移\"></div>" +
                "<div class=\"map_panel_button\" style=\"left:21px; top:20px;\" title=\"初始视点\"></div>" +
                "<div class=\"map_panel_button\" style=\"left:21px; top:66px;\" title=\"放大\"></div>" +
                "<div class=\"map_panel_button\" style=\"left:21px; top:88px;\" title=\"缩小\"></div>" +
                "</div>";
            boxBorder.append(strdivpanel);
            $(containerObj_).find("#" + panelid).children().css("cursor", "pointer");
            $(containerObj_).find("#" + panelid).children().bind("click", function (e) {
                switch (this.title) {
                    case "向东平移":
                        doMove(0); break;
                    case "向南平移":
                        doMove(1); break;
                    case "向西平移":
                        doMove(2); break;
                    case "向北平移":
                        doMove(3); break;
                    case "初始视点":
                        gotoDefaultView(); break;
                    case "放大":
                        doZoom(1); break;
                    case "缩小":
                        doZoom(0); break;
                    default:
                        break;
                };
                return false;
            });
            $(containerObj_).find("#" + panelid).children().bind("mousedown", function (e) {
                return false;
            });
            $(containerObj_).find("#" + panelid).children().bind("dblclick", function (e) {
                return false;
            });
        };

        $(containerObj_).find("#" + panelid).css("display", ((enabled == true || enabled == "true") ? "block" : "none"));
    };


    function doMove(dir) {
        let distX = containerObj_.offsetWidth / 4;   // 水平方向移动距离
        let distY = containerObj_.offsetHeight / 4;  // 垂直方向移动距离

        let xdist, ydist;

        if (dir === 0) {
            xdist = distX;
            ydist = 0;
        } else if (dir === 1) {
            xdist = 0;
            ydist = distY;
        } else if (dir === 2) {
            xdist = -distX;
            ydist = 0;
        } else if (dir === 3) {
            xdist = 0;
            ydist = -distY;
        }
        if (moveCallback_ != null && (typeof moveCallback_ === 'function')) {
            moveCallback_(xdist, ydist);
        } else {
            console.warn("OpBox not bind move event, " + xdist + " " + ydist);
        }
    }

    function doZoom(opt) {
        let x = containerObj_.offsetWidth / 2
        let y = containerObj_.offsetHeight / 2

        if (zoomCallback_ != null && (typeof zoomCallback_ === 'function')) {
            zoomCallback_(opt, x, y);
        } else {
            console.warn("OpBox not bind zoom event, " + opt + " " + x + " " + y);
        }
    }

    function gotoDefaultView() {
        if (defaultViewCallback_ != null && (typeof defaultViewCallback_ === 'function')) {
            defaultViewCallback_();
        } else {
            console.warn("OpBox not bind defaultView event");
        }
    }

    return me;
};
