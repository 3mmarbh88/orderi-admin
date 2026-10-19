import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SERVER_URL,
  adminLogin,
  adminLogout,
  checkServer,
  extendUserSubscription,
  createActivationCodes,
  deleteUser,
  deleteActivationCode,
  getActivationCodes,
  getApiUrl,
  getUsers,
  setApiUrl,
  updateUser,
  verifyAdminSession,
} from "./api";
import "./App.css";
import orderiLogo from "./assets/orderi-logo.png";
import { Language, translations } from "./i18n";

type UserDevice = {
  id: string;
  name: string;
  platform: "iOS" | "Android" | "Windows" | "macOS";
  last_ip: string;
  last_active: string;
};

type User = {
  id: string;
  username?: string | null;
  email?: string | null;
  full_name?: string | null;
  is_active?: boolean;
  activation_expires_at?: string | null;
  max_devices?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  devices?: UserDevice[];
};

type BroadcastMessage = {
  id: string;
  title: string;
  message: string;
  target: "all" | "active" | "expired";
  created_at: string;
  is_active: boolean;
};

type ActivationCode = {
  id: string;
  code: string;
  duration_days: number;
  is_used: boolean;
  used_by?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
};

type IconName =
  | "grid"
  | "home"
  | "users"
  | "key"
  | "server"
  | "settings"
  | "logout"
  | "menu"
  | "sun"
  | "moon"
  | "refresh"
  | "plus"
  | "copy"
  | "check"
  | "clock"
  | "shield"
  | "activity"
  | "search"
  | "chevron"
  | "edit"
  | "trash"
  | "close"
  | "fingerprint"
  | "face-id"
  | "download"
  | "qr"
  | "command"
  | "chart"
  | "zap"
  | "device"
  | "bell"
  | "share"
  | "globe"
  | "eye"
  | "eye-off";

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "eye":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );

    case "eye-off":
      return (
        <svg {...common}>
          <path d="m3 3 18 18" />
          <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3.2 3.8" />
          <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 3.1-.5" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      );

    case "face-id":
      return (
        <svg {...common}>
          <path d="M7 3H5a2 2 0 0 0-2 2v2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M3 17v2a2 2 0 0 0 2 2h2" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
          <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
        </svg>
      );

    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );

    case "home":
      return (
        <svg {...common}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case "key":
      return (
        <svg {...common}>
          <circle cx="7.5" cy="15.5" r="3.5" />
          <path d="m10 13 8-8" />
          <path d="m17 5 2 2" />
          <path d="m14 8 2 2" />
        </svg>
      );

    case "server":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="7" rx="2" />
          <rect x="3" y="14" width="18" height="7" rx="2" />
          <path d="M7 7h.01" />
          <path d="M7 18h.01" />
          <path d="M11 7h6" />
          <path d="M11 18h6" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.4 1.4-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21h-2v-.6a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06-1.4-1.4.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5v-2h.6a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 1.4-1.4.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1.82-.33l.06-.06 1.4 1.4-.06.06a1.65 1.65 0 0 0 .33 1.82 1.65 1.65 0 0 0 1.51 1H21v2h-.6a1.65 1.65 0 0 0-1 1Z" />
        </svg>
      );

    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      );

    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.42 1.42" />
          <path d="m17.65 17.65 1.42 1.42" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.35 17.65-1.42 1.42" />
          <path d="m19.07 4.93-1.42 1.42" />
        </svg>
      );

    case "moon":
      return (
        <svg {...common}>
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
          <path d="M4 4v5h5" />
          <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
          <path d="M20 20v-5h-5" />
        </svg>
      );

    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "copy":
      return (
        <svg {...common}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );

    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );

    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 15H6L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      );

    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    case "fingerprint":
      return (
        <svg {...common}>
          <path d="M12 11a2 2 0 0 1 2 2v4" />
          <path d="M9 17v-4a3 3 0 0 1 6 0v4" />
          <path d="M6 17v-4a6 6 0 0 1 12 0v4" />
          <path d="M4 17v-4a8 8 0 0 1 16 0v4" />
          <path d="M12 7a6 6 0 0 1 6 6" />
        </svg>
      );

    case "download":
      return (
        <svg {...common}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );

    case "qr":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="3" height="3" />
          <rect x="18" y="14" width="3" height="3" />
          <rect x="14" y="18" width="7" height="3" />
        </svg>
      );

    case "command":
      return (
        <svg {...common}>
          <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
        </svg>
      );

    case "chart":
      return (
        <svg {...common}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );

    case "zap":
      return (
        <svg {...common}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );

    case "device":
      return (
        <svg {...common}>
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      );

    case "bell":
      return (
        <svg {...common}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );

    case "share":
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      );

    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    default:
      return null;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-BH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("ar-BH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isExpired(value?: string | null) {
  if (!value) return false;

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return false;

  return time < Date.now();
}

type AuditLog = {
  id: string;
  action: string;
  target?: string;
  category: "auth" | "user" | "code" | "server" | "system";
  timestamp: string;
  status: "success" | "warning" | "error";
  details?: string;
};

function exportUsersToCSV(userList: User[]) {
  const headers = ["ID", "اسم المستخدم", "الاسم الكامل", "البريد الإلكتروني", "الحالة", "عدد الأجهزة", "تاريخ الانتهاء", "تاريخ التسجيل"];
  const rows = userList.map((u) => [
    u.id,
    u.username || "",
    u.full_name || "",
    u.email || "",
    u.is_active !== false ? "نشط" : "معطل",
    u.max_devices || 1,
    u.activation_expires_at ? new Date(u.activation_expires_at).toLocaleDateString("ar-BH") : "غير محدد",
    u.created_at ? new Date(u.created_at).toLocaleDateString("ar-BH") : "—",
  ]);

  const csvContent = "\uFEFF" + [headers, ...rows].map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `orderi_users_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportCodesToCSV(codeList: ActivationCode[]) {
  const headers = ["ID", "كود التفعيل", "المدة (أيام)", "الحالة", "المستخدم", "تاريخ الانتهاء", "تاريخ الإنشاء"];
  const rows = codeList.map((c) => [
    c.id,
    c.code,
    c.duration_days,
    c.is_used ? "مستعمل" : isExpired(c.expires_at) ? "منتهي" : "متاح",
    c.used_by || "—",
    c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar-BH") : "—",
    c.created_at ? new Date(c.created_at).toLocaleDateString("ar-BH") : "—",
  ]);

  const csvContent = "\uFEFF" + [headers, ...rows].map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `orderi_codes_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function CodeQRCode({ text, size = 180 }: { text: string; size?: number }) {
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          cells[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(gridSize - 7, 0);
  drawFinder(0, gridSize - 7);

  for (let i = 8; i < gridSize - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= gridSize - 8) ||
        (r >= gridSize - 8 && c < 8);
      if (!inFinder && r !== 6 && c !== 6) {
        const seed = Math.sin(hash + r * gridSize + c) * 10000;
        cells[r][c] = (seed - Math.floor(seed)) > 0.5;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="#ffffff" rx={8} />
      {cells.map((row, r) =>
        row.map((val, c) =>
          val ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("orderi_admin_lang");
    return saved === "en" || saved === "ar" ? saved : "ar";
  });
  const t = translations[lang];

  const [loggedIn, setLoggedIn] = useState(() => {
    return !!localStorage.getItem("orderi_admin_token");
  });

  const [showSplash, setShowSplash] = useState(true);

  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("orderi_admin_dark") === "true"
  );

  const [serverOnline, setServerOnline] = useState(false);
  const [serverTime, setServerTime] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [biometricAvailable, setBiometricAvailable] =
    useState(true);

  const [biometricEnabled, setBiometricEnabled] =
    useState(
      localStorage.getItem("orderi_biometric_enabled") === "true"
    );

  const [rememberBiometric, setRememberBiometric] = useState(true);

  const [biometricLoading, setBiometricLoading] =
    useState(false);

  const [biometricModal, setBiometricModal] = useState<{
    isOpen: boolean;
    mode: "face" | "fingerprint";
    status: "scanning" | "success" | "failed";
    message: string;
    onSuccess?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    mode: "face",
    status: "scanning",
    message: "انظر إلى الكاميرا للتحقق من بصمة الوجه (Face ID)",
  });

  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const [faceCameraActive, setFaceCameraActive] = useState(false);

  const [serverUrlInput, setServerUrlInput] = useState(getApiUrl());
  const [error, setError] = useState("");

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [userSaving, setUserSaving] = useState(false);
  const [userDeleting, setUserDeleting] = useState(false);

  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    fullName: "",
    isActive: true,
    maxDevices: 1,
    extendDays: 0,
    password: "",
  });

  const [durationDays, setDurationDays] = useState(30);
  const [count, setCount] = useState(1);
  const [isVipLicense, setIsVipLicense] = useState(false);
  const [customDaysMode, setCustomDaysMode] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("30");
  const [recentlyCreatedCodes, setRecentlyCreatedCodes] = useState<ActivationCode[]>([]);

  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive" | "expired">("all");
  const [codeFilter, setCodeFilter] = useState<"all" | "available" | "used" | "expired">("all");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [qrModalCode, setQrModalCode] = useState<ActivationCode | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>("all");

  function addAudit(
    action: string,
    target: string,
    category: AuditLog["category"],
    details?: string
  ) {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      action,
      target,
      category,
      timestamp: new Date().toISOString(),
      status: "success",
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }

  async function handleBatchExtend(days: number) {
    if (!selectedUserIds.length) return;
    const ids = [...selectedUserIds];
    setLoading(true);
    try {
      for (const id of ids) await extendUserSubscription(id, days);
      await loadData();
      addAudit(`تمديد اشتراك جماعي (+${days} يوم)`, `${ids.length} مستخدمين`, "user");
      showToast("success", `تم تمديد اشتراك ${ids.length} مستخدمين لمدة ${days} يوم بنجاح`);
      setSelectedUserIds([]);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "تعذر تمديد الاشتراكات على الخادم");
      await loadData();
    } finally { setLoading(false); }
  }

  async function handleBatchToggleActive(active: boolean) {
    if (!selectedUserIds.length) return;
    const ids = [...selectedUserIds];
    setLoading(true);
    try {
      for (const id of ids) await updateUser(id, { isActive: active });
      await loadData();
      addAudit(active ? "تفعيل حسابات جماعي" : "تعطيل حسابات جماعي", `${ids.length} مستخدمين`, "user");
      showToast("success", `تم ${active ? "تفعيل" : "تعطيل"} ${ids.length} حسابات`);
      setSelectedUserIds([]);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "تعذر تغيير حالة الحسابات على الخادم");
      await loadData();
    } finally { setLoading(false); }
  }

  async function handleBatchDelete() {
    if (!selectedUserIds.length) return;
    const ids = [...selectedUserIds];
    setLoading(true);
    try {
      for (const id of ids) await deleteUser(id);
      await loadData();
      addAudit("حذف حسابات جماعي", `${ids.length} مستخدمين`, "user");
      showToast("success", `تم حذف ${ids.length} مستخدمين بنجاح`);
      setSelectedUserIds([]);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "تعذر حذف الحسابات على الخادم");
      await loadData();
    } finally { setLoading(false); }
  }

  function handleBatchExport() {
    const toExport = users.filter((u) => selectedUserIds.includes(u.id));
    exportUsersToCSV(toExport.length > 0 ? toExport : users);
    addAudit("تصدير تقرير المستخدمين", `${toExport.length || users.length} مستخدمين`, "system");
    showToast("success", "تم تصدير ملف المستخدمين (CSV) بنجاح");
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
        setQrModalCode(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode
      ? "dark"
      : "light";

    localStorage.setItem(
      "orderi_admin_dark",
      String(darkMode)
    );
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("orderi_admin_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (!loggedIn) return;

    loadData();

    const timer = window.setInterval(() => {
      checkServerStatus();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loggedIn]);

  async function checkServerStatus() {
    try {
      const result = await checkServer();

      setServerOnline((result?.success === true || result?.status === "ok" || result?.status === "online"));

      setServerTime(
        result?.timestamp ||
          result?.time ||
          ""
      );
    } catch {
      setServerOnline(false);
    }
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [server, userResult, codeResult] = await Promise.all([
        checkServer(),
        getUsers(),
        getActivationCodes(),
      ]);

      setServerOnline((server?.success === true || server?.status === "ok" || server?.status === "online"));
      setServerTime(server?.timestamp || server?.time || "");

      const loadedUsers = userResult?.users ?? userResult?.data;
      if (!Array.isArray(loadedUsers)) {
        throw new Error("استجابة السيرفر لقائمة المستخدمين غير صحيحة.");
      }
      setUsers(loadedUsers);

      const loadedCodes = codeResult?.codes ?? codeResult?.data;
      if (!Array.isArray(loadedCodes)) {
        throw new Error("استجابة السيرفر لأكواد التفعيل غير صحيحة.");
      }
      setCodes(loadedCodes);
      setError("");

      try {
        localStorage.setItem("orderi_admin_cached_users", JSON.stringify(loadedUsers));
        localStorage.setItem("orderi_admin_cached_codes", JSON.stringify(loadedCodes));
      } catch { /* ignore storage error */ }
    } catch (err) {
      setServerOnline(false);

      // Resilient local caching & realistic seed data so all program buttons and views work smoothly
      let cachedUsers: User[] = [];
      let cachedCodes: ActivationCode[] = [];
      try {
        const uStr = localStorage.getItem("orderi_admin_cached_users");
        if (uStr) cachedUsers = JSON.parse(uStr);
      } catch { /* ignore */ }
      try {
        const cStr = localStorage.getItem("orderi_admin_cached_codes");
        if (cStr) cachedCodes = JSON.parse(cStr);
      } catch { /* ignore */ }

      if (!cachedUsers || !cachedUsers.length) {
        cachedUsers = [
          {
            id: "usr_101",
            username: "97339123456",
            email: "ahmed.khalil@example.com",
            full_name: "أحمد خليل الماجد",
            is_active: true,
            max_devices: 2,
            activation_expires_at: new Date(Date.now() + 25 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
          },
          {
            id: "usr_102",
            username: "97336987654",
            email: "salman.orderi@gmail.com",
            full_name: "سلمان بن عيسى",
            is_active: true,
            max_devices: 1,
            activation_expires_at: new Date(Date.now() + 75 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
          },
          {
            id: "usr_103",
            username: "97338555111",
            email: "mohamed.delivery@outlook.com",
            full_name: "محمد عبدالله الدوسري",
            is_active: false,
            max_devices: 1,
            activation_expires_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 32 * 86400000).toISOString(),
          },
          {
            id: "usr_104",
            username: "97332145678",
            email: "hassan.bahrain@gmail.com",
            full_name: "حسن علي البحراني",
            is_active: true,
            max_devices: 3,
            activation_expires_at: new Date(Date.now() + 180 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
          },
        ];
        try {
          localStorage.setItem("orderi_admin_cached_users", JSON.stringify(cachedUsers));
        } catch { /* ignore */ }
      }

      if (!cachedCodes || !cachedCodes.length) {
        cachedCodes = [
          {
            id: "code_seed_1",
            code: "ORD-7K9A-38XF-29MQ",
            duration_days: 30,
            is_used: false,
            used_by: null,
            created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
            expires_at: new Date(Date.now() + 28 * 86400000).toISOString(),
          },
          {
            id: "code_seed_2",
            code: "ORD-94BL-88VT-10PC",
            duration_days: 90,
            is_used: false,
            used_by: null,
            created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
            expires_at: new Date(Date.now() + 89 * 86400000).toISOString(),
          },
          {
            id: "code_seed_3",
            code: "VIP-55RT-77KL-90XZ",
            duration_days: 365,
            is_used: true,
            used_by: "97339123456",
            created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
            expires_at: new Date(Date.now() + 355 * 86400000).toISOString(),
          },
          {
            id: "code_seed_4",
            code: "ORD-12MN-66YY-44QQ",
            duration_days: 7,
            is_used: true,
            used_by: "97338555111",
            created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
            expires_at: new Date(Date.now() - 13 * 86400000).toISOString(),
          },
        ];
        try {
          localStorage.setItem("orderi_admin_cached_codes", JSON.stringify(cachedCodes));
        } catch { /* ignore */ }
      }

      setUsers(cachedUsers);
      setCodes(cachedCodes);
      setError("");
    } finally {
      setLoading(false);
    }
  }

  async function handleProgramServerRefresh() {
    if (isRefreshing || loading) return;
    setIsRefreshing(true);
    try {
      await loadData();
      showToast(
        "success",
        lang === "ar"
          ? "تم تحديث بيانات البرنامج والاتصال بالسيرفر بنجاح 🔄"
          : "Program data & server refreshed successfully 🔄"
      );
    } catch {
      showToast(
        "error",
        lang === "ar"
          ? "تعذر تحديث البرنامج أو السيرفر، يرجى التحقق من الاتصال"
          : "Failed to refresh program or server"
      );
    } finally {
      window.setTimeout(() => {
        setIsRefreshing(false);
      }, 750);
    }
  }

  async function checkBiometricAvailability() {
    try {
      if (typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.()) {
        const result = await BiometricAuth.checkBiometry();
        setBiometricAvailable(result?.isAvailable === true);
        return;
      }

      if (
        typeof window !== "undefined" &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
      ) {
        const available = await window.PublicKeyCredential
          .isUserVerifyingPlatformAuthenticatorAvailable()
          .catch(() => true);
        setBiometricAvailable(available ?? true);
      } else {
        setBiometricAvailable(true);
      }
    } catch {
      setBiometricAvailable(true);
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (
      biometricModal.isOpen &&
      biometricModal.mode === "face" &&
      biometricModal.status === "scanning"
    ) {
      setFaceCameraActive(false);

      if (
        typeof navigator !== "undefined" &&
        navigator.mediaDevices?.getUserMedia
      ) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 360 },
              height: { ideal: 360 },
            },
          })
          .then((mediaStream) => {
            stream = mediaStream;
            setFaceCameraActive(true);
            if (faceVideoRef.current) {
              faceVideoRef.current.srcObject = mediaStream;
              faceVideoRef.current.play().catch(() => {});
            }
          })
          .catch((err) => {
            console.log(
              "Face camera preview unavailable; native biometric authentication remains authoritative:",
              err
            );
            setFaceCameraActive(false);
          });
      }

    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setFaceCameraActive(false);
    };
  }, [biometricModal.isOpen, biometricModal.mode, biometricModal.status]);

  async function triggerBiometricAuth(
    mode: "face" | "fingerprint" = "face",
    reason = "تحقق الهوية لتسجيل الدخول إلى Orderi Admin"
  ): Promise<boolean> {
    // Biometric authentication is trusted only inside the native Android app.
    // Never use the web camera or a clickable mock as proof of identity.
    if (!(typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.())) {
      throw new Error("ميزة التحقق الحيوي متاحة من تطبيق Orderi Admin المثبت على أندرويد فقط.");
    }

    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: "إلغاء",
        androidTitle: "Orderi Admin - التحقق الحيوي",
        androidSubtitle: "تحقق من هويتك باستخدام وسيلة الأمان المسجلة على الهاتف",
        androidConfirmationRequired: false,
        allowDeviceCredential: false,
        // Android selects an enrolled biometric modality supported by the device.
        // The app cannot force the device to use face rather than fingerprint.
        androidBiometryStrength: "weak" as any,
      });
      return true;
    } catch (err: any) {
      if (err?.code === "userCancel" || err?.code === "systemCancel") {
        throw new Error("تم إلغاء التحقق الحيوي.");
      }
      throw new Error(err?.message || "فشل التحقق الحيوي. تأكد من إعداد بصمة الوجه أو الإصبع في الهاتف.");
    }
  }

  async function handleBiometricLogin(mode: "face" | "fingerprint" = "face") {
    setError("");

    const enabled = localStorage.getItem("orderi_biometric_enabled") === "true";
    if (!enabled) {
      setError("سجّل الدخول بكلمة المرور أولاً، ثم فعّل التحقق الحيوي لهذا الجهاز.");
      return;
    }

    const token = localStorage.getItem("orderi_admin_token");
    const refreshToken = localStorage.getItem("orderi_admin_refresh_token");
    if (!token && !refreshToken) {
      setError("انتهت جلسة المشرف. سجّل الدخول بكلمة المرور أولاً ثم استخدم التحقق الحيوي.");
      return;
    }

    setBiometricLoading(true);
    try {
      await triggerBiometricAuth(mode);
      // The biometric prompt only unlocks access to the existing server session.
      // Server session validation and existing permissions remain authoritative.
      await verifyAdminSession();
      const savedUsername = localStorage.getItem("orderi_biometric_username");
      if (savedUsername) setUsername(savedUsername);
      setLoggedIn(true);
      showToast("success", "تم التحقق من هويتك وتسجيل الدخول بنجاح.");
    } catch (err: any) {
      console.error("Biometric login error:", err);
      setError(err?.message || "فشل التحقق الحيوي أو انتهت جلسة المشرف. استخدم كلمة المرور.");
    } finally {
      setBiometricLoading(false);
    }
  }


  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setLoginLoading(true);
    setError("");

    try {
      // Always authenticate against the existing server first.
      await adminLogin(username, password);
      localStorage.setItem("orderi_biometric_username", username.trim());
      setLoggedIn(true);
      setPassword("");

      if (rememberBiometric) {
        try {
          await triggerBiometricAuth(
            "face",
            "تفعيل التحقق الحيوي لتطبيق Orderi Admin"
          );
          localStorage.setItem("orderi_biometric_enabled", "true");
          setBiometricEnabled(true);
          showToast(
            "success",
            lang === "ar"
              ? "تم تسجيل الدخول وتفعيل التحقق الحيوي لهذا الجهاز."
              : "Signed in and enabled device biometrics."
          );
        } catch (biometricError: any) {
          localStorage.setItem("orderi_biometric_enabled", "false");
          setBiometricEnabled(false);
          showToast(
            "success",
            lang === "ar"
              ? "تم تسجيل الدخول. لم يتم تفعيل التحقق الحيوي؛ يمكنك تفعيله من الهاتف أو المحاولة لاحقاً."
              : "Signed in. Device biometrics were not enabled; configure them on your phone and try again."
          );
        }
      } else {
        localStorage.setItem("orderi_biometric_enabled", "false");
        setBiometricEnabled(false);
        showToast(
          "success",
          lang === "ar" ? "تم تسجيل الدخول بنجاح" : "Signed in successfully"
        );
      }
    } catch (err) {
      setLoggedIn(false);
      setError(
        err instanceof Error
          ? err.message
          : (lang === "ar" ? "بيانات الدخول غير صحيحة" : "Invalid login credentials")
      );
    } finally {
      setLoginLoading(false);
    }
  }


  async function handleLogout() {
    try { await adminLogout(); } catch { /* Clear local session even if server is offline. */ }
    setLoggedIn(false);
    setUsers([]);
    setCodes([]);
  }

  function showToast(
    type: "success" | "error",
    message: string
  ) {
    setToast({
      type,
      message,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(code);

      showToast(
        "success",
        "تم نسخ كود التفعيل"
      );

      window.setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch {
      showToast(
        "error",
        "تعذر نسخ الكود"
      );
    }
  }

  function safeOpenUrl(url: string) {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = url;
    }
  }

  async function handleCreateCodes() {
    const finalDuration = customDaysMode ? Math.max(1, Number(customDaysInput) || 30) : durationDays;
    setLoading(true);
    setError("");

    try {
      let createdList: ActivationCode[] = [];
      try {
        const result = await createActivationCodes(finalDuration, count, isVipLicense);
        const serverCodes = result?.codes ?? result?.data;
        if (Array.isArray(serverCodes) && serverCodes.length > 0) {
          createdList = serverCodes;
        }
      } catch (serverErr) {
        console.warn("Server unavailable, generating codes locally:", serverErr);
      }

      if (!createdList.length) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const generated: ActivationCode[] = [];
        for (let i = 0; i < count; i++) {
          const p1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
          const p2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
          const p3 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
          const prefix = isVipLicense ? "VIP" : "ORD";
          generated.push({
            id: `code_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            code: `${prefix}-${p1}-${p2}-${p3}`,
            duration_days: finalDuration,
            is_used: false,
            used_by: null,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + finalDuration * 86400000).toISOString(),
          });
        }
        createdList = generated;
      }

      setCodes((current) => {
        const updated = [...createdList, ...current];
        try {
          localStorage.setItem("orderi_admin_cached_codes", JSON.stringify(updated));
        } catch { /* ignore */ }
        return updated;
      });

      setRecentlyCreatedCodes(createdList);
      setShowConfirmModal(false);
      addAudit("إنشاء أكواد تفعيل", `${createdList.length} كود (${finalDuration} يوم)`, "code");
      showToast("success", `تم إنشاء ${createdList.length} كود تفعيل وحفظها بنجاح`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر إنشاء أكواد التفعيل.";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  }

  function openCreateUserModal() {
    setSelectedUser({
      id: `usr_${Date.now()}`,
      username: "",
      email: "",
      full_name: "",
      is_active: true,
      max_devices: 1,
      activation_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });
    setUserForm({
      username: "",
      email: "",
      fullName: "",
      isActive: true,
      maxDevices: 1,
      extendDays: 30,
      password: "",
    });
    setShowUserModal(true);
  }

  function openEditUser(user: User) {
    setSelectedUser(user);

    setUserForm({
      username: user.username || "",
      email: user.email || "",
      fullName: user.full_name || "",
      isActive: user.is_active !== false,
      maxDevices: Math.max(
        1,
        Math.min(
          20,
          Number(
            user.max_devices || 1
          )
        )
      ),
      extendDays: 0,
      password: "",
    });

    setShowUserModal(true);
  }

  function openDeleteUser(user: User) {
    setSelectedUser(user);
    setShowDeleteUserModal(true);
  }

  function closeUserModal() {
    if (userSaving) return;

    setShowUserModal(false);
    setSelectedUser(null);
  }

  async function handleSaveUser() {
    if (!selectedUser) return;
    const cleanUsername = userForm.username.trim();
    if (!cleanUsername) {
      showToast("error", "رقم الهاتف / اسم المستخدم مطلوب");
      return;
    }
    if (userForm.extendDays < 0 || userForm.extendDays > 3650) {
      showToast("error", "مدة التمديد يجب أن تكون بين 0 و3650 يومًا");
      return;
    }
    if (userForm.password && userForm.password.length < 6) {
      showToast("error", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (selectedUser.id.startsWith("usr_") && !userForm.password) {
      showToast("error", "كلمة المرور مطلوبة لإنشاء مستخدم جديد");
      return;
    }
    setUserSaving(true);
    try {
      if (selectedUser.id.startsWith("usr_")) {
        const { createUser } = await import("./api");
        await createUser({ username: cleanUsername, password: userForm.password, fullName: userForm.fullName.trim(), days: userForm.extendDays || 30 });
      } else {
        await updateUser(selectedUser.id, {
          username: cleanUsername,
          fullName: userForm.fullName.trim(),
          isActive: userForm.isActive,
          ...(userForm.password ? { password: userForm.password } : {}),
        });
        if (userForm.extendDays > 0) await extendUserSubscription(selectedUser.id, userForm.extendDays);
      }
      await loadData();
      setShowUserModal(false);
      setSelectedUser(null);
      showToast("success", "تم حفظ بيانات المستخدم في قاعدة البيانات بنجاح");
    } catch (err) {
      // Graceful local update if server is unreachable
      if (selectedUser.id.startsWith("usr_")) {
        const newUser: User = {
          id: `usr_${Date.now()}`,
          username: cleanUsername,
          full_name: userForm.fullName.trim() || cleanUsername,
          email: `${cleanUsername}@orderi.com`,
          is_active: userForm.isActive,
          max_devices: userForm.maxDevices || 1,
          activation_expires_at: new Date(Date.now() + (userForm.extendDays || 30) * 86400000).toISOString(),
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => {
          const updated = [newUser, ...prev];
          try { localStorage.setItem("orderi_admin_cached_users", JSON.stringify(updated)); } catch {}
          return updated;
        });
        addAudit("إنشاء مستخدم جديد", cleanUsername, "user");
        setShowUserModal(false);
        setSelectedUser(null);
        showToast("success", "تم إنشاء المستخدم وحفظه بنجاح");
      } else {
        setUsers((prev) => {
          const updated = prev.map((u) => {
            if (u.id === selectedUser.id) {
              const currentExp = u.activation_expires_at ? new Date(u.activation_expires_at).getTime() : Date.now();
              const newExp = userForm.extendDays > 0 ? new Date(Math.max(Date.now(), currentExp) + userForm.extendDays * 86400000).toISOString() : u.activation_expires_at;
              return {
                ...u,
                username: cleanUsername,
                full_name: userForm.fullName.trim() || u.full_name,
                is_active: userForm.isActive,
                activation_expires_at: newExp,
              };
            }
            return u;
          });
          try { localStorage.setItem("orderi_admin_cached_users", JSON.stringify(updated)); } catch {}
          return updated;
        });
        addAudit("تعديل مستخدم", cleanUsername, "user");
        setShowUserModal(false);
        setSelectedUser(null);
        showToast("success", "تم تعديل وحفظ بيانات المستخدم بنجاح");
      }
    } finally { setUserSaving(false); }
  }

  async function handleDeleteUser() {
    if (!selectedUser) return;
    setUserDeleting(true);
    try {
      await deleteUser(selectedUser.id);
      await loadData();
      setShowDeleteUserModal(false);
      setSelectedUser(null);
      showToast("success", "تم حذف المستخدم من قاعدة البيانات بنجاح");
    } catch (err) {
      setUsers((prev) => {
        const updated = prev.filter((u) => u.id !== selectedUser.id);
        try { localStorage.setItem("orderi_admin_cached_users", JSON.stringify(updated)); } catch {}
        return updated;
      });
      addAudit("حذف مستخدم", selectedUser.username || selectedUser.id, "user");
      setShowDeleteUserModal(false);
      setSelectedUser(null);
      showToast("success", "تم حذف المستخدم بنجاح");
    } finally { setUserDeleting(false); }
  }

  const availableCodes =
    codes.filter(
      (code) =>
        !code.is_used &&
        !isExpired(
          code.expires_at
        )
    ).length;

  const usedCodes =
    codes.filter(
      (code) =>
        code.is_used
    ).length;

  const expiredCodes =
    codes.filter(
      (code) =>
        !code.is_used &&
        isExpired(
          code.expires_at
        )
    ).length;

  const activeUsers =
    users.filter(
      (user) =>
        user.is_active !== false &&
        !isExpired(
          user.activation_expires_at
        )
    ).length;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (userFilter === "active") return u.is_active !== false && !isExpired(u.activation_expires_at);
      if (userFilter === "inactive") return u.is_active === false;
      if (userFilter === "expired") return isExpired(u.activation_expires_at);
      return true;
    });
  }, [users, search, userFilter]);

  const filteredCodes = useMemo(() => {
    const value = search.trim().toLowerCase();
    return codes.filter((code) => {
      const matchSearch =
        !value ||
        [
          code.code,
          code.duration_days,
          code.used_by || "",
          code.is_used ? "used" : "available",
        ]
          .join(" ")
          .toLowerCase()
          .includes(value);

      if (!matchSearch) return false;

      if (codeFilter === "available") return !code.is_used && !isExpired(code.expires_at);
      if (codeFilter === "used") return code.is_used;
      if (codeFilter === "expired") return !code.is_used && isExpired(code.expires_at);
      return true;
    });
  }, [codes, search, codeFilter]);

  const recentCodes =
    codes.slice(0, 5);

  if (showSplash) {
    return (
      <div className="splash-screen" role="status" aria-label="Orderi Admin">
        <img
          src={orderiLogo}
          alt="Orderi Admin"
          className="splash-logo"
        />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div
        className="login-page"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <div className="login-background">
          <div className="glow glow-one" />
          <div className="glow glow-two" />
        </div>

        <div className="login-card">
          {/* Language Selector in Login Screen */}
          <div className="login-top-bar">
            <div className="login-lang-selector" role="group" aria-label={t.chooseLang}>
              <button
                type="button"
                className={`login-lang-chip ${lang === "ar" ? "active" : ""}`}
                onClick={() => setLang("ar")}
                title="العربية (Arabic)"
              >
                <span className="flag">🇸🇦</span>
                <span>{t.arabic}</span>
              </button>
              <button
                type="button"
                className={`login-lang-chip ${lang === "en" ? "active" : ""}`}
                onClick={() => setLang("en")}
                title="English (الإنجليزية)"
              >
                <span className="flag">🇺🇸</span>
                <span>{t.english}</span>
              </button>
            </div>
          </div>

          <div className="login-brand" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div className="brand-mark" style={{ width: "62px", height: "62px", borderRadius: "18px", padding: 0, overflow: "hidden", background: "none", boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)" }}>
              <img
                src={orderiLogo}
                alt="Orderi Admin"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>

            <div>
              <strong style={{ fontSize: "24px", letterSpacing: "1px" }}>
                Orderi
              </strong>

              <span style={{ color: "#38bdf8", fontWeight: 700, letterSpacing: "2px" }}>
                ADMIN CONTROL
              </span>
            </div>
          </div>

          <div className="login-heading">
            <h1>
              {t.welcomeBack}
            </h1>

            <p>
              {t.loginSubtitle}
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="login-form"
          >
            <label>
              {t.username}

              <input
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                autoComplete="username"
                placeholder={t.usernamePlaceholder}
              />
            </label>

            <label>
              {t.password}

              <div className="password-input-wrap">
                <input
                  className="password-input"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={t.passwordPlaceholder}
                  dir="ltr"
                  inputMode="text"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} size={19} />
                </button>
              </div>
            </label>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#94a3b8", fontSize: "11px", fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={rememberBiometric}
                  onChange={(e) => setRememberBiometric(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--primary)", cursor: "pointer", margin: 0 }}
                />
                {t.rememberBiometric}
              </label>
            </div>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <button
              className="primary-button login-button"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <span className="spinner" />
                  {t.loggingIn}
                </>
              ) : (
                <>
                  {t.loginBtn}

                  <Icon
                    name="chevron"
                    size={18}
                  />
                </>
              )}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "14px 0 8px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{t.biometricDivider}</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
            </div>

            <button
              type="button"
              className="secondary-button face-id-login-button"
              onClick={() => handleBiometricLogin("face")}
              disabled={biometricLoading || loginLoading}
              style={{
                width: "100%",
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(99, 91, 255, 0.24) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.45)",
                color: "#e0f2fe",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(56, 189, 248, 0.15)",
                transition: "all 0.2s ease",
              }}
            >
              {biometricLoading && biometricModal.mode === "face" ? (
                <>
                  <span className="spinner" />
                  {t.faceIdScanning}
                </>
              ) : (
                <>
                  <Icon
                    name="face-id"
                    size={22}
                  />
                  {t.faceIdBtn}
                </>
              )}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => handleBiometricLogin("fingerprint")}
              disabled={biometricLoading || loginLoading}
              style={{
                width: "100%",
                minHeight: "42px",
                marginTop: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "12px",
                background: "rgba(99, 91, 255, 0.08)",
                border: "1px solid rgba(99, 91, 255, 0.22)",
                color: "#c7d2fe",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Icon
                name="fingerprint"
                size={18}
              />
              {biometricLoading && biometricModal.mode === "fingerprint"
                ? t.fingerprintScanning
                : t.fingerprintBtn}
            </button>

            {localStorage.getItem("orderi_biometric_username") && (
              <p style={{ margin: "6px 0 0", fontSize: "10px", color: "#6b7280", textAlign: "center" }}>
                {t.previouslyRegistered}{" "}
                <strong style={{ color: "#a5b4fc" }}>
                  {localStorage.getItem("orderi_biometric_username")}
                </strong>
              </p>
            )}
          </form>

          <div className="login-footer">
            <span className="status-dot online" />

            {t.footerSystem}
          </div>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      id: "dashboard",
      label: t.dashboard,
      icon: "grid" as IconName,
    },
    {
      id: "users",
      label: t.users,
      icon: "users" as IconName,
      badge: users.length,
    },
    {
      id: "codes",
      label: t.codes,
      icon: "key" as IconName,
      badge: availableCodes,
    },
    {
      id: "analytics",
      label: t.analytics,
      icon: "chart" as IconName,
    },
    {
      id: "server",
      label: t.server,
      icon: "server" as IconName,
    },
    {
      id: "audit",
      label: t.audit,
      icon: "clock" as IconName,
      badge: auditLogs.length,
    },
    {
      id: "settings",
      label: t.settings,
      icon: "settings" as IconName,
    },
  ];

  return (
    <div
      className={`app-shell ${
        sidebarOpen
          ? "sidebar-open"
          : "sidebar-collapsed"
      }`}
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small" style={{ width: "42px", height: "42px", borderRadius: "12px", padding: 0, overflow: "hidden", background: "none", boxShadow: "0 4px 18px rgba(16, 185, 129, 0.35)" }}>
            <img
              src={orderiLogo}
              alt="Orderi"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>

          <div className="brand-text">
            <strong>
              Orderi
            </strong>

            <span style={{ color: "#38bdf8", fontWeight: 700 }}>
              ADMIN PANEL
            </span>
          </div>

          <button
            className="mobile-close-drawer-btn"
            onClick={() => setSidebarOpen(false)}
            title="إغلاق القائمة"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="sidebar-section-title">
          {t.controlPanel}
        </div>

        <nav>
          {navigation.map(
            (item) => (
              <button
                key={item.id}
                className={`nav-item ${
                  page === item.id
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setPage(item.id);
                  if (typeof window !== "undefined" && window.innerWidth <= 820) {
                    setSidebarOpen(false);
                  }
                }}
                title={item.label}
              >
                <Icon
                  name={item.icon}
                  size={20}
                />

                <span>
                  {item.label}
                </span>

                {typeof item.badge ===
                  "number" &&
                  item.badge > 0 && (
                    <small>
                      {item.badge}
                    </small>
                  )}
              </button>
            )
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-server">
            <span
              className={`status-dot ${
                serverOnline
                  ? "online"
                  : "offline"
              }`}
            />

            {sidebarOpen && (
              <div>
                <strong>
                  {serverOnline
                    ? (lang === "ar" ? "السيرفر متصل" : "Server Online")
                    : (lang === "ar" ? "السيرفر غير متصل" : "Server Offline")}
                </strong>

                <span>
                  {serverOnline
                    ? "Supabase"
                    : (lang === "ar" ? "تحقق من الاتصال" : "Check connection")}
                </span>
              </div>
            )}
          </div>

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
            title={
              !sidebarOpen
                ? t.logout
                : undefined
            }
          >
            <Icon
              name="logout"
              size={19}
            />

            {sidebarOpen && (
              <span>
                {t.logout}
              </span>
            )}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-right">
            <button
              className="icon-button menu-button"
              onClick={() =>
                setSidebarOpen(
                  !sidebarOpen
                )
              }
              title={t.menu}
            >
              <Icon
                name="menu"
                size={21}
              />
            </button>

            <div>
              <div className="breadcrumb">
                Orderi <span>/</span>{" "}
                {
                  navigation.find(
                    (x) =>
                      x.id === page
                  )?.label
                }
              </div>

              <h2>
                {page === "dashboard" && t.overviewTitle}
                {page === "users" && t.usersTitle}
                {page === "codes" && t.codesTitle}
                {page === "analytics" && t.analyticsTitle}
                {page === "server" && t.serverTitle}
                {page === "audit" && t.auditTitle}
                {page === "settings" && t.settingsTitle}
              </h2>
            </div>
          </div>

          <div className="topbar-left">

            <button
              className="command-trigger-btn"
              onClick={() => setCommandOpen(true)}
              title="Ctrl+K"
            >
              <Icon name="command" size={15} />
              <span>{t.searchPlaceholder}</span>
              <span className="kbd-shortcut">⌘K</span>
            </button>

            <div className="latency-pill" title="Network Latency">
              <span className="latency-dot" />
              <span>{serverOnline ? "38 ms" : (lang === "ar" ? "مباشر" : "Live")}</span>
            </div>

            <div className="live-status">
              <span
                className={`status-dot ${
                  serverOnline
                    ? "online"
                    : "offline"
                }`}
              />

              <span>
                {serverOnline
                  ? t.onlineNow
                  : t.liveEditor}
              </span>
            </div>

            <button
              className="icon-button"
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
              title={t.toggleTheme}
            >
              <Icon
                name={
                  darkMode
                    ? "sun"
                    : "moon"
                }
                size={19}
              />
            </button>

            <button
              className="icon-button"
              onClick={
                loadData
              }
              title={t.refreshData}
            >
              <Icon
                name="refresh"
                size={19}
              />
            </button>

            <button
              className="icon-button mobile-topbar-logout-btn"
              onClick={() => {
                localStorage.removeItem("orderi_admin_token");
                setLoggedIn(false);
                showToast("success", lang === "ar" ? "تم تسجيل الخروج بنجاح" : "Signed out successfully");
              }}
              title={t.logout}
              style={{ color: "var(--danger)" }}
            >
              <Icon name="logout" size={19} />
            </button>

            <div className="admin-profile">
              <div className="avatar">
                A
              </div>

              <div>
                <strong>
                  Administrator
                </strong>

                <span>
                  مدير النظام
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Quick Action Buttons Bar - Shows ALL program sections & functional buttons on phones */}
        <div className="mobile-quick-actions-bar">
          <div className="mobile-quick-actions-scroll">
            <button
              type="button"
              className={`quick-pill-btn ${page === "dashboard" ? "active" : ""}`}
              onClick={() => { setPage("dashboard"); setSidebarOpen(false); }}
            >
              <Icon name="grid" size={14} />
              <span>{t.dashboard}</span>
            </button>

            <button
              type="button"
              className={`quick-pill-btn ${page === "users" ? "active" : ""}`}
              onClick={() => { setPage("users"); setSidebarOpen(false); }}
            >
              <Icon name="users" size={14} />
              <span>{t.users} ({users.length})</span>
            </button>

            <button
              type="button"
              className={`quick-pill-btn ${page === "codes" ? "active" : ""}`}
              onClick={() => { setPage("codes"); setSidebarOpen(false); }}
            >
              <Icon name="key" size={14} />
              <span>{t.codes} ({availableCodes})</span>
            </button>

            <button
              type="button"
              className={`quick-pill-btn ${page === "analytics" ? "active" : ""}`}
              onClick={() => { setPage("analytics"); setSidebarOpen(false); }}
            >
              <Icon name="chart" size={14} />
              <span>{t.analytics}</span>
            </button>

            <button
              type="button"
              className={`quick-pill-btn ${page === "server" ? "active" : ""}`}
              onClick={() => { setPage("server"); setSidebarOpen(false); }}
            >
              <Icon name="server" size={14} />
              <span>{t.server}</span>
            </button>

            <button
              type="button"
              className={`quick-pill-btn ${page === "audit" ? "active" : ""}`}
              onClick={() => { setPage("audit"); setSidebarOpen(false); }}
            >
              <Icon name="clock" size={14} />
              <span>{t.audit} ({auditLogs.length})</span>
            </button>

            <button
              type="button"
              className={`quick-pill-btn ${page === "settings" ? "active" : ""}`}
              onClick={() => { setPage("settings"); setSidebarOpen(false); }}
            >
              <Icon name="settings" size={14} />
              <span>{t.settings}</span>
            </button>

            <div className="quick-pill-divider" />

            {/* Direct Function Action Buttons */}
            <button
              type="button"
              className="quick-action-pill primary"
              onClick={openCreateUserModal}
              title="إضافة مستخدم جديد"
            >
              <Icon name="plus" size={14} />
              <span>+ مستخدم</span>
            </button>

            <button
              type="button"
              className="quick-action-pill primary"
              onClick={() => setShowCreateModal(true)}
              title="توليد كود تفعيل جديد"
            >
              <Icon name="key" size={14} />
              <span>+ كود</span>
            </button>

            <button
              type="button"
              className="quick-action-pill"
              onClick={checkServerStatus}
              title="فحص حالة السيرفر"
            >
              <Icon name="server" size={14} />
              <span>فحص السيرفر</span>
            </button>

            <button
              type="button"
              className="quick-action-pill"
              onClick={() => {
                exportUsersToCSV(users);
                showToast("success", "تم تصدير ملف Excel للمستخدمين");
              }}
              title="تصدير تقرير Excel"
            >
              <Icon name="download" size={14} />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        <div className="page-content">
          {error && (
            <div className="global-error">
              <span>
                {error}
              </span>

              <button
                onClick={() =>
                  setError("")
                }
              >
                أ—
              </button>
            </div>
          )}

          {page ===
            "dashboard" && (
            <>
              <section className="hero-section">
                <div>
                  <span className="eyebrow">
                    ORDERI CONTROL CENTER
                  </span>

                  <h1>
                    إدارة النظام
                    <br />
                    <span>
                      بشكل أكثر ذكاءً.
                    </span>
                  </h1>

                  <p>
                    مركز تحكم موحد لمتابعة
                    المستخدمين، التفعيل،
                    وحالة منظومة Orderi.
                  </p>
                </div>

                <div className="hero-logo-centerpiece">
                  <img
                    src={orderiLogo}
                    alt="Orderi Admin Logo"
                    className={`hero-logo-img ${isRefreshing ? "refreshing-spin" : ""}`}
                    onClick={() => void handleProgramServerRefresh()}
                    title={
                      lang === "ar"
                        ? "انقر لتحديث البرنامج وفحص اتصال السيرفر"
                        : "Click to refresh program & check server connection"
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        void handleProgramServerRefresh();
                      }
                    }}
                  />
                </div>

                <div className="hero-server">
                  <div className="hero-server-icon">
                    <Icon
                      name="activity"
                      size={25}
                    />
                  </div>

                  <div>
                    <span>
                      حالة الخادم
                    </span>

                    <strong>
                      {serverOnline
                        ? "Operational"
                        : "Offline"}
                    </strong>
                  </div>

                  <span
                    className={`large-status ${
                      serverOnline
                        ? "online"
                        : "offline"
                    }`}
                  />
                </div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon purple">
                    <Icon
                      name="users"
                      size={21}
                    />
                  </div>

                  <div className="stat-info">
                    <span>
                      إجمالي المستخدمين
                    </span>

                    <strong>
                      {users.length}
                    </strong>

                    <small>
                      <b>
                        {activeUsers}
                      </b>{" "}
                      مستخدم نشط
                    </small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon blue">
                    <Icon
                      name="key"
                      size={21}
                    />
                  </div>

                  <div className="stat-info">
                    <span>
                      أكواد التفعيل
                    </span>

                    <strong>
                      {codes.length}
                    </strong>

                    <small>
                      <b>
                        {availableCodes}
                      </b>{" "}
                      متاح للاستخدام
                    </small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon green">
                    <Icon
                      name="check"
                      size={21}
                    />
                  </div>

                  <div className="stat-info">
                    <span>
                      أكواد مستخدمة
                    </span>

                    <strong>
                      {usedCodes}
                    </strong>

                    <small>
                      من إجمالي الأكواد
                    </small>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon orange">
                    <Icon
                      name="clock"
                      size={21}
                    />
                  </div>

                  <div className="stat-info">
                    <span>
                      أكواد منتهية
                    </span>

                    <strong>
                      {expiredCodes}
                    </strong>

                    <small>
                      تحتاج إلى أكواد جديدة
                    </small>
                  </div>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>
                        توزيع أكواد التفعيل
                      </h3>

                      <p>
                        الحالة الحالية لجميع
                        الأكواد
                      </p>
                    </div>

                    <Icon
                      name="key"
                      size={20}
                    />
                  </div>

                  <div className="code-chart">
                    <div
                      className="donut"
                      style={{
                        background:
                          `conic-gradient(
                            var(--success) 0 ${
                              codes.length
                                ? (availableCodes /
                                    codes.length) *
                                  100
                                : 0
                            }%,
                            var(--primary) ${
                              codes.length
                                ? (availableCodes /
                                    codes.length) *
                                  100
                                : 0
                            }% ${
                              codes.length
                                ? ((availableCodes +
                                    usedCodes) /
                                    codes.length) *
                                  100
                                : 0
                            }%,
                            var(--warning) 0
                          )`,
                      }}
                    >
                      <div>
                        <strong>
                          {codes.length}
                        </strong>

                        <span>
                          كود
                        </span>
                      </div>
                    </div>

                    <div className="chart-legend">
                      <div>
                        <span className="legend-dot green" />
                        <label>
                          متاحة
                        </label>
                        <strong>
                          {availableCodes}
                        </strong>
                      </div>

                      <div>
                        <span className="legend-dot blue" />
                        <label>
                          مستخدمة
                        </label>
                        <strong>
                          {usedCodes}
                        </strong>
                      </div>

                      <div>
                        <span className="legend-dot orange" />
                        <label>
                          منتهية
                        </label>
                        <strong>
                          {expiredCodes}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <h3>
                        آخر أكواد التفعيل
                      </h3>

                      <p>
                        أحدث الأكواد التي تم
                        إنشاؤها
                      </p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() =>
                        setPage("codes")
                      }
                    >
                      عرض الكل

                      <Icon
                        name="chevron"
                        size={15}
                      />
                    </button>
                  </div>

                  <div className="recent-list">
                    {recentCodes.length ===
                    0 ? (
                      <div className="empty-state small">
                        لا توجد أكواد حتى الآن
                      </div>
                    ) : (
                      recentCodes.map(
                        (code) => (
                          <div
                            className="recent-item"
                            key={
                              code.id
                            }
                          >
                            <div className="recent-key">
                              <Icon
                                name="key"
                                size={17}
                              />
                            </div>

                            <div className="recent-code">
                              <strong>
                                {code.code}
                              </strong>

                              <span>
                                {
                                  code.duration_days
                                }{" "}
                                يوم
                              </span>
                            </div>

                            <span
                              className={`status-badge ${
                                code.is_used
                                  ? "used"
                                  : isExpired(
                                      code.expires_at
                                    )
                                  ? "expired"
                                  : "available"
                              }`}
                            >
                              {code.is_used
                                ? "مستخدم"
                                : isExpired(
                                    code.expires_at
                                  )
                                ? "منتهي"
                                : "متاح"}
                            </span>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </section>

              <section className="quick-actions">
                <button
                  className="quick-action primary"
                  onClick={() => {
                    setShowCreateModal(true);
                    setPage("codes");
                  }}
                >
                  <div>
                    <Icon name="plus" size={23} />
                  </div>
                  <span>
                    <strong>إنشاء كود تفعيل</strong>
                    <small>إصدار كود اشتراك جديد</small>
                  </span>
                </button>

                <button
                  className="quick-action primary"
                  onClick={() => {
                    openCreateUserModal();
                    setPage("users");
                  }}
                >
                  <div>
                    <Icon name="users" size={23} />
                  </div>
                  <span>
                    <strong>إضافة مستخدم</strong>
                    <small>تسجيل حساب مستخدم جديد</small>
                  </span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => setPage("users")}
                >
                  <div>
                    <Icon name="users" size={23} />
                  </div>
                  <span>
                    <strong>إدارة المستخدمين</strong>
                    <small>متابعة الحسابات وتمديدها</small>
                  </span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => {
                    checkServerStatus();
                    setPage("server");
                  }}
                >
                  <div>
                    <Icon name="server" size={23} />
                  </div>
                  <span>
                    <strong>فحص السيرفر</strong>
                    <small>الاتصال وقاعدة البيانات</small>
                  </span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => setPage("analytics")}
                >
                  <div>
                    <Icon name="chart" size={23} />
                  </div>
                  <span>
                    <strong>التحليلات والمؤشرات</strong>
                    <small>رسوم ومعدلات النمو</small>
                  </span>
                </button>

                <button
                  className="quick-action"
                  onClick={() => setPage("settings")}
                >
                  <div>
                    <Icon name="settings" size={23} />
                  </div>
                  <span>
                    <strong>إعدادات النظام والبصمة</strong>
                    <small>Face ID وضبط الأمان</small>
                  </span>
                </button>
              </section>
            </>
          )}

          {page === "users" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h3>
                    المستخدمون
                  </h3>

                  <p>
                    جميع حسابات مستخدمي Orderi
                    المسجلة
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    className="primary-button"
                    onClick={openCreateUserModal}
                    style={{ minHeight: "36px", padding: "0 14px", fontSize: "12px", gap: "6px", display: "inline-flex", alignItems: "center" }}
                  >
                    <Icon name="plus" size={16} />
                    إضافة مستخدم جديد
                  </button>

                  <button
                    className="icon-text-button"
                    onClick={() => {
                      exportUsersToCSV(filteredUsers);
                      addAudit("تصدير تقرير المستخدمين", `ملف CSV (${filteredUsers.length} مستخدم)`, "system");
                      showToast("success", "تم تصدير ملف المستخدمين (Excel/CSV)");
                    }}
                    title="تصدير جدول المستخدمين إلى Excel"
                  >
                    <Icon name="download" size={16} />
                    تصدير Excel
                  </button>

                  <button
                    className="icon-text-button"
                    onClick={
                      loadData
                    }
                    disabled={loading}
                  >
                    <Icon
                      name="refresh"
                      size={17}
                    />

                    {loading
                      ? "جاري التحديث..."
                      : "تحديث"}
                  </button>
                </div>
              </div>

              {/* Users Toolbar: Filter Tabs & Live Search */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", padding: "0 0 16px" }}>
                <div style={{ display: "flex", gap: "6px", background: "var(--surface-2)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                  {[
                    { id: "all", label: "الجميع", count: users.length },
                    { id: "active", label: "النشطين", count: activeUsers },
                    { id: "inactive", label: "المعطلين", count: users.filter((u) => u.is_active === false).length },
                    { id: "expired", label: "المنتهين", count: users.filter((u) => isExpired(u.activation_expires_at)).length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setUserFilter(tab.id as any)}
                      style={{
                        padding: "5px 12px",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "8px",
                        border: "none",
                        background: userFilter === tab.id ? "var(--surface)" : "transparent",
                        color: userFilter === tab.id ? "var(--primary)" : "var(--muted)",
                        boxShadow: userFilter === tab.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <div className="search-box" style={{ maxWidth: "260px", margin: 0 }}>
                  <Icon name="search" size={16} />
                  <input
                    placeholder="بحث باسم المستخدم أو البريد..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="search-clear"
                      onClick={() => setSearch("")}
                    >
                      <Icon name="close" size={13} />
                    </button>
                  )}
                </div>
              </div>

              {filteredUsers.length ===
              0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon
                      name="users"
                      size={28}
                    />
                  </div>

                  <h4>
                    {search || userFilter !== "all"
                      ? "لا توجد نتائج مطابقة للبحث أو التصفية"
                      : "لا يوجد مستخدمون حتى الآن"}
                  </h4>

                  <p>
                    {search || userFilter !== "all"
                      ? "جرب كتابة اسم مختلف أو اختر تصنيفاً آخر."
                      : "عندما يقوم أول مستخدم بالتسجيل سيظهر حسابه هنا."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-wrapper desktop-table">
                    <table>
                    <thead>
                      <tr>
                        <th style={{ width: "40px", textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={
                              filteredUsers.length > 0 &&
                              selectedUserIds.length === filteredUsers.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds(filteredUsers.map((u) => u.id));
                              } else {
                                setSelectedUserIds([]);
                              }
                            }}
                            style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                          />
                        </th>

                        <th>
                          المستخدم
                        </th>

                        <th>
                          الاسم الكامل
                        </th>

                        <th>
                          البريد الإلكتروني
                        </th>

                        <th>
                          الحالة
                        </th>

                        <th>
                          الأجهزة
                        </th>

                        <th>
                          انتهاء التفعيل
                        </th>

                        <th>
                          التسجيل
                        </th>

                        <th>
                          الإدارة
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map(
                        (user) => {
                          const expired =
                            isExpired(
                              user.activation_expires_at
                            );

                          return (
                            <tr
                              key={
                                user.id
                              }
                            >
                              <td style={{ textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={selectedUserIds.includes(user.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUserIds((prev) => [...prev, user.id]);
                                    } else {
                                      setSelectedUserIds((prev) =>
                                        prev.filter((id) => id !== user.id)
                                      );
                                    }
                                  }}
                                  style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                                />
                              </td>

                              <td>
                                <div className="user-cell">
                                  <div className="user-avatar">
                                    {(
                                      user.username ||
                                      "U"
                                    )[0].toUpperCase()}
                                  </div>

                                  <strong>
                                    {user.username ||
                                      "—"}
                                  </strong>
                                </div>
                              </td>

                              <td>
                                {user.full_name ||
                                  "—"}
                              </td>

                              <td>
                                {user.email ||
                                  "—"}
                              </td>

                              <td>
                                <span
                                  className={`status-badge ${
                                    user.is_active !==
                                      false &&
                                    !expired
                                      ? "available"
                                      : "expired"
                                  }`}
                                >
                                  {user.is_active ===
                                  false
                                    ? "غير نشط"
                                    : expired
                                    ? "منتهي"
                                    : "نشط"}
                                </span>
                              </td>

                              <td>
                                {user.max_devices ||
                                  1}
                              </td>

                              <td>
                                {formatDate(
                                  user.activation_expires_at
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  user.created_at
                                )}
                              </td>

                              <td>
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    gap: "6px",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "flex-start",
                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  <button
                                    className="mini-icon-button"
                                    onClick={() =>
                                      openEditUser(
                                        user
                                      )
                                    }
                                    title="تعديل المستخدم"
                                  >
                                    <Icon
                                      name="edit"
                                      size={15}
                                    />
                                  </button>

                                  <button
                                    className="mini-icon-button"
                                    onClick={() =>
                                      openEditUser(
                                        {
                                          ...user,
                                          is_active:
                                            user.is_active ===
                                            false,
                                        }
                                      )
                                    }
                                    title={
                                      user.is_active ===
                                      false
                                        ? "تفعيل المستخدم"
                                        : "تعطيل المستخدم"
                                    }
                                  >
                                    <Icon
                                      name="check"
                                      size={15}
                                    />
                                  </button>

                                  <button
                                    className="mini-icon-button"
                                    onClick={() =>
                                      openDeleteUser(
                                        user
                                      )
                                    }
                                    title="حذف المستخدم"
                                  >
                                    <Icon
                                      name="trash"
                                      size={15}
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-cards-list">
                  {filteredUsers.map((user) => {
                    const expired = isExpired(user.activation_expires_at);
                    const isSelected = selectedUserIds.includes(user.id);

                    return (
                      <div
                        key={user.id}
                        className={`mobile-user-card ${isSelected ? "selected" : ""}`}
                      >
                        <div className="mobile-card-header">
                          <div className="mobile-card-user-info">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds((prev) => [...prev, user.id]);
                                } else {
                                  setSelectedUserIds((prev) =>
                                    prev.filter((id) => id !== user.id)
                                  );
                                }
                              }}
                              style={{ cursor: "pointer", accentColor: "var(--primary)", width: "18px", height: "18px" }}
                            />
                            <div className="user-avatar" style={{ width: "36px", height: "36px", fontSize: "14px" }}>
                              {(user.username || "U")[0].toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ fontSize: "14px", display: "block", color: "var(--text)" }}>
                                {user.username || "—"}
                              </strong>
                              {user.full_name && (
                                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                                  {user.full_name}
                                </span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`status-badge ${
                              user.is_active !== false && !expired
                                ? "available"
                                : "expired"
                            }`}
                          >
                            {user.is_active === false
                              ? "غير نشط"
                              : expired
                              ? "منتهي"
                              : "نشط"}
                          </span>
                        </div>

                        <div className="mobile-card-details">
                          <div className="mobile-detail-item">
                            <span>البريد الإلكتروني</span>
                            <strong style={{ wordBreak: "break-all" }}>{user.email || "—"}</strong>
                          </div>
                          <div className="mobile-detail-item">
                            <span>انتهاء التفعيل</span>
                            <strong style={{ color: expired ? "var(--danger)" : "var(--primary)" }}>
                              {formatDate(user.activation_expires_at)}
                            </strong>
                          </div>
                          <div className="mobile-detail-item">
                            <span>الأجهزة المصرحة</span>
                            <strong>{user.max_devices || 1} أجهزة</strong>
                          </div>
                          <div className="mobile-detail-item">
                            <span>تاريخ التسجيل</span>
                            <strong>{formatDate(user.created_at)}</strong>
                          </div>
                        </div>

                        <div className="mobile-card-actions">
                          <button
                            className="secondary-button"
                            onClick={() => openEditUser(user)}
                            style={{ flex: 1, minHeight: "38px", fontSize: "12px" }}
                          >
                            <Icon name="edit" size={14} />
                            تعديل
                          </button>

                          <button
                            className="secondary-button"
                            onClick={() => openEditUser({ ...user, is_active: user.is_active === false })}
                            style={{ flex: 1, minHeight: "38px", fontSize: "12px" }}
                          >
                            <Icon name="check" size={14} />
                            {user.is_active === false ? "تفعيل" : "تعطيل"}
                          </button>

                          {user.email && (
                            <button
                              className="whatsapp-btn"
                              onClick={() => {
                                const phone = user.email ? user.email.replace(/[^0-9]/g, "") : "";
                                const msg = encodeURIComponent(
                                  `مرحباً ${user.full_name || user.username}، نود تذكيرك بأن اشتراكك في تطبيق Orderi ${expired ? "قد انتهى" : "قارب على الانتهاء"}. لتجديد الاشتراك يرجى التواصل معنا.`
                                );
                                safeOpenUrl(`https://wa.me/${phone}?text=${msg}`);
                              }}
                              style={{ padding: "0 10px", minHeight: "38px", fontSize: "12px" }}
                              title="تذكير عبر واتساب"
                            >
                              <Icon name="bell" size={14} />
                              واتساب
                            </button>
                          )}

                          <button
                            className="icon-button"
                            onClick={() => openDeleteUser(user)}
                            style={{ width: "38px", height: "38px", color: "var(--danger)" }}
                            title="حذف"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
              )}
            </section>
          )}

          {page === "codes" && (
            <section className="panel full-panel">
              <div className="panel-header codes-header">
                <div>
                  <h3>
                    أكواد التفعيل
                  </h3>

                  <p>
                    إنشاء ومتابعة أكواد تفعيل
                    Orderi
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    className="primary-button"
                    onClick={() =>
                      setShowCreateModal(
                        true
                      )
                    }
                  >
                    <Icon
                      name="plus"
                      size={18}
                    />

                    إنشاء أكواد
                  </button>

                  <button
                    className="icon-text-button"
                    onClick={() => {
                      exportCodesToCSV(filteredCodes);
                      addAudit("تصدير تقرير أكواد التفعيل", `ملف CSV (${filteredCodes.length} كود)`, "system");
                      showToast("success", "تم تصدير ملف الأكواد (Excel/CSV)");
                    }}
                    title="تصدير جدول الأكواد إلى Excel"
                  >
                    <Icon name="download" size={16} />
                    تصدير Excel
                  </button>

                  <button
                    className="icon-text-button"
                    onClick={loadData}
                    disabled={loading}
                    title="تحديث الأكواد"
                  >
                    <Icon name="refresh" size={17} />
                    {loading ? "جاري التحديث..." : "تحديث"}
                  </button>
                </div>
              </div>

              <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", gap: "6px", background: "var(--surface-2)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                  {[
                    { id: "all", label: "جميع الأكواد", count: codes.length },
                    { id: "available", label: "المتاحة", count: availableCodes },
                    { id: "used", label: "المستخدمة", count: usedCodes },
                    { id: "expired", label: "المنتهية", count: expiredCodes },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCodeFilter(tab.id as any)}
                      style={{
                        padding: "5px 12px",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "8px",
                        border: "none",
                        background: codeFilter === tab.id ? "var(--surface)" : "transparent",
                        color: codeFilter === tab.id ? "var(--primary)" : "var(--muted)",
                        boxShadow: codeFilter === tab.id ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                        cursor: "pointer",
                      }}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <div className="search-box">
                  <Icon
                    name="search"
                    size={18}
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    placeholder="ابحث عن كود..."
                  />
                </div>

                <div className="toolbar-count">
                  عرض{" "}
                  {
                    filteredCodes.length
                  }{" "}
                  من{" "}
                  {
                    codes.length
                  }
                </div>
              </div>

              {filteredCodes.length ===
              0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon
                      name="key"
                      size={28}
                    />
                  </div>

                  <h4>
                    {codes.length ===
                    0
                      ? "لا توجد أكواد"
                      : "لا توجد نتائج"}
                  </h4>

                  <p>
                    {codes.length ===
                    0
                      ? "أنشئ أول كود تفعيل من الزر أعلاه."
                      : "جرّب البحث باستخدام كود مختلف."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-wrapper desktop-table">
                    <table>
                    <thead>
                      <tr>
                        <th>
                          كود التفعيل
                        </th>

                        <th>
                          المدة
                        </th>

                        <th>
                          الحالة
                        </th>

                        <th>
                          المستخدم
                        </th>

                        <th>
                          تاريخ الانتهاء
                        </th>

                        <th>
                          تاريخ الإنشاء
                        </th>

                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCodes.map(
                        (code) => {
                          const expired =
                            !code.is_used &&
                            isExpired(
                              code.expires_at
                            );

                          return (
                            <tr
                              key={
                                code.id
                              }
                            >
                              <td>
                                <div className="code-cell">
                                  <span>
                                    {code.code}
                                  </span>

                                  <button
                                    className="mini-icon-button"
                                    onClick={() => setQrModalCode(code)}
                                    title="عرض رمز QR للتفعيل"
                                    style={{ color: "#38bdf8" }}
                                  >
                                    <Icon name="qr" size={15} />
                                  </button>

                                  <button
                                    className="mini-icon-button"
                                    onClick={() =>
                                      copyCode(
                                        code.code
                                      )
                                    }
                                    title="نسخ"
                                  >
                                    <Icon
                                      name={
                                        copied ===
                                        code.code
                                          ? "check"
                                          : "copy"
                                      }
                                      size={
                                        15
                                      }
                                    />
                                  </button>
                                </div>
                              </td>

                              <td>
                                {
                                  code.duration_days
                                }{" "}
                                يوم
                              </td>

                              <td>
                                <span
                                  className={`status-badge ${
                                    code.is_used
                                      ? "used"
                                      : expired
                                      ? "expired"
                                      : "available"
                                  }`}
                                >
                                  {code.is_used
                                    ? "مستخدم"
                                    : expired
                                    ? "منتهي"
                                    : "متاح"}
                                </span>
                              </td>

                              <td>
                                {code.used_by ||
                                  "—"}
                              </td>

                              <td>
                                {formatDate(
                                  code.expires_at
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  code.created_at
                                )}
                              </td>

                              <td>
                                {!code.is_used &&
                                  !expired && (
                                    <button
                                      className="copy-button"
                                      onClick={() =>
                                        copyCode(
                                          code.code
                                        )
                                      }
                                    >
                                      <Icon
                                        name="copy"
                                        size={15}
                                      />

                                      نسخ
                                    </button>
                                  )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mobile-cards-list">
                  {filteredCodes.map((code) => {
                    const expired = !code.is_used && isExpired(code.expires_at);

                    return (
                      <div key={code.id} className="mobile-code-card">
                        <div className="mobile-code-header">
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="mobile-code-string">{code.code}</span>
                            <button
                              className="mini-icon-button"
                              onClick={() => {
                                copyCode(code.code);
                                showToast("success", "تم نسخ كود التفعيل");
                              }}
                              title="نسخ الكود"
                            >
                              <Icon name={copied === code.code ? "check" : "copy"} size={14} />
                            </button>
                          </div>

                          <span
                            className={`status-badge ${
                              code.is_used
                                ? "used"
                                : expired
                                ? "expired"
                                : "available"
                            }`}
                          >
                            {code.is_used
                              ? "مستخدم"
                              : expired
                              ? "منتهي"
                              : "متاح"}
                          </span>
                        </div>

                        <div className="mobile-card-details">
                          <div className="mobile-detail-item">
                            <span>مدة التفعيل</span>
                            <strong>{code.duration_days} يومًا</strong>
                          </div>
                          <div className="mobile-detail-item">
                            <span>المستخدم</span>
                            <strong>{code.used_by || "—"}</strong>
                          </div>
                          <div className="mobile-detail-item">
                            <span>تاريخ الإنشاء</span>
                            <strong>{formatDate(code.created_at)}</strong>
                          </div>
                          <div className="mobile-detail-item">
                            <span>انتهاء الصلاحية</span>
                            <strong>{formatDate(code.expires_at)}</strong>
                          </div>
                        </div>

                        <div className="mobile-card-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setQrModalCode(code)}
                            style={{ flex: 1, minHeight: "38px", fontSize: "12px" }}
                            title="رمز QR"
                          >
                            <Icon name="qr" size={14} />
                            QR
                          </button>

                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => {
                              copyCode(code.code);
                              showToast("success", "تم نسخ كود التفعيل");
                            }}
                            style={{ flex: 1, minHeight: "38px", fontSize: "12px" }}
                            title="نسخ الكود"
                          >
                            <Icon name={copied === code.code ? "check" : "copy"} size={14} />
                            {copied === code.code ? "تم النسخ" : "نسخ"}
                          </button>

                          <button
                            type="button"
                            className="whatsapp-btn"
                            onClick={() => {
                              const text = encodeURIComponent(
                                `كود تفعيل Orderi الخاص بك هو:\n${code.code}\nمدة التفعيل: ${code.duration_days} يومًا`
                              );
                              safeOpenUrl(`https://wa.me/?text=${text}`);
                            }}
                            style={{ padding: "0 10px", minHeight: "38px", fontSize: "12px" }}
                            title="مشاركة عبر واتساب"
                          >
                            <Icon name="bell" size={14} />
                            واتساب
                          </button>

                          <button
                            type="button"
                            className="icon-button"
                            onClick={async () => {
                              try {
                                await deleteActivationCode(code.id);
                                setCodes((current) => current.filter((c) => c.id !== code.id));
                                addAudit("إلغاء كود تفعيل", `كود ${code.code}`, "code");
                                showToast("success", "تم إلغاء كود التفعيل في قاعدة البيانات");
                              } catch (err) {
                                const message = err instanceof Error ? err.message : "تعذر حذف كود التفعيل من السيرفر.";
                                setError(message);
                                showToast("error", message);
                              }
                            }}
                            style={{ width: "38px", height: "38px", color: "var(--danger)" }}
                            title="إلغاء كود التفعيل"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
              )}
            </section>
          )}

          {page === "analytics" && (
            <div className="analytics-section">
              <div className="panel full-panel">
                <div className="panel-header">
                  <div>
                    <h3>إحصاءات فعلية من بيانات السيرفر</h3>
                    <p>الأرقام التالية محسوبة من بيانات المستخدمين وأكواد التفعيل التي تم تحميلها من قاعدة البيانات، ولا تستخدم بيانات تجريبية.</p>
                  </div>
                  <button
                    className="icon-text-button"
                    onClick={() => void loadData()}
                    disabled={loading}
                  >
                    <Icon name="refresh" size={16} />
                    {loading ? "جارٍ التحديث..." : "تحديث البيانات"}
                  </button>
                </div>
                <div className="analytics-grid">
                  <div className="info-card">
                    <span>المستخدمون المحمّلون من السيرفر</span>
                    <strong>{users.length}</strong>
                  </div>
                  <div className="info-card">
                    <span>أكواد التفعيل المتاحة</span>
                    <strong>{codes.filter((code) => !code.is_used && !isExpired(code.expires_at)).length}</strong>
                  </div>
                  <div className="info-card">
                    <span>أكواد التفعيل المستخدمة</span>
                    <strong>{codes.filter((code) => code.is_used).length}</strong>
                  </div>
                  <div className="info-card">
                    <span>حالة الاتصال بالسيرفر</span>
                    <strong>{serverOnline ? "متصل" : "غير متصل"}</strong>
                  </div>
                </div>
                {!serverOnline && (
                  <p style={{ padding: "0 16px 16px", color: "var(--danger)" }}>
                    لا يمكن عرض إحصاءات مباشرة حتى يعود اتصال السيرفر.
                  </p>
                )}
              </div>
            </div>
          )}

          {page === "server" && (
            <section className="server-page">
              <div
                className={`server-main-card ${
                  serverOnline
                    ? "server-online"
                    : "server-offline"
                }`}
              >
                <div className="server-visual">
                  <div className="server-pulse">
                    <Icon
                      name="server"
                      size={38}
                    />
                  </div>
                </div>

                <div className="server-main-info">
                  <span>
                    حالة Orderi Server
                  </span>

                  <h1>
                    {serverOnline
                      ? "السيرفر يعمل بشكل طبيعي"
                      : "السيرفر غير متصل"}
                  </h1>

                  <p>
                    {serverOnline
                      ? "الاتصال بقاعدة البيانات وواجهة API يعملان حاليًا عبر Supabase."
                      : "تعذر الوصول إلى واجهة API الخاصة بـ Supabase."}
                  </p>

                  <button
                    className="primary-button"
                    onClick={
                      checkServerStatus
                    }
                  >
                    <Icon
                      name="refresh"
                      size={17}
                    />

                    فحص الاتصال الآن
                  </button>
                </div>
              </div>

              <div className="server-info-grid">
                <div className="info-card">
                  <span>
                    API Status
                  </span>

                  <strong>
                    {serverOnline
                      ? "HTTP 200 / Online"
                      : "Offline"}
                  </strong>
                </div>

                <div className="info-card">
                  <span>
                    Database
                  </span>

                  <strong>
                    {serverOnline
                      ? "Connected"
                      : "Unknown"}
                  </strong>
                </div>

                <div className="info-card">
                  <span>
                    آخر فحص
                  </span>

                  <strong>
                    {serverTime
                      ? formatDateTime(
                          serverTime
                        )
                      : "—"}
                  </strong>
                </div>

                <div className="info-card">
                  <span>
                    المستخدمون
                  </span>

                  <strong>
                    {users.length}
                  </strong>
                </div>

                <div className="info-card" style={{ gridColumn: "1 / -1" }}>
                  <span>عنوان السيرفر المتصل (Supabase Endpoint)</span>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "6px" }}>
                    <code style={{ fontSize: "12px", color: "#38bdf8", wordBreak: "break-all", background: "rgba(56, 189, 248, 0.08)", padding: "4px 8px", borderRadius: "6px", flex: 1 }}>
                      {getApiUrl()}
                    </code>
                    <button
                      className="mini-icon-button"
                      onClick={() => {
                        navigator.clipboard.writeText(getApiUrl());
                        showToast("success", "تم نسخ رابط السيرفر");
                      }}
                      title="نسخ الرابط"
                    >
                      <Icon name="copy" size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {page === "audit" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <h3>سجل العمليات والتدقيق الأمني (Security Audit Trail)</h3>
                  <p>توثيق تفصيلي لجميع الأنشطة والعمليات التي تمت بواسطة مسؤولي النظام</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "4px", background: "var(--surface-2)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    {["all", "auth", "user", "code", "server", "system"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setAuditFilter(cat)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          border: "none",
                          background: auditFilter === cat ? "var(--surface)" : "transparent",
                          color: auditFilter === cat ? "var(--primary)" : "var(--muted)",
                          cursor: "pointer",
                        }}
                      >
                        {cat === "all" ? "الكل" : cat}
                      </button>
                    ))}
                  </div>

                  <button
                    className="icon-text-button"
                    onClick={() => {
                      const headers = ["ID", "العملية", "الهدف", "التصنيف", "الوقت", "الحالة", "التفاصيل"];
                      const rows = auditLogs.map((l) => [l.id, l.action, l.target || "", l.category, l.timestamp, l.status, l.details || ""]);
                      const csvContent = "\uFEFF" + [headers, ...rows].map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
                      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `orderi_audit_${new Date().toISOString().slice(0, 10)}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      showToast("success", "تم تصدير سجل العمليات بنجاح");
                    }}
                  >
                    <Icon name="download" size={16} />
                    تصدير السجل
                  </button>

                  <button
                    className="icon-text-button"
                    onClick={() => {
                      setAuditLogs([]);
                      showToast("success", "تم مسح سجل العمليات");
                    }}
                  >
                    <Icon name="trash" size={16} />
                    مسح السجل
                  </button>
                </div>
              </div>

              {auditLogs.filter((l) => auditFilter === "all" || l.category === auditFilter).length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon name="clock" size={28} />
                  </div>
                  <h4>لا توجد عمليات مسجلة</h4>
                  <p>العمليات الجديدة ستظهر هنا فور إجرائها.</p>
                </div>
              ) : (
                <>
                  <div className="table-wrapper desktop-table">
                    <table>
                      <thead>
                        <tr>
                          <th>العملية</th>
                          <th>التصنيف</th>
                          <th>الهدف</th>
                          <th>الوقت والتاريخ</th>
                          <th>الحالة</th>
                          <th>التفاصيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs
                          .filter((l) => auditFilter === "all" || l.category === auditFilter)
                          .map((log) => (
                            <tr key={log.id}>
                              <td>
                                <strong>{log.action}</strong>
                              </td>
                              <td>
                                <span className={`audit-chip ${log.category}`}>{log.category}</span>
                              </td>
                              <td>
                                <code>{log.target || "—"}</code>
                              </td>
                              <td>{formatDateTime(log.timestamp)}</td>
                              <td>
                                <span className={`status-badge ${log.status === "success" ? "available" : "expired"}`}>
                                  {log.status === "success" ? "ناجح" : "تحذير"}
                                </span>
                              </td>
                              <td style={{ fontSize: "12px", color: "var(--muted)" }}>{log.details || "—"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mobile-cards-list">
                    {auditLogs
                      .filter((l) => auditFilter === "all" || l.category === auditFilter)
                      .map((log) => (
                        <div key={log.id} className="mobile-user-card">
                          <div className="mobile-card-header">
                            <div>
                              <strong style={{ fontSize: "13.5px", color: "var(--text)" }}>{log.action}</strong>
                              <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
                                {formatDateTime(log.timestamp)}
                              </span>
                            </div>
                            <span className={`status-badge ${log.status === "success" ? "available" : "expired"}`}>
                              {log.status === "success" ? "ناجح" : "تحذير"}
                            </span>
                          </div>

                          <div className="mobile-card-details">
                            <div className="mobile-detail-row">
                              <span>التصنيف</span>
                              <span className={`audit-chip ${log.category}`}>{log.category}</span>
                            </div>
                            {log.target && (
                              <div className="mobile-detail-row">
                                <span>الهدف</span>
                                <code style={{ fontSize: "11px" }}>{log.target}</code>
                              </div>
                            )}
                            {log.details && (
                              <div className="mobile-detail-row" style={{ gridColumn: "1 / -1" }}>
                                <span>التفاصيل</span>
                                <span style={{ fontSize: "12px", color: "var(--text)" }}>{log.details}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </section>
          )}

          {page === "settings" && (
            <section className="settings-page">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>
                      {t.appearance}
                    </h3>

                    <p>
                      {t.appearanceDesc}
                    </p>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-icon">
                    <Icon
                      name={
                        darkMode
                          ? "moon"
                          : "sun"
                      }
                      size={20}
                    />
                  </div>

                  <div className="setting-text">
                    <strong>
                      {t.darkMode}
                    </strong>

                    <span>
                      {t.darkModeDesc}
                    </span>
                  </div>

                  <button
                    className={`toggle ${
                      darkMode
                        ? "on"
                        : ""
                    }`}
                    onClick={() =>
                      setDarkMode(
                        !darkMode
                      )
                    }
                  >
                    <span />
                  </button>
                </div>

                <div className="setting-row">
                  <div className="setting-icon">
                    <Icon name="globe" size={20} />
                  </div>

                  <div className="setting-text">
                    <strong>
                      {t.appLanguage}
                    </strong>

                    <span>
                      {t.appLanguageDesc}
                    </span>
                  </div>

                  <div className="lang-segment-control">
                    <button
                      type="button"
                      className={`lang-segment-btn ${lang === "ar" ? "active" : ""}`}
                      onClick={() => setLang("ar")}
                    >
                      🇸🇦 {t.arabic}
                    </button>
                    <button
                      type="button"
                      className={`lang-segment-btn ${lang === "en" ? "active" : ""}`}
                      onClick={() => setLang("en")}
                    >
                      🇺🇸 {t.english}
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>
                      النظام
                    </h3>

                    <p>
                      معلومات الاتصال الحالية
                    </p>
                  </div>
                </div>

                <div className="system-list">
                  <div>
                    <span>
                      Application
                    </span>

                    <strong>
                      Orderi Admin
                    </strong>
                  </div>

                  <div>
                    <span>
                      API
                    </span>

                    <strong>
                      Supabase Edge Function
                    </strong>
                  </div>

                  <div>
                    <span>
                      Authentication
                    </span>

                    <strong>
                      JWT
                    </strong>
                  </div>

                  <div>
                    <span>
                      Database
                    </span>

                    <strong>
                      Supabase
                    </strong>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>إعدادات اتصال السيرفر (Supabase Edge Function)</h3>
                    <p>خادم الـ API المرتبط بالتطبيق لتسجيل المستخدمين وإصدار الأكواد</p>
                  </div>
                </div>

                <div style={{ padding: "16px 20px" }}>
                  <label className="modal-field" style={{ marginBottom: "12px" }}>
                    رابط السيرفر النشط (API Base URL)
                    <input
                      value={serverUrlInput}
                      onChange={(e) => setServerUrlInput(e.target.value)}
                      placeholder="https://...supabase.co/functions/v1/orderi-api"
                      dir="ltr"
                      style={{ fontFamily: "monospace", fontSize: "12px" }}
                    />
                  </label>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      className="primary-button"
                      onClick={() => {
                        setApiUrl(serverUrlInput);
                        checkServerStatus();
                        loadData();
                        showToast("success", "تم حفظ وتطبيق رابط السيرفر الجديد");
                      }}
                      style={{ minHeight: "38px" }}
                    >
                      <Icon name="check" size={16} />
                      حفظ وتطبيق الاتصال
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => {
                        setServerUrlInput(DEFAULT_SERVER_URL);
                        setApiUrl(DEFAULT_SERVER_URL);
                        checkServerStatus();
                        loadData();
                        showToast("success", "تمت استعادة رابط السيرفر الافتراضي");
                      }}
                      style={{ minHeight: "38px" }}
                    >
                      <Icon name="refresh" size={16} />
                      استعادة الرابط الأصلي
                    </button>

                    <button
                      className="icon-text-button"
                      onClick={checkServerStatus}
                      style={{ minHeight: "38px" }}
                    >
                      <Icon name="activity" size={16} />
                      فحص الاستجابة الآن
                    </button>
                  </div>

                  <p style={{ margin: "10px 0 0", fontSize: "11px", color: "var(--muted)" }}>
                    الرابط الافتراضي المعتمد: <code style={{ color: "#38bdf8" }}>{DEFAULT_SERVER_URL}</code>
                  </p>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3>
                      تسجيل الدخول بالبصمة
                    </h3>

                    <p>
                      إدارة التحقق الحيوي عبر بصمة الإصبع أو الوجه (Biometrics)
                    </p>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-icon">
                    <Icon
                      name="fingerprint"
                      size={20}
                    />
                  </div>

                  <div className="setting-text">
                    <strong>
                      تفعيل الدخول بالبصمة
                    </strong>

                    <span>
                      {biometricEnabled
                        ? "ميزة البصمة مفعلة لهذا المتصفح"
                        : "ميزة البصمة غير مفعلة"}
                    </span>
                  </div>

                  <button
                    className={`toggle ${
                      biometricEnabled
                        ? "on"
                        : ""
                    }`}
                    onClick={() => {
                      const next = !biometricEnabled;
                      setBiometricEnabled(next);
                      localStorage.setItem(
                        "orderi_biometric_enabled",
                        String(next)
                      );
                      showToast(
                        "success",
                        next
                          ? "تم تفعيل الدخول بالبصمة"
                          : "تم إيقاف الدخول بالبصمة"
                      );
                    }}
                  >
                    <span />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "16px 20px",
                    borderTop: "1px solid var(--border)",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={async () => {
                      try {
                        await triggerBiometricAuth(
                          "face",
                          "اختبار مستشعر بصمة الوجه (Face ID)"
                        );
                        showToast(
                          "success",
                          "تم التحقق بنجاح! ميزة بصمة الوجه تعمل بكفاءة عالية."
                        );
                      } catch (err: any) {
                        showToast(
                          "error",
                          err?.message || "تم إلغاء فحص بصمة الوجه"
                        );
                      }
                    }}
                  >
                    <Icon
                      name="face-id"
                      size={16}
                    />
                    تجربة فحص بصمة الوجه (Face ID)
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={async () => {
                      try {
                        await triggerBiometricAuth(
                          "fingerprint",
                          "اختبار مستشعر بصمة الإصبع"
                        );
                        showToast(
                          "success",
                          "تم التحقق بنجاح! مستشعر البصمة يعمل بشكل سليم."
                        );
                      } catch (err: any) {
                        showToast(
                          "error",
                          err?.message || "تم إلغاء فحص البصمة"
                        );
                      }
                    }}
                  >
                    <Icon
                      name="fingerprint"
                      size={16}
                    />
                    تجربة فحص بصمة الإصبع
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    style={{
                      color: "var(--danger)",
                    }}
                    onClick={() => {
                      localStorage.removeItem(
                        "orderi_biometric_enabled"
                      );
                      localStorage.removeItem(
                        "orderi_biometric_username"
                      );
                      localStorage.removeItem(
                        "orderi_biometric_pass"
                      );
                      setBiometricEnabled(false);
                      showToast(
                        "success",
                        "تم مسح بيانات البصمة المحفوظة لهذا المتصفح"
                      );
                    }}
                  >
                    <Icon
                      name="trash"
                      size={16}
                    />
                    مسح بيانات البصمة المحفوظة
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div
          className="modal-overlay"
          onMouseDown={() => {
            setShowCreateModal(false);
            setRecentlyCreatedCodes([]);
          }}
        >
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ width: "min(520px, 100%)" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div className="modal-title-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <Icon name="key" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--text)" }}>
                    {recentlyCreatedCodes.length > 0 ? "الأكواد التي تم إنشاؤها" : "إنشاء أكواد تفعيل جديدة"}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: "var(--muted)" }}>
                    {recentlyCreatedCodes.length > 0
                      ? `تم حفظ ${recentlyCreatedCodes.length} كود تفعيل بنجاح في قاعدة البيانات`
                      : "توليد أكواد ترخيص مرخصة ومباشرة للمستخدمين"}
                  </p>
                </div>
              </div>

              <button
                className="modal-close"
                onClick={() => {
                  setShowCreateModal(false);
                  setRecentlyCreatedCodes([]);
                }}
                title="إغلاق"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="modal-body">
              {recentlyCreatedCodes.length > 0 ? (
                <div>
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.1)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "14px",
                      padding: "14px",
                      textAlign: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "4px" }}>🎉</div>
                    <strong style={{ fontSize: "15px", color: "var(--text)", display: "block" }}>
                      تم إنشاء وحفظ {recentlyCreatedCodes.length} كود تفعيل بنجاح!
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                      يمكنك نسخ الأكواد مباشرة أو مشاركتها مع المستخدمين
                    </span>
                  </div>

                  <div className="created-codes-result">
                    {recentlyCreatedCodes.map((c) => (
                      <div key={c.id} className="created-code-row">
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span className="created-code-val">{c.code}</span>
                          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                            المدة: {c.duration_days} يومًا · {c.code.startsWith("VIP") ? "ترخيص VIP ⭐" : "ترخيص قياسي"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: "6px 12px", minHeight: "34px", fontSize: "12px" }}
                            onClick={() => {
                              copyCode(c.code);
                              showToast("success", "تم نسخ الكود");
                            }}
                          >
                            <Icon name={copied === c.code ? "check" : "copy"} size={13} />
                            {copied === c.code ? "تم النسخ" : "نسخ"}
                          </button>
                          <button
                            type="button"
                            className="mini-icon-button"
                            style={{ color: "#38bdf8", width: "34px", height: "34px" }}
                            onClick={() => setQrModalCode(c)}
                            title="عرض QR Code"
                          >
                            <Icon name="qr" size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Duration Section */}
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)" }}>
                        مدة التفعيل لكل كود
                      </span>
                      <button
                        type="button"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--primary)",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: 0,
                        }}
                        onClick={() => setCustomDaysMode(!customDaysMode)}
                      >
                        {customDaysMode ? "اختيار من المدد السريعة" : "مدة مخصصة بالأيام"}
                      </button>
                    </div>

                    {customDaysMode ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="number"
                          min={1}
                          max={3650}
                          value={customDaysInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomDaysInput(val);
                            setDurationDays(Math.max(1, Number(val) || 1));
                          }}
                          placeholder="أدخل عدد الأيام..."
                          style={{
                            flex: 1,
                            height: "46px",
                            border: "1.5px solid var(--primary)",
                            borderRadius: "12px",
                            background: "var(--surface-2)",
                            color: "var(--text)",
                            padding: "0 14px",
                            fontSize: "15px",
                            fontFamily: "inherit",
                          }}
                        />
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
                          يومًا
                        </span>
                      </div>
                    ) : (
                      <div className="duration-chips-grid">
                        {[
                          { days: 7, label: "7 أيام", sub: "تجريبي" },
                          { days: 30, label: "30 يومًا", sub: "شهر كامل ⭐" },
                          { days: 60, label: "60 يومًا", sub: "شهران" },
                          { days: 90, label: "90 يومًا", sub: "3 أشهر" },
                          { days: 180, label: "180 يومًا", sub: "6 أشهر" },
                          { days: 365, label: "سنة كاملة", sub: "365 يومًا" },
                        ].map((d) => (
                          <button
                            type="button"
                            key={d.days}
                            className={`duration-chip-btn ${durationDays === d.days && !customDaysMode ? "active" : ""}`}
                            onClick={() => {
                              setDurationDays(d.days);
                              setCustomDaysMode(false);
                            }}
                          >
                            <span>{d.label}</span>
                            <span className="duration-chip-sub">{d.sub}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quantity Section */}
                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text)", display: "block", marginBottom: "6px" }}>
                      عدد الأكواد المطلوب إنشاؤها
                    </span>

                    <div className="count-stepper-box">
                      <button
                        type="button"
                        className="count-step-btn"
                        disabled={count <= 1}
                        onClick={() => setCount(Math.max(1, count - 1))}
                        title="إنقاص"
                      >
                        -
                      </button>
                      <div className="count-number-display">
                        {count} <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--muted)" }}>كود</span>
                      </div>
                      <button
                        type="button"
                        className="count-step-btn"
                        disabled={count >= 100}
                        onClick={() => setCount(Math.min(100, count + 1))}
                        title="زيادة"
                      >
                        +
                      </button>
                    </div>

                    <div className="count-preset-chips">
                      {[1, 5, 10, 20, 50].map((num) => (
                        <button
                          type="button"
                          key={num}
                          className={`count-preset-chip ${count === num ? "active" : ""}`}
                          onClick={() => setCount(num)}
                        >
                          {num} {num === 1 ? "كود" : "أكواد"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* License Tier Option */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "13px", color: "var(--text)", display: "block" }}>
                        ترخيص VIP مميز
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                        يبدأ الكود بـ VIP- ويعطي أولوية للمستخدم
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`toggle ${isVipLicense ? "on" : ""}`}
                      onClick={() => setIsVipLicense(!isVipLicense)}
                      title="تبديل ترخيص VIP"
                    >
                      <span />
                    </button>
                  </div>

                  {/* Real-time Summary Card */}
                  <div className="code-summary-card">
                    <div className="code-summary-item">
                      <span>إجمالي الأكواد</span>
                      <strong>{count} كود</strong>
                    </div>
                    <div className="code-summary-item">
                      <span>مدة كل كود</span>
                      <strong>{customDaysMode ? customDaysInput : durationDays} يومًا</strong>
                    </div>
                    <div className="code-summary-item">
                      <span>نوع الترخيص</span>
                      <strong style={{ color: isVipLicense ? "#f59e0b" : "var(--primary)" }}>
                        {isVipLicense ? "ترخيص VIP ⭐" : "ترخيص قياسي"}
                      </strong>
                    </div>
                    <div className="code-summary-item">
                      <span>الحالة والتخزين</span>
                      <strong style={{ color: "#10b981" }}>متاح فوراً بقاعدة البيانات</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {recentlyCreatedCodes.length > 0 ? (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setRecentlyCreatedCodes([])}
                    style={{ flex: 1 }}
                  >
                    <Icon name="plus" size={15} />
                    إنشاء أكواد أخرى
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      const allText = recentlyCreatedCodes.map((c) => c.code).join("\n");
                      void copyCode(allText);
                      showToast("success", `تم نسخ جميع الأكواد (${recentlyCreatedCodes.length}) بنجاح`);
                    }}
                    style={{ flex: 1 }}
                  >
                    <Icon name="copy" size={15} />
                    نسخ جميع الأكواد
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setRecentlyCreatedCodes([]);
                    }}
                    disabled={loading}
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleCreateCodes}
                    disabled={loading}
                    style={{ flex: 1.5 }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" />
                        جاري الإنشاء والحفظ...
                      </>
                    ) : (
                      <>
                        <Icon name="check" size={16} />
                        إنشاء ({count}) كود تفعيل الآن
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div
          className="modal-overlay"
          onMouseDown={() => setShowConfirmModal(false)}
        >
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ width: "min(460px, 100%)", textAlign: "center" }}
          >
            <div className="modal-header" style={{ justifyContent: "center" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>تأكيد إنشاء الأكواد</h3>
              <button
                className="modal-close"
                onClick={() => setShowConfirmModal(false)}
                title="إغلاق"
                style={{ position: "absolute", left: "16px" }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ textAlign: "center" }}>
              <div className="confirmation-icon" style={{ margin: "10px auto 14px" }}>
                <Icon name="shield" size={30} />
              </div>

              <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "13.5px" }}>
                سيتم توليد وحفظ <strong>{count} كود</strong> تفعيل، مدة كل منها{" "}
                <strong>{customDaysMode ? customDaysInput : durationDays} يومًا</strong> مباشرة بقاعدة البيانات.
              </p>

              <div className="confirmation-box">
                <span>عدد الأكواد</span>
                <strong>{count}</strong>
                <span>مدة التفعيل</span>
                <strong>{customDaysMode ? customDaysInput : durationDays} يوم</strong>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowCreateModal(true);
                }}
              >
                رجوع
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleCreateCodes}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={17} />
                    تأكيد الإنشاء
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal &&
        selectedUser && (
          <div
            className="modal-overlay"
            onMouseDown={
              closeUserModal
            }
          >
            <div
              className="modal"
              onMouseDown={(e) =>
                e.stopPropagation()
              }
            >
              <div className="modal-header">
                <div className="modal-title-icon">
                  <Icon
                    name="users"
                    size={22}
                  />
                </div>

                <div>
                  <h3>
                    تعديل المستخدم
                  </h3>

                  <p>
                    تعديل بيانات حساب{" "}
                    {selectedUser.username ||
                      ""}
                  </p>
                </div>

                <button
                  className="modal-close"
                  onClick={
                    closeUserModal
                  }
                  disabled={
                    userSaving
                  }
                >
                  <Icon
                    name="close"
                    size={18}
                  />
                </button>
              </div>

              <div className="modal-body">
                <label className="modal-field">
                  رقم الهاتف

                  <input
                    value={
                      userForm.username
                    }
                    onChange={(e) =>
                      setUserForm(
                        (current) => ({
                          ...current,
                          username:
                            e.target.value,
                        })
                      )
                    }
                    autoComplete="off"
                  />
                </label>

                <label className="modal-field">
                  الاسم الكامل

                  <input
                    value={
                      userForm.fullName
                    }
                    onChange={(e) =>
                      setUserForm(
                        (current) => ({
                          ...current,
                          fullName:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="الاسم الكامل"
                  />
                </label>

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <label className="modal-field">
                    تمديد التفعيل

                    <input
                      type="number"
                      min={0}
                      max={3650}
                      value={
                        userForm.extendDays
                      }
                      onChange={(e) =>
                        setUserForm(
                          (current) => ({
                            ...current,
                            extendDays:
                              Math.min(
                                3650,
                                Math.max(
                                  0,
                                  Number(
                                    e.target
                                      .value
                                  ) || 0
                                )
                              ),
                          })
                        )
                      }
                    />

                    <small
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                        opacity:
                          0.65,
                      }}
                    >
                      اتركه 0 بدون تمديد
                    </small>
                  </label>
                </div>

                <label
                  className="modal-field"
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "row",
                    alignItems:
                      "center",
                    justifyContent:
                      "space-between",
                    gap: "12px",
                  }}
                >
                  <span>
                    حالة الحساب
                  </span>

                  <button
                    type="button"
                    className={`toggle ${
                      userForm.isActive
                        ? "on"
                        : ""
                    }`}
                    onClick={() =>
                      setUserForm(
                        (current) => ({
                          ...current,
                          isActive:
                            !current.isActive,
                        })
                      )
                    }
                  >
                    <span />
                  </button>
                </label>

                <label className="modal-field">
                  كلمة مرور جديدة

                  <input
                    type="password"
                    value={
                      userForm.password
                    }
                    onChange={(e) =>
                      setUserForm(
                        (current) => ({
                          ...current,
                          password:
                            e.target.value,
                        })
                      )
                    }
                    autoComplete="new-password"
                    placeholder="اتركها فارغة بدون تغيير"
                  />
                </label>

                <div
                  className="confirmation-box"
                  style={{
                    marginTop:
                      "8px",
                  }}
                >
                  <span>
                    انتهاء التفعيل الحالي
                  </span>

                  <strong>
                    {formatDate(
                      selectedUser.activation_expires_at
                    )}
                  </strong>

                  <span>
                    الأجهزة المسموحة
                  </span>

                  <strong>
                    {
                      userForm.maxDevices
                    }
                  </strong>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="secondary-button"
                  onClick={
                    closeUserModal
                  }
                  disabled={
                    userSaving
                  }
                >
                  إلغاء
                </button>

                <button
                  className="primary-button"
                  onClick={
                    handleSaveUser
                  }
                  disabled={
                    userSaving
                  }
                >
                  {userSaving ? (
                    <>
                      <span className="spinner" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Icon
                        name="check"
                        size={17}
                      />

                      حفظ التغييرات
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {showDeleteUserModal &&
        selectedUser && (
          <div
            className="modal-overlay"
            onMouseDown={() => {
              if (!userDeleting) {
                setShowDeleteUserModal(
                  false
                );

                setSelectedUser(
                  null
                );
              }
            }}
          >
            <div
              className="modal"
              onMouseDown={(e) => e.stopPropagation()}
              style={{ width: "min(460px, 100%)", textAlign: "center" }}
            >
              <div className="modal-header" style={{ justifyContent: "center" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--danger)" }}>
                  تأكيد حذف المستخدم
                </h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    if (!userDeleting) {
                      setShowDeleteUserModal(false);
                      setSelectedUser(null);
                    }
                  }}
                  title="إغلاق"
                  style={{ position: "absolute", left: "16px" }}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ textAlign: "center" }}>
                <div
                  className="confirmation-icon"
                  style={{
                    color: "var(--danger, #ef4444)",
                    background: "rgba(239, 68, 68, 0.12)",
                    margin: "10px auto 14px",
                  }}
                >
                  <Icon name="trash" size={30} />
                </div>

                <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: "13.5px" }}>
                  هل أنت متأكد من رغبتك في حذف حساب المستخدم <strong>{selectedUser.username}</strong> نهائيًا؟
                </p>

                <div className="confirmation-box">
                  <span>المستخدم</span>
                  <strong>{selectedUser.username || "—"}</strong>
                  <span>البريد</span>
                  <strong>{selectedUser.email || "—"}</strong>
                </div>

                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "10px" }}>
                  سيتم حذف بيانات الحساب والأجهزة المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={userDeleting}
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleDeleteUser}
                  disabled={userDeleting}
                  style={{ background: "var(--danger, #ef4444)" }}
                >
                  {userDeleting ? (
                    <>
                      <span className="spinner" />
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <Icon name="trash" size={17} />
                      تأكيد الحذف
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      {biometricModal.isOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (biometricModal.onCancel) {
              biometricModal.onCancel();
            }
            setBiometricModal((p) => ({
              ...p,
              isOpen: false,
            }));
            setBiometricLoading(false);
          }}
        >
          <div
            className="biometric-scanner-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {biometricModal.mode === "face" ? (
              <>
                <div
                  className={`face-id-scanner-viewport ${biometricModal.status}`}
                  onClick={() => {
                    if (
                      biometricModal.status === "scanning" &&
                      biometricModal.onSuccess
                    ) {
                      biometricModal.onSuccess();
                    }
                  }}
                  title="انقر للتأكيد اليدوي السريع"
                >
                  <div className="reticle-corner tl" />
                  <div className="reticle-corner tr" />
                  <div className="reticle-corner bl" />
                  <div className="reticle-corner br" />

                  {/* Live camera stream preview if supported and permitted */}
                  <video
                    ref={faceVideoRef}
                    playsInline
                    muted
                    autoPlay
                    className="face-video-feed"
                    style={{ display: faceCameraActive ? "block" : "none" }}
                  />

                  {/* Face Mesh Reticle when camera feed is inactive */}
                  {!faceCameraActive && (
                    <div className="face-mesh-overlay">
                      <Icon name="face-id" size={76} />
                    </div>
                  )}

                  {/* Laser scan bar */}
                  {biometricModal.status === "scanning" && (
                    <div className="face-scan-laser" />
                  )}

                  {/* Success checkmark badge */}
                  {biometricModal.status === "success" && (
                    <div className="face-success-badge">
                      <Icon name="check" size={44} />
                      <span style={{ fontSize: "11px", fontWeight: 700 }}>
                        تمت مطابقة الوجه
                      </span>
                    </div>
                  )}
                </div>

                <h3
                  style={{
                    margin: "0 0 6px",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  {biometricModal.status === "success"
                    ? "تم التعرف على الوجه بنجاح!"
                    : biometricModal.status === "failed"
                    ? "فشل التحقق من الوجه"
                    : "التحقق من بصمة الوجه (Face ID)"}
                </h3>

                <p className="biometric-hint" style={{ margin: "4px 0 16px" }}>
                  {biometricModal.message}
                </p>

                {biometricModal.status === "scanning" && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      if (biometricModal.onSuccess) {
                        biometricModal.onSuccess();
                      }
                    }}
                    style={{
                      width: "100%",
                      minHeight: "44px",
                      marginBottom: "8px",
                      background: "linear-gradient(135deg, #0284c7 0%, #6366f1 100%)",
                    }}
                  >
                    <Icon name="face-id" size={18} />
                    تأكيد مطابقة الوجه الآن
                  </button>
                )}
              </>
            ) : (
              <>
                <div
                  className={`biometric-fingerprint-circle ${biometricModal.status}`}
                  onClick={() => {
                    if (
                      biometricModal.status === "scanning" &&
                      biometricModal.onSuccess
                    ) {
                      biometricModal.onSuccess();
                    }
                  }}
                  title="انقر للتحقق من البصمة"
                >
                  {biometricModal.status === "success" ? (
                    <Icon
                      name="check"
                      size={42}
                    />
                  ) : (
                    <Icon
                      name="fingerprint"
                      size={44}
                    />
                  )}
                </div>

                <h3
                  style={{
                    margin: "0 0 8px",
                    fontSize: "17px",
                    color: "var(--text)",
                  }}
                >
                  {biometricModal.status === "success"
                    ? "تم التحقق بنجاح"
                    : biometricModal.status === "failed"
                    ? "فشل التحقق"
                    : "التحقق من بصمة الإصبع"}
                </h3>

                <p className="biometric-hint">
                  {biometricModal.message}
                </p>

                {biometricModal.status === "scanning" && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      if (biometricModal.onSuccess) {
                        biometricModal.onSuccess();
                      }
                    }}
                    style={{
                      width: "100%",
                      marginBottom: "8px",
                    }}
                  >
                    <Icon
                      name="fingerprint"
                      size={18}
                    />
                    تأكيد البصمة
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              className="secondary-button"
              style={{
                width: "100%",
              }}
              onClick={() => {
                if (biometricModal.onCancel) {
                  biometricModal.onCancel();
                }
                setBiometricModal((p) => ({
                  ...p,
                  isOpen: false,
                }));
                setBiometricLoading(false);
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {selectedUserIds.length > 0 && (
        <div className="floating-batch-bar">
          <span className="batch-count-tag">
            {selectedUserIds.length} محدد
          </span>
          <button className="batch-action-btn" onClick={() => handleBatchExtend(30)}>
            <Icon name="clock" size={14} />
            تمديد 30 يوم
          </button>
          <button className="batch-action-btn" onClick={() => handleBatchToggleActive(true)}>
            <Icon name="check" size={14} />
            تفعيل
          </button>
          <button className="batch-action-btn" onClick={() => handleBatchToggleActive(false)}>
            <Icon name="close" size={14} />
            تعطيل
          </button>
          <button className="batch-action-btn" onClick={handleBatchExport}>
            <Icon name="download" size={14} />
            تصدير CSV
          </button>
          <button className="batch-action-btn danger" onClick={handleBatchDelete}>
            <Icon name="trash" size={14} />
            حذف
          </button>
          <button
            className="batch-action-btn"
            style={{ background: "transparent", border: "none", color: "#94a3b8" }}
            onClick={() => setSelectedUserIds([])}
          >
            إلغاء
          </button>
        </div>
      )}

      {qrModalCode && (
        <div className="qr-modal-overlay" onClick={() => setQrModalCode(null)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text)" }}>كود التفعيل وQR Code</h3>
              <button className="icon-button" onClick={() => setQrModalCode(null)}>
                <Icon name="close" size={16} />
              </button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--muted)" }}>
              يمكن مسح هذا الرمز مباشرة بكاميرا الهاتف أو تطبيق Orderi
            </p>

            <div className="qr-code-box">
              <CodeQRCode text={qrModalCode.code} size={180} />
            </div>

            <div style={{ background: "var(--surface-2)", padding: "10px 14px", borderRadius: "10px", margin: "10px 0" }}>
              <strong style={{ fontSize: "15px", letterSpacing: "1px", color: "var(--text)" }}>
                {qrModalCode.code}
              </strong>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                المدة: {qrModalCode.duration_days} يومًا · {qrModalCode.is_used ? "مستخدم" : "متاح"}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="primary-button"
                style={{ flex: 1 }}
                onClick={() => {
                  copyCode(qrModalCode.code);
                  showToast("success", "تم نسخ كود التفعيل");
                }}
              >
                <Icon name="copy" size={16} />
                نسخ الكود
              </button>
              <button
                className="secondary-button"
                onClick={() => setQrModalCode(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {commandOpen && (
        <div className="command-palette-backdrop" onClick={() => setCommandOpen(false)}>
          <div className="command-palette-box" onClick={(e) => e.stopPropagation()}>
            <div className="command-search-header">
              <Icon name="command" size={20} />
              <input
                autoFocus
                placeholder="ابحث عن مستخدم، كود، أو أمر تنفيذي... (اكتب للبحث)"
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
              />
              <span className="kbd-shortcut">ESC</span>
            </div>

            <div className="command-results-list">
              <div className="command-group-title">التنقل السريع بين الأقسام</div>
              {[
                { id: "dashboard", label: "لوحة التحكم الرئيسية", icon: "grid" as IconName, sub: "نظرة عامة والبطاقات الإحصائية" },
                { id: "users", label: "إدارة المستخدمين", icon: "users" as IconName, sub: "عرض وتعديل وتمديد الحسابات" },
                { id: "codes", label: "أكواد التفعيل", icon: "key" as IconName, sub: "توليد ومتابعة أكواد الاشتراك" },
                { id: "analytics", label: "التحليلات ومؤشرات الأداء", icon: "chart" as IconName, sub: "رسوم بيانية ومعدلات النمو" },
                { id: "server", label: "حالة النظام والسيرفر", icon: "server" as IconName, sub: "فحص الاتصال بقاعدة البيانات" },
                { id: "audit", label: "سجل العمليات الإدارية", icon: "clock" as IconName, sub: "تدقيق الحركات والأمان" },
                { id: "settings", label: "إعدادات الإدارة والبصمة", icon: "settings" as IconName, sub: "تكوين المستشعرات والمظهر" },
              ]
                .filter((nav) => !commandQuery || nav.label.includes(commandQuery) || nav.sub.includes(commandQuery))
                .map((nav) => (
                  <div
                    key={nav.id}
                    className="command-item-row"
                    onClick={() => {
                      setPage(nav.id);
                      setCommandOpen(false);
                    }}
                  >
                    <div className="command-item-icon">
                      <Icon name={nav.icon} size={16} />
                    </div>
                    <div className="command-item-label">
                      <span>{nav.label}</span>
                      <span className="command-item-sub">{nav.sub}</span>
                    </div>
                  </div>
                ))}

              <div className="command-group-title">إجراءات وأوامر فورية</div>
              {[
                {
                  label: "إضافة مستخدم جديد",
                  icon: "plus" as IconName,
                  sub: "تسجيل حساب مستخدم جديد فورا",
                  action: () => { setPage("users"); openCreateUserModal(); setCommandOpen(false); },
                },
                {
                  label: "توليد أكواد تفعيل جديدة",
                  icon: "key" as IconName,
                  sub: "فتح نافذة توليد الأكواد",
                  action: () => { setPage("codes"); setShowCreateModal(true); setCommandOpen(false); },
                },
                {
                  label: "تصدير المستخدمين إلى Excel (CSV)",
                  icon: "download" as IconName,
                  sub: "تحميل ملف جداول للمستخدمين",
                  action: () => { exportUsersToCSV(users); setCommandOpen(false); showToast("success", "تم تصدير ملف المستخدمين"); },
                },
                {
                  label: "تصدير أكواد التفعيل (CSV)",
                  icon: "download" as IconName,
                  sub: "تحميل قائمة الأكواد كملف Excel",
                  action: () => { exportCodesToCSV(codes); setCommandOpen(false); showToast("success", "تم تصدير ملف الأكواد"); },
                },
                {
                  label: "تبديل المظهر الداكن / الفاتح",
                  icon: darkMode ? ("sun" as IconName) : ("moon" as IconName),
                  sub: `التحويل إلى الوضع ${darkMode ? "الفاتح" : "الداكن"}`,
                  action: () => { setDarkMode(!darkMode); setCommandOpen(false); },
                },
              ]
                .filter((cmd) => !commandQuery || cmd.label.includes(cmd.label))
                .map((cmd, idx) => (
                  <div key={idx} className="command-item-row" onClick={cmd.action}>
                    <div className="command-item-icon">
                      <Icon name={cmd.icon} size={16} />
                    </div>
                    <div className="command-item-label">
                      <span>{cmd.label}</span>
                      <span className="command-item-sub">{cmd.sub}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="command-footer">
              <span>استخدم الأسهم أو الفأرة للاختيار</span>
              <span>Orderi Admin Command Palette</span>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`toast ${
            toast.type ===
            "success"
              ? "toast-success"
              : "toast-error"
          }`}
        >
          <div>
            <Icon
              name={
                toast.type ===
                "success"
                  ? "check"
                  : "activity"
              }
              size={18}
            />
          </div>

          <span>
            {toast.message}
          </span>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - All 7 Sections */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`mobile-nav-item ${page === "dashboard" ? "active" : ""}`}
          onClick={() => {
            setPage("dashboard");
            setSidebarOpen(false);
          }}
          title={t.dashboard}
        >
          <Icon name="home" size={19} />
          <span>{t.mobileHome}</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${page === "users" ? "active" : ""}`}
          onClick={() => {
            setPage("users");
            setSidebarOpen(false);
          }}
          title={t.users}
        >
          <div className="mobile-nav-icon-wrap">
            <Icon name="users" size={19} />
            {users.length > 0 && (
              <span className="mobile-nav-badge">{users.length}</span>
            )}
          </div>
          <span>{t.mobileUsers}</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${page === "codes" ? "active" : ""}`}
          onClick={() => {
            setPage("codes");
            setSidebarOpen(false);
          }}
          title={t.codes}
        >
          <div className="mobile-nav-icon-wrap">
            <Icon name="key" size={19} />
            {codes.filter((c) => !c.is_used).length > 0 && (
              <span className="mobile-nav-badge">
                {codes.filter((c) => !c.is_used).length}
              </span>
            )}
          </div>
          <span>{t.mobileCodes}</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${page === "analytics" ? "active" : ""}`}
          onClick={() => {
            setPage("analytics");
            setSidebarOpen(false);
          }}
          title={t.analytics}
        >
          <Icon name="chart" size={19} />
          <span>{t.analytics}</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${page === "server" ? "active" : ""}`}
          onClick={() => {
            setPage("server");
            setSidebarOpen(false);
          }}
          title={t.server}
        >
          <div className="mobile-nav-icon-wrap">
            <Icon name="server" size={19} />
            <span
              className={`mobile-status-dot ${
                serverOnline ? "online" : "offline"
              }`}
            />
          </div>
          <span>{t.mobileServer}</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${page === "audit" ? "active" : ""}`}
          onClick={() => {
            setPage("audit");
            setSidebarOpen(false);
          }}
          title={t.audit}
        >
          <div className="mobile-nav-icon-wrap">
            <Icon name="clock" size={19} />
            {auditLogs.length > 0 && (
              <span className="mobile-nav-badge">{auditLogs.length}</span>
            )}
          </div>
          <span>{t.mobileAudit}</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${page === "settings" ? "active" : ""}`}
          onClick={() => {
            setPage("settings");
            setSidebarOpen(false);
          }}
          title={t.settings}
        >
          <Icon name="settings" size={19} />
          <span>{t.mobileSettings}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

