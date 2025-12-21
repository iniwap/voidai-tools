const { useState, useEffect, useRef, useCallback } = React;
const { Icon, Button, useToast, SectionHeader } = window.SharedComponents;

// === 核心算法 (源自您上传的 watermarkEngine.js + alphaMap.js + blendModes.js) ===
const WatermarkCore = {
    masks: { 48: null, 96: null },

    async init() {
        const load = (src) => new Promise(r => { const i = new Image(); i.crossOrigin = "Anonymous"; i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
        const [m48, m96] = await Promise.all([load('assets/watermark/bg_48.png'), load('assets/watermark/bg_96.png')]);
        if (m48) this.masks[48] = this.getImgData(m48);
        if (m96) this.masks[96] = this.getImgData(m96);
        return !!(m48 || m96);
    },

    getImgData(img) {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height);
    },

    // 算法核心：计算 Alpha Map (alphaMap.js)
    calculateAlphaMap(maskData) {
        const { width, height, data } = maskData;
        const alphaMap = new Float32Array(width * height);
        for (let i = 0; i < alphaMap.length; i++) {
            const idx = i * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            // Take max of RGB channels
            alphaMap[i] = Math.max(r, g, b) / 255.0;
        }
        return alphaMap;
    },

    // 算法核心：反向混合 (blendModes.js)
    removeWatermark(imageData, alphaMap, position) {
        const { x, y, width, height } = position;
        const threshold = 0.002;
        const maxAlpha = 0.99;
        const logoVal = 255; // White

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const imgIdx = ((y + row) * imageData.width + (x + col)) * 4;
                const alphaIdx = row * width + col;

                let alpha = alphaMap[alphaIdx];
                if (alpha < threshold) continue;
                alpha = Math.min(alpha, maxAlpha);
                const oneMinusAlpha = 1.0 - alpha;

                for (let c = 0; c < 3; c++) {
                    const watermarked = imageData.data[imgIdx + c];
                    const original = (watermarked - alpha * logoVal) / oneMinusAlpha;
                    imageData.data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
                }
            }
        }
    },

    process(img) {
        const cvs = document.createElement('canvas');
        cvs.width = img.naturalWidth; cvs.height = img.naturalHeight;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);

        // 配置检测 (watermarkEngine.js)
        const isLarge = cvs.width > 1024 && cvs.height > 1024;
        const size = isLarge ? 96 : 48;
        const margin = isLarge ? 64 : 32; // Gemini padding rule

        const maskData = this.masks[size];
        if (!maskData) throw new Error(`缺少 ${size}px Mask`);

        // 计算位置 (Bottom Right)
        const x = cvs.width - size - (margin / 2); // 严格对其原算法
        const y = cvs.height - size - (margin / 2);

        // 执行移除
        const alphaMap = this.calculateAlphaMap(maskData);
        this.removeWatermark(imageData, alphaMap, { x, y, width: size, height: size });

        ctx.putImageData(imageData, 0, 0);
        return cvs.toDataURL('image/png');
    }
};

const WatermarkTool = () => {
    const [files, setFiles] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [status, setStatus] = useState('loading');
    const [isComparing, setIsComparing] = useState(false);
    const fileInputRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        WatermarkCore.init().then(ok => setStatus(ok ? 'ready' : 'error'));
    }, []);

    const processItem = useCallback(async (fileObj) => {
        setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));
        await new Promise(r => setTimeout(r, 50));

        try {
            const img = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = fileObj.original; });
            const res = WatermarkCore.process(img);
            setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, result: res, status: 'done' } : f));
            if (!selectedId) setSelectedId(fileObj.id);
        } catch (e) {
            console.error(e);
            setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
            toast("处理失败: 请检查Mask文件", "error");
        }
    }, [selectedId]);

    const handleUpload = (e) => {
        const newFiles = Array.from(e.target.files || e.dataTransfer.files).map(f => ({
            id: Math.random().toString(36).slice(2),
            file: f,
            original: URL.createObjectURL(f),
            status: 'pending'
        }));
        setFiles(p => [...p, ...newFiles]);
        newFiles.forEach(processItem);
        if (!selectedId && newFiles.length) setSelectedId(newFiles[0].id);
        if (e.target) e.target.value = '';
    };

    const activeFile = files.find(f => f.id === selectedId) || files[files.length - 1];

    if (status === 'error') return <div className="h-full flex items-center justify-center text-red-400">错误：缺少 assets/watermark/bg_48.png</div>;

    return (
        <div className="flex h-full gap-6 animate-enter" onDragOver={e => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleUpload(e); }}>
            {/* 左侧：列表 */}
            <div className="w-80 flex flex-col flex-shrink-0 h-full">
                <div className="glass-panel p-4 rounded-2xl flex flex-col h-full overflow-hidden">
                    <SectionHeader title="任务队列" icon="layers" />
                    <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl p-6 text-center cursor-pointer mb-4 transition-all group shrink-0">
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
                        <Icon name="upload-cloud" size={28} className="mx-auto mb-2 text-slate-400 group-hover:text-indigo-400" />
                        <p className="text-xs font-bold text-slate-300">点击 / 拖拽上传</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {files.map(f => (
                            <div key={f.id} onClick={() => setSelectedId(f.id)} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer border transition-all ${selectedId === f.id ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}>
                                <img src={f.result || f.original} className="w-10 h-10 rounded object-cover bg-slate-900 border border-slate-700" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs truncate font-medium ${selectedId === f.id ? 'text-white' : 'text-slate-400'}`}>{f.file.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{f.status === 'done' ? '完成' : f.status === 'processing' ? '处理中...' : '等待'}</p>
                                </div>
                                {f.status === 'done' && <Icon name="check" size={14} className="text-green-400" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧：预览 */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <div className="glass-panel p-6 rounded-2xl h-full flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-white font-bold flex items-center gap-2"><Icon name="image" className="text-indigo-400" /> 效果预览</h3>
                        {activeFile?.status === 'done' && (
                            <div className="flex gap-2">
                                <Button variant="secondary" icon="eye" onMouseDown={() => setIsComparing(true)} onMouseUp={() => setIsComparing(false)} onMouseLeave={() => setIsComparing(false)}>按住对比</Button>
                                <a href={activeFile.result} download={`clean_${activeFile.file.name}`}><Button variant="primary" icon="download">保存</Button></a>
                            </div>
                        )}
                    </div>
                    <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden bg-checkerboard">
                        {activeFile ? (
                            <>
                                <img src={isComparing ? activeFile.original : (activeFile.result || activeFile.original)} className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-100" />
                                {activeFile.status === 'done' && <div className="absolute top-4 left-4 bg-black/80 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10">{isComparing ? '原图' : '去水印结果'}</div>}
                            </>
                        ) : <div className="text-slate-600 flex flex-col items-center"><Icon name="image" size={48} className="mb-4 opacity-20" /><p>请选择图片</p></div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.WatermarkTool = WatermarkTool;