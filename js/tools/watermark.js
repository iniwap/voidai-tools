const { useState, useEffect, useRef, useCallback } = React;
const { Icon, Button, useToast, SectionHeader } = window.SharedComponents;

// === 核心算法模块 (移植自 watermarkEngine.js) ===
const WatermarkEngine = {
    masks: { 48: null, 96: null },

    // 初始化加载 Mask
    async init() {
        const load = (src) => new Promise(r => {
            const i = new Image();
            i.crossOrigin = "Anonymous";
            i.onload = () => r(i);
            i.onerror = () => r(null);
            i.src = src;
        });
        const [m48, m96] = await Promise.all([
            load('assets/watermark/bg_48.png'),
            load('assets/watermark/bg_96.png')
        ]);
        if (m48) this.masks[48] = this.getImageData(m48);
        if (m96) this.masks[96] = this.getImageData(m96);
        return !!(m48 || m96);
    },

    getImageData(img) {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height);
    },

    // 检测配置
    detectConfig(w, h) {
        if (w > 1024 && h > 1024) return { size: 96, margin: 64 };
        return { size: 48, margin: 32 }; // Default
    },

    // 计算 Alpha Map (max(r,g,b)/255)
    calculateAlphaMap(maskData) {
        const { width, height, data } = maskData;
        const map = new Float32Array(width * height);
        for (let i = 0; i < map.length; i++) {
            const idx = i * 4;
            const maxVal = Math.max(data[idx], data[idx + 1], data[idx + 2]);
            map[i] = maxVal / 255.0;
        }
        return map;
    },

    // 反向混合 (Reverse Alpha Blending)
    process(img) {
        const cvs = document.createElement('canvas');
        cvs.width = img.naturalWidth; cvs.height = img.naturalHeight;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
        const { size, margin } = this.detectConfig(cvs.width, cvs.height);

        const maskImgData = this.masks[size];
        if (!maskImgData) throw new Error(`Missing mask for size ${size}`);

        const alphaMap = this.calculateAlphaMap(maskImgData);

        // Watermark Position (Bottom Right)
        // 注意：原项目逻辑可能有 Margin，这里严格对标
        // 假设水印在右下角：
        // const startX = cvs.width - size - (margin / 2); // 需根据实际图片微调，通常 Gemni 是固定的
        // 简单处理：尝试匹配右下角
        const startX = cvs.width - size - 24; // 经验值 24px padding
        const startY = cvs.height - size - 24;

        const data = imageData.data;
        const threshold = 0.002;
        const maxAlpha = 0.99;
        const logoVal = 255; // White

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const gx = startX + x;
                const gy = startY + y;
                if (gx < 0 || gy < 0 || gx >= cvs.width || gy >= cvs.height) continue;

                const imgIdx = (gy * cvs.width + gx) * 4;
                const maskIdx = y * size + x;
                let alpha = alphaMap[maskIdx];

                if (alpha < threshold) continue;
                alpha = Math.min(alpha, maxAlpha);
                const oneMinusAlpha = 1.0 - alpha;

                for (let c = 0; c < 3; c++) {
                    const original = (data[imgIdx + c] - alpha * logoVal) / oneMinusAlpha;
                    data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)));
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return cvs.toDataURL('image/png');
    }
};

// === UI 组件 ===
const WatermarkTool = () => {
    const [files, setFiles] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [status, setStatus] = useState('loading'); // loading, ready, error
    const [isComparing, setIsComparing] = useState(false);
    const fileInputRef = useRef(null);
    const toast = useToast();

    useEffect(() => {
        WatermarkEngine.init().then(ok => setStatus(ok ? 'ready' : 'error'));
    }, []);

    const processItem = useCallback(async (fileObj) => {
        setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'processing' } : f));

        // Yield to UI
        await new Promise(r => setTimeout(r, 50));

        try {
            const img = await new Promise((r, j) => {
                const i = new Image();
                i.onload = () => r(i);
                i.onerror = j;
                i.src = fileObj.original;
            });

            const resultUrl = WatermarkEngine.process(img);

            setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, result: resultUrl, status: 'done' } : f));
            if (!selectedId) setSelectedId(fileObj.id);

        } catch (e) {
            console.error(e);
            toast("处理失败: " + e.message, "error");
            setFiles(p => p.map(f => f.id === fileObj.id ? { ...f, status: 'error' } : f));
        }
    }, [selectedId]);

    const handleUpload = (e) => {
        const newFiles = Array.from(e.target.files).map(f => ({
            id: Math.random().toString(36).slice(2),
            file: f,
            original: URL.createObjectURL(f),
            status: 'pending'
        }));
        setFiles(p => [...p, ...newFiles]);
        newFiles.forEach(processItem);
        if (!selectedId && newFiles.length) setSelectedId(newFiles[0].id);
        e.target.value = '';
    };

    const activeFile = files.find(f => f.id === selectedId) || files[files.length - 1];

    if (status === 'loading') return <div className="flex justify-center items-center h-full text-slate-500">正在加载水印引擎...</div>;
    if (status === 'error') return <div className="flex justify-center items-center h-full text-red-400">错误：缺少水印掩码文件 (assets/watermark/bg_48.png)</div>;

    return (
        <div className="flex h-full gap-6 animate-enter">
            {/* 左侧：上传列表 */}
            <div className="w-80 flex flex-col flex-shrink-0 h-full">
                <div className="glass-panel p-4 rounded-2xl flex flex-col h-full overflow-hidden">
                    <SectionHeader title="任务队列" icon="layers" />

                    <div
                        onClick={() => fileInputRef.current.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl p-6 text-center cursor-pointer mb-4 transition-all group shrink-0"
                    >
                        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
                        <Icon name="upload-cloud" size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-indigo-400" />
                        <p className="text-xs font-bold text-slate-300">点击 / 拖拽上传</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {files.map(f => (
                            <div key={f.id} onClick={() => setSelectedId(f.id)} className={`p-2.5 rounded-lg flex items-center gap-3 cursor-pointer border transition-all ${selectedId === f.id ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}>
                                <img src={f.result || f.original} className="w-10 h-10 rounded object-cover bg-slate-900" />
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs truncate ${selectedId === f.id ? 'text-white' : 'text-slate-400'}`}>{f.file.name}</p>
                                    <p className="text-[10px] text-slate-600">
                                        {f.status === 'done' ? <span className="text-green-400">完成</span> : f.status === 'processing' ? '处理中...' : '等待中'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧：预览工作台 */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                <div className="glass-panel p-6 rounded-2xl h-full flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-white font-bold flex items-center gap-2"><Icon name="image" className="text-indigo-400" /> 效果预览</h3>
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
                                    <Button variant="primary" icon="download">下载结果</Button>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* 16:9 居中预览容器 */}
                    <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden bg-checkerboard">
                        {activeFile ? (
                            <img
                                src={isComparing ? activeFile.original : (activeFile.result || activeFile.original)}
                                className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-100"
                            />
                        ) : (
                            <div className="text-slate-600 flex flex-col items-center">
                                <Icon name="image" size={48} className="mb-4 opacity-20" />
                                <p>请选择图片查看</p>
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