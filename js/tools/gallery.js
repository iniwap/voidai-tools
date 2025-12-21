const { useState, useEffect, useMemo } = React;
const { Icon, Button } = window.SharedComponents;

const GalleryTool = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('全部');
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedItem, setSelectedItem] = useState(null);

    // Mock Data Fallback
    useEffect(() => {
        fetch('assets/gallery/data.json')
            .then(res => res.json())
            .then(setItems)
            .catch(() => {
                setItems([
                    { id: 1, prompt: "Cyberpunk girl, neon lights, 8k", tags: ["Cyberpunk", "Portrait"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=Cyberpunk" },
                    { id: 2, prompt: "Cute cat, watercolor", tags: ["Animal", "Cute"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=Cat" },
                    { id: 3, prompt: "Sci-fi city, sunset", tags: ["Sci-Fi", "Landscape"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=City" }
                ]);
            });
    }, []);

    const allTags = useMemo(() => { const t = new Set(['全部']); items.forEach(i => i.tags?.forEach(tag => t.add(tag))); return Array.from(t); }, [items]);
    const filtered = useMemo(() => items.filter(i => (i.prompt.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedTag === '全部' || i.tags?.includes(selectedTag))), [items, searchTerm, selectedTag]);
    const visible = filtered.slice(0, visibleCount);
    const getImageUrl = (url) => url.startsWith('http') ? url : `assets/gallery/images/${url}`;

    return (
        <div className="h-full flex flex-col overflow-hidden p-4 md:p-6">
            {/* 顶部筛选区 */}
            <div className="flex-shrink-0 mb-4 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1 group">
                        <Icon name="search" className="absolute left-3 top-2.5 text-void-400 group-focus-within:text-blue-400" size={18} />
                        <input type="text" placeholder="搜索 Prompt..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-void-900 border border-void-700 rounded-xl text-white focus:border-blue-500 outline-none transition-all" />
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${selectedTag === tag ? 'bg-blue-600 border-blue-500 text-white' : 'bg-void-900 border-void-800 text-void-400'}`}>{tag}</button>
                    ))}
                </div>
            </div>

            {/* 瀑布流网格 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 pb-10">
                    {visible.map(item => (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className="break-inside-avoid bg-void-900 rounded-xl overflow-hidden border border-void-800 hover:border-blue-500/50 cursor-zoom-in group">
                            <div className="relative">
                                <img src={getImageUrl(item.image)} className="w-full h-auto object-cover" loading="lazy" onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Error'} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <p className="text-white text-xs line-clamp-2 mb-2 font-mono">{item.prompt}</p>
                                    <div className="flex gap-1">{item.tags?.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white">{t}</span>)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {visible.length < filtered.length && <div className="text-center pb-8"><Button onClick={() => setVisibleCount(prev => prev + 12)} variant="secondary" className="rounded-full text-xs">加载更多</Button></div>}
            </div>

            {/* 详情弹窗 */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-fade-in"></div>
                    <div className="relative w-full max-w-4xl bg-void-900 border border-void-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="md:w-2/3 bg-black flex items-center justify-center p-4 overflow-auto"><img src={getImageUrl(selectedItem.image)} className="max-w-full max-h-[80vh] object-contain rounded" /></div>
                        <div className="md:w-1/3 p-6 flex flex-col border-l border-void-800 bg-void-900">
                            <div className="flex justify-between mb-4"><h3 className="font-bold text-white">详情</h3><button onClick={() => setSelectedItem(null)} className="text-void-400 hover:text-white"><Icon name="x" /></button></div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar"><div className="bg-void-950 p-4 rounded-xl border border-void-800 text-sm text-void-300 font-mono leading-relaxed select-all">{selectedItem.prompt}</div><div className="mt-4 flex flex-wrap gap-2">{selectedItem.tags?.map(t => <span key={t} className="px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400">{t}</span>)}</div></div>
                            <div className="mt-4 flex flex-col gap-2"><Button onClick={() => { navigator.clipboard.writeText(selectedItem.prompt); alert('复制成功') }} icon="copy">复制 Prompt</Button><a href={getImageUrl(selectedItem.image)} download target="_blank" className="w-full py-2.5 rounded-lg border border-void-700 text-void-300 hover:bg-void-800 hover:text-white text-center text-sm font-medium transition-colors flex items-center justify-center gap-2"><Icon name="download" size={16} /> 下载原图</a></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.GalleryTool = GalleryTool;