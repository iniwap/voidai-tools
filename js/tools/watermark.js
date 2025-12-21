const { useState, useEffect, useRef, useCallback } = React;
const { Icon, Button } = window.SharedComponents;

const WatermarkTool = () => {
    const [files, setFiles] = useState([]);
    const [masks, setMasks] = useState({ 48: null, 96: null });
    const [status, setStatus] = useState('loading_assets');
    const fileInputRef = useRef(null);

    // 1. 预加载 Mask
    useEffect(() => {
        const load = (src) => new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject();
            img.src = src;
        });
        Promise.allSettled([load('assets/watermark/bg_48.png'), load('assets/watermark/bg_96.png')])
            .then(([r48, r96]) => {
                const m = {};
                if (r48.status === 'fulfilled') m[48] = r48.value;
                if (r96.status === 'fulfilled') m[96] = r96.value;
                setMasks(m);
                setStatus(Object.keys(m).length ? 'ready' : 'error_assets');
            });
    }, []);

    // 2. 核心处理 (无损反算)
    const processImage = useCallback(async (fileObj) => {
        // 更新状态为处理中
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));

        // 强制微小延时，让 React 有机会渲染 "处理中" UI
        await new Promise(r => setTimeout(r, 50));

        try {
            const img = await new Promise((resolve, reject) => {
                const i = new Image();
                i.onload = () => resolve(i);
                i.onerror = reject;
                i.src = fileObj.original;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);

            // Mask 匹配逻辑
            let mask = masks[48];
            if (img.naturalWidth > 2048 && masks[96]) mask = masks[96];
            if (!mask && masks[96]) mask = masks[96];
            if (!mask) throw new Error("Mask asset missing");

            const mCanvas = document.createElement('canvas');
            mCanvas.width = mask.naturalWidth; mCanvas.height = mask.naturalHeight;
            const mCtx = mCanvas.getContext('2d'); mCtx.drawImage(mask, 0, 0);
            const mData = mCtx.getImageData(0, 0, mask.naturalWidth, mask.naturalHeight).data;
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const pad = 24;
            const startX = canvas.width - mask.naturalWidth - pad;
            const startY = canvas.height - mask.naturalHeight - pad;

            // 像素反算
            for (let y = 0; y < mask.naturalHeight; y++) {
                for (let x = 0; x < mask.naturalWidth; x++) {
                    let gX = startX + x, gY = startY + y;
                    if (gX >= canvas.width || gY >= canvas.height) continue;
                    const idx = (gY * canvas.width + gX) * 4;
                    const mIdx = (y * mask.naturalWidth + x) * 4;
                    let alpha = mData[mIdx + 3] / 255.0;
                    if (alpha < 0.01) continue;
                    if (alpha > 0.95) alpha = 0.95;
                    for (let c = 0; c < 3; c++) {
                        imgData.data[idx + c] = Math.min(255, Math.max(0, (imgData.data[idx + c] - 255 * alpha) / (1 - alpha)));
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);

            canvas.toBlob(blob => {
                const resultUrl = URL.createObjectURL(blob);
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, result: resultUrl, status: 'done' } : f));
            }, 'image/png');

        } catch (e) {
            console.error("Watermark processing error:", e);
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
        }
    }, [masks]);

    // 3. 文件添加与队列管理
    const addFiles = useCallback((fileList) => {
        const newFiles = Array.from(fileList).map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            original: URL.createObjectURL(f),
            status: 'pending'
        }));
        setFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(f => processImage(f));
    }, [processImage]);

    // 4. 拖拽事件处理
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    return (
        <div
            className="h-full flex flex-col p-4 md:p-6"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
        >
            {/* 上传区域 */}
            <div className="flex-shrink-0 mb-6">
                <div
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-void-700 hover:border-blue-500 bg-void-900/50 hover:bg-void-800 transition-all rounded-2xl p-8 text-center cursor-pointer group relative"
                >
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
                    <div className="w-16 h-16 bg-void-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-900/10">
                        <Icon name="upload-cloud" size={32} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">点击或拖拽上传图片</h3>
                    <p className="text-sm text-void-400">支持批量处理 • 自动识别 Mask • 无损还原</p>

                    {status === 'error_assets' && (
                        <div className="absolute top-4 right-4 text-red-400 text-xs font-mono bg-red-900/20 py-1 px-2 rounded flex items-center gap-1">
                            <Icon name="alert-triangle" size={12} /> 缺少 assets/watermark/bg_48.png
                        </div>
                    )}
                </div>
            </div>

            {/* 结果网格 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                {files.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-10">
                        {files.map(f => (
                            <div key={f.id} className="relative aspect-square bg-void-800 rounded-xl overflow-hidden border border-void-700 group hover:border-blue-500 transition-colors">
                                {/* 图片展示 (原图或结果) */}
                                <img src={f.result || f.original} className="w-full h-full object-cover checkerboard" />

                                {/* 状态角标 */}
                                <div className="absolute top-2 left-2 z-10">
                                    {f.status === 'processing' && <span className="bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded-full animate-pulse">处理中...</span>}
                                    {f.status === 'done' && <span className="bg-green-600/90 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1"><Icon name="check" size={10} /> 完成</span>}
                                    {f.status === 'error' && <span className="bg-red-600/90 text-white text-[10px] px-2 py-1 rounded-full">失败</span>}
                                </div>

                                {/* 悬停操作层 */}
                                {f.status === 'done' && (
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                        <a
                                            href={f.result}
                                            download={`clean_${f.file.name}`}
                                            onClick={e => e.stopPropagation()}
                                            className="p-3 bg-white text-black rounded-full hover:scale-110 transition shadow-xl"
                                            title="下载处理后的图片"
                                        >
                                            <Icon name="download" size={20} />
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-void-700 select-none">
                        <Icon name="images" size={64} className="mb-4 opacity-20" />
                        <p>暂无图片</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// 挂载到全局
window.Tools = window.Tools || {};
window.Tools.WatermarkTool = WatermarkTool;