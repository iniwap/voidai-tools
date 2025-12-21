const { useState, useEffect, useRef, createContext, useContext } = React;

// --- Icon 组件 (SVG 注入模式 - 修复显示问题) ---
const Icon = ({ name, size = 18, className = "" }) => {
    // 直接获取 SVG 定义，不依赖 DOM 扫描
    const iconData = window.lucide?.icons[name];

    if (!iconData) return <span className="w-4 h-4 bg-red-500/20 rounded inline-block"></span>;

    // 构建 SVG 字符串
    const svgContent = iconData.toSvg({
        width: size,
        height: size,
        class: className,
        stroke: "currentColor",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none"
    });

    return <span dangerouslySetInnerHTML={{ __html: svgContent }} style={{ display: 'inline-flex', verticalAlign: 'middle' }} />;
};

// --- Toast 系统 ---
const ToastContext = createContext();
const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    const show = (msg, type = 'success') => {
        setToast({ msg, type, id: Date.now() });
        setTimeout(() => setToast(null), 3000);
    };
    return (
        <ToastContext.Provider value={show}>
            {children}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-xl border border-slate-700 animate-enter">
                    <Icon name={toast.type === 'error' ? 'alert-circle' : 'check-circle'} size={16} className={toast.type === 'error' ? 'text-red-400' : 'text-green-400'} />
                    <span className="text-sm font-medium">{toast.msg}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
};
const useToast = () => useContext(ToastContext);

// --- Button 组件 ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon = null, ...props }) => {
    const base = "h-10 px-4 rounded-lg text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none border";
    const styles = {
        primary: "bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white border-transparent",
        danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`} {...props}>
            {icon && <Icon name={icon} size={16} />}
            {children}
        </button>
    );
};

// --- Section Header ---
const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
        <span className="p-1 bg-slate-800 rounded text-indigo-400 flex"><Icon name={icon} size={16} /></span>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
    </div>
);

window.SharedComponents = { Icon, Button, ToastProvider, useToast, SectionHeader };