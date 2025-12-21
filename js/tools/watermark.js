const { useState, useEffect, useRef, useCallback } = React;
const { Icon, Button, SectionHeader } = window.SharedComponents;

const WatermarkTool = () => {
    const [files, setFiles] = useState([]);
    const [masks, setMasks] = useState({ 48: null, 96: null });
    const [status, setStatus] = useState('idle');
    const [selectedId, setSelectedId] = useState(null);
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
            });
    }, []);

    // 核心算法 (修复版)
    const processImage = useCallback(async (fileObj) => {
        setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));

        try {
            // 1. 加载原图
            const img = await new Promise((resolve) => {
                const i = new Image(); i.onload = () => resolve(i); i.src = fileObj.original;
            });

            // 2. 准备画布
            const cvs = document.createElement('canvas');
            cvs.width = img.naturalWidth; cvs.height = img.naturalHeight;
            const ctx = cvs.getContext('2d');

            // 3. 匹配 Mask
            let mask = masks[48];
            if (img.naturalWidth > 2048 && masks[96]) mask = masks[96];
            if (!mask && masks[96]) mask = masks[96];

            // 如果没有 Mask，直接返回原图（避免报错）
            if (!mask) {
                console.warn("No mask found, skipping processing");
                setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, result: fileObj.original, status: 'done' } : f));
                return;
            }

            // 4. 绘制原图
            ctx.drawImage(img, 0, 0);
            const iData = ctx.getImageData(0, 0, cvs.width, cvs.height);

            // 5. 绘制 Mask 获取 Alpha
            const mCvs = document.createElement('canvas');
            mCvs.width = mask.naturalWidth; mCvs.height = mask.naturalHeight;
            const mCtx = mCvs.getContext('2d'); mCtx.drawImage(mask, 0, 0);
            const mData = mCtx.getImageData(0, 0, mCvs.width, mCvs.height).data;

            // 6. 像素迭代 (修复数学公式)
            const pad = 24;
            const startX = cvs.width - mCvs.width - pad;
            const startY = cvs.height - mCvs.height - pad;

            for (let y = 0; y < mCvs.height; y++) {
                for (let x = 0; x < mCvs.width; x++) {
                    const gx = startX + x, gy = startY + y;
                    if (gx < 0 || gy < 0 || gx >= cvs.width || gy >= cvs.height) continue;

                    const idx = (gy * cvs.width + gx) * 4;
                    const mIdx = (y * mCvs.width + x) * 4;

                    // Alpha 从 Mask 的 Alpha 通道获取 (0-255) -> (0-1)
                    let alpha = mData[mIdx + 3] / 255.0;

                    // 阈值保护，防止除以0或过度补偿
                    if (alpha < 0.02) continue;
                    if (alpha > 0.95) alpha = 0.95;

                    // 反算公式: Original = (Composite - Watermark*Alpha) / (1 - Alpha)
                    // 假设水印是纯白 (255,255,255)
                    for (let c = 0; c < 3; c++) {
                        let val = (iData.data[idx + c] - 255 * alpha) / (1 - alpha);
                        // 关键：Clamp 防止溢出变黑
                        iData.data[idx + c] = Math.max(0, Math.min(255, val));
                    }
                }
            }

            ctx.putImageData(iData, 0, 0);

            cvs.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, result: url, status: 'done' } : f));
                if (!selectedId) setSelectedId(fileObj.id);
            }, 'image/png');

        } catch (e) {
            console.error(e);
            setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
        }
    }, [masks, selectedId]);

    const handleUpload = (e) => {
        const newFiles = Array.from(e.target.files).map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            original: URL.createObjectURL(f),
            status: 'pending'
        }));
        setFiles(p => [...p, ...newFiles]);
        newFiles.forEach(processImage);
        if (!selectedId && newFiles.length > 0) setSelectedId(newFiles[0].id);
        e.target.value = '';
    };

    const activeFile = files.find(f => f.id === selectedId) || files[files.length - 1];

    return (
        <div className="flex h-full gap-6 animate-fade-in relative">
            {/* 左侧：列表与上传 (高度填满) */}
            <div className="w-80 flex flex-col gap-4 flex-shrink-0 h-full">
                <div className="glass-panel p-4 rounded-2xl flex flex-col h-full overflow-hidden">
                    <SectionHeader title="处理队列" icon="layers" rightAction={<span className="text-xs text-slate-500">{files.length} items</span>} />

                    {/* Upload Button */}
                    <div onClick={() => fileInputRef.current.click()} className="flex-shrink-0 border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl p-6 text-center cursor-pointer mb-4 group transition-all">
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
                        <Icon name="upload-cloud" size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-indigo-400" />
                        <span className="text-xs font-bold text-slate-300">添加图片</span>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {files.map(f => (
                            <div key={f.id} onClick={() => setSelectedId(f.id)} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer border transition-all ${selectedId === f.id ? 'bg-slate-800 border-indigo-500/50 shadow-md' : 'bg-transparent border-transparent hover:bg-slate-800/30'}`}>
                                <img src={f.result || f.original} className="w-10 h-10 rounded object-cover bg-slate-900 border border-slate-700" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${selectedId === f.id ? 'text-white' : 'text-slate-400'}`}>{f.file.name}</p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">{f.status === 'done' ? '处理完成' : f.status === 'processing' ? '处理中...' : '等待中'}</p>
                                </div>
                                {f.status === 'done' && <Icon name="check-circle" size={14} className="text-green-500" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧：预览区 (高度填满，内容居中) */}
            <div className="flex-1 flex flex-col h-full min-w-0">
                <div className="glass-panel rounded-2xl flex-1 p-6 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Icon name="image" size={18} className="text-indigo-400" /> 效果预览
                        </h3>
                        {activeFile?.status === 'done' && (
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onMouseDown={() => setIsComparing(true)}
                                    onMouseUp={() => setIsComparing(false)}
                                    onMouseLeave={() => setIsComparing(false)}
                                    icon="eye"
                                >按住对比</Button>
                                <a href={activeFile.result} download={`clean_${activeFile.file.name}`}>
                                    <Button variant="primary" icon="download">保存</Button>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* 预览容器：保持 16:9 比例或自适应填满，居中显示 */}
                    <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden bg-checkerboard">
                        {activeFile ? (
                            <>
                                <img
                                    src={isComparing ? activeFile.original : (activeFile.result || activeFile.original)}
                                    className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-200"
                                    style={{ transform: isComparing ? 'scale(0.98)' : 'scale(1)' }}
                                />
                                {activeFile.status === 'done' && (
                                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 pointer-events-none">
                                        {isComparing ? '原始图片 (ORIGINAL)' : '处理结果 (CLEANED)'}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-slate-600 flex flex-col items-center">
                                <Icon name="layers" size={48} className="mb-4 opacity-20" />
                                <p>请选择图片开始</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.WatermarkTool = WatermarkTool;