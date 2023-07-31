const sdAttributes = [
    'sd-prompt',
    'sd-model',
    'sd-steps',
    'sd-sampler',
    'sd-seed',
    'sd-size',
    'sd-cfgscale',
    'sd-time',
]

const intersectionObserver = new IntersectionObserver(entries => {
    if (entries[0].intersectionRatio <= 0) return;
    loadMoreRecords();
    // load more content;
});

function observeScroll() {
    const recordsLoadMore = document.querySelector(".recordsLoadMore");
    // start observing
    intersectionObserver.observe(recordsLoadMore);
}

function cancelObserveScroll() {
    intersectionObserver.disconnect();
}

async function showUseRecords() {

    const recordsActiveTag = document.getElementsByClassName('record-active')[0];
    if (recordsActiveTag.style.display === 'block') {
        return
    }

    recordsActiveTag.style.display = 'block';

    const records = await queryRecords();
    const tabsEle = document.getElementById('tabs');
    const quicksettingsEle = document.getElementById('quicksettings');
    const useRecordsEle = document.getElementsByClassName('records-container')[0];

    tabsEle.style.display = 'none';
    quicksettingsEle.style.display = 'none';
    useRecordsEle.style.display = 'block';

    window.useRecordsData = {
        records: records,
        curPage: 2, // 
    };

    replaceRecordsNum(records.total);
    addRecordsDom(records.list);
    observeScroll();
}

function replaceSDValue(data) {
    sdAttributes.forEach(id => {
        const element = document.getElementById(id);
        const sdKey = id.split('-')[1];
        element.innerHTML = data[sdKey];
    })

    const sdImgEle = document.getElementById('sd-imgurl');
    sdImgEle.src = data.imgurl;

    // 设置图片下载链接
    const sdImgDownloadBtn = document.getElementById('sd-img-download');
    sdImgDownloadBtn.href = data.imgurl;
}

function getSdValues(detail) {
    const data = JSON.parse(detail.prompt);
    const infotext = data.infotexts[0];
    const infos = infotext.split(',');
    const { cfg_scale, sampler_name, steps, prompt } = data;
    const sdData = {};
    infos.forEach(item => {
        const [sdKey, sdValue] = item.trim().split(':');
        if (sdKey == 'Model') {
            sdData.model = sdValue;
        }
        if (sdKey == 'Seed') {
            sdData.seed = sdValue;
        }
        if (sdKey == 'Size') {
            sdData.size = `${sdValue}像素`;
        }
    })
    return {
        time: detail.gmtCreate,
        imgurl: detail.imgUrl,
        cfgscale: cfg_scale,
        sampler: sampler_name,
        steps: steps,
        prompt: prompt,
        ...sdData
    }
}

function showRecordDetail(id) {
    // 背景高斯模糊
    const useRecordsEle = document.getElementsByClassName('records-container')[0];
    useRecordsEle.style.filter = 'blur(15px)';

    const recordDetail = window.useRecordsData.records.list.find(item => item.id === id);
    const recordDetailEle = document.getElementsByClassName('record-detail-container')[0];
    // 处理弹窗中的数据
    const sdValues = getSdValues(recordDetail);
    replaceSDValue(sdValues);
    recordDetailEle.style.display = 'flex';
}

function hideSdValues() {
    sdAttributes.forEach(id => {
        const element = document.getElementById(id);
        element.innerHTML = '***';
    })
    const sdImgEle = document.getElementById('sd-imgurl');
    sdImgEle.src = "";

    // 设置图片下载链接
    const sdImgDownloadBtn = document.getElementById('sd-img-download');
    sdImgDownloadBtn.href = "";
}

function addRecordsDom(records) {
    const listContainerEle = document.getElementsByClassName('img-list')[0];
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < records.length; i++) {
        const recordItem = records[i];
        const { id, imgUrl } = recordItem;
        const imgItem = document.createElement('img');

        imgItem.src = imgUrl;
        imgItem.className = 'img-item';
        imgItem.setAttribute('record-id', id);
        imgItem.addEventListener('click', () => {
            showRecordDetail(id);
        })
        fragment.appendChild(imgItem);
    }
    listContainerEle.appendChild(fragment);
}

function removeRecordsDom() {
    const listContainerEle = document.getElementsByClassName('img-list')[0];
    listContainerEle.innerHTML = "";
}

function replaceRecordsNum(num) {
    const imgNumEle = document.getElementsByClassName('img-num')[0];
    imgNumEle.innerHTML = `共${num}张图片`;
}

async function queryRecords(page = 1) {
    const response = await fetch('/imageRecord/getCurUserRecordList',
        {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page,
                limit: 30
            })
        });
    const result = await response.json();
    return result.data;
}

/**
 * navigator.clipboard.writeText 在一些环境下可能无法工作。特别是，在一些旧的浏览器或在非安全（非HTTPS）的上下文中，这个API可能无法使用。这也是为什么我们需要一个后备方案的原因。
 *
 * document.execCommand('copy') 这个旧式的API也有它自己的局限。一些浏览器可能需要用户在复制操作发生时是处于激活状态（即，复制操作被触发是由用户的直接动作，如点击一个按钮，而非由其他脚本调用的结果）。如果不满足这个条件，复制操作可能会失败。
 * @returns {Promise<void>}
 */
async function copyPrompt() {
    try {
        const promptEle = document.getElementById('sd-prompt');
        await navigator.clipboard.writeText(promptEle.innerHTML);
        window.vt.info('复制成功');
    } catch (e) {
        const promptEle = document.getElementById('sd-prompt');

        var textArea = document.createElement("textarea");
        textArea.value = promptEle.innerHTML;
        textArea.style.position = 'fixed';  // 将textarea定位到固定位置
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        var copyInfo = document.querySelector('.record-detail-prompt-copy'); // 根据你的class选择元素
        try {
            var successful = document.execCommand('copy');
            if (successful) {
                copyInfo.classList.add("record-detail-prompt-copy-gray");
                setTimeout(function () {
                    copyInfo.classList.remove("record-detail-prompt-copy-gray");
                }, 500); // 延时500毫秒后移除CSS类
            }
        } catch (err) {
            console.error('复制失败', err);
        }

        document.body.removeChild(textArea);
    }
}

function closeDetailModal() {
    // 处理弹窗中的数据
    hideSdValues();
    const recordDetailEle = document.getElementsByClassName('record-detail-container')[0];
    recordDetailEle.style.display = 'none';

    // 取消高斯模糊
    const useRecordsEle = document.getElementsByClassName('records-container')[0];
    useRecordsEle.style.filter = 'none';
}

async function loadMoreRecords() {
    const { curPage, records } = window.useRecordsData;
    if (!curPage || curPage == 1) {
        // 打开作画记录页面时会触发loadmore, 再这个地方特殊处理一下
        return;
    }
    const newRecords = await queryRecords(curPage);
    window.useRecordsData.curPage = curPage + 1;
    window.useRecordsData.records.list = records.list.concat(newRecords.list);

    // 如果停留在这个列表页面时，正好新增了一条作画记录
    if (window.useRecordsData.records.total != newRecords.total) {
        replaceRecordsNum(records.total);
        window.useRecordsData.records.total = records.total;
    }

    addRecordsDom(newRecords.list);

    // 如果加载到底了 隐藏加载更多dom
    if (window.useRecordsData.records.list.length === records.total) {
        const recordsLoadMore = document.querySelector(".recordsLoadMore");
        recordsLoadMore.style.display = 'none';
    }
}

function closeUseRecords() {
    const tabsEle = document.getElementById('tabs');
    const quicksettingsEle = document.getElementById('quicksettings');
    const useRecordsEle = document.getElementsByClassName('records-container')[0];
    const recordsActiveTag = document.getElementsByClassName('record-active')[0];

    tabsEle.style.display = 'flex';
    quicksettingsEle.style.display = 'flex';
    useRecordsEle.style.display = 'none';
    recordsActiveTag.style.display = 'none';

    window.useRecordsData = {
        records: {},
        curPage: 1, // 
    };

    removeRecordsDom();
    cancelObserveScroll();
}

async function downloadImage() {
    const imageSrc = document.getElementById('sd-imgurl').src;
    console.log('imageSrc', imageSrc)
    const image = await fetch(imageSrc);
    const imageBlob = await image.blob();
    const imageURL = URL.createObjectURL(imageBlob);
    const imageName = imageSrc.split('/').pop();

    const link = document.createElement('a');
    link.href = imageURL;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener("DOMContentLoaded", function () {
    window.showUseRecords = showUseRecords;
    window.closeDetailModal = closeDetailModal;
    window.copyPrompt = copyPrompt;
    window.closeUseRecords = closeUseRecords;
    window.downloadImage = downloadImage;
})

