const { useState, useEffect, useRef, useCallback } = React;
const { Icon, Button, useToast } = window.SharedComponents;

const WatermarkTool = () => {
    const [files, setFiles] = useState([]);
    const [masks, setMasks] = useState({ 48: null, 96: null });
    const [status, setStatus] = useState('idle');
    const [selectedId, setSelectedId] = useState(null);
    const [isComparing, setIsComparing] = useState(false);
    const fileInputRef = useRef(null);
    const toast = useToast();

    // 加载掩码
    useEffect(() => {
        const load = (src) => new Promise(r => { const i = new Image(); i.crossOrigin = "Anonymous"; i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
        Promise.all([load('assets/watermark/bg_48.png'), load('assets/watermark/bg_96.png')]).then(([m48, m96]) => {
            if (m48 || m96) {
                setMasks({ 48: m48, 96: m96 });
                setStatus('ready');
            } else {
                setStatus('error');
                toast("Mask资源加载失败", "error");
            }
        });
    }, []);

    // 核心算法：严格对标原版
    const processImage = useCallback(async (fileObj) => {
        setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));

        try {
            const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = fileObj.original; });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // 1. Draw Original
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            // 2. Select Mask
            let mask = masks[48];
            if (img.naturalWidth > 2048 && masks[96]) mask = masks[96];
            if (!mask && masks[96]) mask = masks[96];
            if (!mask) throw new Error("No mask found");

            // 3. Prepare Mask Data
            const mCvs = document.createElement('canvas');
            mCvs.width = mask.naturalWidth; mCvs.height = mask.naturalHeight;
            const mCtx = mCvs.getContext('2d'); mCtx.drawImage(mask, 0, 0);
            const maskData = mCtx.getImageData(0, 0, mCvs.width, mCvs.height).data;

            // 4. Pixel Logic (Strict Implementation)
            const padding = 24; // Standard padding for Gemini watermarks
            const startX = canvas.width - mask.naturalWidth - padding;
            const startY = canvas.height - mask.naturalHeight - padding;

            const mW = mask.naturalWidth;
            const mH = mask.naturalHeight;
            const W = canvas.width;

            for (let y = 0; y < mH; y++) {
                for (let x = 0; x < mW; x++) {
                    const globalX = startX + x;
                    const globalY = startY + y;

                    if (globalX >= 0 && globalX < W && globalY >= 0 && globalY < canvas.height) {
                        const iIdx = (globalY * W + globalX) * 4;
                        const mIdx = (y * mW + x) * 4;

                        // 获取 Alpha (假设 Mask 图片本身带有透明度，或者是纯黑白图作为Alpha)
                        // 原版 bg_48.png 是带 Alpha 通道的白色图片
                        let alpha = maskData[mIdx + 3] / 255.0;

                        // 关键：防止过度修正
                        if (alpha < 0.02) continue; // 忽略几乎透明的区域
                        if (alpha > 0.95) alpha = 0.95; // 钳制最大 Alpha，防止分母为 0

                        // Formula: Original = (Composite - Watermark * alpha) / (1 - alpha)
                        // Gemini Watermark Color is White (255, 255, 255)
                        const wColor = 255;

                        for (let c = 0; c < 3; c++) {
                            let original = (data[iIdx + c] - wColor * alpha) / (1 - alpha);
                            data[iIdx + c] = Math.min(255, Math.max(0, original));
                        }
                    }
                }
            }

            ctx.putImageData(imgData, 0, 0);

            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, result: url, status: 'done' } : f));
                if (!selectedId) setSelectedId(fileObj.id);
            });

        } catch (e) {
            console.error(e);
            toast("处理失败", "error");
            setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
        }
    }, [masks, selectedId, toast]);

    const handleUpload = (e) => {
        const newFiles = Array.from(e.target.files).map(f => ({
            id: Math.random().toString(36).slice(2),
            file: f,
            original: URL.createObjectURL(f),
            status: 'pending'
        }));
        setFiles(p => [...p, ...newFiles]);
        newFiles.forEach(processImage);
        if (!selectedId && newFiles.length) setSelectedId(newFiles[0].id);
        e.target.value = '';
    };

    const activeFile = files.find(f => f.id === selectedId) || files[files.length - 1];

    return (
        <div className="flex h-full gap-6 animate-fade-in">
            {/* 左侧：列表 (Flex-col 填满高度) */}
            <div className="w-80 flex flex-col gap-4 flex-shrink-0 h-full">
                <div className="glass-panel p-4 rounded-2xl flex flex-col h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                        <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2"><Icon name="layers" className="text-indigo-400" /> 任务队列</h3>
                        <span className="text-xs text-slate-500">{files.length}</span>
                    </div>

                    <label className="flex-shrink-0 border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl p-4 text-center cursor-pointer mb-4 transition-all group">
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
                        <Icon name="plus" className="text-slate-400 group-hover:text-indigo-400 mx-auto mb-1" />
                        <span className="text-xs font-bold text-slate-300">添加图片</span>
                    </label>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {files.map(f => (
                            <div key={f.id} onClick={() => setSelectedId(f.id)} className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer border transition-all ${selectedId === f.id ? 'bg-indigo-600/20 border-indigo-500/50' : 'border-transparent hover:bg-slate-800/50'}`}>
                                <img src={f.result || f.original} className="w-10 h-10 rounded object-cover bg-slate-900" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs truncate ${selectedId === f.id ? 'text-white' : 'text-slate-400'}`}>{f.file.name}</p>
                                    <p className="text-[10px] text-slate-600">{f.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧：预览 (Flex-col, 16:9 容器) */}
            <div className="flex-1 flex flex-col h-full min-w-0 glass-panel rounded-2xl p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2"><Icon name="image" className="text-indigo-400" /> 效果预览</h3>
                    {activeFile?.status === 'done' && (
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onMouseDown={() => setIsComparing(true)}
                                onMouseUp={() => setIsComparing(false)}
                                onMouseLeave={() => setIsComparing(false)}
                                icon="eye"
                            >按住对比</Button>
                            <a href={activeFile.result} download={`clean_${activeFile.file.name}`}><Button variant="primary" icon="download">下载</Button></a>
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden bg-checkerboard">
                    {activeFile ? (
                        <img
                            src={isComparing ? activeFile.original : (activeFile.result || activeFile.original)}
                            className="max-w-full max-h-full object-contain shadow-2xl transition-opacity duration-200"
                        />
                    ) : (
                        <div className="text-slate-600 flex flex-col items-center">
                            <Icon name="image" size={48} className="mb-4 opacity-20" />
                            <p>请选择图片</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.WatermarkTool = WatermarkTool;