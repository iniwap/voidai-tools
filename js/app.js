// js/app.js
const { useState, useEffect } = React;
const { Icon } = window.SharedComponents;

// 首页卡片列表
const TOOLS_CONFIG = [
    {
        id: 'watermark',
        title: 'Gemini 去水印 Pro',
        desc: '基于像素反算的无损去水印工具，还原纯净画质。',
        icon: 'eraser',
        color: 'text-blue-400',
        component: 'WatermarkTool'
    },
    {
        id: 'memaker', // ID changed
        title: '萌萌工坊 MeMaker',
        desc: '咒语生成、智能九宫格切图、GIF动图合成一站式工具。',
        icon: 'smile-plus', // New icon
        color: 'text-pink-400', // Changed color
        component: 'MeMakerTool' // Changed Component
    },
    {
        id: 'gallery',
        title: '幻境图谱 Gallery',
        desc: '精选 Midjourney 与 Stable Diffusion 高质量提示词库。',
        icon: 'aperture', // New icon
        color: 'text-indigo-400',
        component: 'GalleryTool'
    },
];

const App = () => {
    const [currentView, setCurrentView] = useState('home');

    // 简单的路由处理
    const navigate = (viewId) => {
        setCurrentView(viewId);
        window.scrollTo(0, 0);
    };

    const renderView = () => {
        if (currentView === 'home') {
            return (
                <div className="animate-fade-in py-10 max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-violet-200 mb-6 tracking-tight">
                            释放 AI 的无限潜能
                        </h1>
                        <p className="text-void-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            墨智工坊提供的一站式 AI 辅助工具集。<br />无需登录，本地运行，隐私安全。
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {TOOLS_CONFIG.map(tool => (
                            <div
                                key={tool.id}
                                onClick={() => navigate(tool.id)}
                                className="glass-card p-8 rounded-2xl cursor-pointer group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className={`mb-6 inline-flex p-4 rounded-2xl bg-void-800 border border-void-700 group-hover:scale-110 transition-transform duration-300 shadow-inner w-fit`}>
                                    <Icon name={tool.icon} className={tool.color} size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">{tool.title}</h3>
                                <p className="text-void-400 leading-relaxed mb-8 text-sm flex-1">
                                    {tool.desc}
                                </p>
                                <div className="flex items-center text-sm font-bold text-blue-400 gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 mt-auto">
                                    立即使用 <Icon name="arrow-right" size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // 渲染具体工具
        const toolConfig = TOOLS_CONFIG.find(t => t.id === currentView);
        if (toolConfig) {
            // 从全局 window.Tools 获取组件
            const ToolComponent = window.Tools[toolConfig.component];
            if (ToolComponent) {
                return <ToolComponent onBack={() => navigate('home')} />;
            }
            return <div className="text-red-400 p-10">Error: Component {toolConfig.component} not found.</div>;
        }

        return <div>404 Not Found</div>;
    };

    return (
        <div className="min-h-screen flex flex-col bg-void-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-void-950 to-void-950">
            {/* Navbar */}
            <header className="border-b border-void-800 bg-void-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('home')}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
                            <Icon name="box" className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">VoidAI Tools</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col relative z-0">
                {renderView()}
            </main>

            {/* Footer */}
            <footer className="border-t border-void-800 bg-void-950 py-8 mt-auto relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-void-400">
                    <div className="flex items-center gap-2">
                        <span>&copy; {new Date().getFullYear()}</span>
                        <a href="https://aiforge.taobao.com/" target="_blank" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">墨智工坊</a>
                        <span className="text-void-800">|</span>
                        <span>Built for Creators</span>
                    </div>
                    <div className="flex items-center gap-2 bg-void-900 px-4 py-2 rounded-full border border-void-800">
                        <Icon name="message-circle" size={16} className="text-green-500" />
                        <span>官方微信公众号：<span className="text-slate-200 font-medium">AI夜航员</span></span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);