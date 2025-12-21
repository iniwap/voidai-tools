// js/tools/watermark.js
const { useState, useEffect } = React;
const { Icon, Button, PageHeader } = window.SharedComponents;

const WatermarkTool = ({ onBack }) => {
    const [files, setFiles] = useState([]);
    const [masks, setMasks] = useState({ 48: null, 96: null });
    const [status, setStatus] = useState('loading_assets');

    // 加载 Mask 资源
    useEffect(() => {
        const load = (src) => new Promise((resolve, reject) => {
            const img = new Image(); img.crossOrigin = "Anonymous";
            img.onload = () => resolve(img); img.onerror = () => reject(); img.src = src;
        });
        // 假设资源放在 assets/watermark/ 下
        Promise.allSettled([load('assets/watermark/bg_48.png'), load('assets/watermark/bg_96.png')])
            .then(([r48, r96]) => {
                const m = {};
                if (r48.status === 'fulfilled') m[48] = r48.value;
                if (r96.status === 'fulfilled') m[96] = r96.value;
                setMasks(m);
                setStatus(Object.keys(m).length ? 'ready' : 'error_assets');
            });
    }, []);

    // 核心处理逻辑
    const processImage = async (fileObj) => {
        fileObj.status = 'processing';
        setFiles([...files]);
        await new Promise(r => setTimeout(r, 50)); // UI breathe

        try {
            const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = fileObj.original; });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);

            // Mask Selection Logic
            let mask = masks[48];
            if (img.naturalWidth > 2048 && masks[96]) mask = masks[96];
            if (!mask && masks[96]) mask = masks[96];
            if (!mask) throw new Error("Mask asset missing");

            // Processing
            const mCanvas = document.createElement('canvas');
            mCanvas.width = mask.naturalWidth; mCanvas.height = mask.naturalHeight;
            const mCtx = mCanvas.getContext('2d'); mCtx.drawImage(mask, 0, 0);
            const mData = mCtx.getImageData(0, 0, mask.naturalWidth, mask.naturalHeight).data;
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const pad = 24; // Padding
            const startX = canvas.width - mask.naturalWidth - pad;
            const startY = canvas.height - mask.naturalHeight - pad;

            for (let y = 0; y < mask.naturalHeight; y++) {
                for (let x = 0; x < mask.naturalWidth; x++) {
                    let gX = startX + x, gY = startY + y;
                    if (gX >= canvas.width || gY >= canvas.height) continue;
                    const idx = (gY * canvas.width + gX) * 4;
                    const mIdx = (y * mask.naturalWidth + x) * 4;
                    let alpha = mData[mIdx + 3] / 255.0;
                    if (alpha < 0.01) continue;
                    if (alpha > 0.95) alpha = 0.95;
                    for (let c = 0; c < 3; c++) {
                        imgData.data[idx + c] = Math.min(255, Math.max(0, (imgData.data[idx + c] - 255 * alpha) / (1 - alpha)));
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);

            canvas.toBlob(blob => {
                fileObj.result = URL.createObjectURL(blob);
                fileObj.blob = blob;
                fileObj.status = 'done';
                setFiles([...files]);
            }, 'image/png');
        } catch (e) {
            console.error(e);
            fileObj.status = 'error';
            setFiles([...files]);
        }
    };

    const handleUpload = (e) => {
        const newFiles = Array.from(e.target.files).map(f => ({
            id: Math.random(), file: f, original: URL.createObjectURL(f), status: 'pending'
        }));
        const updated = [...files, ...newFiles];
        setFiles(updated);
        newFiles.forEach(f => processImage(f));
    };

    return (
        <div className="animate-slide-up w-full">
            <PageHeader title="Gemini 去水印 Pro" desc="基于像素反算的无损去水印工具，还原纯净画质。" onBack={onBack} />

            <div className="flex gap-4 mb-6">
                <label className="cursor-pointer">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
                    <div className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/30">
                        <Icon name="upload-cloud" size={20} /> 上传图片
                    </div>
                </label>
                {status === 'error_assets' && <div className="text-red-400 flex items-center gap-2"><Icon name="alert-triangle" /> 缺少 assets/watermark/bg_48.png</div>}
            </div>

            {files.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
                    {files.map(f => (
                        <div key={f.id} className="relative aspect-square bg-void-800 rounded-xl overflow-hidden border border-void-700 group hover:border-blue-500 transition-colors">
                            <img src={f.result || f.original} className="w-full h-full object-cover checkerboard" />

                            {/* Status Overlay */}
                            <div className="absolute top-2 left-2">
                                {f.status === 'processing' && <span className="bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded-full animate-pulse">处理中...</span>}
                                {f.status === 'done' && <span className="bg-green-600/90 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1"><Icon name="check" size={10} /> 完成</span>}
                            </div>

                            {/* Actions Overlay */}
                            {f.status === 'done' && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                    <a href={f.result} download={`clean_${f.file.name}`} className="p-3 bg-white text-black rounded-full hover:scale-110 transition shadow-xl">
                                        <Icon name="download" size={20} />
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-[50vh] border-2 border-dashed border-void-800 rounded-3xl flex flex-col items-center justify-center text-void-400 bg-void-900/30">
                    <div className="p-6 bg-void-800/50 rounded-full mb-4"><Icon name="images" size={48} className="opacity-50" /></div>
                    <p>拖拽图片到这里，支持批量处理</p>
                </div>
            )}
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.WatermarkTool = WatermarkTool;