import { useState } from 'react';

export function useAdminAuditLogs() {
    // Mock data - in production this would fetch from an audit log API
    const logs = [
        { id: 1, user: "Admin", action: "User Created", details: "New barber account created", timestamp: "2024-12-02 10:30", severity: "info" },
        { id: 2, user: "System", action: "Payment Processed", details: "Payment of 450€ completed", timestamp: "2024-12-02 10:15", severity: "success" },
        { id: 3, user: "Admin", action: "User Suspended", details: "User account suspended for violation", timestamp: "2024-12-02 09:45", severity: "warning" },
        { id: 4, user: "System", action: "Database Backup", details: "Automated backup completed", timestamp: "2024-12-02 03:00", severity: "success" },
        { id: 5, user: "Admin", action: "Settings Updated", details: "Platform settings modified", timestamp: "2024-12-01 16:20", severity: "info" },
        { id: 6, user: "System", action: "Failed Login", details: "Multiple failed login attempts detected", timestamp: "2024-12-01 14:10", severity: "error" }
    ];

    const severityConfig = {
        info: { icon: "FileText", color: "text-blue-600", bg: "bg-blue-100", label: "Info" },
        success: { icon: "CheckCircle", color: "text-emerald-600", bg: "bg-emerald-100", label: "Succès" },
        warning: { icon: "AlertCircle", color: "text-amber-600", bg: "bg-amber-100", label: "Attention" },
        error: { icon: "AlertCircle", color: "text-red-600", bg: "bg-red-100", label: "Erreur" }
    };

    const stats = {
        info: logs.filter(l => l.severity === 'info').length,
        success: logs.filter(l => l.severity === 'success').length,
        warning: logs.filter(l => l.severity === 'warning').length,
        error: logs.filter(l => l.severity === 'error').length
    };

    return {
        logs,
        severityConfig,
        stats,
        isLoading: false,
        error: null
    };
}
