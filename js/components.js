const { useState, useEffect, useRef, createContext, useContext } = React;

// --- 1. Toast Context (全局提示) ---
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
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700 animate-enter">
                    <Icon name={toast.type === 'error' ? 'alert-circle' : 'check-circle'} size={20} className={toast.type === 'error' ? 'text-red-400' : 'text-green-400'} />
                    <span className="text-sm font-bold">{toast.msg}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
};
const useToast = () => useContext(ToastContext);

// --- 2. Icon 组件 (同步渲染修复版) ---
const Icon = ({ name, size = 18, className = "" }) => {
    // 确保 lucide 已加载
    if (!window.lucide || !window.lucide.icons[name]) {
        return <span className="inline-block w-4 h-4 bg-gray-700 rounded-sm" title={`Icon missing: ${name}`}></span>;
    }

    // 直接生成 SVG 对象，不依赖 DOM 操作，防止 React 更新时丢失
    const iconNode = window.lucide.icons[name];
    const svgHtml = iconNode.toSvg({
        width: size,
        height: size,
        class: className,
        stroke: "currentColor",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none"
    });

    return <span dangerouslySetInnerHTML={{ __html: svgHtml }} className="inline-flex items-center justify-center" style={{ width: size, height: size }} />;
};

// --- 3. Button 组件 ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon = null, ...props }) => {
    const base = "h-10 px-5 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 select-none whitespace-nowrap";
    const styles = {
        primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-transparent",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent",
        danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`} {...props}>
            {icon && <Icon name={icon} size={18} />}
            {children}
        </button>
    );
};

// --- 4. SectionHeader ---
const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/5">
        <div className="p-1.5 bg-slate-800/50 rounded-lg text-indigo-400">
            <Icon name={icon} size={18} />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
    </div>
);

window.SharedComponents = { Icon, Button, ToastProvider, useToast, SectionHeader };