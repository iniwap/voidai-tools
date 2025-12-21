const { useState, useEffect, useRef, createContext, useContext } = React;

// --- 1. 全局 Toast 上下文 ---
const ToastContext = createContext();

const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type, id: Date.now() });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            {toast && (
                <div className="fixed top-6 left-1/2 z-[100] toast-enter flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-800 text-white shadow-xl border border-slate-700">
                    <Icon name={toast.type === 'success' ? 'check-circle' : 'alert-circle'} size={16} className={toast.type === 'success' ? 'text-green-400' : 'text-red-400'} />
                    <span className="text-sm font-medium">{toast.msg}</span>
                </div>
            )}
        </ToastContext.Provider>
    );
};

// 方便的 Hook
const useToast = () => useContext(ToastContext);

// --- 2. Icon 组件 (稳健版) ---
const Icon = ({ name, size = 18, className = "" }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (window.lucide && ref.current) {
            // 清空旧内容
            ref.current.innerHTML = '';

            const iconNode = window.lucide.icons[name];
            if (iconNode) {
                // 直接生成 SVG 字符串并注入，这是最可靠的方法
                const svg = iconNode.toSvg({
                    width: size,
                    height: size,
                    class: className,
                    stroke: "currentColor",
                    "stroke-width": 2,
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round"
                });
                ref.current.innerHTML = svg;
            } else {
                console.warn(`Icon ${name} not found`);
            }
        }
    }, [name, size, className]);

    return <span ref={ref} className="inline-flex items-center justify-center" />;
};

// --- 3. Button 组件 ---
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon = null, ...props }) => {
    const base = "h-9 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none border";

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-500 border-transparent text-white shadow-lg shadow-indigo-500/20",
        secondary: "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200",
        ghost: "bg-transparent hover:bg-slate-800/50 border-transparent text-slate-400 hover:text-white",
        danger: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${className}`}
            {...props}
        >
            {icon && <Icon name={icon} size={16} />}
            {children}
        </button>
    );
};

window.SharedComponents = { Icon, Button, ToastProvider, useToast };