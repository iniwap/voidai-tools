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
        fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js').then(r => r.text())
            .then(t => setWorkerUrl(URL.createObjectURL(new Blob([t], { type: 'application/javascript' }))));
    }, []);

    const copyText = (text) => { navigator.clipboard.writeText(text); toast("已复制"); };

    // Cutter Logic
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
            i.onload = () => { if (type === 'cut') setCutterRaw(i); if (type === 'anim') { setAnimRaw(i); setAnimRes(null); } };
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
        const scale = Math.min(1, 300 / cellW);
        const outW = cellW * scale; const outH = cellH * scale;

        const gif = new GIF({ workers: 2, quality: 10, width: outW, height: outH, workerScript: workerUrl, transparent: 0x00000000 });
        const cvs = document.createElement('canvas'); cvs.width = outW; cvs.height = outH; const ctx = cvs.getContext('2d');

        const total = animCols * animRows;
        let frame = 0;
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
        <div className="flex flex-col h-full animate-enter">
            {/* Tabs */}
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
                {mode === 'prompt' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto h-full pb-10">
                            {['static', 'anim'].map((k, i) => (
                                <div key={k} className="glass-panel p-6 rounded-2xl flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                            <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                                            {k === 'static' ? '静态表情包' : '动图序列帧'} Prompt
                                        </h3>
                                        <Button variant="ghost" icon="copy" onClick={() => copyText(prompts[k])}>复制</Button>
                                    </div>
                                    <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-auto">
                                        <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">{prompts[k]}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {mode !== 'prompt' && (
                    <div className="flex gap-6 h-full">
                        {/* Left: Settings */}
                        <div className="w-1/2 glass-panel p-6 rounded-2xl flex flex-col">
                            <SectionHeader title={mode === 'cutter' ? '参数设置' : '动图配置'} icon="settings-2" />
                            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                <label className="block w-full aspect-[2/1] border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-slate-800/30 transition-all rounded-xl flex flex-col items-center justify-center cursor-pointer group bg-slate-900/50">
                                    {(mode === 'cutter' ? cutterRaw : animRaw) ? (
                                        <div className="text-center">
                                            <Icon name="refresh-ccw" size={32} className="text-white mb-2" />
                                            <p className="text-sm font-bold text-white">点击更换图片</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <Icon name="upload-cloud" size={48} className="text-slate-600 mb-3 group-hover:text-indigo-400" />
                                            <p className="text-sm font-medium text-slate-400">点击上传</p>
                                        </div>
                                    )}
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
                                <Button variant="primary" className="w-full h-12 text-base" icon={mode === 'cutter' ? 'package' : (isGenerating ? 'loader' : 'play')} disabled={mode === 'cutter' ? !slices.length : (!animRaw || isGenerating)} onClick={mode === 'cutter' ? downloadZip : generateGif}>
                                    {mode === 'cutter' ? '打包下载 ZIP' : (isGenerating ? '生成中...' : '生成 GIF')}
                                </Button>
                            </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="w-1/2 glass-panel p-6 rounded-2xl flex flex-col relative bg-slate-900/40">
                            <SectionHeader title="结果预览" icon="eye" />
                            <div className="flex-1 bg-slate-950/50 rounded-xl border border-slate-800/50 flex items-center justify-center relative overflow-hidden">
                                {mode === 'cutter' && (
                                    slices.length ? (
                                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
                                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cutCols}, minmax(0, 1fr))` }}>
                                                {slices.map((s, i) => <img key={i} src={s} className="w-full aspect-square object-cover bg-slate-800 rounded border border-slate-700/50" />)}
                                            </div>
                                        </div>
                                    ) : <div className="text-slate-600 text-center"><Icon name="grid" size={48} className="mb-2 opacity-30" /><p>暂无切片</p></div>
                                )}
                                {mode === 'animator' && (
                                    animRes ? (
                                        <div className="flex flex-col items-center gap-6 animate-enter">
                                            <img src={animRes} className="max-w-[80%] max-h-[300px] object-contain bg-checkerboard rounded-lg shadow-2xl p-2" />
                                            <a href={animRes} download="emoji.gif"><Button variant="secondary" icon="download">下载 GIF</Button></a>
                                        </div>
                                    ) : <div className="text-slate-600 text-center"><Icon name="film" size={48} className="mb-2 opacity-30" /><p>等待生成</p></div>
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