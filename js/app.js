const { useState } = React;
const { Icon } = window.SharedComponents;

const TOOLS = [
    { id: 'watermark', title: '去水印 Pro', desc: '无损还原纯净画质', icon: 'eraser', color: 'text-indigo-400', image: 'assets/icons/tool_watermark.png', component: 'WatermarkTool' },
    { id: 'memaker', title: '萌萌工坊', desc: '咒语 / 切图 / 动图', icon: 'smile-plus', color: 'text-pink-400', image: 'assets/icons/tool_memaker.png', component: 'MeMakerTool' },
    { id: 'gallery', title: '幻境图谱', desc: 'AI 提示词灵感库', icon: 'aperture', color: 'text-cyan-400', image: 'assets/icons/tool_gallery.png', component: 'GalleryTool' },
];

const App = () => {
    const [view, setView] = useState('home');

    return (
        <div className="flex flex-col h-full bg-void-950 text-slate-200">
            <header className="h-[56px] border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-50">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">V</div>
                    <span className="font-bold text-lg">VoidAI</span>
                </div>
                {view !== 'home' && <button onClick={() => setView('home')} className="text-xs bg-slate-800 px-3 py-1.5 rounded-lg hover:text-white transition">首页</button>}
            </header>

            <main className="flex-1 min-h-0 relative z-0 flex flex-col">
                {view === 'home' ? (
                    <div className="max-w-5xl mx-auto w-full py-12 px-4 animate-enter overflow-y-auto custom-scrollbar">
                        <div className="text-center mb-12 mt-10">
                            <h1 className="text-5xl font-extrabold text-white mb-4">Void<span className="text-indigo-400">AI</span> Tools</h1>
                            <p className="text-slate-400">一站式 AI 生产力工具集</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {TOOLS.map(t => (
                                <div key={t.id} onClick={() => setView(t.id)} className="glass-panel rounded-2xl cursor-pointer group relative overflow-hidden h-64 hover:border-indigo-500/50 transition-all duration-300">
                                    <img src={t.image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500" onError={e => e.target.style.display = 'none'} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-6">
                                        <h3 className="text-xl font-bold text-white mb-1">{t.title}</h3>
                                        <p className="text-sm text-slate-400">{t.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 w-full h-full p-4 md:p-6 overflow-hidden">
                        {window.Tools && window.Tools[TOOLS.find(t => t.id === view)?.component]
                            ? React.createElement(window.Tools[TOOLS.find(t => t.id === view).component])
                            : <div className="text-center mt-20">Loading Component...</div>}
                    </div>
                )}
            </main>

            <footer className="h-[40px] border-t border-slate-800 bg-slate-950 flex items-center justify-center px-6 shrink-0 z-50 text-[10px] text-slate-600 uppercase tracking-widest">
                <span>&copy; 2025 墨智工坊</span>
            </footer>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);