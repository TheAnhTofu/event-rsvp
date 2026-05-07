"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  IconDotsVertical,
  IconFilterSliders,
  IconPlusNavy,
  IconProfileCircle,
  IconSearchField,
  IconSortArrowDown,
  IconSortArrowUp,
} from "@/components/icons/admin";
import { PaginationBar } from "@/components/admin/registrant-list/pagination-bar";
import { usePathname, useRouter } from "@/i18n/navigation";
import { fetchWithRetry } from "@/lib/fetch-retry";
import {
  formatTrDate,
  parsePageSizeParam,
} from "@/lib/admin/registrant-list/utils";

const PHONE_COUNTRY_OPTIONS = [
  "+852",
  "+86",
  "+1",
  "+44",
  "+65",
  "+61",
  "+33",
  "+81",
] as const;

type AdminUserDto = {
  id: string;
  userCode: string;
  email: string;
  displayName: string;
  phoneCountry: string;
  phoneNumber: string;
  role: "admin" | "viewer";
  createdAt: string;
  updatedAt: string;
};

function IconTickCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="text-[14px] font-medium leading-6 text-[#001742]">
      {children}
      {required ? <span className="text-red-500">*</span> : null}
    </span>
  );
}

function UserStatusChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded bg-[#eafbe8] px-2 py-1">
      <span className="size-1.5 shrink-0 rounded-sm bg-[#00a66c]" />
      <span className="text-[10px] font-medium leading-none text-[#00a66c]">
        Active
      </span>
    </span>
  );
}

function PermissionChip({ role }: { role: "admin" | "viewer" }) {
  if (role === "admin") {
    return (
      <span className="inline-flex h-[22px] items-center rounded-lg bg-[#27ae60] px-3 text-[10px] font-medium tracking-[0.16px] text-white">
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex h-[22px] items-center rounded-lg bg-[#2f80ed] px-3 text-[10px] font-medium tracking-[0.16px] text-white">
      Viewer
    </span>
  );
}

export function AdminUsersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "create" ? "create" : "list";
  const editUserId = searchParams.get("userId");

  const listPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const listPageSize = parsePageSizeParam(searchParams.get("pageSize"));

  const [me, setMe] = useState<{
    role: "admin" | "viewer";
    email: string;
    userId: string;
  } | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);

  const [list, setList] = useState<AdminUserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [searchDraft, setSearchDraft] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [listLoading, setListLoading] = useState(true);
  const [listErr, setListErr] = useState<string | null>(null);

  const [formErr, setFormErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [displayName, setDisplayName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+852");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loadedUser, setLoadedUser] = useState<AdminUserDto | null>(null);

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [userIdSort, setUserIdSort] = useState<"asc" | "desc">("desc");

  const canMutate = me?.role === "admin";

  const spKey = searchParams.toString();

  const sortedList = useMemo(() => {
    const rows = [...list];
    rows.sort((a, b) => {
      const cmp = a.userCode.localeCompare(b.userCode, undefined, {
        numeric: true,
      });
      return userIdSort === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [list, userIdSort]);

  const patchUrl = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      if (p.get("page") === "1") p.delete("page");
      const ps = p.get("pageSize");
      if (!ps || ps === "15") p.delete("pageSize");
      const qv = p.get("q")?.trim();
      if (!qv) p.delete("q");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setTab = useCallback(
    (next: "list" | "create", userId?: string | null) => {
      const p = new URLSearchParams(searchParams.toString());
      if (next === "list") {
        p.delete("tab");
        p.delete("userId");
      } else {
        p.set("tab", "create");
        if (userId) p.set("userId", userId);
        else p.delete("userId");
      }
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setListPageUrl = (p: number) => {
    patchUrl({ page: p <= 1 ? null : String(p) });
  };

  const setListPageSizeUrl = useCallback(
    (n: number) => {
      patchUrl({
        pageSize: n === 15 ? null : String(n),
        page: null,
      });
    },
    [patchUrl],
  );

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (!res.ok) {
        setMe(null);
        return;
      }
      const data = (await res.json()) as {
        role: "admin" | "viewer";
        email: string;
        userId: string;
      };
      setMe(data);
    } catch {
      setMe(null);
    } finally {
      setMeLoaded(true);
    }
  }, []);

  const loadList = useCallback(async () => {
    setListErr(null);
    setListLoading(true);
    try {
      const page = Math.max(1, Number(searchParams.get("page")) || 1);
      const pageSize = parsePageSizeParam(searchParams.get("pageSize"));
      const q = searchParams.get("q")?.trim() ?? "";
      const offset = (page - 1) * pageSize;

      const p = new URLSearchParams();
      p.set("limit", String(pageSize));
      p.set("offset", String(offset));
      if (q) p.set("q", q);

      const res = await fetchWithRetry(
        `/api/admin/users?${p.toString()}`,
        { credentials: "include" },
        { retries: 3 },
      );

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        const msg =
          typeof errBody.error === "string"
            ? errBody.error
            : res.status === 401 || res.status === 403
              ? "Sign in required or access denied."
              : `Could not load users (HTTP ${res.status}).`;
        throw new Error(msg);
      }

      const data = (await res.json()) as {
        users?: AdminUserDto[];
        total?: number;
      };
      const rows = Array.isArray(data.users) ? data.users : [];
      setList(rows);
      setTotal(typeof data.total === "number" ? data.total : rows.length);
    } catch (e) {
      setList([]);
      setTotal(0);
      setListErr(
        e instanceof Error
          ? e.message
          : "Could not load users. Check that the API server is running.",
      );
    } finally {
      setListLoading(false);
    }
  }, [spKey]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (tab === "list") void loadList();
  }, [tab, loadList, spKey]);

  useEffect(() => {
    setSelected(new Set());
  }, [spKey]);

  /** Sync search box from URL when switching tab or locale path — omitting `searchParams` avoids resetting the input on debounced `q` updates while typing. */
  useEffect(() => {
    setSearchDraft(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams intentionally omitted (see comment above)
  }, [tab, pathname]);

  useEffect(() => {
    if (tab !== "list") return;
    const t = setTimeout(() => {
      const next = searchDraft.trim();
      const cur = searchParams.get("q")?.trim() ?? "";
      if (next === cur) return;
      patchUrl({ q: next || null, page: null });
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft, tab, patchUrl, searchParams]);

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setPassword2("");
    setRole("viewer");
    setDisplayName("");
    setPhoneCountry("+852");
    setPhoneNumber("");
    setLoadedUser(null);
    setFormErr(null);
    setShowPw(false);
    setShowPw2(false);
  }, []);

  useEffect(() => {
    if (tab !== "create") return;

    if (!editUserId) {
      resetForm();
      return;
    }

    let cancelled = false;
    setDetailLoading(true);
    setFormErr(null);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/users/${editUserId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Not found");
        const data = (await res.json()) as { user: AdminUserDto };
        if (cancelled) return;
        const u = data.user;
        setLoadedUser(u);
        setEmail(u.email);
        setRole(u.role);
        setDisplayName(u.displayName);
        setPhoneCountry(u.phoneCountry || "+852");
        setPhoneNumber(u.phoneNumber);
        setPassword("");
        setPassword2("");
      } catch {
        if (!cancelled) setFormErr("Could not load user.");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, editUserId, resetForm]);

  const submitForm = async () => {
    setFormErr(null);
    const isEdit = Boolean(editUserId && loadedUser);

    if (!isEdit) {
      if (password.length < 8) {
        setFormErr("Password must be at least 8 characters.");
        return;
      }
      if (password !== password2) {
        setFormErr("Passwords do not match.");
        return;
      }
    } else {
      if (password || password2) {
        if (password.length < 8) {
          setFormErr("New password must be at least 8 characters.");
          return;
        }
        if (password !== password2) {
          setFormErr("Passwords do not match.");
          return;
        }
      }
    }

    setSaving(true);
    try {
      if (!isEdit) {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            role,
            displayName,
            phoneCountry,
            phoneNumber,
          }),
        });
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          user?: AdminUserDto;
        };
        if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
        resetForm();
        setTab("list");
        void loadList();
        return;
      }

      const body: Record<string, unknown> = {
        email,
        role,
        displayName,
        phoneCountry,
        phoneNumber,
      };
      if (password) body.password = password;

      const res = await fetch(`/api/admin/users/${editUserId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminUserDto;
      };
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      if (j.user) setLoadedUser(j.user);
      setPassword("");
      setPassword2("");
      void loadList();
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const detailPageTitle =
    editUserId && loadedUser
      ? `Edit — ${loadedUser.userCode}`
      : "Create New User";

  const inputClass =
    "w-full rounded-lg border border-[#e1e3e6] bg-white px-3 py-2 text-[14px] text-[#333] outline-none focus:border-admin-navy disabled:bg-slate-100";
  const selectClass = `${inputClass} appearance-none bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%20stroke%3D%22%234F4F4F%22%20stroke-width%3D%221.5%22%2F%3E%3C%2Fsvg%3E')]`;

  const phoneCountryOptions = useMemo(() => {
    const base = [...PHONE_COUNTRY_OPTIONS];
    if (phoneCountry && !base.includes(phoneCountry as (typeof PHONE_COUNTRY_OPTIONS)[number])) {
      return [phoneCountry, ...base];
    }
    return base;
  }, [phoneCountry]);

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageSelected =
    sortedList.length > 0 &&
    sortedList.every((u) => selected.has(u.id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) setSelected(new Set());
    else setSelected(new Set(sortedList.map((u) => u.id)));
  };

  const toggleUserIdSort = () => {
    setUserIdSort((o) => (o === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-page-bg">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-admin-border bg-white px-5 py-[15px]">
        <div className="flex min-w-0 items-center gap-1.5">
          <IconProfileCircle className="size-5 shrink-0 text-admin-navy" />
          <h1 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
            User List
          </h1>
        </div>
        {canMutate && tab === "list" ? (
          <button
            type="button"
            onClick={() => setTab("create")}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[12px] bg-admin-navy px-4 text-[13px] font-medium text-white hover:opacity-95"
          >
            <IconPlusNavy className="size-5 shrink-0 text-white" />
            Create New User
          </button>
        ) : null}
      </header>

      {tab === "list" ? (
        <>
          <div className="min-h-0 flex-1 overflow-auto bg-white p-5 pb-16">
            <div className="w-full min-w-0 overflow-hidden rounded-xl border border-[#e0e0e0] bg-white shadow-[0_4px_2px_-2px_rgba(27,46,94,0.02)]">
              <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-admin-border px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 lg:max-w-[min(100%,calc(100%-120px))]">
                  <label className="block min-w-0 flex-1 text-[13px] font-medium text-admin-navy lg:max-w-[400px]">
                    <span className="sr-only">Search</span>
                    <div className="relative">
                      <IconSearchField className="pointer-events-none absolute left-3 top-1/2 size-[21px] -translate-y-1/2 text-admin-col-muted" />
                      <input
                        type="search"
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.preventDefault();
                        }}
                        placeholder="Search…"
                        enterKeyHint="search"
                        autoComplete="off"
                        className="block h-10 w-full rounded-xl border border-[#e0e0e0] bg-white py-2 pl-10 pr-3 text-sm text-ink placeholder:text-admin-col-muted outline-none focus:border-admin-navy focus:ring-2 focus:ring-admin-navy/20"
                      />
                    </div>
                  </label>
                  <button
                    type="button"
                    title="Filters (coming soon)"
                    disabled
                    className="flex size-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl border border-[#e0e0e0] bg-white opacity-60"
                  >
                    <IconFilterSliders className="size-[18px] text-admin-navy" />
                  </button>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    title="Table options"
                    className="flex size-10 items-center justify-center rounded-lg text-admin-col-muted hover:bg-admin-table-header-bg hover:text-admin-navy"
                  >
                    <IconDotsVertical className="size-4" />
                  </button>
                </div>
              </div>

              {listErr && (
                <div
                  className="mx-4 mb-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
                  role="alert"
                >
                  <p className="font-medium">Could not load users</p>
                  <p className="mt-1 text-red-700">{listErr}</p>
                  <button
                    type="button"
                    onClick={() => void loadList()}
                    className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-[12px] font-medium text-red-900 hover:bg-red-100"
                  >
                    Try again
                  </button>
                </div>
              )}

              {listLoading ? (
                <p className="px-5 py-8 text-center text-sm text-admin-col-muted">
                  Loading…
                </p>
              ) : list.length === 0 && !listErr ? (
                <p className="px-5 py-8 text-center text-sm text-admin-col-muted">
                  No users match.
                </p>
              ) : !listErr ? (
                <div className="w-full overflow-x-auto border-t border-admin-table-border">
                  <table className="w-full min-w-[1100px] table-fixed border-collapse border border-admin-table-border text-sm">
                    <thead>
                      <tr className="h-[54px] bg-[#f9fafc] text-[12px] text-admin-navy">
                        <th className="w-12 border-b border-r border-[#efefef] px-4 text-left align-middle">
                          <input
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={toggleSelectAll}
                            className="size-4 rounded border-[#bdbdbd] text-admin-navy"
                            aria-label="Select all on page"
                          />
                        </th>
                        <th className="w-[140px] border-b border-r border-[#efefef] px-4 text-left align-middle">
                          <button
                            type="button"
                            onClick={toggleUserIdSort}
                            className="inline-flex items-center gap-1 font-semibold text-admin-navy hover:underline"
                          >
                            User ID
                            {userIdSort === "asc" ? (
                              <IconSortArrowUp className="size-3 shrink-0" />
                            ) : (
                              <IconSortArrowDown className="size-3 shrink-0" />
                            )}
                          </button>
                        </th>
                        <th className="w-[130px] border-b border-r border-[#efefef] px-4 text-left align-middle font-medium text-[#8d8d8d]">
                          Status
                        </th>
                        <th className="w-[160px] border-b border-r border-[#efefef] px-4 text-left align-middle font-medium text-[#8d8d8d]">
                          Permissions
                        </th>
                        <th className="w-[180px] border-b border-r border-[#efefef] px-4 text-left align-middle font-medium text-[#8d8d8d]">
                          Name
                        </th>
                        <th className="min-w-0 border-b border-r border-[#efefef] px-4 text-left align-middle font-medium text-[#8d8d8d]">
                          Email Address
                        </th>
                        <th className="w-[120px] border-b border-r border-[#efefef] px-4 text-left align-middle font-medium text-[#8d8d8d]">
                          Created At
                        </th>
                        <th className="w-12 border-b border-[#efefef] px-2 text-right align-middle" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedList.map((u) => (
                        <tr
                          key={u.id}
                          className="h-[50px] hover:bg-admin-table-header-bg/50"
                        >
                          <td className="border-b border-r border-[#efefef] px-4 align-middle">
                            <input
                              type="checkbox"
                              checked={selected.has(u.id)}
                              onChange={() => toggleRow(u.id)}
                              className="size-4 rounded border-[#bdbdbd]"
                              aria-label={`Select ${u.userCode}`}
                            />
                          </td>
                          <td className="border-b border-r border-[#efefef] px-4 align-middle font-medium text-[#4f4f4f]">
                            {u.userCode}
                          </td>
                          <td className="border-b border-r border-[#efefef] px-4 align-middle">
                            <UserStatusChip />
                          </td>
                          <td className="border-b border-r border-[#efefef] px-4 align-middle">
                            <PermissionChip role={u.role} />
                          </td>
                          <td className="border-b border-r border-[#efefef] px-4 align-middle font-medium text-[#4f4f4f]">
                            {u.displayName || "—"}
                          </td>
                          <td className="border-b border-r border-[#efefef] px-4 align-middle font-medium text-[#4f4f4f]">
                            {u.email}
                          </td>
                          <td className="border-b border-r border-[#efefef] px-4 align-middle font-medium text-[#4f4f4f]">
                            {formatTrDate(u.createdAt)}
                          </td>
                          <td className="border-b border-[#efefef] px-2 text-right align-middle">
                            <button
                              type="button"
                              onClick={() => setTab("create", u.id)}
                              className="inline-flex size-10 items-center justify-center rounded-lg text-admin-col-muted hover:bg-white hover:text-admin-navy"
                              title="Row actions"
                            >
                              <IconDotsVertical className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {!listLoading && !listErr && (
                <PaginationBar
                  page={listPage}
                  pageSize={listPageSize}
                  total={total}
                  disabled={listLoading}
                  onPageChange={setListPageUrl}
                  onPageSizeChange={setListPageSizeUrl}
                />
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex shrink-0 flex-col gap-0 border-b border-admin-border bg-white px-5 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5">
              <h1 className="text-[18px] font-semibold leading-[22px] text-admin-navy">
                {detailPageTitle}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTab("list")}
                  className="rounded-xl border border-[#e0e0e0] bg-white px-[14px] py-2.5 text-[13px] font-normal text-black hover:bg-admin-table-header-bg"
                >
                  Cancel
                </button>
                {canMutate ? (
                  <button
                    type="button"
                    disabled={saving || detailLoading}
                    onClick={() => void submitForm()}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-admin-navy px-4 text-[13px] font-medium text-white hover:opacity-95 disabled:opacity-50"
                  >
                    <IconTickCircle className="size-5 shrink-0 text-white" />
                    {editUserId ? "Save changes" : "Submit"}
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto px-5 pb-16 pt-5">
            {!meLoaded && (
              <p className="text-sm text-admin-col-muted">Loading…</p>
            )}
            {meLoaded && !canMutate && (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                Viewer role: you can review this form but cannot save changes.
              </p>
            )}

            {detailLoading && (
              <p className="text-sm text-admin-col-muted">Loading user…</p>
            )}

            {formErr && (
              <p className="mb-4 text-sm text-red-600" role="alert">
                {formErr}
              </p>
            )}

            <div className="w-full rounded-xl border border-[#e0e0e0] bg-white p-6">
              <h2 className="text-[16px] font-semibold leading-[22px] text-admin-navy">
                User Information
              </h2>

              <div className="mt-6 flex w-full flex-col gap-4">
                <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4">
                  <label className="flex flex-col gap-1">
                    <FieldLabel required>Permissions</FieldLabel>
                    <select
                      value={role}
                      onChange={(e) =>
                        setRole(e.target.value as "admin" | "viewer")
                      }
                      disabled={!canMutate}
                      className={selectClass}
                    >
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <FieldLabel required>Name</FieldLabel>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!canMutate}
                      className={inputClass}
                    />
                  </label>
                </div>

                <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <FieldLabel required>Email Address</FieldLabel>
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!canMutate}
                      className={inputClass}
                    />
                  </label>

                  <div className="flex flex-col gap-1">
                    <FieldLabel required>Telephone</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={phoneCountry}
                        onChange={(e) => setPhoneCountry(e.target.value)}
                        disabled={!canMutate}
                        className={`${selectClass} w-full shrink-0 sm:w-[160px]`}
                      >
                        {phoneCountryOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!canMutate}
                        className={`${inputClass} min-w-0 flex-1`}
                        inputMode="tel"
                      />
                    </div>
                  </div>
                </div>

                {!editUserId && (
                  <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <FieldLabel required>Password</FieldLabel>
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={!canMutate}
                          className={`${inputClass} pr-11`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-admin-col-muted hover:text-admin-navy"
                          aria-label={showPw ? "Hide password" : "Show password"}
                        >
                          {showPw ? "Hide" : "Show"}
                        </button>
                      </div>
                    </label>
                    <label className="flex flex-col gap-1">
                      <FieldLabel required>Confirm Password</FieldLabel>
                      <div className="relative">
                        <input
                          type={showPw2 ? "text" : "password"}
                          autoComplete="new-password"
                          value={password2}
                          onChange={(e) => setPassword2(e.target.value)}
                          disabled={!canMutate}
                          className={`${inputClass} pr-11`}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPw2((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-xs text-admin-col-muted hover:text-admin-navy"
                          aria-label={showPw2 ? "Hide password" : "Show password"}
                        >
                          {showPw2 ? "Hide" : "Show"}
                        </button>
                      </div>
                    </label>
                  </div>
                )}

                {editUserId && (
                  <>
                    <p className="text-[14px] font-medium text-admin-navy">
                      Change password (optional)
                    </p>
                    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="text-[14px] font-medium text-[#001742]">
                          New password
                        </span>
                        <div className="relative">
                          <input
                            type={showPw ? "text" : "password"}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={!canMutate}
                            className={`${inputClass} pr-11`}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPw((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-xs text-admin-col-muted hover:text-admin-navy"
                            aria-label={showPw ? "Hide password" : "Show password"}
                          >
                            {showPw ? "Hide" : "Show"}
                          </button>
                        </div>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[14px] font-medium text-[#001742]">
                          Confirm new password
                        </span>
                        <div className="relative">
                          <input
                            type={showPw2 ? "text" : "password"}
                            autoComplete="new-password"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            disabled={!canMutate}
                            className={`${inputClass} pr-11`}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPw2((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-xs text-admin-col-muted hover:text-admin-navy"
                            aria-label={showPw2 ? "Hide password" : "Show password"}
                          >
                            {showPw2 ? "Hide" : "Show"}
                          </button>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {editUserId && loadedUser && (
                <div className="mt-8 border-t border-admin-border pt-6">
                  <h3 className="text-[12px] font-semibold uppercase tracking-wide text-admin-col-muted">
                    Other information
                  </h3>
                  <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
                    <div className="flex justify-between gap-4">
                      <dt className="text-admin-col-muted">Created at</dt>
                      <dd className="text-admin-navy">
                        {new Date(loadedUser.createdAt).toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-admin-col-muted">Updated at</dt>
                      <dd className="text-admin-navy">
                        {new Date(loadedUser.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
