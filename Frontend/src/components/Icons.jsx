/* Inline SVG icons — no icon font, no CDN, themeable via currentColor. */

const base = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
};

const Icon = ({children, size = 18, ...rest}) => (
    <svg {...base} width={size} height={size} {...rest}>
        {children}
    </svg>
);

export const SigmaMark = ({size = 28}) => (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <defs>
            <linearGradient id="sigmaMark" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--brand-500)" />
                <stop offset="100%" stopColor="var(--accent-500)" />
            </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#sigmaMark)" />
        <path
            d="M42 17H23l12 15-12 15h19"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const PlusIcon = (p) => (
    <Icon {...p}>
        <path d="M12 5v14M5 12h14" />
    </Icon>
);

export const SearchIcon = (p) => (
    <Icon {...p}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
    </Icon>
);

export const TrashIcon = (p) => (
    <Icon {...p}>
        <path d="M4 7h16M10 11v6M14 11v6" />
        <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Icon>
);

export const PencilIcon = (p) => (
    <Icon {...p}>
        <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
    </Icon>
);

export const SunIcon = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
);

export const MoonIcon = (p) => (
    <Icon {...p}>
        <path d="M21 13a8.4 8.4 0 0 1-10-10 8.5 8.5 0 1 0 10 10z" />
    </Icon>
);

export const SendIcon = (p) => (
    <Icon {...p}>
        <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
);

export const StopIcon = (p) => (
    <Icon {...p}>
        <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
    </Icon>
);

export const CopyIcon = (p) => (
    <Icon {...p}>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </Icon>
);

export const CheckIcon = (p) => (
    <Icon {...p}>
        <path d="m5 13 4 4L19 7" />
    </Icon>
);

export const RefreshIcon = (p) => (
    <Icon {...p}>
        <path d="M20 11a8 8 0 1 0-1.9 6.3" />
        <path d="M20 5v6h-6" />
    </Icon>
);

export const MenuIcon = (p) => (
    <Icon {...p}>
        <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
);

export const CloseIcon = (p) => (
    <Icon {...p}>
        <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
);

export const ChevronIcon = (p) => (
    <Icon {...p}>
        <path d="m6 9 6 6 6-6" />
    </Icon>
);

export const SparkIcon = (p) => (
    <Icon {...p}>
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    </Icon>
);

export const AlertIcon = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
    </Icon>
);
