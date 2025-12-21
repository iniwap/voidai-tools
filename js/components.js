const { useState, useEffect, useRef } = React;

// 1. Icon 组件 (Robust Implementation)
const Icon = ({ name, size = 18, className = "" }) => {
    // 使用 callback ref 确保节点存在时立即渲染图标
    const iconRef = useRef(null);

    useEffect(() => {
        if (iconRef.current) {
            // 清空旧内容，防止重影
            iconRef.current.innerHTML = '';

            // 获取 SVG 字符串
            const iconNode = window.lucide?.icons[name];
            if (iconNode) {
                // 将 SVG 转换为元素并插入
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                // 设置 Lucide 默认属性
                svg.setAttribute("width", size);
                svg.setAttribute("height", size);
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("fill", "none");
                svg.setAttribute("stroke", "currentColor");
                svg.setAttribute("stroke-width", "2");
                svg.setAttribute("stroke-linecap", "round");
                svg.setAttribute("stroke-linejoin", "round");
                svg.classList.add(...className.split(" ").filter(c => c));

                // Lucide 内部结构是 [tag, attrs, children] 的数组，这里我们直接用 lucide.createIcons 的逻辑或者简化版
                // 为了最稳健，我们使用 lucide.icons[name].toSvg() 返回的字符串
                const svgString = iconNode.toSvg({
                    width: size,
                    height: size,
                    class: className
                });

                // 解析字符串为 DOM
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgString, "image/svg+xml");
                iconRef.current.appendChild(doc.documentElement);
            }
        }
    }, [name, size, className]);

    return <span ref={iconRef} style={{ display: 'inline-flex', alignItems: 'center' }}></span>;
};

// 2. Button 组件 (Modern Design)
const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon = null, active = false }) => {
    const baseStyle = "h-9 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none border";

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-500 border-transparent text-white shadow-lg shadow-indigo-500/20",
        secondary: "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200",
        ghost: "bg-transparent hover:bg-slate-800/50 border-transparent text-slate-400 hover:text-white",
        outline: "bg-transparent border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
    };

    // Active 状态覆盖
    const activeStyle = active ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/50" : "";

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${activeStyle} ${className}`}
        >
            {icon && <Icon name={icon} size={16} />}
            {children}
        </button>
    );
};

// 3. SectionTitle 组件 (统一标题样式)
const SectionTitle = ({ icon, title, subtitle }) => (
    <div className="mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="p-1.5 bg-slate-800 rounded-md text-indigo-400"><Icon name={icon} size={18} /></span>
            {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-500 mt-1 ml-9">{subtitle}</p>}
    </div>
);

window.SharedComponents = { Icon, Button, SectionTitle };