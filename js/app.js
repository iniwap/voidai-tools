const { useState, useEffect } = React;
const { Icon } = window.SharedComponents;

const TOOLS_CONFIG = [
    {
        id: 'watermark',
        title: 'Gemini 去水印 Pro',
        desc: '基于像素反算的无损去水印工具',
        icon: 'eraser',
        color: 'text-blue-400',
        image: 'assets/icons/tool_watermark.png',
        component: 'WatermarkTool'
    },
    {
        id: 'memaker',
        title: '萌萌工坊 MeMaker',
        desc: '表情包/切图/动图一站式工作台',
        icon: 'smile-plus',
        color: 'text-pink-400',
        image: 'assets/icons/tool_memaker.png',
        component: 'MeMakerTool'
    },
    {
        id: 'gallery',
        title: '幻境图谱 Gallery',
        desc: '精选 AI 提示词灵感库',
        icon: 'aperture',
        color: 'text-indigo-400',
        image: 'assets/icons/tool_gallery.png',
        component: 'GalleryTool'
    },
];

const App = () => {
    const [view, setView] = useState('home');

    const renderContent = () => {
        if (view === 'home') {
            return (
                <div className="animate-enter py-10 px-4 max-w-6xl mx-auto w-full">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
                            VoidAI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Tools</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            墨智工坊打造的一站式 AI 生产力工具集
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TOOLS_CONFIG.map(tool => (
                            <div
                                key={tool.id}
                                onClick={() => setView(tool.id)}
                                className="glass-panel rounded-2xl cursor-pointer group relative overflow-hidden flex flex-col h-64 hover:border-indigo-500/50 transition-all duration-300"
                            >
                                {/* 图标满铺设计 */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-10 pointer-events-none"></div>
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 overflow-hidden">
                                    <img
                                        src={tool.image}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                    <div className="hidden w-full h-full items-center justify-center bg-slate-900">
                                        <Icon name={tool.icon} className={tool.color} size={80} />
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 w-full p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                                        {tool.title}
                                    </h3>
                                    <p className="text-sm text-slate-300 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                                        {tool.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const toolConfig = TOOLS_CONFIG.find(t => t.id === view);
        if (toolConfig) {
            const ToolComponent = window.Tools && window.Tools[toolConfig.component];
            return ToolComponent ? (
                <div className="flex-1 w-full h-full p-4 md:p-6 overflow-hidden">
                    <ToolComponent />
                </div>
            ) : <div className="flex items-center justify-center h-full text-slate-500">组件加载中...</div>;
        }
        return <div>404</div>;
    };

    return (
        <div className="h-full flex flex-col bg-void-950 text-slate-200">
            {/* Header: 固定高度 60px */}
            <header className="h-[60px] border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-6 justify-between shrink-0">
                <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => setView('home')}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <img
                            src="assets/icons/logo.png"
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                        />
                        <div className="hidden text-white font-bold text-lg">V</div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="font-bold text-base leading-none text-white tracking-tight">VoidAI Tools</span>
                        {view !== 'home' && (
                            <span className="text-[10px] text-indigo-400 font-medium animate-enter mt-0.5">
                                {TOOLS_CONFIG.find(t => t.id === view)?.title}
                            </span>
                        )}
                    </div>
                </div>

                {view !== 'home' && (
                    <button
                        onClick={() => setView('home')}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                    >
                        <Icon name="layout-grid" size={14} /> 首页
                    </button>
                )}
            </header>

            {/* Main: 自动填满剩余空间 */}
            <main className="flex-1 min-h-0 overflow-hidden relative z-0 flex flex-col">
                {renderContent()}
            </main>

            {/* Footer: 固定高度 48px，始终存在 */}
            <footer className="h-[48px] border-t border-slate-800 bg-slate-950 flex items-center justify-center px-6 shrink-0 z-50">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>&copy; {new Date().getFullYear()} 墨智工坊</span>
                    <span className="text-slate-800">|</span>
                    <a href="https://aiforge.taobao.com/" target="_blank" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                        <Icon name="shopping-bag" size={12} /> 淘宝店铺
                    </a>
                    <span className="text-slate-800">|</span>
                    <span className="flex items-center gap-1.5">
                        <Icon name="message-circle" size={12} className="text-green-500" />
                        公众号：<span className="text-slate-300">AI夜航员</span>
                    </span>
                </div>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);