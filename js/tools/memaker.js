// js/tools/memaker.js
const { useState, useEffect, useRef } = React;
const { Icon, Button, PageHeader } = window.SharedComponents;

const MeMakerTool = ({ onBack }) => {
    const [mode, setMode] = useState('prompt'); // prompt, cutter, animator
    const [toast, setToast] = useState(null);

    // --- 状态：Cutter ---
    const [cutterImg, setCutterImg] = useState(null);
    const [cutterRaw, setCutterRaw] = useState(null);
    const [slices, setSlices] = useState([]);
    const [cols, setCols] = useState(6);
    const [rows, setRows] = useState(4);

    // --- 状态：Animator ---
    const [animImg, setAnimImg] = useState(null);
    const [animRaw, setAnimRaw] = useState(null);
    const [animRes, setAnimRes] = useState(null);
    const [animCols, setAnimCols] = useState(6);
    const [animRows, setAnimRows] = useState(4);
    const [fps, setFps] = useState(12);
    const [isGenerating, setIsGenerating] = useState(false);
    const [workerUrl, setWorkerUrl] = useState(null);

    // --- 初始化：加载 GIF Worker ---
    useEffect(() => {
        fetch('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js')
            .then(r => r.text())
            .then(t => {
                const blob = new Blob([t], { type: 'application/javascript' });
                setWorkerUrl(URL.createObjectURL(blob));
            }).catch(e => console.error("GIF Worker Load Failed", e));
    }, []);

    // --- 辅助：Toast ---
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2000);
    };

    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        showToast("咒语已复制！");
    };

    // --- 核心：切图逻辑 (复刻原版) ---
    const processSlices = (img = cutterRaw, c = cols, r = rows) => {
        if (!img) return;
        const cellW = img.width / c;
        const cellH = img.height / r;
        const cropSize = Math.min(cellW, cellH);
        const cropX = (cellW - cropSize) / 2;
        const cropY = (cellH - cropSize) / 2;

        const cvs = document.createElement('canvas');
        cvs.width = cropSize; cvs.height = cropSize;
        const ctx = cvs.getContext('2d');
        const temp = [];

        for (let row = 0; row < r; row++) {
            for (let col = 0; col < c; col++) {
                ctx.clearRect(0, 0, cropSize, cropSize);
                ctx.drawImage(img, col * cellW + cropX, row * cellH + cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
                temp.push(cvs.toDataURL('image/png'));
            }
        }
        setSlices(temp);
    };

    // 监听参数变化重新切图
    useEffect(() => { if (cutterRaw) processSlices(); }, [cols, rows, cutterRaw]);

    const handleCutterUpload = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => { setCutterRaw(img); setCutterImg(evt.target.result); };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(f);
    };

    const downloadZip = async () => {
        if (!slices.length) return;
        const zip = new JSZip();
        const folder = zip.folder("emojis");
        slices.forEach((d, i) => folder.file(`emoji_${i + 1}.png`, d.split(',')[1], { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "emoji_pack.zip";
        link.click();
    };

    // --- 核心：动图逻辑 (复刻原版) ---
    const handleAnimUpload = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => { setAnimRaw(img); setAnimImg(evt.target.result); setAnimRes(null); };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(f);
    };

    const generateGif = () => {
        if (!animRaw || !workerUrl) return;
        setIsGenerating(true);
        const size = 300;
        const cvs = document.createElement('canvas');
        cvs.width = size; cvs.height = size;
        const ctx = cvs.getContext('2d');

        const gif = new GIF({
            workers: 4, quality: 10, width: size, height: size,
            workerScript: workerUrl, transparent: 0x00000000
        });

        const cellW = animRaw.width / animCols;
        const cellH = animRaw.height / animRows;
        const cropSize = Math.min(cellW, cellH);
        const cropX = (cellW - cropSize) / 2;
        const cropY = (cellH - cropSize) / 2;
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
        gif.on('finished', blob => {
            setAnimRes(URL.createObjectURL(blob));
            setIsGenerating(false);
        });
        gif.render();
    };

    // --- 界面部分 ---
    return (
        <div className="animate-slide-up w-full relative">
            {/* Toast */}
            {toast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold animate-fade-in">
                    <Icon name="sparkles" size={16} /> {toast}
                </div>
            )}

            <PageHeader title="萌萌工坊 (MeMaker)" desc="咒语生成、智能切图、动图制作一站式工具。" onBack={onBack} />

            {/* Sub-Navigation */}
            <div className="flex bg-void-900/50 p-1.5 rounded-xl gap-1 mb-8 w-fit border border-void-800">
                {[
                    { id: 'prompt', label: '咒语生成', icon: 'wand-2' },
                    { id: 'cutter', label: '智能切图', icon: 'scissors' },
                    { id: 'animator', label: '动图制作', icon: 'film' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setMode(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === tab.id ? 'bg-void-800 text-white shadow-sm' : 'text-void-400 hover:text-void-200'}`}
                    >
                        <Icon name={tab.icon} size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* === MODE 1: PROMPTS === */}
            {mode === 'prompt' && (
                <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="glass-card p-6 rounded-2xl relative group hover:border-blue-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-900 text-blue-400 flex items-center justify-center text-xs">1</span> 静态表情包</h3>
                            <Button variant="ghost" className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" onClick={() => copyText(`为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包，注意头饰、衣服要正确；涵盖各种各样的常用聊天语句，或是一些有关的娱乐 meme；每个表情配上可爱中文字体；纯白背景，4x6布局，不要画出网格线`)}>
                                <Icon name="copy" size={12} /> 复制
                            </Button>
                        </div>
                        <div className="bg-void-950 p-4 rounded-xl text-xs text-void-400 font-mono leading-relaxed border border-void-800 select-all">
                            为我生成图中人物的绘制 Q 版的... (4x6布局)...
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-2xl relative group hover:border-purple-500/50 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-purple-900 text-purple-400 flex items-center justify-center text-xs">2</span> 动图序列帧</h3>
                            <Button variant="ghost" className="text-xs bg-purple-500/10 text-purple-400 hover:bg-purple-500/20" onClick={() => copyText(`为我生成图中人物的绘制 Q 版的，彩色手绘 LINE 风格的半身像表情包... 24张图片里都使用可爱的字体写着汉字“爱你”。纯白背景，不要画出网格线`)}>
                                <Icon name="copy" size={12} /> 复制
                            </Button>
                        </div>
                        <div className="bg-void-950 p-4 rounded-xl text-xs text-void-400 font-mono leading-relaxed border border-void-800 select-all">
                            为我生成图中人物... 小图片分别为“飞吻”动画的连贯的拆分动作...
                        </div>
                    </div>

                    <div className="md:col-span-2 text-center mt-4">
                        <Button onClick={() => setMode('cutter')} className="mx-auto" icon="arrow-right">去切图</Button>
                    </div>
                </div>
            )}

            {/* === MODE 2: CUTTER === */}
            {mode === 'cutter' && (
                <div className="grid lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="space-y-4">
                        <div className="glass-card p-4 rounded-2xl">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Icon name="scissors" className="text-blue-400" /> 配置</h3>
                            <div className="flex gap-2 h-24">
                                <label className="flex-1 border-2 border-dashed border-void-700 hover:border-blue-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-void-900/50">
                                    {cutterImg ? <img src={cutterImg} className="w-full h-full object-cover opacity-50 rounded-lg" /> : <Icon name="upload" className="text-void-400 mb-1" />}
                                    <span className="text-[10px] text-void-400 font-bold uppercase">{cutterImg ? '更换' : '上传'}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleCutterUpload} />
                                </label>
                                <div className="w-16 flex flex-col gap-2">
                                    <input type="number" value={cols} onChange={e => setCols(e.target.value)} className="w-full bg-void-900 border border-void-700 rounded text-center text-white text-sm py-1" title="列" />
                                    <input type="number" value={rows} onChange={e => setRows(e.target.value)} className="w-full bg-void-900 border border-void-700 rounded text-center text-white text-sm py-1" title="行" />
                                </div>
                            </div>
                            <Button disabled={!slices.length} onClick={downloadZip} className="w-full mt-4" icon="package">打包下载 ZIP</Button>
                        </div>
                    </div>

                    <div className="lg:col-span-2 glass-card p-4 rounded-2xl min-h-[400px]">
                        <div className="flex justify-between items-center mb-4 text-sm text-void-400">
                            <span>预览结果 ({slices.length} 张)</span>
                            <span className="bg-void-800 px-2 py-1 rounded text-xs">{cols}x{rows} 智能居中</span>
                        </div>
                        {slices.length > 0 ? (
                            <div className="grid gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                                {slices.map((s, i) => (
                                    <div key={i} className="aspect-square bg-void-900 rounded border border-void-800 overflow-hidden hover:border-blue-500 cursor-pointer" onClick={() => { /* Option: send to animator */ }}>
                                        <img src={s} className="w-full h-full object-contain" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-void-600">
                                <Icon name="layout-grid" size={48} className="mb-2 opacity-20" />
                                <p>上传网格图以预览</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === MODE 3: ANIMATOR === */}
            {mode === 'animator' && (
                <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
                    <div className="glass-card p-6 rounded-2xl">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Icon name="film" className="text-purple-400" /> 动图配置</h3>
                        <div className="flex gap-2 h-24 mb-4">
                            <label className="flex-1 border-2 border-dashed border-void-700 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-void-900/50">
                                {animImg ? <img src={animImg} className="w-full h-full object-contain p-1" /> : <Icon name="upload" className="text-void-400 mb-1" />}
                                <span className="text-[10px] text-void-400 font-bold uppercase">{animImg ? '更换' : '上传序列'}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleAnimUpload} />
                            </label>
                            <div className="w-16 flex flex-col gap-2">
                                <input type="number" value={animCols} onChange={e => setAnimCols(e.target.value)} className="w-full bg-void-900 border border-void-700 rounded text-center text-white text-sm py-1" />
                                <input type="number" value={animRows} onChange={e => setAnimRows(e.target.value)} className="w-full bg-void-900 border border-void-700 rounded text-center text-white text-sm py-1" />
                            </div>
                        </div>
                        <div className="bg-void-900 p-3 rounded-lg border border-void-800 mb-4">
                            <div className="flex justify-between text-xs text-void-400 mb-2">
                                <span>速度 (FPS)</span>
                                <span className="text-purple-400 font-mono">{fps}</span>
                            </div>
                            <input type="range" min="1" max="24" value={fps} onChange={e => setFps(e.target.value)} className="w-full h-1 bg-void-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                        <Button disabled={!animRaw || isGenerating} onClick={generateGif} className="w-full" icon={isGenerating ? 'loader' : 'play'}>
                            {isGenerating ? '合成中...' : '生成 GIF'}
                        </Button>
                    </div>

                    <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px] bg-void-950 relative">
                        {animRes ? (
                            <div className="text-center animate-fade-in z-10">
                                <img src={animRes} className="w-48 h-48 object-contain mx-auto border-4 border-void-800 rounded-lg bg-void-900 checkerboard shadow-2xl mb-6" />
                                <a href={animRes} download="animated_emoji.gif" className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full font-bold text-sm inline-flex items-center gap-2 transition-colors">
                                    <Icon name="download" size={16} /> 保存 GIF
                                </a>
                            </div>
                        ) : (
                            <div className="text-void-700 text-center">
                                {isGenerating ? <Icon name="loader-2" size={48} className="animate-spin mx-auto mb-2 text-purple-500" /> : <Icon name="film" size={48} className="mx-auto mb-2 opacity-20" />}
                                <p className="text-sm">{isGenerating ? '正在渲染序列帧...' : '等待生成...'}</p>
                            </div>
                        )}
                        {/* Background Deco */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4c1d95 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.MeMakerTool = MeMakerTool; // 注意这里改了名字