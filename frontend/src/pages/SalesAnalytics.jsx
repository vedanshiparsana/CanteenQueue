import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import AdminSidebar from "../components/AdminSidebar";
import {
    getSalesAnalytics,
    getPopularItems,
    getAnalyticsSummary,
} from "../services/api";

import "../styles/pages/SalesAnalytics.css";

function SalesAnalytics() {
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
    });

    const [sales, setSales] = useState([]);
    const [popularItems, setPopularItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError("");

            const [summaryResponse, salesResponse, popularResponse] =
                await Promise.all([
                    getAnalyticsSummary(),
                    getSalesAnalytics(),
                    getPopularItems(),
                ]);

            setSummary(
                summaryResponse?.data?.data || {
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                }
            );

            setSales(salesResponse?.data?.data || []);
            setPopularItems(popularResponse?.data?.data || []);
        } catch (err) {
            console.error("Error loading analytics:", err);

            setError(
                err?.response?.data?.message ||
                    "Unable to load sales analytics right now."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    const formatCurrency = (value) => {
        const amount = Number(value || 0);

        return `₹${amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatShortCurrency = (value) => {
        const amount = Number(value || 0);

        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        }

        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }

        return `₹${amount.toFixed(0)}`;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const parts = String(dateValue).split("-");

        if (parts.length !== 3) {
            return String(dateValue);
        }

        const [year, month, day] = parts;

        return `${day}/${month}/${year}`;
    };

    const formatChartDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const parts = String(dateValue).split("-");

        if (parts.length !== 3) {
            return String(dateValue);
        }

        const [, month, day] = parts;

        return `${day}/${month}`;
    };

    /*
     * CSV DOWNLOAD
     *
     * Important:
     * Excel sometimes interprets normal date values as actual dates.
     * When the column is narrow, Excel then displays ######.
     *
     * To prevent that, the exported date is written as:
     *
     * ="05/10/2026"
     *
     * Excel evaluates this as TEXT, so it will display the date
     * instead of converting it to an Excel date serial number.
     */
    const downloadRevenueCSV = () => {
        if (!sales.length) {
            return;
        }

        const rows = [
            ["Date", "Revenue", "Orders"],

            ...sales.map((item) => {
                const rawDate = item?._id || item?.date || "";

                let displayDate = rawDate;

                if (rawDate) {
                    const parts = String(rawDate).split("-");

                    if (parts.length === 3) {
                        const [year, month, day] = parts;

                        displayDate = `${day}/${month}/${year}`;
                    }
                }

                /*
                 * ="date" forces Excel to display the value as text.
                 * This prevents the ###### problem.
                 */
                const excelSafeDate = displayDate
                    ? `="${displayDate}"`
                    : "";

                return [
                    excelSafeDate,
                    Number(item?.revenue || 0),
                    Number(item?.orders || 0),
                ];
            }),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((value) =>
                        `"${String(value).replace(/"/g, '""')}"`
                    )
                    .join(",")
            )
            .join("\r\n");

        /*
         * UTF-8 BOM helps Excel correctly recognize the CSV encoding.
         */
        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download = `canteenqueue-revenue-report-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        setShowDownloadMenu(false);
    };

    const chartSales = useMemo(() => {
        return sales.map((item) => ({
            date: item?._id || item?.date || "",
            displayDate: formatChartDate(
                item?._id || item?.date
            ),
            revenue: Number(item?.revenue || 0),
            orders: Number(item?.orders || 0),
        }));
    }, [sales]);

    const topPopularItems = useMemo(() => {
        return popularItems.slice(0, 7).map((item) => ({
            name: item?.name || "Unknown Item",
            quantity: Number(item?.totalQuantity || 0),
        }));
    }, [popularItems]);

    const totalUnitsSold = useMemo(() => {
        return popularItems.reduce(
            (total, item) =>
                total + Number(item?.totalQuantity || 0),
            0
        );
    }, [popularItems]);

    const bestSellingItem = useMemo(() => {
        if (!popularItems.length) {
            return "—";
        }

        return popularItems[0]?.name || "—";
    }, [popularItems]);

    const reportingDays = sales.length;

    const CustomRevenueTooltip = ({
        active,
        payload,
        label,
    }) => {
        if (!active || !payload || !payload.length) {
            return null;
        }

        return (
            <div className="sales-chart-tooltip">
                <strong>{label}</strong>

                <span>
                    Revenue:{" "}
                    {formatCurrency(
                        payload[0]?.value || 0
                    )}
                </span>
            </div>
        );
    };

    const CustomOrdersTooltip = ({
        active,
        payload,
        label,
    }) => {
        if (!active || !payload || !payload.length) {
            return null;
        }

        return (
            <div className="sales-chart-tooltip">
                <strong>{label}</strong>

                <span>
                    Orders:{" "}
                    {Number(payload[0]?.value || 0)}
                </span>
            </div>
        );
    };

    const CustomItemsTooltip = ({
        active,
        payload,
    }) => {
        if (!active || !payload || !payload.length) {
            return null;
        }

        return (
            <div className="sales-chart-tooltip">
                <strong>
                    {payload[0]?.payload?.name}
                </strong>

                <span>
                    Units sold:{" "}
                    {Number(payload[0]?.value || 0)}
                </span>
            </div>
        );
    };

    return (
        <div className="sales-analytics-page">
            <AdminSidebar />

            <main className="sales-analytics-main">
                <header className="sales-analytics-header">
                    <div>
                        <span className="sales-analytics-eyebrow">
                            REPORTING
                        </span>

                        <h1>
    Sales <span>Analytics</span>
</h1>

                        <p>
                            Track revenue, orders, and your
                            best-selling menu items.
                        </p>
                    </div>

                    <div className="sales-analytics-header-actions">
                        <div className="download-report-wrapper">
                            <button
                                type="button"
                                className="download-report-button"
                                onClick={() =>
                                    setShowDownloadMenu(
                                        (current) =>
                                            !current
                                    )
                                }
                                disabled={
                                    loading || !sales.length
                                }
                                aria-expanded={
                                    showDownloadMenu
                                }
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M12 3v11"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />

                                    <path
                                        d="m8 10 4 4 4-4"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    <path
                                        d="M5 20h14"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                Download Report

                                <svg
                                    className={`download-chevron ${
                                        showDownloadMenu
                                            ? "open"
                                            : ""
                                    }`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="m6 9 6 6 6-6"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </button>

                            {showDownloadMenu && (
                                <div className="download-report-menu">
                                    <button
                                        type="button"
                                        className="download-menu-item"
                                        onClick={
                                            downloadRevenueCSV
                                        }
                                    >
                                        <span className="download-menu-icon csv-icon">
                                            CSV
                                        </span>

                                        <span className="download-menu-content">
                                            <strong>
                                                Revenue CSV
                                            </strong>

                                            <small>
                                                Download sales
                                                data as a CSV
                                                file
                                            </small>
                                        </span>

                                        <span className="download-menu-arrow">
                                            →
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="sales-analytics-refresh"
                            onClick={loadAnalytics}
                            disabled={loading}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 14.9 3"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />

                                <path
                                    d="M5 4v4h4M19 20v-4h-4"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>

                            {loading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="sales-analytics-error">
                        <span className="sales-error-icon">
                            !
                        </span>

                        <div>
                            <strong>
                                Analytics unavailable
                            </strong>

                            <p>{error}</p>
                        </div>

                        <button
                            type="button"
                            onClick={loadAnalytics}
                        >
                            Try again
                        </button>
                    </div>
                )}

                <section className="sales-summary-grid">
                    <article className="sales-summary-card revenue-card">
                        <div className="sales-summary-card-top">
                            <span className="sales-summary-label">
                                TOTAL REVENUE
                            </span>

                            <span className="sales-summary-icon">
                                ₹
                            </span>
                        </div>

                        <strong className="sales-summary-value">
                            {loading
                                ? "—"
                                : formatCurrency(
                                      summary.totalRevenue
                                  )}
                        </strong>

                        <span className="sales-summary-caption">
                            From completed paid orders
                        </span>
                    </article>

                    <article className="sales-summary-card orders-card">
                        <div className="sales-summary-card-top">
                            <span className="sales-summary-label">
                                TOTAL ORDERS
                            </span>

                            <span className="sales-summary-icon">
                                #
                            </span>
                        </div>

                        <strong className="sales-summary-value">
                            {loading
                                ? "—"
                                : Number(
                                      summary.totalOrders ||
                                          0
                                  ).toLocaleString(
                                      "en-IN"
                                  )}
                        </strong>

                        <span className="sales-summary-caption">
                            Successful orders
                        </span>
                    </article>

                    <article className="sales-summary-card average-card">
                        <div className="sales-summary-card-top">
                            <span className="sales-summary-label">
                                AVERAGE ORDER VALUE
                            </span>

                            <span className="sales-summary-icon">
                                ↗
                            </span>
                        </div>

                        <strong className="sales-summary-value">
                            {loading
                                ? "—"
                                : formatCurrency(
                                      summary.averageOrderValue
                                  )}
                        </strong>

                        <span className="sales-summary-caption">
                            Average spend per order
                        </span>
                    </article>
                </section>

                <section className="sales-mini-stats">
                    <div className="sales-mini-stat">
                        <span>Total Units Sold</span>

                        <strong>
                            {loading
                                ? "—"
                                : totalUnitsSold.toLocaleString(
                                      "en-IN"
                                  )}
                        </strong>
                    </div>

                    <div className="sales-mini-divider"></div>

                    <div className="sales-mini-stat">
                        <span>Best Selling Item</span>

                        <strong title={bestSellingItem}>
                            {loading
                                ? "—"
                                : bestSellingItem}
                        </strong>
                    </div>

                    <div className="sales-mini-divider"></div>

                    <div className="sales-mini-stat">
                        <span>Reporting Days</span>

                        <strong>
                            {loading
                                ? "—"
                                : reportingDays}
                        </strong>
                    </div>
                </section>

                <section className="sales-chart-grid">
                    <article className="sales-chart-card sales-chart-wide">
                        <div className="sales-chart-header">
                            <div>
                                <span>REVENUE</span>

                                <h2>
                                    Revenue Overview
                                </h2>
                            </div>

                            <strong>
                                {loading
                                    ? "—"
                                    : formatShortCurrency(
                                          summary.totalRevenue
                                      )}
                            </strong>
                        </div>

                        <div className="sales-chart-container">
                            {loading ? (
                                <div className="sales-chart-loading">
                                    Loading revenue data...
                                </div>
                            ) : chartSales.length ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <AreaChart
                                        data={chartSales}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="revenueGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#2F6B4F"
                                                    stopOpacity={
                                                        0.28
                                                    }
                                                />

                                                <stop
                                                    offset="100%"
                                                    stopColor="#2F6B4F"
                                                    stopOpacity={
                                                        0.02
                                                    }
                                                />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            stroke="#E9EEE9"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#8B958D",
                                                fontSize: 10,
                                            }}
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#8B958D",
                                                fontSize: 10,
                                            }}
                                            tickFormatter={
                                                formatShortCurrency
                                            }
                                        />

                                        <Tooltip
                                            content={
                                                <CustomRevenueTooltip />
                                            }
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#2F6B4F"
                                            strokeWidth={2.5}
                                            fill="url(#revenueGradient)"
                                            dot={false}
                                            activeDot={{
                                                r: 5,
                                                strokeWidth: 2,
                                                stroke: "#FFFFFF",
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="sales-chart-empty">
                                    No revenue data
                                    available yet.
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="sales-chart-card">
                        <div className="sales-chart-header">
                            <div>
                                <span>ORDERS</span>

                                <h2>
                                    Order Volume
                                </h2>
                            </div>

                            <strong>
                                {loading
                                    ? "—"
                                    : Number(
                                          summary.totalOrders ||
                                              0
                                      ).toLocaleString(
                                          "en-IN"
                                      )}
                            </strong>
                        </div>

                        <div className="sales-chart-container">
                            {loading ? (
                                <div className="sales-chart-loading">
                                    Loading order data...
                                </div>
                            ) : chartSales.length ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={chartSales}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -10,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#E9EEE9"
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="displayDate"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#8B958D",
                                                fontSize: 10,
                                            }}
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8B958D",
                                                fontSize: 10,
                                            }}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomOrdersTooltip />
                                            }
                                        />

                                        <Bar
                                            dataKey="orders"
                                            fill="#7CA68D"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0,
                                            ]}
                                            maxBarSize={38}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="sales-chart-empty">
                                    No order data
                                    available yet.
                                </div>
                            )}
                        </div>
                    </article>

                    <article className="sales-chart-card">
                        <div className="sales-chart-header">
                            <div>
                                <span>
                                    MENU PERFORMANCE
                                </span>

                                <h2>
                                    Top Selling Items
                                </h2>
                            </div>

                            <strong>
                                {loading
                                    ? "—"
                                    : popularItems.length}
                            </strong>
                        </div>

                        <div className="sales-chart-container">
                            {loading ? (
                                <div className="sales-chart-loading">
                                    Loading item data...
                                </div>
                            ) : topPopularItems.length ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >
                                    <BarChart
                                        data={
                                            topPopularItems
                                        }
                                        layout="vertical"
                                        margin={{
                                            top: 5,
                                            right: 10,
                                            left: 15,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            stroke="#E9EEE9"
                                            horizontal={false}
                                        />

                                        <XAxis
                                            type="number"
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#8B958D",
                                                fontSize: 10,
                                            }}
                                        />

                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={85}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: "#647068",
                                                fontSize: 10,
                                            }}
                                        />

                                        <Tooltip
                                            content={
                                                <CustomItemsTooltip />
                                            }
                                        />

                                        <Bar
                                            dataKey="quantity"
                                            fill="#2F6B4F"
                                            radius={[
                                                0,
                                                5,
                                                5,
                                                0,
                                            ]}
                                            maxBarSize={24}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="sales-chart-empty">
                                    No item sales data
                                    available yet.
                                </div>
                            )}
                        </div>
                    </article>
                </section>

                <section className="sales-bottom-grid">
                    <article className="sales-recent-card">
                        <div className="sales-section-heading">
                            <div>
                                <span>
                                    DAILY BREAKDOWN
                                </span>

                                <h2>Recent Sales</h2>
                            </div>
                        </div>

                        {loading ? (
                            <div className="sales-list-loading">
                                Loading sales...
                            </div>
                        ) : sales.length ? (
                            <div className="sales-table">
                                <div className="sales-table-header">
                                    <span>Date</span>
                                    <span>Revenue</span>
                                    <span>Orders</span>
                                </div>

                                {sales
                                    .slice()
                                    .reverse()
                                    .slice(0, 6)
                                    .map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <div
                                                className="sales-table-row"
                                                key={`${
                                                    item?._id ||
                                                    "sale"
                                                }-${index}`}
                                            >
                                                <span>
                                                    {formatDate(
                                                        item?._id ||
                                                            item?.date
                                                    )}
                                                </span>

                                                <strong>
                                                    {formatCurrency(
                                                        item?.revenue
                                                    )}
                                                </strong>

                                                <span className="sales-order-count">
                                                    {Number(
                                                        item?.orders ||
                                                            0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </div>
                                        )
                                    )}
                            </div>
                        ) : (
                            <div className="sales-list-empty">
                                No sales recorded yet.
                            </div>
                        )}
                    </article>

                    <article className="sales-highlight-card">
                        <span className="sales-highlight-eyebrow">
                            PERFORMANCE
                        </span>

                        <h2>
                            Keep an eye on what
                            <span> sells best.</span>
                        </h2>

                        <p>
                            Use these analytics to
                            understand daily revenue,
                            order volume, and the menu
                            items your customers choose
                            most.
                        </p>

                        <div className="sales-highlight-metric">
                            <span>Best seller</span>

                            <strong>
                                {loading
                                    ? "—"
                                    : bestSellingItem}
                            </strong>
                        </div>
                    </article>
                </section>
            </main>
        </div>
    );
}

export default SalesAnalytics;