const hiprint = window.hiprint;
const autoConnect = window['vue-plugin-hiprint'].autoConnect;
const disAutoConnect = window['vue-plugin-hiprint'].disAutoConnect;
const defaultElementTypeProvider = window['vue-plugin-hiprint'].defaultElementTypeProvider;

var hiprintTemplate;

//构建设计器
function buildDesigner() {
    $("#hiprint-printTemplate").empty(); // 先清空, 避免重复构建
    hiprintTemplate = new hiprint.PrintTemplate({
        template: {}, // 模板json(object)
        settingContainer: "#PrintElementOptionSetting", // 元素参数容器
        onImageChooseClick: (target) => {
            //增加图片选择
            let input = document.createElement("input");
            input.setAttribute("type", "file");
            input.click();
            input.onchange = function () {
                var file = this.files[0];
                var reader = new FileReader();
                if (file) {
                    var reader = new FileReader();
                    //通过文件流行文件转换成Base64字行串 
                    reader.readAsDataURL(file);
                    //转换成功后
                    reader.onloadend = function () {
                        // 通过 target.refresh 更新图片元素
                        target.refresh(reader.result);
                    }
                }
            }
            input.remove();
        }
    });
    // 构建 并填充到 容器中
    hiprintTemplate.design("#hiprint-printTemplate", { grid: true }); // 0.0.46版本新增, 是否显示网格
}


//创建HiprintTemplate对象
function createHiprintTemplate() {
    hiprintTemplate = new hiprint.PrintTemplate({});
}



//构建左侧拖拽面板
function buildProvider(data, clear) {
    // 组装 provider
    if (Array.isArray(data)) {
        let providerList = createProviderList(data);
        hiprint.init({ providers: providerList });
    } else {
        let provider = createProvider(data.key, data.options);
        hiprint.init({ providers: [provider] });
    }
    if (clear) {
        $("#provider-container").empty(); // 先清空, 避免重复构建
    }
    if (Array.isArray(data)) {
        data.forEach((item) => hiprint.PrintElementTypeManager.build($("#provider-container"), item.key));
    } else {
        hiprint.PrintElementTypeManager.build($("#provider-container"), data.key);
    }
}


//获取Html
function getHtml(printData) {
    var html = hiprintTemplate.getHtml(printData);
    return html[0].outerHTML;
}


//导出Json模板
function getJson() {
    var json = hiprintTemplate.getJson();
    return JSON.stringify(json);
}


//导出部分Json模板：就是仅导出 options, 不导出 printElementType，一些其他数据需要再 provider 中获取，所以一点要先 init 对应的 provider
function getJsonTid() {
    var json = hiprintTemplate.getJsonTid();
    return JSON.stringify(json);
}


//更新模板
function update(json) {
    hiprintTemplate.update(JSON.parse(json));
}


//浏览器打印
function print(printData) {
    hiprintTemplate.print(printData);
}


//设置打印客户端地址 例：http://localhost:17521
function setHost(address) {
    hiprint.hiwebSocket.setHost(address);
}

//与打印客户端是否成功连接
function isOpened() {
    return hiprint.hiwebSocket.opened;
}


//获取打印机列表
function getPrinterList() {
    var x = hiprintTemplate.getPrinterList();
    return x;
}


//客户端直接打印
function print2(printData, config) {
    hiprintTemplate.print2(printData, config || {});
}



//生成pdf
function toPdf(printData,fileName) {
    hiprintTemplate.toPdf(printData, fileName);
}


//调整纸张尺寸
function setPaper(paperTypeOrWidth, height) {
    hiprintTemplate.setPaper(paperTypeOrWidth, height);
}


//旋转
function rotatePaper() {
    hiprintTemplate.rotatePaper();
};


//对齐(左:left 居中:vertical 右:right 顶部:top  垂直居中:horizontal 底部:bottom 横向分散:distributeHor 纵向分散:distributeVer) 
function setElsAlign(e) {
    hiprintTemplate.setElsAlign(e);
}


//清空
function clear() {
    hiprintTemplate.clear();
};

/**
 * @description 这是一个示例, 如果后端返回的数据,与我们需要的格式不对应, 那么我们可以在这里进行转换
 */
const PRINT_ELEMENT_TYPE_MAP = {
    // 比如后端返回元素类型的是 "txt", 但是我们需要的是 "text"
    txt: "text",
    img: "image",
    // 比如后端返回的 "二维码", 但是我们需要的是 "text"
    qrcode: "text",
    // 比如后端返回的 "条形码", 但是我们需要的是 "text"
    barcode: "text",
    table: "table",
    tableCustom: "table",
    hLine: "hline",
    vLine: "vline",
    rect: "rect",
    oval: "oval",
};

/**
 * 创建一个 provider
 * @param {*} key 这个 key 是用于创建 "唯一" 的 "tid" 的, 一般是用于区分不同的 provider
 * @param {*} options 这个就需要根据实际情况来定义了,根据项目实际情况与后端协商定义
 * @returns Object
 */
const createProvider = function (key, options) {
    const addElementTypes = function (context) {
        // 先清空, 避免重复添加. 如果有特殊需求, 可以不清空
        context.removePrintElementTypes(key);
        // 实际添加 一般分为以下几步:
        // 1. 添加一个key (用于创建 "唯一" 的 "tid" ) -- 对象包含数组: {"key",[]}
        // 2. 添加一个分组 (就是为了给元素分组, 便于展示) -- 对象包含数组: {"分组名称",[]}
        // 3. 添加分组下的元素数组 (实际的元素操作,都在这里进行) -- 数组包含对象 [{元素格式},{元素格式}]

        // 反过来说, 我们就是需要 先 "创建元素数组", 把这个"元素数组"push到 "分组对象"中, 最后把这个"分组对象"push到 "key数组"中

        // 所以我们先来 第 3 步: 创建元素数组
        // 这里的 options.config 是一个数组, 里面包含了后端返回的元素配置信息
        let printElements = options.printElements.map((item) => {
            // 提出来, 方便处理 二维码 条形码;
            // 如果和后端约定好,那么就更简单了,直接把后端返回的数据,直接赋值给 options
            let options = {
                title: item.title, // 在 options 中添加 title, 是可以清空的
                field: item.field,
                testData: item.testData,
                ...item.options, // 可选参数之类的, 或者参数都在这里面
            };
            // 有些元素可以不设置宽高的,比如 table
            item.width && (options.width = item.width);
            item.height && (options.height = item.height);
            // 特殊处理 二维码 条形码
            if (["qrcode", "barcode"].includes(item.type)) {
                options.textType = item.type;
            }
            //   基础打印元素选项
            let printElement = {
                tid: `${key}.${item.id}`, // 确保不重复就行
                title: item.title, // 这个 title 清空了,还是会有这个默认值
                type: PRINT_ELEMENT_TYPE_MAP[item.type], // 转换后端返回的元素类型
                options: options,
            };
            // 特殊处理 表格 (表格参比较多咯~~~)
            if (["table", "tableCustom"].includes(item.type)) {
                // 根据实际情况 进行处理
                if (item.columns) {
                    printElement.columns = item.columns;
                } else {
                    printElement.columns = [
                        [
                            { align: "center", width: 100 },
                            { align: "center", width: 100 },
                        ],
                    ];
                }
                return printElement;
            }
            return printElement;
        });
        // 第 2 步: 创建分组对象
        // 如果 是多个分组, 就再套一层循环就好了
        let printElementGroup = new hiprint.PrintElementTypeGroup(options.groupName, printElements);
        // 第 1 步: 添加到 key 数组中
        context.addPrintElementTypes(key, [printElementGroup]);
    };
    return {
        addElementTypes: addElementTypes,
    };
};

/**
 * 创建多个 provider
 * @param {*} optionList 参数列表
 * @returns Array
 */
const createProviderList = function (optionList) {
    const providers = optionList.map((item) => {
        return createProvider(item.key, item.options);
    });
    // 当你不清楚的时候, 可以 log 出来看看
    return providers;
};



export { createHiprintTemplate, buildDesigner, buildProvider, autoConnect, disAutoConnect, getHtml, getJson, getJsonTid, update, print, setHost, isOpened, getPrinterList,print2, toPdf ,setPaper, rotatePaper, setElsAlign, clear };
