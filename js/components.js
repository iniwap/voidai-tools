// js/components.js

// 1. Icon Component
const Icon = ({ name, size = 20, className = "" }) => {
    const iconRef = React.useRef(null);
    React.useEffect(() => {
        if (iconRef.current && window.lucide) {
            window.lucide.icons[name]?.toSvg(iconRef.current);
        }
    }, [name]);
    return <i ref={iconRef} className={className} style={{ width: size, height: size, display: 'inline-block' }}></i>;
};

// 2. Button Component
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon = null }) => {
    const baseStyle = "px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none";
    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-900/20",
        secondary: "bg-void-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
        ghost: "text-void-400 hover:text-white hover:bg-void-800"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {icon && <Icon name={icon} size={18} />}
            {children}
        </button>
    );
};

// 3. PageHeader Component (每个工具详情页的顶部)
const PageHeader = ({ title, desc, onBack }) => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-void-900/50 backdrop-blur p-6 rounded-2xl border border-void-800 mb-8 animate-fade-in">
        <div>
            <button onClick={onBack} className="text-xs font-bold text-void-400 hover:text-white mb-2 flex items-center gap-1 transition-colors">
                <Icon name="arrow-left" size={12} /> 返回工具库
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {title}
            </h2>
            <p className="text-sm text-void-400 mt-1">{desc}</p>
        </div>
    </div>
);

// 导出组件供全局使用
window.SharedComponents = { Icon, Button, PageHeader };