export function useAdminPlatformHealth() {
    const healthMetrics = [
        { label: "Uptime", value: "99.9%", status: "healthy", icon: "CheckCircle" },
        { label: "Response Time", value: "45ms", status: "healthy", icon: "Zap" },
        { label: "Error Rate", value: "0.1%", status: "healthy", icon: "Activity" },
        { label: "Database", value: "Optimal", status: "healthy", icon: "Database" }
    ];

    const recentIssues = [
        { id: 1, title: "Slow API Response", severity: "warning", time: "2h ago", resolved: false },
        { id: 2, title: "Database Connection Timeout", severity: "critical", time: "5h ago", resolved: true },
        { id: 3, title: "High Memory Usage", severity: "info", time: "1d ago", resolved: true }
    ];

    const severityColors = {
        critical: { bg: "bg-red-100", text: "text-red-800", label: "Critique" },
        warning: { bg: "bg-amber-100", text: "text-amber-800", label: "Attention" },
        info: { bg: "bg-blue-100", text: "text-blue-800", label: "Info" }
    };

    return {
        healthMetrics,
        recentIssues,
        severityColors,
        isLoading: false,
        error: null
    };
}
