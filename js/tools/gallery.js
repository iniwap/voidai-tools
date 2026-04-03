const { useState, useEffect, useMemo } = React;
const { Icon, Button, useToast, SectionHeader } = window.SharedComponents;

const GalleryTool = () => {
    const [items, setItems] = useState([]);
    const [parts, setParts] = useState([]);
    const [loadedParts, setLoadedParts] = useState(0);
    const [isLoadingPart, setIsLoadingPart] = useState(false);
    const [isBootstrapping, setIsBootstrapping] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('全部');
    const [visibleCount, setVisibleCount] = useState(12);
    const [selectedItem, setSelectedItem] = useState(null);
    const toast = useToast();

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            try {
                const response = await fetch('assets/gallery/index.json');
                const indexData = await response.json();
                if (cancelled) {
                    return;
                }

                const nextParts = indexData.parts || [];
                setParts(nextParts);

                if (nextParts.length > 0) {
                    setIsLoadingPart(true);
                    const firstResponse = await fetch(`assets/gallery/${nextParts[0].file}`);
                    const firstPart = await firstResponse.json();
                    if (cancelled) {
                        return;
                    }
                    setItems(firstPart);
                    setLoadedParts(1);
                } else {
                    setItems([]);
                    setLoadedParts(0);
                }
            } catch (error) {
                if (!cancelled) {
                    setLoadError('加载图谱数据失败');
                    setItems([]);
                }
            } finally {
                if (!cancelled) {
                    setIsBootstrapping(false);
                    setIsLoadingPart(false);
                }
            }
        };

        bootstrap();

        return () => {
            cancelled = true;
        };
    }, []);

    const allTags = useMemo(() => ['全部', ...new Set(items.flatMap(i => i.tags || []))], [items]);
    const filtered = items.filter(i => (i.prompt.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedTag === '全部' || i.tags?.includes(selectedTag)));
    const visible = filtered.slice(0, visibleCount);
    const getImageUrl = (url) => url.startsWith('http') ? url : `assets/gallery/images/${String(url).replace(/^\/+/, '')}`;
    const copyText = (e, text) => { if (e) e.stopPropagation(); navigator.clipboard.writeText(text); toast("复制成功"); };
    const hasMoreParts = loadedParts < parts.length;

    const loadNextPart = async () => {
        if (isLoadingPart || !hasMoreParts) {
            return;
        }

        const nextPart = parts[loadedParts];
        if (!nextPart) {
            return;
        }

        setIsLoadingPart(true);
        try {
            const response = await fetch(`assets/gallery/${nextPart.file}`);
            const payload = await response.json();
            setItems(prev => [...prev, ...payload]);
            setLoadedParts(prev => prev + 1);
        } catch (error) {
            setLoadError('加载更多数据失败');
        } finally {
            setIsLoadingPart(false);
        }
    };

    const handleLoadMore = async () => {
        if (visibleCount + 12 <= items.length) {
            setVisibleCount(p => p + 12);
            return;
        }

        if (hasMoreParts) {
            await loadNextPart();
        }

        setVisibleCount(p => p + 12);
    };

    useEffect(() => {
        if ((!searchTerm && selectedTag === '全部') || isBootstrapping || isLoadingPart || !hasMoreParts) {
            return;
        }
        loadNextPart();
    }, [searchTerm, selectedTag, loadedParts, hasMoreParts, isBootstrapping, isLoadingPart]);

    return (
        <div className="flex flex-col h-full animate-enter">
            <div className="glass-panel p-3 rounded-xl mb-4 flex gap-4 items-center shrink-0">
                <div className="relative w-64 group">
                    <div className="absolute left-3 top-2.5 text-slate-500"><Icon name="search" /></div>
                    <input type="text" placeholder="搜索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 input-void rounded-lg text-sm" />
                </div>
                <div className="w-px h-6 bg-slate-700"></div>
                <div className="flex-1 overflow-x-auto custom-scrollbar flex gap-2 pb-1">
                    {allTags.map(tag => (
                        <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${selectedTag === tag ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-800'}`}>{tag}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                {loadError && (
                    <div className="glass-panel rounded-xl p-3 mb-4 text-sm text-rose-300 border border-rose-500/30">
                        {loadError}
                    </div>
                )}
                <div className="masonry-grid pb-20">
                    {visible.map(item => (
                        <div key={item.id} onClick={() => setSelectedItem(item)} className="break-inside-avoid glass-panel rounded-xl overflow-hidden hover:border-indigo-500/50 cursor-zoom-in group relative mb-4 transition-all">
                            <div className="relative">
                                <img src={getImageUrl(item.image)} className="w-full h-auto object-cover block" loading="lazy" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <button onClick={(e) => copyText(e, item.prompt)} className="self-end p-2 bg-white text-black rounded-full hover:scale-110 transition shadow-lg"><Icon name="copy" size={14} /></button>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-900/50">
                                <p className="text-xs text-slate-300 line-clamp-2 font-mono opacity-80 mb-2">{item.prompt}</p>
                                <div className="flex gap-1 flex-wrap">{item.tags?.slice(0, 3).map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{t}</span>)}</div>
                            </div>
                        </div>
                    ))}
                </div>
                {(visible.length < filtered.length || hasMoreParts) && (
                    <div className="text-center pb-8">
                        <Button variant="secondary" onClick={handleLoadMore}>
                            {isBootstrapping || isLoadingPart ? '加载中...' : '加载更多'}
                        </Button>
                    </div>
                )}
            </div>

            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10" onClick={() => setSelectedItem(null)}>
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-enter"></div>
                    <div className="relative w-full max-w-5xl glass-panel rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh] animate-enter" onClick={e => e.stopPropagation()}>
                        <div className="md:w-2/3 bg-black/50 flex items-center justify-center p-4 relative"><img src={getImageUrl(selectedItem.image)} className="max-w-full max-h-full object-contain shadow-2xl" /></div>
                        <div className="md:w-1/3 p-6 flex flex-col border-l border-slate-700/50 bg-slate-900/90">
                            <SectionHeader title="Prompt 详情" icon="file-text" />
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
