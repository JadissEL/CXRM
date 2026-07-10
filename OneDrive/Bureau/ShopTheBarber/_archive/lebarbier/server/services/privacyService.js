import fs from 'fs/promises';
import path from 'path';
import { get, run, query } from '../database/db.js';
import { sendEmail } from './emailService.js';

export class PrivacyService {
  // Request data export
  static async requestDataExport(userId, requestType = 'full') {
    try {
      // Check if user has a pending request
      const existingRequest = await get(
        "SELECT * FROM data_export_requests WHERE user_id = ? AND status IN ('pending', 'processing')",
        [userId]
      );

      if (existingRequest) {
        throw new Error('Vous avez déjà une demande d\'export en cours');
      }

      // Create export request
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      const result = await run(
        "INSERT INTO data_export_requests (user_id, request_type, expires_at) VALUES (?, ?, ?)",
        [userId, requestType, expiresAt.toISOString()]
      );

      // Log the request
      await this.logDataAccess(userId, 'export', requestType);

      // Schedule the export job
      await this.scheduleDataExport(result.lastID);

      return {
        id: result.lastID,
        message: 'Demande d\'export créée avec succès. Vous recevrez un email quand l\'export sera prêt.',
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      console.error('Error requesting data export:', error);
      throw error;
    }
  }

  // Process data export
  static async processDataExport(exportId) {
    try {
      // Get export request
      const exportRequest = await get(
        "SELECT * FROM data_export_requests WHERE id = ?",
        [exportId]
      );

      if (!exportRequest) {
        throw new Error('Export request not found');
      }

      // Update status to processing
      await run(
        "UPDATE data_export_requests SET status = 'processing' WHERE id = ?",
        [exportId]
      );

      // Get user data based on request type
      let userData = {};
      
      switch (exportRequest.request_type) {
        case 'full':
          userData = await this.exportFullUserData(exportRequest.user_id);
          break;
        case 'profile':
          userData = await this.exportUserProfile(exportRequest.user_id);
          break;
        case 'appointments':
          userData = await this.exportUserAppointments(exportRequest.user_id);
          break;
        case 'reviews':
          userData = await this.exportUserReviews(exportRequest.user_id);
          break;
        default:
          throw new Error('Invalid export type');
      }

      // Create export file
      const fileName = `export_${exportRequest.user_id}_${Date.now()}.json`;
      const exportDir = path.join(process.cwd(), 'exports');
      
      // Ensure export directory exists
      try {
        await fs.access(exportDir);
      } catch {
        await fs.mkdir(exportDir, { recursive: true });
      }

      const filePath = path.join(exportDir, fileName);
      const fileContent = JSON.stringify(userData, null, 2);
      
      await fs.writeFile(filePath, fileContent, 'utf8');
      const fileStats = await fs.stat(filePath);

      // Update export request with file info
      await run(
        "UPDATE data_export_requests SET status = 'completed', file_path = ?, file_size = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [filePath, fileStats.size, exportId]
      );

      // Send email notification
      const user = await get("SELECT email, first_name FROM users WHERE id = ?", [exportRequest.user_id]);
      if (user) {
        await this.sendExportNotification(user.email, user.first_name, fileName);
      }

      return { success: true, filePath, fileSize: fileStats.size };
    } catch (error) {
      console.error('Error processing data export:', error);
      
      // Update status to failed
      await run(
        "UPDATE data_export_requests SET status = 'failed' WHERE id = ?",
        [exportId]
      );
      
      throw error;
    }
  }

  // Export full user data
  static async exportFullUserData(userId) {
    const user = await get("SELECT * FROM users WHERE id = ?", [userId]);
    const profile = await get("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
    const addresses = await query("SELECT * FROM user_addresses WHERE user_id = ?", [userId]);
    const paymentMethods = await query("SELECT * FROM user_payment_methods WHERE user_id = ?", [userId]);
    const appointments = await query("SELECT * FROM appointments WHERE client_id = ?", [userId]);
    const reviews = await query("SELECT * FROM reviews WHERE user_id = ?", [userId]);
    const favorites = await query("SELECT * FROM user_favorites WHERE user_id = ?", [userId]);
    const consents = await query("SELECT * FROM privacy_consents WHERE user_id = ?", [userId]);

    return {
      user: {
        ...user,
        password_hash: undefined, // Don't export password hash
        mfa_secret: undefined // Don't export MFA secret
      },
      profile,
      addresses,
      paymentMethods: paymentMethods.map(pm => ({
        ...pm,
        payment_token: undefined // Don't export payment tokens
      })),
      appointments,
      reviews,
      favorites,
      privacyConsents: consents,
      exportDate: new Date().toISOString(),
      exportType: 'full'
    };
  }

  // Export user profile only
  static async exportUserProfile(userId) {
    const user = await get("SELECT id, email, first_name, last_name, phone, city, created_at FROM users WHERE id = ?", [userId]);
    const profile = await get("SELECT * FROM user_profiles WHERE user_id = ?", [userId]);
    const addresses = await query("SELECT * FROM user_addresses WHERE user_id = ?", [userId]);

    return {
      user,
      profile,
      addresses,
      exportDate: new Date().toISOString(),
      exportType: 'profile'
    };
  }

  // Export user appointments
  static async exportUserAppointments(userId) {
    const appointments = await query(`
      SELECT a.*, b.name as barber_name, s.name as service_name
      FROM appointments a
      LEFT JOIN barbers b ON a.barber_id = b.id
      LEFT JOIN appointment_services aps ON a.id = aps.appointment_id
      LEFT JOIN services s ON aps.service_id = s.id
      WHERE a.client_id = ?
      ORDER BY a.appointment_date DESC
    `, [userId]);

    return {
      appointments,
      exportDate: new Date().toISOString(),
      exportType: 'appointments'
    };
  }

  // Export user reviews
  static async exportUserReviews(userId) {
    const reviews = await query(`
      SELECT r.*, b.name as barber_name
      FROM reviews r
      LEFT JOIN barbers b ON r.barber_id = b.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    return {
      reviews,
      exportDate: new Date().toISOString(),
      exportType: 'reviews'
    };
  }

  // Request account deletion
  static async requestAccountDeletion(userId, reason = null) {
    try {
      // Check if user has a pending deletion request
      const existingRequest = await get(
        "SELECT * FROM account_deletion_requests WHERE user_id = ? AND status IN ('pending', 'approved')",
        [userId]
      );

      if (existingRequest) {
        throw new Error('Vous avez déjà une demande de suppression en cours');
      }

      // Schedule deletion for 30 days from now (GDPR requirement)
      const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const result = await run(
        "INSERT INTO account_deletion_requests (user_id, reason, scheduled_for) VALUES (?, ?, ?)",
        [userId, reason, scheduledFor.toISOString()]
      );

      // Log the request
      await this.logDataAccess(userId, 'delete', 'account');

      // Send confirmation email
      const user = await get("SELECT email, first_name FROM users WHERE id = ?", [userId]);
      if (user) {
        await this.sendDeletionRequestNotification(user.email, user.first_name, scheduledFor);
      }

      return {
        id: result.lastID,
        message: 'Demande de suppression de compte créée. Votre compte sera supprimé dans 30 jours.',
        scheduledFor: scheduledFor.toISOString()
      };
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      throw error;
    }
  }

  // Cancel account deletion request
  static async cancelAccountDeletion(userId) {
    try {
      const result = await run(
        "UPDATE account_deletion_requests SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'",
        [userId]
      );

      if (result.changes === 0) {
        throw new Error('Aucune demande de suppression en attente trouvée');
      }

      // Log the cancellation
      await this.logDataAccess(userId, 'cancel_delete', 'account');

      return { message: 'Demande de suppression annulée avec succès' };
    } catch (error) {
      console.error('Error cancelling account deletion:', error);
      throw error;
    }
  }

  // Process account deletion
  static async processAccountDeletion(userId) {
    try {
      // Get user info for logging
      const user = await get("SELECT email, first_name FROM users WHERE id = ?", [userId]);

      // Delete user data in the correct order (respecting foreign key constraints)
      await run("DELETE FROM data_access_logs WHERE user_id = ?", [userId]);
      await run("DELETE FROM privacy_consents WHERE user_id = ?", [userId]);
      await run("DELETE FROM data_export_requests WHERE user_id = ?", [userId]);
      await run("DELETE FROM user_favorites WHERE user_id = ?", [userId]);
      await run("DELETE FROM user_payment_methods WHERE user_id = ?", [userId]);
      await run("DELETE FROM user_addresses WHERE user_id = ?", [userId]);
      await run("DELETE FROM user_profiles WHERE user_id = ?", [userId]);
      await run("DELETE FROM user_settings WHERE user_id = ?", [userId]);
      await run("DELETE FROM barber_settings WHERE user_id = ?", [userId]);
      await run("DELETE FROM admin_settings WHERE user_id = ?", [userId]);
      await run("DELETE FROM reviews WHERE user_id = ?", [userId]);
      await run("DELETE FROM appointments WHERE client_id = ?", [userId]);
      await run("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
      await run("DELETE FROM otp_codes WHERE user_id = ?", [userId]);
      await run("DELETE FROM login_attempts WHERE email = ?", [user?.email]);
      await run("DELETE FROM users WHERE id = ?", [userId]);

      // Update deletion request status
      await run(
        "UPDATE account_deletion_requests SET status = 'completed', processed_at = CURRENT_TIMESTAMP WHERE user_id = ?",
        [userId]
      );

      console.log(`Account deletion completed for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error processing account deletion:', error);
      throw error;
    }
  }

  // Get user's privacy data
  static async getUserPrivacyData(userId) {
    const exportRequests = await query(
      "SELECT * FROM data_export_requests WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    const deletionRequest = await get(
      "SELECT * FROM account_deletion_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    const consents = await query(
      "SELECT * FROM privacy_consents WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    const accessLogs = await query(
      "SELECT * FROM data_access_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [userId]
    );

    return {
      exportRequests,
      deletionRequest,
      consents,
      accessLogs
    };
  }

  // Update privacy consent
  static async updateConsent(userId, consentType, granted, version, ipAddress = null, userAgent = null) {
    try {
      await run(
        "INSERT INTO privacy_consents (user_id, consent_type, granted, version, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, consentType, granted, version, ipAddress, userAgent]
      );

      // Log the consent change
      await this.logDataAccess(userId, 'consent_change', consentType);

      return { success: true };
    } catch (error) {
      console.error('Error updating consent:', error);
      throw error;
    }
  }

  // Log data access for audit trail
  static async logDataAccess(userId, action, dataType, ipAddress = null, userAgent = null) {
    try {
      await run(
        "INSERT INTO data_access_logs (user_id, action, data_type, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
        [userId, action, dataType, ipAddress, userAgent]
      );
    } catch (error) {
      console.error('Error logging data access:', error);
      // Don't throw error for logging failures
    }
  }

  // Get scheduled deletion requests
  static async getScheduledDeletions() {
    return await query(
      "SELECT * FROM account_deletion_requests WHERE status = 'pending' AND scheduled_for <= datetime('now')"
    );
  }

  // Get expired export requests
  static async getExpiredExports() {
    return await query(
      "SELECT * FROM data_export_requests WHERE status = 'completed' AND expires_at <= datetime('now')"
    );
  }

  // Clean up expired exports
  static async cleanupExpiredExports() {
    try {
      const expiredExports = await this.getExpiredExports();
      
      for (const exportRequest of expiredExports) {
        if (exportRequest.file_path) {
          try {
            await fs.unlink(exportRequest.file_path);
          } catch (error) {
            console.error(`Error deleting file ${exportRequest.file_path}:`, error);
          }
        }
        
        await run(
          "DELETE FROM data_export_requests WHERE id = ?",
          [exportRequest.id]
        );
      }

      return { cleaned: expiredExports.length };
    } catch (error) {
      console.error('Error cleaning up expired exports:', error);
      throw error;
    }
  }

  // Send export notification email
  static async sendExportNotification(email, firstName, fileName) {
    const subject = 'Votre export de données est prêt - ShopTheBarber';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">ShopTheBarber</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre export de données est maintenant prêt et disponible pour téléchargement.</p>
        <p><strong>Fichier :</strong> ${fileName}</p>
        <p>Ce fichier contient toutes les données que vous avez demandées au format JSON.</p>
        <p><strong>Important :</strong> Ce fichier expirera dans 30 jours pour des raisons de sécurité.</p>
        <p>Si vous avez des questions concernant vos données, n'hésitez pas à nous contacter.</p>
        <p>Cordialement,<br>L'équipe ShopTheBarber</p>
      </div>
    `;

    await sendEmail(email, subject, html);
  }

  // Send deletion request notification
  static async sendDeletionRequestNotification(email, firstName, scheduledFor) {
    const subject = 'Demande de suppression de compte confirmée - ShopTheBarber';
    const scheduledDate = new Date(scheduledFor).toLocaleDateString('fr-FR');
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">ShopTheBarber</h2>
        <p>Bonjour ${firstName},</p>
        <p>Nous confirmons votre demande de suppression de compte.</p>
        <p><strong>Date de suppression :</strong> ${scheduledDate}</p>
        <p>Votre compte et toutes vos données personnelles seront définitivement supprimés à cette date.</p>
        <p>Si vous changez d'avis, vous pouvez annuler cette demande en vous connectant à votre compte.</p>
        <p>Cordialement,<br>L'équipe ShopTheBarber</p>
      </div>
    `;

    await sendEmail(email, subject, html);
  }

  // Schedule data export (placeholder for job queue)
  static async scheduleDataExport(exportId) {
    // In a production environment, this would add the job to a queue
    // For now, we'll process it immediately
    setTimeout(() => {
      this.processDataExport(exportId).catch(console.error);
    }, 1000);
  }
} 