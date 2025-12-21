const { useState, useEffect, useMemo } = React;
const { Icon, Button, SectionTitle } = window.SharedComponents;

const GalleryTool = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('全部');
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedItem, setSelectedItem] = useState(null);

    // Mock Data (确保有数据展示)
    useEffect(() => {
        fetch('assets/gallery/data.json')
            .then(r => r.json())
            .then(setItems)
            .catch(() => {
                setItems([
                    { id: 1, prompt: "Cyberpunk girl, neon lights, highly detailed, 8k", tags: ["Cyberpunk", "Portrait"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=Cyberpunk" },
                    { id: 2, prompt: "Cute cat, watercolor style, soft lighting", tags: ["Animal", "Cute"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=Cat" },
                    { id: 3, prompt: "Futuristic city, flying cars, sunset", tags: ["Sci-Fi", "Landscape"], image: "https://via.placeholder.com/600x400/0f172a/ffffff?text=City" }
                ]);
            });
    }, []);

    const allTags = useMemo(() => {
        const t = new Set(['全部']);
        items.forEach(i => i.tags?.forEach(tag => t.add(tag)));
        return Array.from(t);
    }, [items]);

    const filtered = useMemo(() => items.filter(i =>
        (i.prompt.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedTag === '全部' || i.tags?.includes(selectedTag))
    ), [items, searchTerm, selectedTag]);

    const visible = filtered.slice(0, visibleCount);
    const getImageUrl = (url) => url.startsWith('http') ? url : `assets/gallery/images/${url}`;

    const copyText = (e, text) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        alert("Prompt 已复制");
    };

    return (
        <div className="flex flex-col h-full animate-enter">
            {/* Filter Bar */}
            <div className="flex-shrink-0 mb-6 space-y-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Icon name="search" className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-indigo-400" size={18} />
                        <input
                            type="text"
                            placeholder="搜索风格、关键词..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                </div>
                {/* Scrollable Tags */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mask-linear-fade">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(tag)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${selectedTag === tag ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Waterfall Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 pb-10">
                    {visible.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="break-inside-avoid glass-panel rounded-xl overflow-hidden hover:border-indigo-500/50 cursor-zoom-in group relative"
                        >
                            <div className="relative">
                                <img
                                    src={getImageUrl(item.image)}
                                    className="w-full h-auto object-cover"
                                    loading="lazy"
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Error'}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={(e) => copyText(e, item.prompt)}
                                            className="p-2 bg-white text-slate-900 rounded-full hover:scale-110 transition shadow-lg"
                                            title="复制 Prompt"
                                        >
                                            <Icon name="copy" size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900/50">
                                <p className="text-xs text-slate-300 line-clamp-2 font-mono mb-2 opacity-80">{item.prompt}</p>
                                <div className="flex gap-1 flex-wrap">
                                    {item.tags?.slice(0, 3).map(t => (
                                        <span key={t} className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {visible.length < filtered.length && (
                    <div className="text-center pb-8">
                        <Button onClick={() => setVisibleCount(prev => prev + 12)} variant="secondary" className="rounded-full px-8">加载更多</Button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8" onClick={() => setSelectedItem(null)}>
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in"></div>
                    <div
                        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] animate-enter"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="md:w-2/3 bg-black flex items-center justify-center p-4 overflow-auto relative">
                            <img src={getImageUrl(selectedItem.image)} className="max-w-full max-h-full object-contain shadow-2xl" />
                        </div>
                        <div className="md:w-1/3 p-6 flex flex-col border-l border-slate-800 bg-slate-900">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-white text-lg">Prompt 详情</h3>
                                    <span className="text-xs text-slate-500 font-mono">ID: #{selectedItem.id}</span>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition"><Icon name="x" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative group">
                                    <p className="text-sm text-slate-300 font-mono leading-relaxed select-all">{selectedItem.prompt}</p>
                                    <button
                                        onClick={(e) => copyText(e, selectedItem.prompt)}
                                        className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-400 rounded border border-slate-700 hover:text-white hover:border-indigo-500 transition opacity-0 group-hover:opacity-100"
                                    >
                                        <Icon name="copy" size={14} />
                                    </button>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">标签</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedItem.tags?.map(t => (
                                            <span key={t} className="px-2 py-1 rounded text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                                <Icon name="tag" size={12} /> {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-slate-800">
                                <Button onClick={(e) => copyText(e, selectedItem.prompt)} icon="copy" className="w-full">复制完整 Prompt</Button>
                                <a href={getImageUrl(selectedItem.image)} download target="_blank" className="block">
                                    <Button variant="secondary" icon="download" className="w-full">下载原图</Button>
                                </a>
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