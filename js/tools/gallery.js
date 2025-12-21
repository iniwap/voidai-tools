const { useState, useEffect, useMemo } = React;
const { Icon, Button, SectionHeader } = window.SharedComponents;

const GalleryTool = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('全部');
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        fetch('assets/gallery/data.json').then(r => r.json()).then(setItems).catch(() => {
            setItems([
                { id: 1, prompt: "Cyberpunk girl, neon lights, highly detailed, 8k", tags: ["Cyberpunk", "Portrait"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=Demo1" },
                { id: 2, prompt: "Cute cat, watercolor style, soft lighting", tags: ["Animal", "Cute"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=Demo2" }
            ]);
        });
    }, []);

    const allTags = useMemo(() => { const t = new Set(['全部']); items.forEach(i => i.tags?.forEach(tag => t.add(tag))); return Array.from(t); }, [items]);
    const filtered = useMemo(() => items.filter(i => (i.prompt.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedTag === '全部' || i.tags?.includes(selectedTag))), [items, searchTerm, selectedTag]);
    const visible = filtered.slice(0, visibleCount);
    const getImageUrl = (url) => url.startsWith('http') ? url : `assets/gallery/images/${url}`;
    const copyText = (e, text) => { if (e) e.stopPropagation(); navigator.clipboard.writeText(text); alert("已复制"); };

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            {/* 筛选栏 */}
            <div className="glass-panel p-4 rounded-xl mb-6 flex flex-col md:flex-row gap-4 shrink-0">
                <div className="relative w-full md:w-80 group">
                    <div className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-indigo-400"><Icon name="search" /></div>
                    <input type="text" placeholder="搜索 Prompt..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div className="flex-1 overflow-x-auto custom-scrollbar flex gap-2 pb-1">
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${selectedTag === tag ? 'bg-indigo-600 border-indigo-500 text-white shadow' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* 瀑布流内容 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-20">
                    {visible.map(item => (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className="break-inside-avoid glass-panel rounded-xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-zoom-in group relative mb-4">
                            <div className="relative">
                                <img src={getImageUrl(item.image)} className="w-full h-auto object-cover block" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <div className="flex justify-end"><button onClick={(e) => copyText(e, item.prompt)} className="p-2 bg-white/90 text-black rounded-full hover:scale-110 transition"><Icon name="copy" size={14} /></button></div>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900/80 backdrop-blur-sm">
                                <p className="text-xs text-slate-300 line-clamp-2 font-mono opacity-80 mb-2">{item.prompt}</p>
                                <div className="flex gap-1 flex-wrap">{item.tags?.slice(0, 3).map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{t}</span>)}</div>
                            </div>
                        </div>
                    ))}
                </div>
                {visible.length < filtered.length && <div className="text-center pb-8"><Button variant="secondary" onClick={() => setVisibleCount(p => p + 12)}>加载更多</Button></div>}
            </div>

            {/* Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10" onClick={() => setSelectedItem(null)}>
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-fade-in"></div>
                    <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-full animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="md:w-2/3 bg-black flex items-center justify-center p-4 relative overflow-hidden">
                            <img src={getImageUrl(selectedItem.image)} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="md:w-1/3 p-6 flex flex-col border-l border-slate-800 bg-slate-900">
                            <div className="flex justify-between items-start mb-6">
                                <div><h3 className="font-bold text-white text-lg">Prompt 详情</h3><span className="text-xs text-slate-500 font-mono">ID: #{selectedItem.id}</span></div>
                                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white"><Icon name="x" size={24} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                                <p className="text-sm text-slate-300 font-mono leading-relaxed select-all">{selectedItem.prompt}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button className="flex-1" icon="copy" onClick={(e) => copyText(e, selectedItem.prompt)}>复制</Button>
                                <a href={getImageUrl(selectedItem.image)} download target="_blank" className="flex-1"><Button variant="secondary" icon="download" className="w-full">下载原图</Button></a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.GalleryTool = GalleryTool;