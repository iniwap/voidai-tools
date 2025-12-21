const { useState, useEffect, useRef, useCallback } = React;
const { Icon, Button, SectionTitle } = window.SharedComponents;

const WatermarkTool = () => {
    const [files, setFiles] = useState([]);
    const [masks, setMasks] = useState({ 48: null, 96: null });
    const [status, setStatus] = useState('idle');
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [isComparing, setIsComparing] = useState(false);
    const fileInputRef = useRef(null);

    // 资源加载
    useEffect(() => {
        const load = (src) => new Promise((resolve) => {
            const img = new Image(); img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src;
        });
        Promise.all([load('assets/watermark/bg_48.png'), load('assets/watermark/bg_96.png')])
            .then(([r48, r96]) => {
                const m = {};
                if (r48) m[48] = r48; if (r96) m[96] = r96;
                setMasks(m);
                setStatus(Object.keys(m).length ? 'ready' : 'error');
            });
    }, []);

    // 核心处理逻辑 (防抖 + 状态管理)
    const processImage = useCallback(async (fileObj) => {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));
        await new Promise(r => setTimeout(r, 100)); // UI 渲染缓冲

        try {
            const img = await new Promise((resolve, reject) => {
                const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = fileObj.original;
            });

            const cvs = document.createElement('canvas');
            cvs.width = img.naturalWidth; cvs.height = img.naturalHeight;
            const ctx = cvs.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);

            // 智能选择 Mask
            let mask = masks[48];
            if (img.naturalWidth > 2048 && masks[96]) mask = masks[96];
            if (!mask && masks[96]) mask = masks[96];
            if (!mask) throw new Error("缺少 Mask 资源");

            // 绘制 Mask
            const mCvs = document.createElement('canvas');
            mCvs.width = mask.naturalWidth; mCvs.height = mask.naturalHeight;
            const mCtx = mCvs.getContext('2d'); mCtx.drawImage(mask, 0, 0);
            const mData = mCtx.getImageData(0, 0, mCvs.width, mCvs.height).data;
            const iData = ctx.getImageData(0, 0, cvs.width, cvs.height);

            const pad = 24;
            const startX = cvs.width - mCvs.width - pad;
            const startY = cvs.height - mCvs.height - pad;

            // 像素反算
            for (let y = 0; y < mCvs.height; y++) {
                for (let x = 0; x < mCvs.width; x++) {
                    let gx = startX + x, gy = startY + y;
                    if (gx >= cvs.width || gy >= cvs.height) continue;
                    const idx = (gy * cvs.width + gx) * 4;
                    const mIdx = (y * mCvs.width + x) * 4;

                    let alpha = mData[mIdx + 3] / 255.0;
                    if (alpha < 0.01) continue;
                    if (alpha > 0.95) alpha = 0.95;

                    for (let c = 0; c < 3; c++) {
                        // Formula: Original = (Composite - Watermark * alpha) / (1 - alpha)
                        // Assuming watermark is white (255)
                        iData.data[idx + c] = Math.min(255, Math.max(0, (iData.data[idx + c] - 255 * alpha) / (1 - alpha)));
                    }
                }
            }
            ctx.putImageData(iData, 0, 0);

            cvs.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, result: url, status: 'done' } : f));
                // 如果是第一张图，自动选中
                if (!selectedFileId) setSelectedFileId(fileObj.id);
            }, 'image/png');

        } catch (e) {
            console.error(e);
            setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
        }
    }, [masks, selectedFileId]);

    const handleUpload = (e) => {
        const newFiles = Array.from(e.target.files).map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            original: URL.createObjectURL(f),
            status: 'pending'
        }));
        setFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(processImage);
        if (newFiles.length > 0 && !selectedFileId) setSelectedFileId(newFiles[0].id);
        e.target.value = ''; // Reset input
    };

    // 当前选中的文件对象
    const activeFile = files.find(f => f.id === selectedFileId) || files[0];

    return (
        <div className="flex h-full gap-6 animate-enter">
            {/* 左侧：列表与操作 */}
            <div className="w-80 flex flex-col gap-4 flex-shrink-0">
                <div className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
                    <SectionTitle icon="layers" title="任务列表" subtitle={`${files.filter(f => f.status === 'done').length}/${files.length} 完成`} />

                    <div
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl p-6 text-center cursor-pointer transition-all group"
                    >
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                            <Icon name="plus" className="text-indigo-400" />
                        </div>
                        <span className="text-xs text-slate-400">点击添加图片</span>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 min-h-[200px] max-h-[400px]">
                        {files.map(f => (
                            <div
                                key={f.id}
                                onClick={() => setSelectedFileId(f.id)}
                                className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer border transition-all ${selectedFileId === f.id ? 'bg-slate-800 border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}
                            >
                                <img src={f.original} className="w-10 h-10 rounded object-cover bg-slate-900" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-300 truncate">{f.file.name}</p>
                                    <p className="text-[10px] text-slate-500">
                                        {f.status === 'done' ? <span className="text-green-400">已处理</span> : f.status === 'processing' ? <span className="text-indigo-400">处理中...</span> : '等待中'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧：预览工作台 */}
            <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden">
                {activeFile ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Icon name="image" size={18} className="text-indigo-400" />
                                效果预览
                            </h3>
                            {activeFile.status === 'done' && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        onMouseDown={() => setIsComparing(true)}
                                        onMouseUp={() => setIsComparing(false)}
                                        onMouseLeave={() => setIsComparing(false)}
                                        icon="eye"
                                    >按住对比原图</Button>
                                    <a href={activeFile.result} download={`clean_${activeFile.file.name}`}>
                                        <Button variant="primary" icon="download">下载图片</Button>
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 flex items-center justify-center bg-checkerboard rounded-xl overflow-hidden border border-slate-800 relative">
                            {activeFile.status === 'done' ? (
                                <img
                                    src={isComparing ? activeFile.original : activeFile.result}
                                    className="max-w-full max-h-full object-contain shadow-2xl"
                                />
                            ) : (
                                <div className="flex flex-col items-center text-slate-500">
                                    <Icon name="loader-2" size={48} className="animate-spin mb-4 text-indigo-500" />
                                    <span>正在消除水印...</span>
                                </div>
                            )}

                            {/* 对比标签 */}
                            {activeFile.status === 'done' && (
                                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-white border border-white/10">
                                    {isComparing ? 'Original (原图)' : 'Cleaned (去水印)'}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <Icon name="layers" size={64} className="mb-4 opacity-20" />
                        <p>请在左侧上传图片开始处理</p>
                    </div>
                )}
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.WatermarkTool = WatermarkTool;