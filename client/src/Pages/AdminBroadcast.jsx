import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Loader2, CheckCircle2, CalendarX2, Pencil, Trash2, X } from "lucide-react";
import Navbar from "../Components/UniversalNavbar";
import { useNotification } from "../Components/NotificationProvider";
import {
  createBroadcastMessage,
  getAdminBroadcastMessages,
  updateBroadcastMessage,
  deleteBroadcastMessage,
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

const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
};

const fromDatetimeLocalValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const AdminBroadcast = () => {
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetSchools: [],
    targetDepartments: [],
    expiresAt: "",
    action: 'notice',
    isActive: true,
  });
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(DEFAULT_HISTORY_LIMIT);
  const [editingBroadcastId, setEditingBroadcastId] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      message: "",
      targetSchools: [],
      targetDepartments: [],
      expiresAt: "",
      action: 'notice',
      isActive: true,
    });
    setEditingBroadcastId(null);
  }, []);

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
    if (name === "isActive") {
      setFormData((prev) => ({
        ...prev,
        isActive: event.target.checked,
      }));
      return;
    }
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

    if (!formData.expiresAt) {
      showNotification(
        "warning",
        "Expiry required",
        "Please choose when this broadcast should expire."
      );
      return;
    }

    const expiryIso = fromDatetimeLocalValue(formData.expiresAt);
    if (!expiryIso) {
      showNotification(
        "error",
        "Invalid expiry",
        "Please pick a valid future date and time for expiry."
      );
      return;
    }

    if (new Date(expiryIso) <= new Date()) {
      showNotification(
        "error",
        "Expiry must be in the future",
        "Adjust the expiry so it is later than the current time."
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
        expiresAt: expiryIso,
        action: formData.action || 'notice',
        isActive: formData.isActive,
      };

      if (editingBroadcastId) {
        await updateBroadcastMessage(editingBroadcastId, payload);
        showNotification(
          "success",
          "Broadcast updated",
          "Changes have been saved and will reflect for faculty shortly."
        );
      } else {
        await createBroadcastMessage(payload);
        showNotification(
          "success",
          "Broadcast sent",
          "Faculty members will see this message within a few minutes."
        );
      }

      resetForm();
      fetchHistory();
    } catch (err) {
      console.error("❌ Failed to submit broadcast:", err);
      showNotification(
        "error",
        "Unable to save broadcast",
        err.response?.data?.message || "Please retry in a few moments."
      );
    } finally {
      setSending(false);
    }
  };

  const handleEditBroadcast = useCallback((broadcast) => {
    setEditingBroadcastId(broadcast._id);
    setFormData({
      title: broadcast.title || "",
      message: broadcast.message || "",
      targetSchools: broadcast.targetSchools || [],
      targetDepartments: broadcast.targetDepartments || [],
      expiresAt: toDatetimeLocalValue(broadcast.expiresAt),
      action: broadcast.action || 'notice',
      isActive: broadcast.isActive ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleDeleteBroadcast = useCallback(async (broadcastId) => {
    const confirmDelete = window.confirm("Delete this broadcast permanently?");
    if (!confirmDelete) return;

    try {
      await deleteBroadcastMessage(broadcastId);
      showNotification(
        "success",
        "Broadcast deleted",
        "The broadcast has been removed."
      );
      if (editingBroadcastId === broadcastId) {
        resetForm();
      }
      fetchHistory();
    } catch (err) {
      console.error("❌ Failed to delete broadcast:", err);
      showNotification(
        "error",
        "Unable to delete broadcast",
        err.response?.data?.message || "Please retry in a few moments."
      );
    }
  }, [deleteBroadcastMessage, editingBroadcastId, fetchHistory, resetForm, showNotification]);

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
                {editingBroadcastId ? "Edit Broadcast" : "Create Broadcast"}
              </h2>
              {editingBroadcastId && (
                <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <span>Updating an existing broadcast. Changes will overwrite the original message.</span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    <X className="h-3 w-3" /> Cancel edit
                  </button>
                </div>
              )}
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
                      Expiry <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="expiresAt"
                      value={formData.expiresAt}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      min={toDatetimeLocalValue(new Date(Date.now() + 5 * 60 * 1000))}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      The message disappears automatically after this time. Choose a future timestamp.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Action
                    </label>
                    <div className="flex items-center gap-4">
                      <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${formData.action === 'notice' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white'}`}>
                        <input type="radio" name="action" value="notice" checked={formData.action === 'notice'} onChange={handleInputChange} />
                        <span className="text-sm">Notice (informational)</span>
                      </label>
                      <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border ${formData.action === 'block' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-white'}`}>
                        <input type="radio" name="action" value="block" checked={formData.action === 'block'} onChange={handleInputChange} />
                        <span className="text-sm">Block faculty access</span>
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Choose 'Block faculty access' to temporarily prevent faculty from using the portal (they will still see this broadcast).
                    </p>
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="broadcast-active"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="broadcast-active" className="text-sm font-semibold text-slate-700">
                      Keep this broadcast active until expiry
                    </label>
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
                    {sending ? (editingBroadcastId ? "Saving..." : "Sending...") : editingBroadcastId ? "Update Broadcast" : "Send Broadcast"}
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
                    const isBlocking = item.action === 'block';
                    return (
                      <li
                        key={item._id}
                        className={`rounded-2xl border px-4 py-4 shadow-sm transition hover:shadow-md ${
                          isExpired
                            ? "border-slate-200 bg-slate-50"
                            : isBlocking
                              ? "border-red-200 bg-red-50/80"
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
                            <span>
                              Status: <strong className="ml-1">{item.isActive ? 'Active' : 'Inactive'}</strong>
                            </span>
                            <span>
                              Action: <strong className="ml-1">{item.action || 'notice'}</strong>
                            </span>
                            {isExpired && (
                              <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                Expired
                              </span>
                            )}
                            {isBlocking && !isExpired && (
                              <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                                Blocking faculty access
                              </span>
                            )}
                            {item.isActive && !isExpired && (
                              <span className="text-[11px] font-semibold text-emerald-600">
                                Currently shown to faculty
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
                          <div className="ml-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditBroadcast(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBroadcast(item._id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
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
