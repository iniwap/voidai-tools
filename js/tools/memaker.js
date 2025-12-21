const { useState, useEffect, useRef } = React;
const { Icon, Button, useToast, SectionHeader } = window.SharedComponents;

const MeMakerTool = () => {
    const [mode, setMode] = useState('prompt');
    const toast = useToast();

    // Data
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
            .catch(() => toast("GIF组件加载失败", "error"));
    }, []);

    const copyText = (text) => { navigator.clipboard.writeText(text); toast("已复制"); };

    // 切图
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
        toast("正在打包...");
        const zip = new JSZip();
        const folder = zip.folder("emojis");
        slices.forEach((s, i) => folder.file(`emoji_${i + 1}.png`, s.split(',')[1], { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = "emojis.zip"; link.click();
    };

    const generateGif = () => {
        if (!animRaw || !workerUrl) return;
        setIsGenerating(true);
        const cellW = animRaw.width / animCols;
        const cellH = animRaw.height / animRows;
        // GIF 宽固定 300，高自适应
        const outW = 300;
        const outH = cellH * (300 / cellW);

        const cvs = document.createElement('canvas');
        cvs.width = outW; cvs.height = outH;
        const ctx = cvs.getContext('2d');

        const gif = new GIF({ workers: 2, quality: 10, width: outW, height: outH, workerScript: workerUrl, transparent: 0x00000000 });

        for (let r = 0; r < animRows; r++) {
            for (let c = 0; c < animCols; c++) {
                ctx.clearRect(0, 0, outW, outH);
                ctx.drawImage(animRaw, c * cellW, r * cellH, cellW, cellH, 0, 0, outW, outH);
                gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
            }
        }
        gif.on('finished', blob => { setAnimRes(URL.createObjectURL(blob)); setIsGenerating(false); });
        gif.render();
    };

    return (
        <div className="flex flex-col h-full animate-enter">
            {/* Mode Tabs */}
            <div className="flex justify-center mb-6 shrink-0">
                <div className="bg-slate-900/80 p-1 rounded-xl border border-slate-700 flex gap-1 shadow-lg">
                    {[{ id: 'prompt', l: '咒语', i: 'wand-2' }, { id: 'cutter', l: '切图', i: 'scissors' }, { id: 'animator', l: '动图', i: 'film' }].map(t => (
                        <button key={t.id} onClick={() => setMode(t.id)} className={`px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${mode === t.id ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                            <Icon name={t.i} size={16} /> {t.l}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {/* === Mode 1: Prompt === */}
                {mode === 'prompt' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto h-full">
                            {/* Card 1 */}
                            <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
                                <SectionHeader title="静态表情包 Prompt" icon="smile" />
                                <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-auto">
                                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all h-full">{prompts.static}</pre>
                                </div>
                                <div className="mt-4"><Button className="w-full" icon="copy" onClick={() => copyText(prompts.static)}>复制 Prompt</Button></div>
                            </div>
                            {/* Card 2 */}
                            <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
                                <SectionHeader title="动图序列帧 Prompt" icon="film" />
                                <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-auto">
                                    <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all h-full">{prompts.anim}</pre>
                                </div>
                                <div className="mt-4"><Button className="w-full" icon="copy" onClick={() => copyText(prompts.anim)}>复制 Prompt</Button></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* === Mode 2 & 3: 50/50 Split === */}
                {mode !== 'prompt' && (
                    <div className="flex gap-6 h-full">
                        {/* 左侧：控制面板 (50%) */}
                        <div className="w-1/2 glass-panel p-6 rounded-2xl flex flex-col">
                            <SectionHeader title={mode === 'cutter' ? '参数设置' : '动图配置'} icon="settings-2" />
                            <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                                <label className="block w-full aspect-[2/1] border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/30 transition-all rounded-xl flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden bg-slate-900/50">
                                    {(mode === 'cutter' ? cutterRaw : animRaw) ? (
                                        <img src={(mode === 'cutter' ? cutterRaw : animRaw).src} className="absolute inset-0 w-full h-full object-contain p-4 opacity-50 group-hover:opacity-30" />
                                    ) : (
                                        <Icon name="upload-cloud" size={48} className="text-slate-600 mb-3" />
                                    )}
                                    <span className="text-sm font-medium text-slate-300 relative z-10">
                                        {(mode === 'cutter' ? cutterRaw : animRaw) ? '点击更换' : `上传${mode === 'cutter' ? '网格' : '序列'}图`}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, mode === 'cutter' ? 'cut' : 'anim')} />
                                </label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs text-slate-400 font-bold uppercase mb-1 block">列数</label><input type="number" value={mode === 'cutter' ? cutCols : animCols} onChange={e => mode === 'cutter' ? setCutCols(e.target.value) : setAnimCols(e.target.value)} className="w-full h-10 input-void rounded-lg text-center" /></div>
                                    <div><label className="text-xs text-slate-400 font-bold uppercase mb-1 block">行数</label><input type="number" value={mode === 'cutter' ? cutRows : animRows} onChange={e => mode === 'cutter' ? setCutRows(e.target.value) : setAnimRows(e.target.value)} className="w-full h-10 input-void rounded-lg text-center" /></div>
                                </div>

                                {mode === 'animator' && (
                                    <div><label className="text-xs text-slate-400 font-bold uppercase mb-1 block">帧率: {fps}</label><input type="range" min="1" max="24" value={fps} onChange={e => setFps(e.target.value)} className="w-full h-2 bg-slate-800 rounded-lg accent-indigo-500" /></div>
                                )}
                            </div>
                            <div className="pt-6 mt-auto border-t border-white/5">
                                {mode === 'cutter' ? (
                                    <Button variant="primary" className="w-full h-12 text-base" icon="package" disabled={!slices.length} onClick={downloadZip}>打包下载</Button>
                                ) : (
                                    <Button variant="primary" className="w-full h-12 text-base" icon={isGenerating ? 'loader' : 'play'} disabled={!animRaw || isGenerating} onClick={generateGif}>{isGenerating ? '生成中...' : '生成 GIF'}</Button>
                                )}
                            </div>
                        </div>

                        {/* 右侧：预览区 (50%) */}
                        <div className="w-1/2 glass-panel p-6 rounded-2xl flex flex-col relative bg-slate-900/40">
                            <SectionHeader title="结果预览" icon="eye" />
                            <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800/50 flex items-center justify-center relative overflow-hidden">
                                {mode === 'cutter' && (
                                    slices.length > 0 ? (
                                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
                                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cutCols}, minmax(0, 1fr))` }}>
                                                {slices.map((s, i) => (
                                                    <div key={i} className="aspect-square bg-slate-800 rounded border border-slate-700/50 overflow-hidden relative">
                                                        <img src={s} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : <div className="text-center text-slate-600"><Icon name="grid" size={48} className="mb-2 opacity-30" /><p>暂无预览</p></div>
                                )}

                                {mode === 'animator' && (
                                    animRes ? (
                                        <div className="flex flex-col items-center gap-6 animate-enter">
                                            <img src={animRes} className="max-w-[80%] max-h-[300px] object-contain bg-checkerboard rounded-lg shadow-2xl p-2" />
                                            <a href={animRes} download="emoji.gif"><Button variant="secondary" icon="download">下载 GIF</Button></a>
                                        </div>
                                    ) : <div className="text-center text-slate-600"><Icon name="film" size={48} className="mb-2 opacity-30" /><p>等待生成</p></div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.MeMakerTool = MeMakerTool;