import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Megaphone, Loader2, RefreshCw, Inbox } from "lucide-react";
import { getFacultyBroadcastMessages } from "../api";

const DEFAULT_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

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

const formatRelativeTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) {
    return "";
  }

  const minutes = Math.round(diffMs / 60000);
  if (minutes <= 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const AudienceBadge = ({ label }) => (
  <span className="inline-flex items-center rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
    {label}
  </span>
);

const FacultyBroadcastFeed = ({ pollInterval = DEFAULT_POLL_INTERVAL, maxItems = 6 }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }
        setError(null);
        const response = await getFacultyBroadcastMessages({ limit: maxItems });
        setMessages(response.data?.data || []);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("❌ Failed to load broadcast messages:", err);
        setError(err.response?.data?.message || "Unable to load broadcasts");
      } finally {
        setLoading(false);
      }
    },
    [maxItems]
  );

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(() => fetchMessages(false), pollInterval);
    return () => clearInterval(intervalId);
  }, [fetchMessages, pollInterval]);

  const headerSubtitle = useMemo(() => {
    if (loading && messages.length === 0) {
      return "Fetching latest alerts";
    }
    if (error) {
      return "Unable to refresh";
    }
    if (!messages.length) {
      return "No alerts right now";
    }
    return lastUpdated ? `Updated ${formatRelativeTime(lastUpdated)}` : "";
  }, [loading, messages.length, error, lastUpdated]);

  return (
    <section className="mb-6 rounded-2xl border border-blue-100 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-blue-700">
            <Megaphone className="h-5 w-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Admin Broadcasts
            </h2>
          </div>
          <p className="text-xs text-blue-500">{headerSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchMessages()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </button>
      </header>

      <div className="px-5 py-4">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-6 py-8 text-center text-blue-500">
            <Inbox className="mb-3 h-10 w-10" />
            <p className="text-sm font-medium">No active broadcasts for you right now.</p>
            <p className="text-xs">You will see messages from admin here as soon as they are sent.</p>
          </div>
        )}

        {messages.length > 0 && (
          <ul className="flex flex-col gap-4">
            {messages.map((item) => {
              const subtitleParts = [];

              if (item.targetSchools?.length) {
                subtitleParts.push(`Schools: ${item.targetSchools.join(", ")}`);
              } else {
                subtitleParts.push("Schools: All");
              }

              if (item.targetDepartments?.length) {
                subtitleParts.push(
                  `Departments: ${item.targetDepartments.join(", ")}`
                );
              } else {
                subtitleParts.push("Departments: All");
              }

              const subtitle = subtitleParts.join(" • ");

              return (
                <li
                  key={item._id}
                  className="group rounded-2xl border border-blue-100 bg-blue-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-100/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-blue-900">
                        {item.title?.trim?.() || "Important Update"}
                      </h3>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-blue-800">
                        {item.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right text-xs text-blue-600">
                      <span>{formatRelativeTime(item.createdAt)}</span>
                      <span className="text-[11px] text-blue-500">
                        {formatTimestamp(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-blue-600">
                    <AudienceBadge label={subtitle} />
                    {item.createdByName && (
                      <AudienceBadge label={`By ${item.createdByName}`} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading broadcasts…</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default FacultyBroadcastFeed;
