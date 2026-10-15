/**
 * Orderi Admin API
 * الاتصال بسيرفر Orderi المركزي
 */

export const DEFAULT_SERVER_URL = "https://orderi-server.onrender.com";

/**
 * الحصول على عنوان السيرفر الفعال.
 * الأولوية:
 * 1) العنوان المخصص المحفوظ في المتصفح / التطبيق
 * 2) متغير البيئة VITE_API_URL
 * 3) السيرفر الافتراضي
 */
export function getApiUrl(): string {
  if (typeof window !== "undefined") {
    const custom =
      localStorage.getItem("orderi_custom_api_url") ||
      localStorage.getItem("natan_custom_api_url");
    if (custom && custom.trim()) {
      return normalizeApiUrl(custom);
    }
  }

  const envUrl =
    typeof import.meta !== "undefined"
      ? (import.meta as any).env?.VITE_API_URL
      : undefined;

  return normalizeApiUrl(envUrl || DEFAULT_SERVER_URL);
}

/**
 * تنظيف عنوان السيرفر.
 */
function normalizeApiUrl(url: string): string {
  let value = String(url || "").trim();
  if (!value) {
    return DEFAULT_SERVER_URL;
  }
  value = value.replace(/\/+$/, "");
  if (value.endsWith("/api")) {
    value = value.slice(0, -4);
  }
  return value;
}

/**
 * حفظ عنوان السيرفر المخصص.
 */
export function setApiUrl(url: string) {
  if (typeof window !== "undefined") {
    const value = String(url || "").trim();
    if (value) {
      const normalized = normalizeApiUrl(value);
      localStorage.setItem("orderi_custom_api_url", normalized);
      localStorage.setItem("natan_custom_api_url", normalized);
    } else {
      localStorage.removeItem("orderi_custom_api_url");
      localStorage.removeItem("natan_custom_api_url");
    }
  }
}

/**
 * تنفيذ طلب API مع الترويسات والتوكن والتعامل مع الأخطاء.
 */
async function request(path: string, options: RequestInit = {}) {
  const API_URL = getApiUrl();
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("orderi_admin_token") ||
        localStorage.getItem("natan_admin_token")
      : null;

  const buildUrl = (p: string) => {
    const cleanBase = API_URL.replace(/\/+$/, "");
    const cleanPath = p.startsWith("/") ? p : `/${p}`;
    return `${cleanBase}${cleanPath}`;
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
    });

    // تجربة المسار البديل بدون /api إذا لم يتوفر
    if (response.status === 404 && path.startsWith("/api/")) {
      const altPath = path.replace("/api/", "/");
      const altResponse = await fetch(buildUrl(altPath), {
        ...options,
        headers,
      }).catch(() => null);
      if (altResponse && altResponse.status !== 404) {
        response = altResponse;
      }
    }
  } catch (err: any) {
    throw new Error(`تعذر الاتصال بالسيرفر: ${err?.message || "Network Error"}`);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("orderi_admin_token");
        localStorage.removeItem("orderi_admin_refresh_token");
        localStorage.removeItem("natan_admin_token");
        localStorage.removeItem("natan_admin_refresh_token");
      }
    }

    const serverMessage =
      data?.error ||
      data?.message ||
      data?.detail ||
      `HTTP ${response.status} - ${API_URL}`;
    throw new Error(serverMessage);
  }

  return data;
}

/**
 * فحص حالة اتصال السيرفر.
 */
export async function checkServer() {
  const API_URL = getApiUrl();
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("orderi_admin_token") ||
        localStorage.getItem("natan_admin_token")
      : null;

  const headers: Record<string, string> = {
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };

  const endpoints = ["/api/health", "/health", ""];
  for (const ep of endpoints) {
    try {
      const url = `${API_URL}${ep}`;
      const res = await fetch(url, {
        method: "GET",
        headers,
      });
      if (res.ok) {
        return await res.json().catch(() => ({
          success: true,
          status: "ok",
        }));
      }
    } catch {
      // المحاولة التالية
    }
  }

  return request("/api/health");
}

/**
 * تسجيل دخول المشرف.
 */
export async function adminLogin(username: string, password: string) {
  const cleanUsername = username.trim();
  if (!cleanUsername) {
    throw new Error("يرجى إدخال اسم المستخدم");
  }
  if (!password) {
    throw new Error("يرجى إدخال كلمة المرور");
  }

  const result = await request("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({
      username: cleanUsername,
      password,
    }),
  });

  const token =
    result?.token ||
    result?.accessToken ||
    result?.data?.token ||
    result?.data?.accessToken ||
    result?.session?.access_token;

  if (!token) {
    throw new Error("السيرفر لم يرجع رمز تسجيل الدخول (token)");
  }

  localStorage.setItem("orderi_admin_token", token);
  localStorage.setItem("natan_admin_token", token);
  localStorage.setItem("orderi_admin_user", cleanUsername);

  const refreshToken =
    result?.refreshToken ||
    result?.data?.refreshToken ||
    result?.session?.refresh_token;

  if (refreshToken) {
    localStorage.setItem("orderi_admin_refresh_token", refreshToken);
    localStorage.setItem("natan_admin_refresh_token", refreshToken);
  }

  return result;
}

/**
 * تسجيل الدخول باستخدام البصمة الحيوية (Biometric).
 */
export async function adminBiometricLogin(_biometricKey: string) {
  throw new Error("تسجيل الدخول بالبصمة يحتاج جلسة صالحة أو إعادة تسجيل الدخول بكلمة المرور.");
}

/**
 * التحقق من صلاحية جلسة المشرف.
 */
export async function verifyAdminSession() {
  return request("/api/admin/me");
}

/**
 * جلب إحصائيات لوحة التحكم.
 */
export async function getDashboardStats() {
  return request("/api/admin/dashboard/stats");
}

/**
 * جلب قائمة المستخدمين.
 */
export async function getUsers() {
  const result = await request("/api/admin/users");
  const users = result?.users ?? result?.data;
  if (!Array.isArray(users)) throw new Error("استجابة السيرفر لقائمة المستخدمين غير صحيحة.");
  return {
    ...result,
    users: users.map((user: any) => ({
      ...user,
      username: user.username ?? user.phone ?? "",
      full_name: user.full_name ?? user.name ?? "",
      activation_expires_at: user.activation_expires_at ?? user.expires_at ?? user.subscription?.expires_at ?? null,
      is_active: user.is_active !== false,
    })),
  };
}

/**
 * إضافة مستخدم جديد من قبل المشرف.
 */
export async function createUser(data: {
  username: string;
  password?: string;
  phone?: string;
  days?: number;
  email?: string;
  fullName?: string;
}) {
  return request("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * تعديل بيانات مستخدم.
 */
export async function updateUser(
  id: string,
  data: {
    username?: string;
    email?: string | null;
    fullName?: string | null;
    full_name?: string | null;
    phone?: string | null;
    isActive?: boolean;
    is_active?: boolean;
    maxDevices?: number;
    max_devices?: number;
    extendDays?: number;
    extend_days?: number;
    password?: string;
  }
) {
  return request(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * حذف مستخدم نهائياً.
 */
export async function deleteUser(id: string) {
  return request(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/**
 * تمديد اشتراك مستخدم.
 */
export async function extendUserSubscription(id: string, days: number) {
  return request(`/api/admin/users/${encodeURIComponent(id)}/extend-subscription`, {
    method: "POST",
    body: JSON.stringify({ days }),
  });
}

/**
 * إلغاء ربط جهاز المستخدم.
 */
export async function unlinkUserDevice(id: string) {
  return request(`/api/admin/users/${encodeURIComponent(id)}/unlink-device`, {
    method: "POST",
  });
}

/**
 * جلب أكواد التفعيل والتراخيص.
 */
export async function getActivationCodes() {
  const result = await request("/api/admin/activation-codes");
  const codes = result?.activation_codes ?? result?.codes ?? result?.data;
  if (!Array.isArray(codes)) {
    throw new Error("استجابة السيرفر لأكواد التفعيل غير صحيحة.");
  }
  // Cancelled codes remain in the database for audit, but are not offered as usable codes.
  return { ...result, codes: codes.filter((code: any) => code?.is_cancelled !== true) };
}

/**
 * إنشاء وتوليد أكواد تفعيل جديدة.
 */
export async function createActivationCodes(
  durationDays: number,
  count: number,
  isVip: boolean = false
) {
  const result = await request("/api/admin/activation-codes/bulk", {
    method: "POST",
    body: JSON.stringify({
      durationDays,
      duration_days: durationDays,
      count,
      is_vip: isVip,
    }),
  });
  const codes = result?.activation_codes ?? result?.codes ?? result?.data;
  if (!Array.isArray(codes)) {
    throw new Error("السيرفر لم يرجع أكواد التفعيل المحفوظة.");
  }
  return { ...result, codes };
}

/**
 * إلغاء كود تفعيل.
 */
export async function deleteActivationCode(id: string) {
  return request(`/api/admin/activation-codes/${encodeURIComponent(id)}/cancel`, {
    method: "PATCH",
  });
}

/**
 * جلب قائمة الأجهزة المرتبطة.
 */
export async function getDevices() {
  return request("/api/admin/devices");
}

/**
 * فصل جهاز مسجل.
 */
export async function unlinkDevice(id: string) {
  return request(`/api/admin/devices/${encodeURIComponent(id)}/unlink`, {
    method: "DELETE",
  });
}

/**
 * حظر أو فك حظر جهاز.
 */
export async function toggleBlockDevice(id: string, isBlocked: boolean) {
  return request(`/api/admin/devices/${encodeURIComponent(id)}/${isBlocked ? "block" : "unblock"}`, {
    method: "POST",
  });
}

/**
 * جلب سجل العمليات والتدقيق (Audit Logs).
 */
export async function getAuditLogs() {
  return request("/api/admin/logs");
}

/**
 * جلب التنبيهات.
 */
export async function getAlerts() {
  return request("/api/admin/alerts");
}

/**
 * تحديد تنبيه كمقروء.
 */
export async function markAlertRead(id: string) {
  return request(`/api/admin/alerts/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
}

/**
 * مسح وقراءة كافة التنبيهات.
 */
export async function clearAllAlerts() {
  return request("/api/admin/alerts/clear-all", {
    method: "POST",
  });
}

/**
 * تسجيل الخروج.
 */
export async function adminLogout() {
  try {
    if (localStorage.getItem("orderi_admin_token") || localStorage.getItem("natan_admin_token")) {
      await request("/api/admin/logout", { method: "POST" });
    }
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("orderi_admin_token");
      localStorage.removeItem("orderi_admin_refresh_token");
      localStorage.removeItem("orderi_admin_user");
      localStorage.removeItem("orderi_biometric_pass");
      localStorage.removeItem("natan_admin_token");
      localStorage.removeItem("natan_admin_refresh_token");
    }
  }
}
