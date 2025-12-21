// js/tools/gallery.js
const { useState, useEffect, useMemo } = React;
const { Icon, Button, PageHeader } = window.SharedComponents;

const GalleryTool = ({ onBack }) => {
    // State
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('全部');
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedItem, setSelectedItem] = useState(null); // Modal state

    // Load Data
    useEffect(() => {
        fetch('assets/gallery/data.json')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.warn("Load failed, using mock", err);
                // Mock for testing
                setItems([
                    { id: 1, prompt: "Cyberpunk girl, neon lights", tags: ["Cyberpunk", "Portrait"], image: "https://via.placeholder.com/600x400" },
                    { id: 2, prompt: "Cute cat, watercolor style", tags: ["Animal", "Cute"], image: "https://via.placeholder.com/600x400" }
                ]);
                setIsLoading(false);
            });
    }, []);

    // Derived Data: Tags
    const allTags = useMemo(() => {
        const tags = new Set(['全部']);
        items.forEach(item => {
            if (item.tags) item.tags.forEach(t => tags.add(t));
        });
        return Array.from(tags);
    }, [items]);

    // Derived Data: Filtered Items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.prompt.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = selectedTag === '全部' || (item.tags && item.tags.includes(selectedTag));
            return matchesSearch && matchesTag;
        });
    }, [items, searchTerm, selectedTag]);

    // Derived Data: Visible Items
    const visibleItems = filteredItems.slice(0, visibleCount);

    // Handlers
    const loadMore = () => setVisibleCount(prev => prev + 12);

    const copyText = (e, text) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        alert("Prompt 已复制!");
    };

    const getImageUrl = (url) => url.startsWith('http') ? url : `assets/gallery/images/${url}`;

    return (
        <div className="animate-slide-up w-full pb-20">
            <PageHeader title="幻境图谱 (Prompt Gallery)" desc="精选 AI 提示词库，支持标签筛选与详情查看。" onBack={onBack} />

            {/* Filter Bar */}
            <div className="sticky top-[70px] z-30 bg-void-950/90 backdrop-blur-md py-4 border-b border-void-800 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:border-0 sm:static sm:backdrop-blur-none mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search */}
                    <div className="relative w-full md:w-96 group">
                        <Icon name="search" className="absolute left-3 top-3 text-void-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="搜索 Prompt..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(12); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-void-900 border border-void-700 rounded-xl text-white focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>
                    {/* Tags */}
                    <div className="w-full md:w-auto overflow-x-auto no-scrollbar flex gap-2 pb-1">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => { setSelectedTag(tag); setVisibleCount(12); }}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedTag === tag ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-void-900 border-void-800 text-void-400 hover:bg-void-800 hover:text-white'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-void-500"><Icon name="loader-2" className="animate-spin inline mr-2" /> 加载中...</div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 text-void-500">没有找到相关结果</div>
            ) : (
                <>
                    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                        {visibleItems.map(item => (
                            <div key={item.id} onClick={() => setSelectedItem(item)} className="break-inside-avoid bg-void-900 rounded-xl overflow-hidden border border-void-800 hover:border-indigo-500/50 hover:translate-y-[-4px] hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-zoom-in group">
                                <div className="relative">
                                    <img
                                        src={getImageUrl(item.image)}
                                        className="w-full h-auto object-cover bg-void-950"
                                        loading="lazy"
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Error'}
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        <p className="text-white text-xs line-clamp-2 mb-3 font-mono">{item.prompt}</p>
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-1">
                                                {item.tags?.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur text-white">{t}</span>)}
                                            </div>
                                            <button onClick={(e) => copyText(e, item.prompt)} className="p-2 bg-white text-black rounded-full hover:scale-110 transition"><Icon name="copy" size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Load More */}
                    {visibleCount < filteredItems.length && (
                        <div className="flex justify-center mt-12">
                            <Button onClick={loadMore} variant="secondary" className="px-8 rounded-full">
                                加载更多 ({filteredItems.length - visibleCount})
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* === MODAL (Detail View) === */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-fade-in"></div>
                    <div className="relative w-full max-w-5xl bg-void-900 border border-void-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                        {/* Image Side */}
                        <div className="md:w-2/3 bg-black flex items-center justify-center p-4 overflow-auto">
                            <img src={getImageUrl(selectedItem.image)} className="max-w-full max-h-[80vh] object-contain rounded" />
                        </div>
                        {/* Info Side */}
                        <div className="md:w-1/3 p-6 flex flex-col border-l border-void-800 bg-void-900">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Prompt 详情</h3>
                                    <span className="text-xs text-void-500">ID: #{selectedItem.id}</span>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="text-void-400 hover:text-white"><Icon name="x" size={24} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <div className="bg-void-950 p-4 rounded-xl border border-void-800 relative group">
                                    <p className="text-sm text-void-300 font-mono leading-relaxed select-all">{selectedItem.prompt}</p>
                                    <button onClick={(e) => copyText(e, selectedItem.prompt)} className="absolute top-2 right-2 p-1.5 bg-void-800 text-void-400 rounded hover:text-white hover:bg-indigo-600 transition"><Icon name="copy" size={14} /></button>
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-xs font-bold text-void-500 uppercase mb-3">标签</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedItem.tags?.map(t => (
                                            <span key={t} className="px-3 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                                <Icon name="tag" size={10} /> {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 pt-6 border-t border-void-800">
                                <Button onClick={(e) => copyText(e, selectedItem.prompt)} className="w-full" icon="copy">复制完整 Prompt</Button>
                                <a href={getImageUrl(selectedItem.image)} download target="_blank" className="w-full py-2.5 rounded-lg border border-void-700 text-void-300 hover:bg-void-800 hover:text-white text-center text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <Icon name="download" size={16} /> 下载原图
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