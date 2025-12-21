const { useState, useEffect, useRef } = React;
const { Icon, Button, SectionTitle } = window.SharedComponents;

const MeMakerTool = () => {
    const [mode, setMode] = useState('prompt'); // prompt, cutter, animator
    const [toast, setToast] = useState(null);

    // --- State: Cutter ---
    const [cutterRaw, setCutterRaw] = useState(null);
    const [slices, setSlices] = useState([]);
    const [cutCols, setCutCols] = useState(6);
    const [cutRows, setCutRows] = useState(4);

    // --- State: Animator ---
    const [animRaw, setAnimRaw] = useState(null);
    const [animRes, setAnimRes] = useState(null);
    const [animCols, setAnimCols] = useState(6);
    const [animRows, setAnimRows] = useState(4);
    const [fps, setFps] = useState(12);
    const [isGenerating, setIsGenerating] = useState(false);
    const [workerUrl, setWorkerUrl] = useState(null);

    // Init Worker
    useEffect(() => {
        fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
            .then(r => r.text())
            .then(t => setWorkerUrl(URL.createObjectURL(new Blob([t], { type: 'application/javascript' }))))
            .catch(e => console.error("GIF Worker Failed", e));
    }, []);

    // Helpers
    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
    const copyText = (text) => { navigator.clipboard.writeText(text); showToast("已复制到剪贴板"); };

    // --- Logic: Cutter ---
    const handleCutUpload = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (evt) => {
            const i = new Image();
            i.onload = () => { setCutterRaw(i); };
            i.src = evt.target.result;
        };
        r.readAsDataURL(f);
    };

    useEffect(() => {
        if (!cutterRaw) return;
        // 切图算法
        const cellW = cutterRaw.width / cutCols;
        const cellH = cutterRaw.height / cutRows;
        const size = Math.min(cellW, cellH);
        const startX = (cellW - size) / 2;
        const startY = (cellH - size) / 2;

        const cvs = document.createElement('canvas');
        cvs.width = size; cvs.height = size;
        const ctx = cvs.getContext('2d');
        const temp = [];

        for (let r = 0; r < cutRows; r++) {
            for (let c = 0; c < cutCols; c++) {
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(cutterRaw, c * cellW + startX, r * cellH + startY, size, size, 0, 0, size, size);
                temp.push(cvs.toDataURL('image/png'));
            }
        }
        setSlices(temp);
    }, [cutterRaw, cutCols, cutRows]);

    const downloadZip = async () => {
        if (!slices.length) return;
        const zip = new JSZip();
        const folder = zip.folder("emojis");
        slices.forEach((s, i) => folder.file(`emoji_${i + 1}.png`, s.split(',')[1], { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "emojis.zip";
        link.click();
    };

    // --- Logic: Animator ---
    const handleAnimUpload = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (evt) => {
            const i = new Image();
            i.onload = () => { setAnimRaw(i); setAnimRes(null); };
            i.src = evt.target.result;
        };
        r.readAsDataURL(f);
    };

    const generateGif = () => {
        if (!animRaw || !workerUrl) return;
        setIsGenerating(true);
        const size = 300; // GIF Output Size
        const cvs = document.createElement('canvas');
        cvs.width = size; cvs.height = size;
        const ctx = cvs.getContext('2d');

        const gif = new GIF({ workers: 2, quality: 10, width: size, height: size, workerScript: workerUrl, transparent: 0x00000000 });

        const cellW = animRaw.width / animCols;
        const cellH = animRaw.height / animRows;
        const cropSize = Math.min(cellW, cellH);
        const startX = (cellW - cropSize) / 2;
        const startY = (cellH - cropSize) / 2;
        const total = animCols * animRows;

        let frame = 0;
        for (let r = 0; r < animRows; r++) {
            for (let c = 0; c < animCols; c++) {
                if (frame >= total) break;
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(animRaw, c * cellW + startX, r * cellH + startY, cropSize, cropSize, 0, 0, size, size);
                gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
                frame++;
            }
        }
        gif.on('finished', blob => { setAnimRes(URL.createObjectURL(blob)); setIsGenerating(false); });
        gif.render();
    };

    return (
        <div className="flex flex-col h-full animate-enter">
            {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold animate-enter">{toast}</div>}

            {/* Mode Switcher */}
            <div className="flex justify-center mb-6">
                <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-700 flex gap-1 shadow-lg">
                    {[
                        { id: 'prompt', label: '咒语生成', icon: 'wand-2' },
                        { id: 'cutter', label: '智能切图', icon: 'scissors' },
                        { id: 'animator', label: '动图制作', icon: 'film' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setMode(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${mode === tab.id ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <Icon name={tab.icon} size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex gap-6">

                {/* === Mode 1: Prompt === */}
                {mode === 'prompt' && (
                    <div className="w-full grid md:grid-cols-2 gap-6 h-full overflow-y-auto pb-10">
                        {/* Static Card */}
                        <div className="glass-panel p-6 rounded-2xl flex flex-col h-fit">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span> 静态表情包 Prompt
                                </h3>
                                <Button variant="ghost" icon="copy" onClick={() => copyText('为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包，注意头饰、衣服要正确；涵盖各种各样的常用聊天语句，或是一些有关的娱乐 meme；每个表情配上可爱中文字体；纯白背景，4x6布局，不要画出网格线')}>复制</Button>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl text-sm text-slate-400 font-mono leading-relaxed select-all border border-slate-800">
                                为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包... (4x6布局，不要画网格线)
                            </div>
                        </div>

                        {/* Anim Card */}
                        <div className="glass-panel p-6 rounded-2xl flex flex-col h-fit">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <span className="w-6 h-6 rounded bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs">2</span> 动图序列帧 Prompt
                                </h3>
                                <Button variant="ghost" icon="copy" onClick={() => copyText('为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包，注意头饰要正确；4x6布局，小图片分别为“飞吻”动画的连贯的拆分动作，使用这24张可以组成一个完整的、循环动画，动作流畅逼真，最后一帧应流畅地循环回到第一帧。24张图片里都使用可爱的字体写着汉字“爱你”。纯白背景，不要画出网格线')}>复制</Button>
                            </div>
                            <div className="bg-slate-950 p-4 rounded-xl text-sm text-slate-400 font-mono leading-relaxed select-all border border-slate-800">
                                为我生成图中人物... 4x6布局，小图片分别为“飞吻”动画的连贯的拆分动作...
                            </div>
                        </div>
                    </div>
                )}

                {/* === Mode 2: Cutter === */}
                {mode === 'cutter' && (
                    <>
                        {/* Settings */}
                        <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                            <div className="glass-panel p-5 rounded-2xl space-y-4">
                                <SectionTitle icon="settings-2" title="参数设置" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">列数 (Cols)</label>
                                        <input type="number" value={cutCols} onChange={e => setCutCols(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center focus:border-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">行数 (Rows)</label>
                                        <input type="number" value={cutRows} onChange={e => setCutRows(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <label className="block w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 transition-all rounded-xl p-4 text-center cursor-pointer">
                                    <Icon name="upload" className="mx-auto mb-2 text-slate-400" />
                                    <span className="text-xs text-slate-300">更换图片</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleCutUpload} />
                                </label>
                                <Button className="w-full" disabled={!slices.length} onClick={downloadZip} icon="package">打包下载 ZIP</Button>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="flex-1 glass-panel p-6 rounded-2xl flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white">切片预览</h3>
                                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{cutCols} x {cutRows} 智能居中</span>
                            </div>
                            {cutterRaw ? (
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cutCols}, minmax(0, 1fr))` }}>
                                        {slices.map((s, i) => (
                                            <img key={i} src={s} className="w-full aspect-square object-contain bg-checkerboard rounded border border-slate-700/50" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <label className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/30 transition-colors">
                                    <Icon name="image-plus" size={48} className="opacity-20 mb-4" />
                                    <p className="text-slate-500">点击上传网格图</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleCutUpload} />
                                </label>
                            )}
                        </div>
                    </>
                )}

                {/* === Mode 3: Animator === */}
                {mode === 'animator' && (
                    <>
                        <div className="w-72 flex-shrink-0 flex flex-col gap-4">
                            <div className="glass-panel p-5 rounded-2xl space-y-4">
                                <SectionTitle icon="settings" title="动图配置" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">列数</label>
                                        <input type="number" value={animCols} onChange={e => setAnimCols(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">行数</label>
                                        <input type="number" value={animRows} onChange={e => setAnimRows(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-2"><span>速度 (FPS)</span><span>{fps}</span></div>
                                    <input type="range" min="1" max="24" value={fps} onChange={e => setFps(e.target.value)} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                                </div>
                                <label className="block w-full border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/50 transition-all rounded-xl p-4 text-center cursor-pointer">
                                    <Icon name="upload" className="mx-auto mb-2 text-slate-400" />
                                    <span className="text-xs text-slate-300">更换序列图</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAnimUpload} />
                                </label>
                                <Button className="w-full" disabled={!animRaw || isGenerating} onClick={generateGif} icon={isGenerating ? 'loader' : 'play'}>
                                    {isGenerating ? '合成中...' : '生成 GIF'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative bg-slate-900/50">
                            {animRes ? (
                                <div className="text-center animate-enter z-10">
                                    <div className="bg-checkerboard p-4 rounded-xl border border-slate-700 shadow-2xl mb-6 inline-block">
                                        <img src={animRes} className="w-64 h-64 object-contain" />
                                    </div>
                                    <div>
                                        <a href={animRes} download="emoji.gif">
                                            <Button variant="primary" icon="download" className="px-8">保存动图</Button>
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-600">
                                    {isGenerating ? (
                                        <>
                                            <Icon name="loader-2" size={48} className="animate-spin mb-4 text-indigo-500" />
                                            <p>正在合成序列帧...</p>
                                        </>
                                    ) : (
                                        <>
                                            {animRaw ? (
                                                <div className="relative group">
                                                    <img src={animRaw.src} className="max-w-[300px] opacity-50 rounded-lg" />
                                                    <div className="absolute inset-0 flex items-center justify-center"><span className="bg-black/50 text-white px-3 py-1 rounded backdrop-blur text-sm">已加载序列图</span></div>
                                                </div>
                                            ) : (
                                                <div onClick={() => document.querySelector('input[type=file]').click()} className="cursor-pointer">
                                                    <Icon name="film" size={64} className="mb-4 opacity-20" />
                                                    <p>请上传序列图开始制作</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.MeMakerTool = MeMakerTool;