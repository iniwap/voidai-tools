const { useState, useEffect } = React;
const { Icon } = window.SharedComponents;

// 配置中心
const TOOLS_CONFIG = [
    {
        id: 'watermark',
        title: 'Gemini 去水印 Pro',
        desc: '无损还原纯净画质',
        icon: 'eraser',
        color: 'text-blue-400',
        image: 'assets/icons/tool_watermark.png',
        component: 'WatermarkTool'
    },
    {
        id: 'memaker',
        title: '萌萌工坊 MeMaker',
        desc: '表情包/切图/动图一站式',
        icon: 'smile-plus',
        color: 'text-pink-400',
        image: 'assets/icons/tool_memaker.png',
        component: 'MeMakerTool'
    },
    {
        id: 'gallery',
        title: '幻境图谱 Gallery',
        desc: 'AI 提示词灵感库',
        icon: 'aperture',
        color: 'text-indigo-400',
        image: 'assets/icons/tool_gallery.png',
        component: 'GalleryTool'
    },
];

const App = () => {
    const [view, setView] = useState('home');

    // 渲染主视图
    const renderContent = () => {
        if (view === 'home') {
            return (
                <div className="animate-fade-in py-8 px-4 md:px-8 max-w-7xl mx-auto w-full">
                    {/* Hero Section */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-violet-200 mb-3 tracking-tight">
                            释放 AI 的无限潜能
                        </h1>
                        <p className="text-void-400 text-sm md:text-base max-w-xl mx-auto">
                            墨智工坊提供的一站式 AI 辅助工具集。无需登录，本地运行，隐私安全。
                        </p>
                    </div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {TOOLS_CONFIG.map(tool => (
                            <div
                                key={tool.id}
                                onClick={() => setView(tool.id)}
                                className="glass-card rounded-2xl cursor-pointer group relative overflow-hidden flex flex-col h-64"
                            >
                                {/* 1. 图标区域 (顶满设计，无边距) */}
                                <div className="h-40 w-full relative overflow-hidden bg-void-900/50 group-hover:bg-void-800/50 transition-colors">
                                    <img
                                        src={tool.image}
                                        alt={tool.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    {/* 兜底 SVG (当图片不存在时居中显示) */}
                                    <div className="hidden w-full h-full items-center justify-center">
                                        <Icon name={tool.icon} className={tool.color} size={64} />
                                    </div>

                                    {/* 悬停时的进入按钮 */}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur rounded-full p-2 text-white">
                                        <Icon name="arrow-right" size={16} />
                                    </div>
                                </div>

                                {/* 2. 信息区域 */}
                                <div className="p-5 flex-1 flex flex-col justify-center border-t border-void-800 bg-void-900/20 backdrop-blur-sm">
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors truncate">
                                        {tool.title}
                                    </h3>
                                    <p className="text-xs text-void-400 line-clamp-2 leading-relaxed">
                                        {tool.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 渲染具体工具 (动态加载)
        const toolConfig = TOOLS_CONFIG.find(t => t.id === view);
        if (toolConfig) {
            const ToolComponent = window.Tools && window.Tools[toolConfig.component];
            if (ToolComponent) {
                return (
                    // 容器优化：去除不必要的 Padding，让工具充满空间
                    <div className="flex-1 flex flex-col min-h-0 animate-slide-up bg-void-900/30 w-full h-full">
                        <ToolComponent />
                    </div>
                );
            }
            return <div className="flex items-center justify-center h-full text-red-400">组件 {toolConfig.component} 未加载</div>;
        }
        return <div>404</div>;
    };

    return (
        <div className="h-full flex flex-col">
            {/* 顶栏 (高度严格控制 h-14) */}
            <header className="h-14 border-b border-void-800 bg-void-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-4 md:px-6 justify-between shrink-0">
                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setView('home')}>
                    {/* Logo */}
                    <div className="w-8 h-8 rounded-lg overflow-hidden relative shadow-lg shadow-blue-900/20 bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                        <img
                            src="assets/icons/logo.png"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="hidden"><Icon name="box" className="text-white" size={18} /></div>
                    </div>

                    {/* 标题 & 面包屑 */}
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-lg tracking-tight text-white hidden sm:block">VoidAI Tools</span>
                        {view !== 'home' && (
                            <>
                                <span className="text-void-700 text-sm">/</span>
                                <span className="text-sm font-medium text-blue-400 flex items-center gap-1 animate-fade-in">
                                    {TOOLS_CONFIG.find(t => t.id === view)?.title}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* 右侧操作 */}
                {view !== 'home' && (
                    <button onClick={() => setView('home')} className="text-xs bg-void-800 hover:bg-void-700 text-void-300 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                        <Icon name="x" size={14} /> <span className="hidden sm:inline">关闭</span>
                    </button>
                )}
            </header>

            {/* 内容区域 (flex-1 自动填满剩余空间，内部滚动) */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {renderContent()}
                </div>
            </main>

            {/* 页脚 (仅在首页显示，工具页隐藏以节省空间) */}
            {view === 'home' && (
                <footer className="border-t border-void-800 bg-void-950 py-4 shrink-0">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-void-500">
                        <div className="flex items-center gap-2">
                            <span>&copy; {new Date().getFullYear()} 墨智工坊</span>
                            <span className="text-void-800">|</span>
                            <a href="https://aiforge.taobao.com/" target="_blank" className="hover:text-blue-400 transition-colors">淘宝店铺</a>
                        </div>
                        <div className="flex items-center gap-1.5 bg-void-900 px-3 py-1 rounded-full border border-void-800">
                            <Icon name="message-circle" size={12} className="text-green-500" />
                            <span>公众号：<span className="text-slate-300">AI夜航员</span></span>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);