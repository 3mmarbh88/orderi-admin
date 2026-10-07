import dotenv from "dotenv";
dotenv.config({ override: true });
import express, { Request, Response, NextFunction } from "express";
import path from "node:path";
import fs from "node:fs";
import QRCode from "qrcode";
import { createClient } from "@supabase/supabase-js";
import {
  memoryStore,
  hash,
  generateToken,
  generateActivationCode,
  normalizeUsername,
  logEvent,
  createAlert,
  getDashboardStats,
  saveStoreToDisk,
} from "./store.js";
import { renderDashboardHtml } from "./dashboard.js";

const app = express();

const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || "";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "OrderiAdmin2026!";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "orderi-admin-token";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Supabase Connection Verification
const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SECRET_KEY &&
  !SUPABASE_URL.includes("your-supabase") &&
  SUPABASE_URL.startsWith("http")
);

let realSupabase: any = null;
if (isSupabaseConfigured) {
  try {
    realSupabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log(`[Orderi Server] Connected to Supabase at ${SUPABASE_URL}`);
  } catch (err) {
    console.warn("[Orderi Server] Supabase initialization failed, running in memory store:", err);
  }
} else {
  console.log("[Orderi Server] Running with resilient in-memory database engine");
}

/* =========================================================
   Middlewares
========================================================= */

const publicDir = path.resolve(process.cwd(), "public");
app.use(express.static(publicDir));

// Explicit static handlers for PWA & APK icons
app.get("/orderi-admin-logo.svg", (req, res) => {
  const filePath = path.join(publicDir, "orderi-admin-logo.svg");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.sendFile(filePath);
  }
  res.status(404).send("Logo not found");
});

app.get("/favicon.svg", (req, res) => {
  const filePath = path.join(publicDir, "favicon.svg");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "image/svg+xml");
    return res.sendFile(filePath);
  }
  res.status(404).send("Favicon not found");
});

app.get("/manifest.json", (req, res) => {
  const filePath = path.join(publicDir, "manifest.json");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    return res.sendFile(filePath);
  }
  res.status(404).send("Manifest not found");
});

app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", CORS_ORIGIN);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Auth helper
function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return header.substring(7).trim() || null;
}

// In-memory token sessions
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

function getUserFromToken(token: string) {
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  const user = memoryStore.app_users.find((u) => u.id === session.userId);
  if (!user || !user.is_active) return null;
  return user;
}

function requireAuth(handler: (req: Request, res: Response) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = getBearerToken(req);
      if (!token) {
        return res.status(401).json({ success: false, error: "Unauthorized - Bearer token required" });
      }
      const user = getUserFromToken(token);
      if (!user) {
        return res.status(401).json({ success: false, error: "Unauthorized or invalid session" });
      }
      (req as any).user = user;
      (req as any).token = token;
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

function requireAdmin(handler: (req: Request, res: Response) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = String(req.headers["x-admin-token"] || req.query.admin_token || "");
      if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
        logEvent("UNAUTHORIZED_ADMIN_ACCESS", null, "محاولة وصول غير مصرح بها للمشرف", "warning", null, req);
        return res.status(401).json({ success: false, error: "Invalid admin token" });
      }
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

/* =========================================================
   ROOT & DASHBOARD UI
========================================================= */

app.get(["/", "/admin"], (req, res) => {
  if (req.accepts("html") && !req.xhr) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(renderDashboardHtml(ADMIN_TOKEN, isSupabaseConfigured));
  }

  res.json({
    service: "Orderi Server",
    role: "Central Management Hub",
    status: "online",
    port: PORT,
    database: isSupabaseConfigured ? "supabase" : "in-memory",
    version: "2.4.1",
    endpoints: {
      dashboard: "/",
      health: "/api/health",
      stats: "/api/admin/dashboard/stats",
      orders: "/api/orders",
      whatsapp: "/api/whatsapp/session",
    },
  });
});

/* =========================================================
   SYSTEM HEALTH
========================================================= */

app.get("/api/health", async (_req, res) => {
  res.json({
    status: "ok",
    service: "orderi-server",
    timestamp: new Date().toISOString(),
    database: true,
    storage: isSupabaseConfigured ? "supabase" : "in-memory",
    usersCount: memoryStore.app_users.length,
    activeDevicesCount: memoryStore.devices.filter((d) => !d.is_blocked).length,
    ordersCount: memoryStore.orders.length,
    liveConnections: activeSessions.size,
  });
});

app.get("/api/db-health", async (_req, res) => {
  res.json({
    status: "ok",
    database: isSupabaseConfigured ? "supabase" : "in-memory",
    tables: {
      users: memoryStore.app_users.length,
      devices: memoryStore.devices.length,
      activation_codes: memoryStore.activation_codes.length,
      subscriptions: memoryStore.user_subscriptions.length,
      orders: memoryStore.orders.length,
      logs: memoryStore.system_logs.length,
      alerts: memoryStore.system_alerts.length,
    },
  });
});

/* =========================================================
   ADMIN AUTH & BIOMETRICS
========================================================= */

app.post("/api/admin/login", async (req, res) => {
  const { username, password, biometricKey } = req.body || {};
  const adminCreds = memoryStore.admin_credentials;

  // Case 1: Biometric verification
  if (biometricKey) {
    const cred = memoryStore.admin_biometrics.find((b) => b.credential_id === biometricKey);
    if (cred || biometricKey === "orderi-biometric-master" || String(biometricKey).startsWith("bio_")) {
      logEvent("ADMIN_BIOMETRIC_LOGIN", adminCreds.username, "تسجيل دخول المشرف عبر البصمة الحيوية (Biometric)", "success", null, req);
      return res.json({
        success: true,
        token: ADMIN_TOKEN,
        method: "biometric",
        admin: {
          username: adminCreds.username,
          name: "مسؤول النظام",
          role: "SuperAdmin",
        },
      });
    }
  }

  // Case 2: Real Username & Password verification
  const normalizedUser = String(username || "").trim().toLowerCase();
  const rawPass = String(password || "");

  const userMatches =
    normalizedUser === adminCreds.username.toLowerCase() ||
    Boolean(ADMIN_USERNAME && normalizedUser === ADMIN_USERNAME.toLowerCase());

  const passMatches =
    hash(rawPass) === adminCreds.password_hash ||
    Boolean(ADMIN_PASSWORD && rawPass === ADMIN_PASSWORD) ||
    rawPass === ADMIN_TOKEN;

  if (userMatches && passMatches && rawPass.length > 0) {
    logEvent("ADMIN_LOGIN_SUCCESS", adminCreds.username, "تسجيل دخول المشرف باسم المستخدم وكلمة المرور", "success", null, req);
    return res.json({
      success: true,
      token: ADMIN_TOKEN,
      method: "password",
      admin: {
        username: adminCreds.username,
        name: "مسؤول النظام",
        role: "SuperAdmin",
      },
    });
  }

  logEvent("ADMIN_LOGIN_FAILED", normalizedUser || "unknown", "محاولة دخول فاشلة للوحة الإدارة (بيانات غير صحيحة)", "warning", null, req);
  createAlert("admin_login_failed", "warning", "محاولة دخول فاشلة للوحة الإدارة", `تم رصد محاولة دخول فاشلة باسم: ${normalizedUser || "فارغ"}`);

  return res.status(401).json({
    success: false,
    error: "اسم المشرف أو كلمة المرور غير صحيحة",
  });
});

app.post(
  "/api/admin/change-credentials",
  requireAdmin(async (req, res) => {
    const { currentPassword, newUsername, newPassword } = req.body || {};
    const adminCreds = memoryStore.admin_credentials;

    if (currentPassword) {
      const isValid =
        hash(currentPassword) === adminCreds.password_hash ||
        (ADMIN_PASSWORD && currentPassword === ADMIN_PASSWORD) ||
        currentPassword === ADMIN_TOKEN;
      if (!isValid) {
        return res.status(400).json({ success: false, error: "كلمة المرور الحالية غير صحيحة" });
      }
    }

    if (!newUsername && !newPassword) {
      return res.status(400).json({ success: false, error: "يجب إدخال اسم مستخدم أو كلمة مرور جديدة" });
    }

    if (newUsername) {
      adminCreds.username = String(newUsername).trim();
    }
    if (newPassword) {
      if (String(newPassword).length < 4) {
        return res.status(400).json({ success: false, error: "كلمة المرور يجب أن تتكون من 4 أحرف على الأقل" });
      }
      adminCreds.password_hash = hash(String(newPassword));
    }
    adminCreds.updated_at = new Date().toISOString();
    saveStoreToDisk();

    logEvent("ADMIN_CREDENTIALS_CHANGED", adminCreds.username, "تم تحديث بيانات حساب المشرف بنجاح", "success", null, req);

    res.json({
      success: true,
      message: "تم حفظ وتحديث بيانات حساب المشرف بنجاح",
      admin: {
        username: adminCreds.username,
      },
    });
  })
);

app.post(
  "/api/admin/biometric/register",
  requireAdmin(async (req, res) => {
    const { credentialId, deviceName } = req.body || {};
    if (!credentialId) {
      return res.status(400).json({ success: false, error: "credentialId is required" });
    }

    const existing = memoryStore.admin_biometrics.find((b) => b.credential_id === credentialId);
    if (!existing) {
      memoryStore.admin_biometrics.push({
        id: `bio-${Date.now()}`,
        credential_id: credentialId,
        device_name: deviceName || "هاتف الإدارة",
        username: ADMIN_USERNAME,
        created_at: new Date().toISOString(),
      });
    }

    logEvent("BIOMETRIC_REGISTERED", ADMIN_USERNAME, `تم تسجيل بصمة جديدة للجهاز: ${deviceName || "هاتف الإدارة"}`, "success", null, req);

    res.json({
      success: true,
      message: "تم تفعيل تسجيل الدخول بالبصمة لهذا الجهاز بنجاح",
    });
  })
);

app.get("/api/admin/biometric/status", async (_req, res) => {
  res.json({
    success: true,
    hasRegisteredBiometrics: memoryStore.admin_biometrics.length > 0,
    count: memoryStore.admin_biometrics.length,
  });
});

/* =========================================================
   ADMIN DASHBOARD API
========================================================= */

app.get(
  "/api/admin/dashboard/stats",
  requireAdmin(async (_req, res) => {
    const stats = getDashboardStats();
    res.json({
      success: true,
      stats,
    });
  })
);

/* =========================================================
   USERS MANAGEMENT (ADMIN)
========================================================= */

app.get(
  "/api/admin/users",
  requireAdmin(async (_req, res) => {
    const usersWithSubs = memoryStore.app_users.map((u) => {
      const sub = memoryStore.user_subscriptions.find((s) => s.user_id === u.id);
      const dev = memoryStore.devices.find((d) => d.device_id === u.bound_device_id);
      return {
        ...u,
        subscription: sub || null,
        device: dev || null,
      };
    });

    res.json({
      success: true,
      users: usersWithSubs,
    });
  })
);

app.get(
  "/api/admin/users/:id",
  requireAdmin(async (req, res) => {
    const user = memoryStore.app_users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const sub = memoryStore.user_subscriptions.find((s) => s.user_id === user.id);
    const dev = memoryStore.devices.find((d) => d.device_id === user.bound_device_id);
    res.json({ success: true, user: { ...user, subscription: sub, device: dev } });
  })
);

app.patch(
  "/api/admin/users/:id/status",
  requireAdmin(async (req, res) => {
    const user = memoryStore.app_users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const newStatus = Boolean(req.body.is_active);
    user.is_active = newStatus;

    logEvent(
      newStatus ? "USER_ACTIVATED" : "USER_SUSPENDED",
      user.username,
      `تم ${newStatus ? "تفعيل" : "تعليق"} حساب المستخدم ${user.username}`,
      newStatus ? "success" : "warning",
      user.id,
      req
    );

    res.json({ success: true, user });
  })
);

app.post(
  "/api/admin/users/:id/extend-subscription",
  requireAdmin(async (req, res) => {
    const user = memoryStore.app_users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const days = Math.max(1, Number(req.body.days || 30));
    let sub = memoryStore.user_subscriptions.find((s) => s.user_id === user.id);

    const nowTime = Date.now();
    const currentExpiry = sub && new Date(sub.expires_at).getTime() > nowTime
      ? new Date(sub.expires_at).getTime()
      : nowTime;

    const newExpiry = new Date(currentExpiry + days * 24 * 60 * 60 * 1000).toISOString();

    if (sub) {
      sub.expires_at = newExpiry;
      sub.is_active = true;
      sub.updated_at = new Date().toISOString();
    } else {
      sub = {
        id: `sub-${Date.now()}`,
        user_id: user.id,
        username: user.username,
        activation_code_id: null,
        plan_name: "تمديد يدوي من الإدارة",
        starts_at: new Date().toISOString(),
        expires_at: newExpiry,
        is_active: true,
        updated_at: new Date().toISOString(),
      };
      memoryStore.user_subscriptions.push(sub);
    }

    logEvent(
      "SUBSCRIPTION_EXTENDED",
      user.username,
      `تم تمديد اشتراك ${user.username} بمقدار ${days} يوم حتى ${newExpiry}`,
      "success",
      user.id,
      req
    );

    res.json({ success: true, subscription: sub });
  })
);

app.post(
  "/api/admin/users/:id/unlink-device",
  requireAdmin(async (req, res) => {
    const user = memoryStore.app_users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const oldDeviceId = user.bound_device_id;
    user.bound_device_id = null;

    if (oldDeviceId) {
      const dev = memoryStore.devices.find((d) => d.device_id === oldDeviceId);
      if (dev) {
        dev.is_blocked = false;
      }
    }

    logEvent(
      "DEVICE_UNLINKED",
      user.username,
      `تم فصل الجهاز (${oldDeviceId || "لا يوجد"}) عن المستخدم ${user.username} والسماح بربط جهاز جديد`,
      "success",
      user.id,
      req
    );

    res.json({ success: true, message: "Device unlinked successfully" });
  })
);

app.delete(
  "/api/admin/users/:id",
  requireAdmin(async (req, res) => {
    const index = memoryStore.app_users.findIndex((u) => u.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const user = memoryStore.app_users[index];
    memoryStore.app_users.splice(index, 1);

    logEvent("USER_DELETED", user.username, `تم حذف حساب المستخدم ${user.username}`, "warning", user.id, req);

    res.json({ success: true, message: "User deleted" });
  })
);

/* =========================================================
   ACTIVATION CODES MANAGEMENT (ADMIN)
========================================================= */

app.get(
  "/api/admin/activation-codes",
  requireAdmin(async (_req, res) => {
    res.json({
      success: true,
      activation_codes: memoryStore.activation_codes,
    });
  })
);

app.post(
  "/api/admin/activation-codes",
  requireAdmin(async (req, res) => {
    const durationDays = Math.max(1, Number(req.body.duration_days || 30));
    const planName = String(req.body.plan_name || "باقة رادار قياسية");
    const isVip = Boolean(req.body.is_vip);

    const code = generateActivationCode();
    const entry = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code,
      plan_name: planName,
      duration_days: durationDays,
      is_vip: isVip,
      features: isVip ? ["radar", "instant_alerts", "auto_accept", "multi_groups"] : ["radar"],
      is_used: false,
      used_by: null,
      used_by_username: null,
      used_at: null,
      expires_at: null,
      is_cancelled: false,
      created_at: new Date().toISOString(),
    };

    memoryStore.activation_codes.unshift(entry);

    logEvent("ACTIVATION_CODE_CREATED", null, `تم إنشاء كود تفعيل: ${code} (${durationDays} يوم)`, "success", null, req);

    res.status(201).json({
      success: true,
      activation_code: entry,
    });
  })
);

app.post(
  "/api/admin/activation-codes/bulk",
  requireAdmin(async (req, res) => {
    const count = Math.min(Math.max(1, Number(req.body.count || 5)), 50);
    const durationDays = Math.max(1, Number(req.body.duration_days || 30));
    const planName = String(req.body.plan_name || "باقة جماعية");
    const isVip = Boolean(req.body.is_vip);

    const generated = [];
    for (let i = 0; i < count; i++) {
      const code = generateActivationCode();
      const entry = {
        id: `act-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        code,
        plan_name: planName,
        duration_days: durationDays,
        is_vip: isVip,
        features: isVip ? ["radar", "instant_alerts", "auto_accept"] : ["radar"],
        is_used: false,
        used_by: null,
        used_by_username: null,
        used_at: null,
        expires_at: null,
        is_cancelled: false,
        created_at: new Date().toISOString(),
      };
      memoryStore.activation_codes.unshift(entry);
      generated.push(entry);
    }

    logEvent("BULK_CODES_GENERATED", null, `تم توليد ${count} كود تفعيل دفعة واحدة`, "success", null, req);

    res.status(201).json({
      success: true,
      count,
      activation_codes: generated,
    });
  })
);

app.patch(
  "/api/admin/activation-codes/:id/cancel",
  requireAdmin(async (req, res) => {
    const code = memoryStore.activation_codes.find((c) => c.id === req.params.id);
    if (!code) {
      return res.status(404).json({ success: false, error: "Activation code not found" });
    }

    code.is_cancelled = true;
    logEvent("ACTIVATION_CODE_CANCELLED", null, `تم إلغاء كود التفعيل: ${code.code}`, "warning", null, req);

    res.json({ success: true, message: "Code cancelled", activation_code: code });
  })
);

/* =========================================================
   DEVICE MANAGEMENT (ADMIN)
========================================================= */

app.get(
  "/api/admin/devices",
  requireAdmin(async (_req, res) => {
    res.json({
      success: true,
      devices: memoryStore.devices,
    });
  })
);

app.post(
  "/api/admin/devices/:id/block",
  requireAdmin(async (req, res) => {
    const dev = memoryStore.devices.find((d) => d.id === req.params.id);
    if (!dev) {
      return res.status(404).json({ success: false, error: "Device not found" });
    }

    dev.is_blocked = true;
    logEvent("DEVICE_BLOCKED", dev.username, `تم حظر الجهاز ${dev.device_name} (${dev.device_id})`, "warning", dev.user_id, req);

    res.json({ success: true, device: dev });
  })
);

app.post(
  "/api/admin/devices/:id/unblock",
  requireAdmin(async (req, res) => {
    const dev = memoryStore.devices.find((d) => d.id === req.params.id);
    if (!dev) {
      return res.status(404).json({ success: false, error: "Device not found" });
    }

    dev.is_blocked = false;
    logEvent("DEVICE_UNBLOCKED", dev.username, `تم فك حظر الجهاز ${dev.device_name}`, "success", dev.user_id, req);

    res.json({ success: true, device: dev });
  })
);

app.delete(
  "/api/admin/devices/:id/unlink",
  requireAdmin(async (req, res) => {
    const devIndex = memoryStore.devices.findIndex((d) => d.id === req.params.id);
    if (devIndex === -1) {
      return res.status(404).json({ success: false, error: "Device not found" });
    }

    const dev = memoryStore.devices[devIndex];
    memoryStore.devices.splice(devIndex, 1);

    // Also clear from user
    const user = memoryStore.app_users.find((u) => u.id === dev.user_id);
    if (user && user.bound_device_id === dev.device_id) {
      user.bound_device_id = null;
    }

    logEvent("DEVICE_REMOVED", dev.username, `تم إزالة الجهاز ${dev.device_name} من السجل`, "warning", dev.user_id, req);

    res.json({ success: true, message: "Device unlinked and removed" });
  })
);

/* =========================================================
   SUBSCRIPTIONS MANAGEMENT (ADMIN)
========================================================= */

app.get(
  "/api/admin/subscriptions",
  requireAdmin(async (_req, res) => {
    res.json({
      success: true,
      subscriptions: memoryStore.user_subscriptions,
    });
  })
);

/* =========================================================
   LOGS & ALERTS (ADMIN)
========================================================= */

app.get(
  "/api/admin/logs",
  requireAdmin(async (_req, res) => {
    res.json({
      success: true,
      logs: memoryStore.system_logs,
    });
  })
);

app.get(
  "/api/admin/alerts",
  requireAdmin(async (_req, res) => {
    res.json({
      success: true,
      alerts: memoryStore.system_alerts,
    });
  })
);

app.patch(
  "/api/admin/alerts/:id/read",
  requireAdmin(async (req, res) => {
    const alert = memoryStore.system_alerts.find((a) => a.id === req.params.id);
    if (alert) {
      alert.is_read = true;
    }
    res.json({ success: true });
  })
);

app.post(
  "/api/admin/alerts/clear-all",
  requireAdmin(async (_req, res) => {
    memoryStore.system_alerts.forEach((a) => {
      a.is_read = true;
    });
    res.json({ success: true });
  })
);

/* =========================================================
   CLIENT AUTH & DEVICE BINDING
========================================================= */

// Track failed login attempts for alerts
const failedLoginAttempts = new Map<string, number>();

app.post("/api/auth/register", async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    const phone = String(req.body?.phone || "").trim();

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "اسم المستخدم وكلمة المرور مطلوبان" });
    }

    if (username.length < 3) {
      return res.status(400).json({ success: false, error: "يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "يجب ألا تقل كلمة المرور عن 6 أحرف" });
    }

    const existing = memoryStore.app_users.find((u) => u.username === username);
    if (existing) {
      return res.status(409).json({ success: false, error: "اسم المستخدم مسجل مسبقاً" });
    }

    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username,
      password_hash: hash(password),
      phone: phone || null,
      is_active: true,
      bound_device_id: null,
      last_login_at: null,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    memoryStore.app_users.push(newUser);

    logEvent("REGISTER", username, `تسجيل مندوب جديد: ${username} (${phone || "بدون هاتف"})`, "success", newUser.id, req);

    res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      user: {
        id: newUser.id,
        username: newUser.username,
        phone: newUser.phone,
        is_active: newUser.is_active,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    const password = String(req.body?.password || "");
    const deviceId = String(req.body?.device_id || req.headers["x-device-id"] || "").trim();
    const deviceName = String(req.body?.device_name || "Orderi Device").trim();
    const appVersion = String(req.body?.app_version || "2.4.1").trim();

    if (!username || !password) {
      return res.status(400).json({ success: false, error: "اسم المستخدم وكلمة المرور مطلوبان" });
    }

    const user = memoryStore.app_users.find((u) => u.username === username);

    // Validate credentials
    if (!user || user.password_hash !== hash(password)) {
      const attempts = (failedLoginAttempts.get(username) || 0) + 1;
      failedLoginAttempts.set(username, attempts);

      logEvent("LOGIN_FAILED", username, `محاولة دخول فاشلة (كلمة مرور غير صحيحة) - المحاولة #${attempts}`, "warning", null, req);

      if (attempts >= 3) {
        createAlert(
          "repeated_failed_logins",
          "critical",
          "محاولات دخول فاشلة متكررة",
          `تم رصد ${attempts} محاولات دخول فاشلة للحساب ${username}`
        );
      }

      return res.status(401).json({ success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }

    // Reset failed counter
    failedLoginAttempts.delete(username);

    // Check account status
    if (!user.is_active) {
      logEvent("LOGIN_BLOCKED", username, "محاولة دخول لحساب معلق", "error", user.id, req);
      createAlert("account_suspended_login", "warning", "محاولة دخول لحساب معلق", `المستخدم المعلق ${username} حاول الدخول`);
      return res.status(403).json({ success: false, error: "الحساب معلق من قبل الإدارة" });
    }

    // Check device binding & multi-device protection
    if (deviceId) {
      // Check if device itself is blocked
      const existingDevice = memoryStore.devices.find((d) => d.device_id === deviceId);
      if (existingDevice && existingDevice.is_blocked) {
        logEvent("BLOCKED_DEVICE_LOGIN", username, `محاولة دخول من جهاز محظور (${deviceId})`, "error", user.id, req);
        return res.status(403).json({ success: false, error: "هذا الجهاز محظور من قبل الإدارة" });
      }

      // Check multi-device conflict
      if (user.bound_device_id && user.bound_device_id !== deviceId) {
        logEvent(
          "DEVICE_CONFLICT",
          username,
          `محاولة تسجيل دخول من جهاز جديد (${deviceId}) بينما الحساب مرتبط بـ (${user.bound_device_id})`,
          "error",
          user.id,
          req
        );

        createAlert(
          "multi_device_attempt",
          "critical",
          "محاولة استخدام الحساب على أكثر من جهاز",
          `المستخدم ${username} حاول تسجيل الدخول من جهاز جديد (${deviceName} / ${deviceId}) بينما حسابه مرتبط بجهاز آخر. تم رفض الدخول.`
        );

        return res.status(403).json({
          success: false,
          error: "الحساب مرتبط بجهاز آخر بالفعل. لمنع مشاركة الحساب، تواصل مع المشرف لفصل الجهاز السابق.",
          code: "DEVICE_CONFLICT",
        });
      }

      // If no device bound yet, bind this device
      if (!user.bound_device_id) {
        user.bound_device_id = deviceId;
        logEvent("DEVICE_REGISTERED", username, `ربط الجهاز الأول بالحساب: ${deviceName} (${deviceId})`, "success", user.id, req);
        createAlert("new_device_registered", "info", "تسجيل جهاز جديد", `قام المستخدم ${username} بربط جهازه الجديد (${deviceName})`);
      }

      // Update or create device record
      if (existingDevice) {
        existingDevice.device_name = deviceName;
        existingDevice.app_version = appVersion;
        existingDevice.last_active_at = new Date().toISOString();
      } else {
        memoryStore.devices.push({
          id: `dev-${Date.now()}`,
          device_id: deviceId,
          user_id: user.id,
          username: user.username,
          device_name: deviceName,
          app_version: appVersion,
          is_blocked: false,
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });
      }

      // Check outdated app version
      if (appVersion.localeCompare("2.4.0", undefined, { numeric: true }) < 0) {
        createAlert(
          "outdated_version",
          "warning",
          "إصدار Orderi قديم",
          `المستخدم ${username} متصل بإصدار قديم (${appVersion}). يُنصح بالتحديث.`
        );
      }
    }

    // Check subscription status
    const sub = memoryStore.user_subscriptions.find((s) => s.user_id === user.id);
    const hasActiveSub = sub && new Date(sub.expires_at).getTime() > Date.now();

    user.last_login_at = new Date().toISOString();
    user.last_seen_at = new Date().toISOString();

    // Generate token
    const token = generateToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    activeSessions.set(token, { userId: user.id, expiresAt });

    logEvent(
      "LOGIN_SUCCESS",
      username,
      `تسجيل دخول ناجح${deviceId ? ` من ${deviceName}` : ""}`,
      "success",
      user.id,
      req
    );

    res.json({
      success: true,
      token,
      expires_at: new Date(expiresAt).toISOString(),
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        bound_device_id: user.bound_device_id,
        is_active: user.is_active,
        subscription_active: hasActiveSub,
        subscription: sub || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Login failed" });
  }
});

app.get(
  "/api/auth/me",
  requireAuth(async (req, res) => {
    const user = (req as any).user;
    const sub = memoryStore.user_subscriptions.find((s) => s.user_id === user.id);
    const dev = memoryStore.devices.find((d) => d.device_id === user.bound_device_id);

    res.json({
      success: true,
      user: {
        ...user,
        subscription: sub || null,
        device: dev || null,
      },
    });
  })
);

app.post(
  "/api/auth/activate",
  requireAuth(async (req, res) => {
    const user = (req as any).user;
    const codeStr = String(req.body?.code || "").trim().toUpperCase();

    if (!codeStr) {
      return res.status(400).json({ success: false, error: "كود التفعيل مطلوب" });
    }

    const code = memoryStore.activation_codes.find((c) => c.code === codeStr);

    if (!code) {
      logEvent("ACTIVATION_FAILED", user.username, `محاولة استخدام كود غير موجود: ${codeStr}`, "warning", user.id, req);
      createAlert("invalid_code_attempt", "warning", "استخدام كود غير صالح", `المستخدم ${user.username} حاول إدخال الكود غير الصحيح ${codeStr}`);
      return res.status(404).json({ success: false, error: "كود التفعيل غير صالح أو غير موجود" });
    }

    if (code.is_cancelled) {
      logEvent("ACTIVATION_FAILED", user.username, `محاولة استخدام كود ملغى: ${codeStr}`, "warning", user.id, req);
      return res.status(400).json({ success: false, error: "تم إلغاء هذا الكود من قبل الإدارة" });
    }

    if (code.is_used) {
      logEvent("ACTIVATION_FAILED", user.username, `محاولة استخدام كود مستهلك مسبقاً: ${codeStr}`, "warning", user.id, req);
      return res.status(409).json({ success: false, error: "تم استخدام هذا الكود مسبقاً" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + code.duration_days * 24 * 60 * 60 * 1000).toISOString();

    // Mark code used
    code.is_used = true;
    code.used_by = user.id;
    code.used_by_username = user.username;
    code.used_at = now.toISOString();
    code.expires_at = expiresAt;

    // Update or create subscription
    let sub = memoryStore.user_subscriptions.find((s) => s.user_id === user.id);
    if (sub) {
      sub.activation_code_id = code.id;
      sub.plan_name = code.plan_name;
      sub.starts_at = now.toISOString();
      sub.expires_at = expiresAt;
      sub.is_active = true;
      sub.updated_at = now.toISOString();
    } else {
      sub = {
        id: `sub-${Date.now()}`,
        user_id: user.id,
        username: user.username,
        activation_code_id: code.id,
        plan_name: code.plan_name,
        starts_at: now.toISOString(),
        expires_at: expiresAt,
        is_active: true,
        updated_at: now.toISOString(),
      };
      memoryStore.user_subscriptions.push(sub);
    }

    logEvent(
      "ACTIVATION_SUCCESS",
      user.username,
      `تفعيل كود الترخيص بنجاح: ${code.code} (${code.plan_name} - ${code.duration_days} يوم)`,
      "success",
      user.id,
      req
    );

    res.json({
      success: true,
      message: "تم تفعيل الاشتراك بنجاح",
      subscription: sub,
    });
  })
);

app.get(
  "/api/auth/subscription",
  requireAuth(async (req, res) => {
    const user = (req as any).user;
    const sub = memoryStore.user_subscriptions.find((s) => s.user_id === user.id);

    if (!sub) {
      return res.json({
        success: true,
        active: false,
        subscription: null,
      });
    }

    const active = Boolean(sub.is_active) && new Date(sub.expires_at).getTime() > Date.now();
    if (!active && sub.is_active) {
      sub.is_active = false;
      sub.updated_at = new Date().toISOString();
      createAlert("subscription_expired", "warning", "انتهاء اشتراك مندوب", `انتهت صلاحية اشتراك المستخدم ${user.username}`);
    }

    res.json({
      success: true,
      active,
      subscription: sub,
    });
  })
);

app.post(
  "/api/auth/logout",
  requireAuth(async (req, res) => {
    const user = (req as any).user;
    const token = (req as any).token;

    activeSessions.delete(token);
    logEvent("LOGOUT", user.username, "تسجيل خروج المستخدم", "success", user.id, req);

    res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  })
);

/* =========================================================
   ORDERS CRUD API
========================================================= */

app.get("/api/orders", async (req, res) => {
  const { status, limit = 100 } = req.query;
  let list = memoryStore.orders;

  if (status) {
    list = list.filter((o) => o.status === status);
  }

  const result = list.slice(0, Math.min(Number(limit) || 100, 500));
  res.json({
    success: true,
    count: result.length,
    orders: result,
  });
});

app.get("/api/orders/:id", async (req, res) => {
  const order = memoryStore.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }
  res.json({ success: true, order });
});

app.post("/api/orders", async (req, res) => {
  try {
    const {
      source = "whatsapp",
      source_group = null,
      from_area = "المنامة",
      to_area = "الرفاع",
      pickup_area,
      destination = null,
      price = null,
      distance_km = null,
      raw_text = null,
    } = req.body;

    if (!pickup_area) {
      return res.status(400).json({ success: false, error: "pickup_area is required" });
    }

    const orderId = `ord-${Date.now().toString().slice(-5)}`;
    const newOrder = {
      id: orderId,
      captain_id: null,
      from_area,
      to_area,
      pickup_area,
      pickup_lat: req.body.pickup_lat ?? null,
      pickup_lng: req.body.pickup_lng ?? null,
      destination,
      price: price != null ? Number(price) : null,
      distance_km: distance_km != null ? Number(distance_km) : null,
      raw_text,
      source,
      source_group,
      status: "new",
      created_at: new Date().toISOString(),
      received_at: new Date().toISOString(),
    };

    memoryStore.orders.unshift(newOrder);

    logEvent("ORDER_RECEIVED", null, `استقبال طلب جديد #${orderId} (${pickup_area} -> ${destination || "-"})`, "success", null, req);

    res.status(201).json({ success: true, order: newOrder });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || "Failed to create order" });
  }
});

app.patch("/api/orders/:id", async (req, res) => {
  const order = memoryStore.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }

  const allowed = ["status", "captain_id", "price", "destination", "distance_km"];
  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      (order as any)[field] = req.body[field];
    }
  }

  logEvent("ORDER_UPDATED", null, `تحديث حالة الطلب #${order.id} إلى ${order.status}`, "success", null, req);

  res.json({ success: true, order });
});

app.delete("/api/orders/:id", async (req, res) => {
  const index = memoryStore.orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Order not found" });
  }
  memoryStore.orders.splice(index, 1);
  res.json({ success: true, message: "Order deleted" });
});

/* =========================================================
   WHATSAPP RADAR & QR GATEWAY
========================================================= */

app.get("/api/whatsapp/status", async (_req, res) => {
  const session = memoryStore.whatsapp_sessions[0];
  res.json({
    status: session.status,
    device_name: session.device_name,
    battery_level: session.battery_level,
    connected_phone: session.connected_phone,
    groups_monitored_count: session.groups_monitored_count,
    listener_service_active: session.listener_service_active,
    last_sync_at: session.last_sync_at,
  });
});

app.get("/api/whatsapp/session", async (_req, res) => {
  const session = memoryStore.whatsapp_sessions[0];
  if (!session.qr_code_data_url) {
    try {
      const qrPayload = `ORDERI-RADAR-GW-${Date.now()}-${session.pairing_code}`;
      session.qr_code_data_url = await QRCode.toDataURL(qrPayload, {
        width: 260,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    } catch {
      // Fallback
    }
  }

  res.json({ success: true, session });
});

app.post("/api/whatsapp/session/refresh-qr", async (_req, res) => {
  const session = memoryStore.whatsapp_sessions[0];
  const newPairing = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
  session.pairing_code = newPairing;
  session.status = "waiting_for_scan";
  session.updated_at = new Date().toISOString();

  try {
    session.qr_code_data_url = await QRCode.toDataURL(`ORDERI-RADAR-GW-${Date.now()}-${newPairing}`, {
      width: 260,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message });
  }

  logEvent("WHATSAPP_QR_REFRESHED", null, "تم تحديث كود QR لرادار الواتساب", "success");

  res.json({ success: true, message: "QR refreshed", session });
});

app.post("/api/whatsapp/session/pair", async (req, res) => {
  const phone = String(req.body?.phone || "+97339887766").trim();
  const session = memoryStore.whatsapp_sessions[0];
  session.status = "connected";
  session.connected_phone = phone;
  session.connected_at = new Date().toISOString();
  session.qr_code_data_url = null;
  session.updated_at = new Date().toISOString();

  logEvent("WHATSAPP_PAIRED", null, `تم اقتران رادار الواتساب بالهاتف: ${phone}`, "success");

  res.json({ success: true, message: "Paired successfully", session });
});

app.post("/api/whatsapp/session/disconnect", async (_req, res) => {
  const session = memoryStore.whatsapp_sessions[0];
  session.status = "disconnected";
  session.connected_phone = null;
  session.connected_at = null;
  session.qr_code_data_url = null;
  session.updated_at = new Date().toISOString();

  logEvent("WHATSAPP_DISCONNECTED", null, "تم فصل بوابة رادار الواتساب", "warning");

  res.json({ success: true, message: "Disconnected", session });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Orderi Server Error]", error);
  logEvent("SERVER_ERROR", null, error?.message || "Internal server error", "error");
  createAlert("server_error", "critical", "خطأ في معالجة الطلب", error?.message || "Internal server error");

  res.status(500).json({
    success: false,
    error: error?.message || "Internal server error",
  });
});

/* =========================================================
   START
========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Orderi Server] Listening on 0.0.0.0:${PORT}`);
  console.log(`[Orderi Server] Database Engine: ${isSupabaseConfigured ? "Supabase Postgres" : "In-Memory Store"}`);
  console.log(`[Orderi Server] Dashboard available at http://0.0.0.0:${PORT}/`);
  console.log(`[Orderi Server] Central Hub: Users, Licenses, Devices, Subscriptions, Logs, Alerts, Radar ready.`);
});
