const { useState, useEffect, useRef } = React;

// 1. Icon 组件 (SVG 字符串注入模式 - 最稳健)
const Icon = ({ name, size = 18, className = "" }) => {
    // 获取 SVG 源码字符串
    const iconNode = window.lucide?.icons[name];

    if (!iconNode) return null;

    // 生成 SVG 字符串
    const svgString = iconNode.toSvg({
        width: size,
        height: size,
        class: className,
        stroke: "currentColor",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none"
    });

    return <span dangerouslySetInnerHTML={{ __html: svgString }} style={{ display: 'inline-flex' }} />;
};

// 2. Button 组件 (样式微调)
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon = null, onMouseDown, onMouseUp, onMouseLeave }) => {
    const base = "h-10 px-4 rounded-lg text-sm cursor-pointer btn-base disabled:opacity-50 disabled:cursor-not-allowed";
    const styles = {
        primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-transparent",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white border border-transparent",
        outline: "bg-transparent border border-slate-700 text-slate-300 hover:border-slate-500"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            className={`${base} ${styles[variant]} ${className}`}
        >
            {icon && <Icon name={icon} size={16} />}
            {children}
        </button>
    );
};

// 3. SectionHeader (模块标题)
const SectionHeader = ({ title, icon, rightAction }) => (
    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <Icon name={icon} size={16} className="text-indigo-400" /> {title}
        </h3>
        {rightAction}
    </div>
);

window.SharedComponents = { Icon, Button, SectionHeader };