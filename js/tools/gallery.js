const { useState, useEffect, useMemo } = React;
const { Icon, Button, useToast } = window.SharedComponents;

const GalleryTool = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('全部');
    const [selectedItem, setSelectedItem] = useState(null);
    const toast = useToast();

    useEffect(() => {
        fetch('assets/gallery/data.json')
            .then(r => r.json())
            .then(setItems)
            .catch(() => setItems([])); // 允许空数据，界面会显示无结果
    }, []);

    const allTags = useMemo(() => ['全部', ...new Set(items.flatMap(i => i.tags || []))], [items]);

    const filtered = items.filter(i =>
        (i.prompt.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedTag === '全部' || i.tags?.includes(selectedTag))
    );

    const copyText = (e, text) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast("Prompt 已复制");
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Filter Bar */}
            <div className="glass-panel p-3 rounded-xl mb-4 flex gap-4 items-center shrink-0">
                <div className="relative w-64 group">
                    <Icon name="search" className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="搜索..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:border-indigo-500 outline-none transition-all input-void"
                    />
                </div>
                <div className="w-px h-6 bg-slate-700"></div>
                <div className="flex-1 overflow-x-auto custom-scrollbar flex gap-2 pb-1">
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${selectedTag === tag ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Masonry Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <div className="masonry-grid pb-20">
                    {filtered.map(item => (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className="break-inside-avoid glass-panel rounded-xl overflow-hidden hover:border-indigo-500/50 cursor-zoom-in group relative mb-4 transition-all">
                            <div className="relative">
                                <img src={item.image.startsWith('http') ? item.image : `assets/gallery/images/${item.image}`} className="w-full h-auto object-cover block" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <button onClick={(e) => copyText(e, item.prompt)} className="self-end p-2 bg-white text-black rounded-full hover:scale-110 transition shadow-lg"><Icon name="copy" size={14} /></button>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900/50">
                                <p className="text-xs text-slate-300 line-clamp-2 font-mono opacity-80">{item.prompt}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10" onClick={() => setSelectedItem(null)}>
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"></div>
                    <div className="relative w-full max-w-5xl glass-panel rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-full animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="md:w-2/3 bg-black/50 flex items-center justify-center p-4 relative">
                            <img src={selectedItem.image.startsWith('http') ? selectedItem.image : `assets/gallery/images/${selectedItem.image}`} className="max-w-full max-h-full object-contain shadow-2xl" />
                        </div>
                        <div className="md:w-1/3 p-6 flex flex-col border-l border-slate-700/50 bg-slate-900/90">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="font-bold text-white">Prompt 详情</h3>
                                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white"><Icon name="x" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                                <p className="text-sm text-slate-300 font-mono leading-relaxed select-all">{selectedItem.prompt}</p>
                            </div>
                            <Button icon="copy" className="w-full" onClick={(e) => copyText(e, selectedItem.prompt)}>复制完整 Prompt</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.Tools = window.Tools || {};
window.Tools.GalleryTool = GalleryTool;