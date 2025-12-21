const { useState } = React;
const { Icon } = window.SharedComponents;

const TOOLS_CONFIG = [
    { id: 'watermark', title: '去水印 Pro', desc: '智能像素反算，无损还原画质', icon: 'eraser', color: 'text-indigo-400', image: 'assets/icons/tool_watermark.png', component: 'WatermarkTool' },
    { id: 'memaker', title: '萌萌工坊', desc: '表情包咒语 / 智能切图 / 动图制作', icon: 'smile-plus', color: 'text-pink-400', image: 'assets/icons/tool_memaker.png', component: 'MeMakerTool' },
    { id: 'gallery', title: '幻境图谱', desc: '精选 AI 提示词灵感库', icon: 'aperture', color: 'text-cyan-400', image: 'assets/icons/tool_gallery.png', component: 'GalleryTool' },
];

const App = () => {
    const [view, setView] = useState('home');

    const renderContent = () => {
        if (view === 'home') {
            return (
                <div className="max-w-6xl mx-auto w-full py-12 px-4 animate-fade-in">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight drop-shadow-2xl">
                            Void<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">AI</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
                            墨智工坊打造的一站式 AI 生产力工具集。
                            <br /><span className="text-sm opacity-60">本地运行 · 隐私安全 · 极速体验</span>
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {TOOLS_CONFIG.map(tool => (
                            <div key={tool.id} onClick={() => setView(tool.id)} className="glass-panel rounded-2xl cursor-pointer group relative overflow-hidden h-72 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90 z-10 pointer-events-none" />
                                <img src={tool.image} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                                <div className="hidden w-full h-full bg-slate-900 items-center justify-center absolute inset-0"><Icon name={tool.icon} size={64} className={tool.color} /></div>
                                <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{tool.title}</h3>
                                    <p className="text-sm text-slate-400 line-clamp-1 opacity-80 group-hover:opacity-100">{tool.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const toolConfig = TOOLS_CONFIG.find(t => t.id === view);
        const ToolComponent = window.Tools && window.Tools[toolConfig?.component];
        return ToolComponent ? (
            <div className="flex-1 w-full h-full p-4 md:p-6 overflow-hidden flex flex-col">
                <ToolComponent />
            </div>
        ) : <div>Loading...</div>;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="h-[60px] border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-50">
                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setView('home')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <img src="assets/icons/logo.png" className="w-full h-full object-cover rounded-lg" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
                        <span className="hidden font-bold text-white">V</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base leading-none text-white">VoidAI Tools</span>
                        {view !== 'home' && <span className="text-[10px] text-indigo-400 font-bold tracking-wider mt-0.5 uppercase animate-fade-in">{TOOLS_CONFIG.find(t => t.id === view)?.title}</span>}
                    </div>
                </div>
                {view !== 'home' && (
                    <button onClick={() => setView('home')} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors flex items-center gap-2">
                        <Icon name="layout-grid" size={14} /> 首页
                    </button>
                )}
            </header>

            {/* Main Content (Scrollable) */}
            <main className="flex-1 overflow-hidden relative z-0 flex flex-col">
                {renderContent()}
            </main>

            {/* Footer (Fixed) */}
            <footer className="h-[40px] border-t border-slate-800 bg-slate-950 flex items-center justify-center px-6 shrink-0 z-50 text-[10px] text-slate-600 uppercase tracking-widest">
                <span className="mr-4">&copy; 2025 墨智工坊</span>
                <span className="w-px h-3 bg-slate-800 mx-2"></span>
                <span className="flex items-center gap-1"><Icon name="message-circle" size={10} className="text-green-500" /> AI夜航员</span>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);