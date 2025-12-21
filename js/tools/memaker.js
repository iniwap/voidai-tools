const { useState, useEffect, useRef } = React;
const { Icon, Button } = window.SharedComponents;

const MeMakerTool = () => {
    const [mode, setMode] = useState('prompt');
    const [toast, setToast] = useState(null);

    // ... (状态变量保持不变，逻辑复用之前的，此处省略部分基础变量声明以聚焦布局)
    const [cutterImg, setCutterImg] = useState(null);
    const [cutterRaw, setCutterRaw] = useState(null);
    const [slices, setSlices] = useState([]);
    const [cols, setCols] = useState(6);
    const [rows, setRows] = useState(4);

    const [animImg, setAnimImg] = useState(null);
    const [animRaw, setAnimRaw] = useState(null);
    const [animRes, setAnimRes] = useState(null);
    const [animCols, setAnimCols] = useState(6);
    const [animRows, setAnimRows] = useState(4);
    const [fps, setFps] = useState(12);
    const [isGenerating, setIsGenerating] = useState(false);
    const [workerUrl, setWorkerUrl] = useState(null);

    // Worker Init
    useEffect(() => {
        fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
            .then(r => r.text())
            .then(t => {
                const blob = new Blob([t], { type: 'application/javascript' });
                setWorkerUrl(URL.createObjectURL(blob));
            }).catch(e => console.error("GIF Worker Failed", e));
    }, []);

    // Helpers
    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2000); };
    const copyText = (text) => { navigator.clipboard.writeText(text); showToast("复制成功！"); };

    // Cutter Logic (同前，略)
    const processSlices = (img = cutterRaw, c = cols, r = rows) => {
        if (!img) return;
        const cellW = img.width / c; const cellH = img.height / r;
        const cropSize = Math.min(cellW, cellH);
        const cropX = (cellW - cropSize) / 2; const cropY = (cellH - cropSize) / 2;
        const cvs = document.createElement('canvas'); cvs.width = cropSize; cvs.height = cropSize;
        const ctx = cvs.getContext('2d'); const temp = [];
        for (let row = 0; row < r; row++) {
            for (let col = 0; col < c; col++) {
                ctx.clearRect(0, 0, cropSize, cropSize);
                ctx.drawImage(img, col * cellW + cropX, row * cellH + cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
                temp.push(cvs.toDataURL('image/png'));
            }
        }
        setSlices(temp);
    };
    useEffect(() => { if (cutterRaw) processSlices(); }, [cols, rows, cutterRaw]);
    const handleCutterUpload = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader(); r.onload = (evt) => { const i = new Image(); i.onload = () => { setCutterRaw(i); setCutterImg(evt.target.result); }; i.src = evt.target.result; }; r.readAsDataURL(f);
    };
    const downloadZip = async () => {
        if (!slices.length) return;
        const zip = new JSZip(); const folder = zip.folder("emojis");
        slices.forEach((d, i) => folder.file(`emoji_${i + 1}.png`, d.split(',')[1], { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = "emoji_pack.zip"; link.click();
    };

    // Animator Logic (同前，略)
    const handleAnimUpload = (e) => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader(); r.onload = (evt) => { const i = new Image(); i.onload = () => { setAnimRaw(i); setAnimImg(evt.target.result); setAnimRes(null); }; i.src = evt.target.result; }; r.readAsDataURL(f);
    };
    const generateGif = () => {
        if (!animRaw || !workerUrl) return; setIsGenerating(true);
        const size = 300; const cvs = document.createElement('canvas'); cvs.width = size; cvs.height = size; const ctx = cvs.getContext('2d');
        const gif = new GIF({ workers: 4, quality: 10, width: size, height: size, workerScript: workerUrl, transparent: 0x00000000 });
        const cellW = animRaw.width / animCols; const cellH = animRaw.height / animRows;
        const cropSize = Math.min(cellW, cellH); const cropX = (cellW - cropSize) / 2; const cropY = (cellH - cropSize) / 2;
        const total = animCols * animRows;
        let frame = 0;
        for (let r = 0; r < animRows; r++) {
            for (let c = 0; c < animCols; c++) {
                if (frame >= total) break;
                ctx.clearRect(0, 0, size, size);
                ctx.drawImage(animRaw, c * cellW + cropX, r * cellH + cropY, cropSize, cropSize, 0, 0, size, size);
                gif.addFrame(ctx, { copy: true, delay: 1000 / fps });
                frame++;
            }
        }
        gif.on('finished', blob => { setAnimRes(URL.createObjectURL(blob)); setIsGenerating(false); });
        gif.render();
    };

    return (
        <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
            {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-fade-in"><Icon name="sparkles" size={16} /> {toast}</div>}

            {/* 子导航 */}
            <div className="flex bg-void-900/50 p-1 rounded-xl gap-1 mb-6 border border-void-800 flex-shrink-0 w-fit mx-auto md:mx-0">
                {[{ id: 'prompt', label: '咒语', icon: 'wand-2' }, { id: 'cutter', label: '切图', icon: 'scissors' }, { id: 'animator', label: '动图', icon: 'film' }].map(tab => (
                    <button key={tab.id} onClick={() => setMode(tab.id)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === tab.id ? 'bg-void-800 text-white shadow-sm' : 'text-void-400 hover:text-void-200'}`}>
                        <Icon name={tab.icon} size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                {mode === 'prompt' && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 rounded-2xl relative group hover:border-blue-500/50 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-900 text-blue-400 flex items-center justify-center text-xs">1</span> 静态表情包</h3>
                                <Button variant="ghost" onClick={() => copyText(`为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包，注意头饰、衣服要正确；涵盖各种各样的常用聊天语句，或是一些有关的娱乐 meme；每个表情配上可爱中文字体；纯白背景，4x6布局，不要画出网格线`)} icon="copy">复制</Button>
                            </div>
                            <div className="bg-void-950 p-4 rounded-xl text-xs text-void-400 font-mono leading-relaxed border border-void-800 select-all">为我生成图中人物的绘制 Q 版的... (4x6布局)...</div>
                        </div>
                        <div className="glass-card p-6 rounded-2xl relative group hover:border-purple-500/50 transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-purple-900 text-purple-400 flex items-center justify-center text-xs">2</span> 动图序列帧</h3>
                                <Button variant="ghost" onClick={() => copyText(`为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包... 24张图片里都使用可爱的字体写着汉字“爱你”。纯白背景，不要画出网格线`)} icon="copy">复制</Button>
                            </div>
                            <div className="bg-void-950 p-4 rounded-xl text-xs text-void-400 font-mono leading-relaxed border border-void-800 select-all">为我生成图中人物... 连贯动作...</div>
                        </div>
                    </div>
                )}

                {mode === 'cutter' && (
                    <div className="grid lg:grid-cols-3 gap-6 h-full pb-10">
                        <div className="glass-card p-4 rounded-2xl flex flex-col gap-4 h-fit">
                            <label className="flex-1 border-2 border-dashed border-void-700 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-void-900/50 min-h-[200px]">
                                {cutterImg ? <img src={cutterImg} className="w-full h-full object-contain p-2 opacity-80" /> : <Icon name="upload" className="text-void-400 mb-1" />}
                                <span className="text-xs text-void-400 font-bold uppercase">{cutterImg ? '更换' : '上传网格图'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleCutterUpload} />
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" value={cols} onChange={e => setCols(e.target.value)} className="bg-void-900 border border-void-700 rounded text-center text-white text-sm py-2" title="列数" />
                                <input type="number" value={rows} onChange={e => setRows(e.target.value)} className="bg-void-900 border border-void-700 rounded text-center text-white text-sm py-2" title="行数" />
                            </div>
                            <Button disabled={!slices.length} onClick={downloadZip} icon="package">打包下载</Button>
                        </div>
                        <div className="lg:col-span-2 glass-card p-4 rounded-2xl overflow-hidden flex flex-col min-h-[400px]">
                            <div className="flex justify-between items-center mb-2 text-xs text-void-400"><span>预览 ({slices.length})</span><span>{cols}x{rows}</span></div>
                            {slices.length ? <div className="grid gap-2 overflow-y-auto custom-scrollbar flex-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>{slices.map((s, i) => <div key={i} className="aspect-square bg-void-900 rounded overflow-hidden"><img src={s} className="w-full h-full object-contain" /></div>)}</div> : <div className="flex-1 flex items-center justify-center text-void-600">请上传图片</div>}
                        </div>
                    </div>
                )}

                {mode === 'animator' && (
                    <div className="grid md:grid-cols-2 gap-6 h-full pb-10">
                        <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 h-fit">
                            <label className="flex-1 border-2 border-dashed border-void-700 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-void-900/50 min-h-[200px]">
                                {animImg ? <img src={animImg} className="w-full h-full object-contain p-2" /> : <Icon name="upload" className="text-void-400 mb-1" />}
                                <span className="text-xs text-void-400 font-bold uppercase">{animImg ? '更换' : '上传序列图'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAnimUpload} />
                            </label>
                            <div className="grid grid-cols-2 gap-2"><input type="number" value={animCols} onChange={e => setAnimCols(e.target.value)} className="bg-void-900 border border-void-700 rounded text-center text-white text-sm py-2" /><input type="number" value={animRows} onChange={e => setAnimRows(e.target.value)} className="bg-void-900 border border-void-700 rounded text-center text-white text-sm py-2" /></div>
                            <div className="bg-void-900 p-2 rounded border border-void-800"><div className="flex justify-between text-xs text-void-400 mb-1"><span>FPS: {fps}</span></div><input type="range" min="1" max="24" value={fps} onChange={e => setFps(e.target.value)} className="w-full h-1 bg-void-700 rounded-lg appearance-none cursor-pointer accent-purple-500" /></div>
                            <Button disabled={!animRaw || isGenerating} onClick={generateGif} icon={isGenerating ? 'loader' : 'play'}>{isGenerating ? '合成中...' : '生成'}</Button>
                        </div>
                        <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center bg-void-950 relative min-h-[400px]">
                            {animRes ? <div className="text-center animate-fade-in z-10"><img src={animRes} className="w-48 h-48 object-contain mx-auto border-4 border-void-800 rounded-lg bg-void-900 checkerboard shadow-2xl mb-6" /><a href={animRes} download="gif.gif" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-sm inline-flex items-center gap-2 transition-colors"><Icon name="download" size={16} /> 保存</a></div> : <div className="text-void-700 text-center"><Icon name="film" size={48} className="mx-auto mb-2 opacity-20" /><p className="text-sm">等待生成</p></div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.MeMakerTool = MeMakerTool;