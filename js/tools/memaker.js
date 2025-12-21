const { useState, useEffect, useRef } = React;
const { Icon, Button, SectionHeader } = window.SharedComponents;

const MeMakerTool = () => {
    const [mode, setMode] = useState('prompt');
    const [toast, setToast] = useState(null);

    // Prompt Data (原始文案还原)
    const prompts = {
        static: `为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包，注意头饰、衣服要正确；\n涵盖各种各样的常用聊天语句，或是一些有关的娱乐 meme；\n每个表情配上可爱中文字体；\n纯白背景，4x6布局，不要画出网格线`,
        anim: `为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包，注意头饰要正确；\n4x6布局，小图片分别为“飞吻”动画的连贯的拆分动作，\n使用这24张可以组成一个完整的、循环动画，动作流畅逼真，最后一帧应流畅地循环回到第一帧。\n24张图片里都使用可爱的字体写着汉字“爱你”。\n纯白背景，不要画出网格线`
    };

    // State
    const [cutterRaw, setCutterRaw] = useState(null);
    const [slices, setSlices] = useState([]);
    const [cutCols, setCutCols] = useState(6);
    const [cutRows, setCutRows] = useState(4);

    const [animRaw, setAnimRaw] = useState(null);
    const [animRes, setAnimRes] = useState(null);
    const [animCols, setAnimCols] = useState(6);
    const [animRows, setAnimRows] = useState(4);
    const [fps, setFps] = useState(12);
    const [isGenerating, setIsGenerating] = useState(false);
    const [workerUrl, setWorkerUrl] = useState(null);

    // Init
    useEffect(() => {
        fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
            .then(r => r.text())
            .then(t => setWorkerUrl(URL.createObjectURL(new Blob([t], { type: 'application/javascript' }))))
            .catch(e => console.error("GIF Worker Failed", e));
    }, []);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
    const copyText = (text) => { navigator.clipboard.writeText(text); showToast("已复制到剪贴板"); };

    // --- 切图逻辑 (保持比例) ---
    useEffect(() => {
        if (!cutterRaw) return;
        const cellW = cutterRaw.width / cutCols;
        const cellH = cutterRaw.height / cutRows;

        const cvs = document.createElement('canvas');
        cvs.width = cellW; cvs.height = cellH;
        const ctx = cvs.getContext('2d');
        const temp = [];

        for (let r = 0; r < cutRows; r++) {
            for (let c = 0; c < cutCols; c++) {
                ctx.clearRect(0, 0, cellW, cellH);
                ctx.drawImage(cutterRaw, c * cellW, r * cellH, cellW, cellH, 0, 0, cellW, cellH);
                temp.push(cvs.toDataURL('image/png'));
            }
        }
        setSlices(temp);
    }, [cutterRaw, cutCols, cutRows]);

    const handleUpload = (e, type) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (evt) => {
            const i = new Image();
            i.onload = () => {
                if (type === 'cut') setCutterRaw(i);
                if (type === 'anim') { setAnimRaw(i); setAnimRes(null); }
            };
            i.src = evt.target.result;
        };
        r.readAsDataURL(f);
        e.target.value = '';
    };

    const downloadZip = async () => {
        if (!slices.length) return;
        const zip = new JSZip();
        const folder = zip.folder("emojis");
        slices.forEach((s, i) => folder.file(`emoji_${i + 1}.png`, s.split(',')[1], { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = "emojis.zip"; link.click();
    };

    const generateGif = () => {
        if (!animRaw || !workerUrl) return;
        setIsGenerating(true);
        // GIF 生成保持 1:1 比例或自适应，这里使用固定宽度，高度自适应
        const cellW = animRaw.width / animCols;
        const cellH = animRaw.height / animRows;
        const scale = 300 / cellW; // Scale to 300px width
        const outW = 300;
        const outH = cellH * scale;

        const cvs = document.createElement('canvas');
        cvs.width = outW; cvs.height = outH;
        const ctx = cvs.getContext('2d');

        const gif = new GIF({ workers: 2, quality: 10, width: outW, height: outH, workerScript: workerUrl, transparent: 0x00000000 });

        let frame = 0;
        const total = animCols * animRows;
        for (let r = 0; r < animRows; r++) {
            for (let c = 0; c < animCols; c++) {
                if (frame >= total) break;
                ctx.clearRect(0, 0, outW, outH);
                ctx.drawImage(animRaw, c * cellW, r * cellH, cellW, cellH, 0, 0, outW, outH);
                gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
                frame++;
            }
        }
        gif.on('finished', blob => { setAnimRes(URL.createObjectURL(blob)); setIsGenerating(false); });
        gif.render();
    };

    return (
        <div className="flex flex-col h-full relative">
            {toast && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold flex items-center gap-2 animate-fade-in"><Icon name="check-circle" size={16} /> {toast}</div>}

            {/* Mode Switcher */}
            <div className="flex justify-center mb-6 shrink-0">
                <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex gap-1 shadow-lg">
                    {[{ id: 'prompt', l: '咒语' }, { id: 'cutter', l: '切图' }, { id: 'animator', l: '动图' }].map(t => (
                        <button key={t.id} onClick={() => setMode(t.id)} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === t.id ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                            {t.l}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-6">

                {/* === 左侧：控制与输入区 === */}
                <div className="w-1/2 flex flex-col gap-4">
                    <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col overflow-hidden">
                        {mode === 'prompt' && (
                            <div className="flex flex-col h-full gap-4">
                                <SectionHeader title="Prompt 生成" icon="wand-2" />
                                <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center"><span className="text-xs text-indigo-400 font-bold uppercase">静态表情包</span><Button variant="ghost" className="h-6 text-xs" icon="copy" onClick={() => copyText(prompts.static)}>复制</Button></div>
                                        <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono leading-relaxed border border-slate-800 whitespace-pre-wrap">{prompts.static}</pre>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center"><span className="text-xs text-pink-400 font-bold uppercase">动图序列帧</span><Button variant="ghost" className="h-6 text-xs" icon="copy" onClick={() => copyText(prompts.anim)}>复制</Button></div>
                                        <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono leading-relaxed border border-slate-800 whitespace-pre-wrap">{prompts.anim}</pre>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(mode === 'cutter' || mode === 'animator') && (
                            <div className="flex flex-col h-full">
                                <SectionHeader title={mode === 'cutter' ? '参数设置' : '动图配置'} icon="settings-2" />
                                <div className="space-y-6">
                                    {/* Upload Box */}
                                    <label className="block w-full aspect-video border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/30 transition-all rounded-xl flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden">
                                        {(mode === 'cutter' ? cutterRaw : animRaw) ? (
                                            <img src={(mode === 'cutter' ? cutterRaw : animRaw).src} className="absolute inset-0 w-full h-full object-contain p-2 opacity-50 group-hover:opacity-30 transition-opacity" />
                                        ) : (
                                            <Icon name="upload-cloud" size={40} className="text-slate-500 mb-2 group-hover:text-indigo-400 transition-colors" />
                                        )}
                                        <span className="text-sm font-bold text-slate-300 relative z-10">
                                            {(mode === 'cutter' ? cutterRaw : animRaw) ? '点击更换图片' : '上传网格原图'}
                                        </span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, mode === 'cutter' ? 'cut' : 'anim')} />
                                    </label>

                                    {/* Inputs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs text-slate-500 mb-1.5 block">列数 (Cols)</label><input type="number" value={mode === 'cutter' ? cutCols : animCols} onChange={e => mode === 'cutter' ? setCutCols(e.target.value) : setAnimCols(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-center text-white focus:border-indigo-500 outline-none" /></div>
                                        <div><label className="text-xs text-slate-500 mb-1.5 block">行数 (Rows)</label><input type="number" value={mode === 'cutter' ? cutRows : animRows} onChange={e => mode === 'cutter' ? setCutRows(e.target.value) : setAnimRows(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-center text-white focus:border-indigo-500 outline-none" /></div>
                                    </div>

                                    {mode === 'animator' && (
                                        <div><label className="text-xs text-slate-500 mb-1.5 block flex justify-between"><span>帧率 (FPS)</span><span>{fps}</span></label><input type="range" min="1" max="24" value={fps} onChange={e => setFps(e.target.value)} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div>
                                    )}

                                    {/* Action Button */}
                                    <div className="pt-4">
                                        {mode === 'cutter' ? (
                                            <Button variant="primary" className="w-full h-12 text-base shadow-xl" icon="package" disabled={!slices.length} onClick={downloadZip}>打包下载 ZIP</Button>
                                        ) : (
                                            <Button variant="primary" className="w-full h-12 text-base shadow-xl" icon={isGenerating ? 'loader' : 'play'} disabled={!animRaw || isGenerating} onClick={generateGif}>{isGenerating ? '生成中...' : '生成 GIF'}</Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* === 右侧：预览区 (50% 宽度) === */}
                <div className="w-1/2 glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden bg-slate-900/40">
                    <SectionHeader title="实时预览" icon="eye" rightAction={mode === 'cutter' && <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{cutCols * cutRows} items</span>} />

                    <div className="flex-1 overflow-hidden relative rounded-xl bg-slate-950/50 border border-slate-800/50 flex items-center justify-center">
                        {mode === 'prompt' && (
                            <div className="text-center text-slate-600">
                                <Icon name="layout-template" size={64} className="mb-4 opacity-20" />
                                <p>请在左侧复制代码去绘画</p>
                            </div>
                        )}

                        {mode === 'cutter' && (
                            slices.length > 0 ? (
                                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
                                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cutCols}, minmax(0, 1fr))` }}>
                                        {slices.map((s, i) => (
                                            <div key={i} className="aspect-square bg-slate-800 rounded border border-slate-700/50 overflow-hidden relative group">
                                                <img src={s} className="w-full h-full object-cover" /> {/* object-cover 填满格子 */}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white">#{i + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-600">
                                    <Icon name="grid" size={64} className="mb-4 opacity-20" />
                                    <p>上传图片以预览切片</p>
                                </div>
                            )
                        )}

                        {mode === 'animator' && (
                            animRes ? (
                                <div className="text-center animate-fade-in">
                                    <img src={animRes} className="max-w-[80%] max-h-[300px] object-contain mx-auto bg-checkerboard rounded-lg shadow-2xl border border-slate-700" />
                                    <div className="mt-6">
                                        <a href={animRes} download="emoji.gif">
                                            <Button variant="secondary" icon="download">下载 GIF</Button>
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-600">
                                    <Icon name="film" size={64} className="mb-4 opacity-20" />
                                    <p>{isGenerating ? '正在渲染...' : '等待生成'}</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.MeMakerTool = MeMakerTool;