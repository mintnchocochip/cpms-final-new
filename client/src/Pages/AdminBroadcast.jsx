import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Loader2, CheckCircle2, CalendarX2 } from "lucide-react";
import Navbar from "../Components/UniversalNavbar";
import { useNotification } from "../Components/NotificationProvider";
import {
  createBroadcastMessage,
  getAdminBroadcastMessages,
} from "../api";
import {
  schoolOptions,
  departmentOptions,
} from "../Components/utils/constants";

const DEFAULT_HISTORY_LIMIT = 25;

const formatTimestamp = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const AdminBroadcast = () => {
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetSchools: [],
    targetDepartments: [],
    expiresAt: "",
  });
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(DEFAULT_HISTORY_LIMIT);

  const toggleAudienceValue = (key, value) => {
    setFormData((prev) => {
      const list = prev[key];
      const exists = list.includes(value);
      const nextValues = exists
        ? list.filter((item) => item !== value)
        : [...list, value];

      return {
        ...prev,
        [key]: nextValues,
      };
    });
  };

  const resetAudience = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [],
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await getAdminBroadcastMessages({
        limit: historyLimit,
        includeExpired: includeExpired ? "true" : "false",
      });
      setHistory(response.data?.data || []);
    } catch (err) {
      console.error("❌ Failed to load broadcast history:", err);
      showNotification(
        "error",
        "Unable to load broadcast history",
        err.response?.data?.message || "Please try again later"
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit, includeExpired, showNotification]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.message.trim()) {
      showNotification(
        "warning",
        "Message required",
        "Please add a message before sending the broadcast."
      );
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetSchools: formData.targetSchools,
        targetDepartments: formData.targetDepartments,
        expiresAt: formData.expiresAt || undefined,
      };

      await createBroadcastMessage(payload);
      showNotification(
        "success",
        "Broadcast sent",
        "Faculty members will see this message within a few minutes."
      );

      setFormData({
        title: "",
        message: "",
        targetSchools: [],
        targetDepartments: [],
        expiresAt: "",
      });

      fetchHistory();
    } catch (err) {
      console.error("❌ Failed to send broadcast:", err);
      showNotification(
        "error",
        "Unable to send broadcast",
        err.response?.data?.message || "Please retry in a few moments."
      );
    } finally {
      setSending(false);
    }
  };

  const activeAudienceDescription = useMemo(() => {
    const schoolLabel =
      formData.targetSchools.length === 0
        ? "All schools"
        : `${formData.targetSchools.length} selected`;
    const departmentLabel =
      formData.targetDepartments.length === 0
        ? "All departments"
        : `${formData.targetDepartments.length} selected`;

    return `${schoolLabel} • ${departmentLabel}`;
  }, [formData.targetSchools, formData.targetDepartments]);

  return (
    <>
      <Navbar userType="admin" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pt-14">
        <div className="lg:ml-64 xl:ml-16 transition-all duration-300">
          <div className="p-4 sm:p-6 lg:p-8 xl:p-12 max-w-6xl mx-auto">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 text-white">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Broadcast Center
                  </h1>
                  <p className="text-sm text-slate-600">
                    Send important announcements to faculty with precise targeting
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    {activeAudienceDescription}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchHistory}
                disabled={historyLoading}
                className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {historyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Loader2 className="h-4 w-4" />
                )}
                Refresh History
              </button>
            </header>

            <section className="mb-10 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">
                Create Broadcast
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Title <span className="text-slate-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="E.g. Upcoming Review Schedule"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      required
                      placeholder="Share the announcement that needs to reach faculty…"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Tip: Mention exact actions, timelines, or attachments if applicable.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Target Schools
                      </label>
                      <button
                        type="button"
                        onClick={() => resetAudience("targetSchools")}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Target all
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Leave empty to reach every school.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {schoolOptions.map((school) => {
                        const selected = formData.targetSchools.includes(school);
                        return (
                          <button
                            key={school}
                            type="button"
                            onClick={() => toggleAudienceValue("targetSchools", school)}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                              selected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"
                            }`}
                          >
                            <span>{school}</span>
                            {selected && <CheckCircle2 className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Target Departments
                      </label>
                      <button
                        type="button"
                        onClick={() => resetAudience("targetDepartments")}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Target all
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Leave empty to reach every department.
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {departmentOptions.map((dept) => {
                        const selected = formData.targetDepartments.includes(dept);
                        return (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => toggleAudienceValue("targetDepartments", dept)}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                              selected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600"
                            }`}
                          >
                            <span>{dept}</span>
                            {selected && <CheckCircle2 className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Optional Expiry
                    </label>
                    <input
                      type="datetime-local"
                      name="expiresAt"
                      value={formData.expiresAt}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      The message disappears automatically after this time. Leave empty to keep it active.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Broadcasts are stored securely and synced with faculty dashboards every few minutes.
                  </p>
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Megaphone className="h-4 w-4" />
                    )}
                    {sending ? "Sending..." : "Send Broadcast"}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Broadcast History
                  </h2>
                  <p className="text-xs text-slate-500">
                    {includeExpired
                      ? "Showing all broadcasts including expired ones"
                      : "Only active broadcasts are listed"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={includeExpired}
                      onChange={(event) => setIncludeExpired(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Include expired
                  </label>
                  <select
                    value={historyLimit}
                    onChange={(event) => setHistoryLimit(Number(event.target.value))}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {[10, 25, 50].map((value) => (
                      <option key={value} value={value}>
                        Last {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-blue-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading broadcast history…
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center text-slate-500">
                  <CalendarX2 className="h-8 w-8" />
                  <p className="text-sm font-semibold">No broadcasts recorded yet.</p>
                  <p className="text-xs">Send your first message using the compose panel above.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-4">
                  {history.map((item) => {
                    const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
                    return (
                      <li
                        key={item._id}
                        className={`rounded-2xl border px-4 py-4 shadow-sm transition hover:shadow-md ${
                          isExpired
                            ? "border-slate-200 bg-slate-50"
                            : "border-blue-100 bg-blue-50/60"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-slate-900">
                              {item.title?.trim?.() || "Broadcast"}
                            </h3>
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                              {item.message}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
                            <span>Created {formatTimestamp(item.createdAt)}</span>
                            {item.expiresAt && (
                              <span>
                                Expires {formatTimestamp(item.expiresAt)}
                              </span>
                            )}
                            {isExpired && (
                              <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                Expired
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 shadow">
                            Schools:
                            {item.targetSchools?.length
                              ? ` ${item.targetSchools.join(", ")}`
                              : " All"}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 shadow">
                            Departments:
                            {item.targetDepartments?.length
                              ? ` ${item.targetDepartments.join(", ")}`
                              : " All"}
                          </span>
                          {item.createdByName && (
                            <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700 shadow">
                              By {item.createdByName}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminBroadcast;
