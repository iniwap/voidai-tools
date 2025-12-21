const { useState, useEffect, useRef } = React;

// 1. Icon 组件: 自动集成 Lucide
const Icon = ({ name, size = 20, className = "" }) => {
    const iconRef = useRef(null);
    useEffect(() => {
        if (iconRef.current && window.lucide) {
            window.lucide.icons[name]?.toSvg(iconRef.current);
        }
    }, [name]);
    return <i ref={iconRef} className={className} style={{ width: size, height: size, display: 'inline-block', verticalAlign: 'middle' }}></i>;
};

// 2. Button 组件: 统一按钮风格
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon = null }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none text-sm";
    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-900/20",
        secondary: "bg-void-800 hover:bg-void-700 text-slate-200 border border-void-700",
        ghost: "text-void-400 hover:text-white hover:bg-void-800"
    };
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
            {icon && <Icon name={icon} size={16} />}
            {children}
        </button>
    );
};

// 导出到全局
window.SharedComponents = { Icon, Button };