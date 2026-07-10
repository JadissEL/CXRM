import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

/* ---------- Types & Schemas ---------- */

const bookingConfirmationSchema = z.object({
  appointmentId: z.string().uuid(),
  clientEmail: z.string().email(),
  clientName: z.string().min(1),
  barberName: z.string().min(1),
  appointmentDate: z.string(),
  startTime: z.string(),
  services: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      duration: z.number(),
      price: z.number(),
      category: z.string(),
    })
  ),
  totalPrice: z.number(),
  depositAmount: z.number(),
});

type BookingConfirmationData = z.infer<typeof bookingConfirmationSchema>;

interface EmailService {
  sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void>;
}

/* ---------- Email Service (Replace Mock in Production) ---------- */

class MockEmailService implements EmailService {
  async sendEmail({ to, subject, html }: { to: string; subject: string; html: string; text?: string }) {
    console.log('📧 [MOCK] Email sent:', { to, subject, preview: html.substring(0, 100) + '...' });
  }
}

const emailService: EmailService = new MockEmailService();

/* ---------- Utils ---------- */

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/* ---------- Email Content Generators ---------- */

function generateEmailHTML(data: BookingConfirmationData): string {
  const totalDuration = data.services.reduce((sum, service) => sum + service.duration, 0);
  const remainingBalance = data.totalPrice - data.depositAmount;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e9ecef;
            }
            .success-icon {
                width: 60px;
                height: 60px;
                background-color: #28a745;
                border-radius: 50%;
                margin: 0 auto 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
            }
            .title {
                color: #28a745;
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .subtitle {
                color: #6c757d;
                margin: 5px 0 0;
                font-size: 16px;
            }
            .confirmation-id {
                background-color: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
                margin: 20px 0;
                font-family: monospace;
                font-size: 14px;
                color: #495057;
            }
            .section {
                margin: 25px 0;
                padding: 20px;
                background-color: #f8f9fa;
                border-radius: 6px;
            }
            .section-title {
                font-size: 18px;
                font-weight: bold;
                margin: 0 0 15px;
                color: #495057;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                padding: 8px 0;
            }
            .detail-label {
                font-weight: 600;
                color: #495057;
            }
            .detail-value {
                color: #212529;
            }
            .service-item {
                background-color: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 6px;
                border-left: 4px solid #007bff;
            }
            .service-name {
                font-weight: bold;
                color: #212529;
                margin-bottom: 5px;
            }
            .service-details {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 8px;
            }
            .service-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
            }
            .service-category {
                background-color: #e9ecef;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                color: #495057;
            }
            .price-summary {
                background-color: #e8f5e8;
                padding: 20px;
                border-radius: 6px;
                margin: 20px 0;
            }
            .price-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
            }
            .total-row {
                font-weight: bold;
                font-size: 18px;
                padding-top: 10px;
                border-top: 2px solid #28a745;
                margin-top: 10px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                color: #6c757d;
                font-size: 14px;
            }
            .button {
                display: inline-block;
                background-color: #007bff;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 10px 5px;
            }
            .button:hover {
                background-color: #0056b3;
            }
            @media (max-width: 600px) {
                .detail-row {
                    flex-direction: column;
                }
                .service-meta {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="success-icon">✓</div>
                <h1 class="title">Booking Confirmed!</h1>
                <p class="subtitle">Your appointment has been successfully scheduled</p>
            </div>

            <div class="confirmation-id">
                <strong>Confirmation ID:</strong> ${data.appointmentId}
            </div>

            <div class="section">
                <h2 class="section-title">📅 Appointment Details</h2>
                <div class="detail-row">
                    <span class="detail-label">Barber:</span>
                    <span class="detail-value">${data.barberName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formatDate(data.appointmentDate)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${formatTime(data.startTime)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Duration:</span>
                    <span class="detail-value">${formatDuration(totalDuration)}</span>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">✂️ Services Booked</h2>
                ${data.services.map(service => `
                    <div class="service-item">
                        <div class="service-name">${service.name}</div>
                        <div class="service-details">${service.description}</div>
                        <div class="service-meta">
                            <div>
                                <span class="service-category">${service.category}</span>
                                <span style="margin-left: 10px; color: #6c757d;">${formatDuration(service.duration)}</span>
                            </div>
                            <div style="font-weight: bold; color: #28a745;">$${service.price.toFixed(2)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="price-summary">
                <h2 class="section-title">💰 Pricing Summary</h2>
                <div class="price-row">
                    <span>Subtotal:</span>
                    <span>$${data.totalPrice.toFixed(2)}</span>
                </div>
                <div class="price-row" style="color: #28a745;">
                    <span>Deposit Paid:</span>
                    <span>$${data.depositAmount.toFixed(2)}</span>
                </div>
                <div class="price-row total-row">
                    <span>Remaining Balance:</span>
                    <span>$${remainingBalance.toFixed(2)}</span>
                </div>
                <div class="price-row total-row" style="color: #28a745;">
                    <span>Total:</span>
                    <span>$${data.totalPrice.toFixed(2)}</span>
                </div>
            </div>

            <div class="section">
                <h2 class="section-title">📋 Important Information</h2>
                <ul style="margin: 0; padding-left: 20px; color: #495057;">
                    <li>Please arrive 10 minutes before your appointment time</li>
                    <li>Bring a valid ID for verification</li>
                    <li>The remaining balance of $${remainingBalance.toFixed(2)} is due at the time of service</li>
                    <li>Cancellations must be made at least 24 hours in advance</li>
                    <li>Late arrivals may result in shortened service time or rescheduling</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">View Appointment</a>
                <a href="#" class="button" style="background-color: #28a745;">Reschedule</a>
            </div>

            <div class="footer">
                <p>Thank you for choosing our services!</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p style="margin-top: 15px; font-size: 12px; color: #adb5bd;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateEmailText(data: BookingConfirmationData): string {
  const totalDuration = data.services.reduce((sum, service) => sum + service.duration, 0);
  const remainingBalance = data.totalPrice - data.depositAmount;

  return `
BOOKING CONFIRMATION
====================

Dear ${data.clientName},

Your appointment has been successfully confirmed!

Confirmation ID: ${data.appointmentId}

APPOINTMENT DETAILS
-------------------
Barber: ${data.barberName}
Date: ${formatDate(data.appointmentDate)}
Time: ${formatTime(data.startTime)}
Total Duration: ${formatDuration(totalDuration)}

SERVICES BOOKED
---------------
${data.services.map(service => 
  `• ${service.name} (${service.category})\n  ${service.description}\n  Duration: ${formatDuration(service.duration)} | Price: $${service.price.toFixed(2)}\n`
).join('\n')}

PRICING SUMMARY
---------------
Subtotal: $${data.totalPrice.toFixed(2)}
Deposit Paid: $${data.depositAmount.toFixed(2)}
Remaining Balance: $${remainingBalance.toFixed(2)}
Total: $${data.totalPrice.toFixed(2)}

IMPORTANT INFORMATION
---------------------
• Please arrive 10 minutes before your appointment time
• Bring a valid ID for verification
• The remaining balance of $${remainingBalance.toFixed(2)} is due at the time of service
• Cancellations must be made at least 24 hours in advance
• Late arrivals may result in shortened service time or rescheduling

Thank you for choosing our services!

If you have any questions, please don't hesitate to contact us.
  `.trim();
}

/* ---------- Handlers ---------- */

// POST: Send booking confirmation email
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validatedData = bookingConfirmationSchema.parse(body);

    // Supabase: Appointment ownership check
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, client_id')
      .eq('id', validatedData.appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Compose & Send email
    const emailHTML = generateEmailHTML(validatedData);
    const emailText = generateEmailText(validatedData);

    await emailService.sendEmail({
      to: validatedData.clientEmail,
      subject: `Booking Confirmation - ${formatDate(validatedData.appointmentDate)} at ${formatTime(validatedData.startTime)}`,
      html: emailHTML,
      text: emailText,
    });

    // Log notification
    const { error: logError } = await supabase.from('notifications').insert({
      user_id: userId,
      type: 'booking_confirmation',
      title: 'Booking Confirmation Sent',
      message: `Confirmation email sent for appointment ${validatedData.appointmentId}`,
      data: {
        appointment_id: validatedData.appointmentId,
        email_sent_to: validatedData.clientEmail,
        services_count: validatedData.services.length,
        total_price: validatedData.totalPrice,
      },
      is_read: false,
    });

    if (logError) console.warn('Notification logging error:', logError);

    return NextResponse.json({
      success: true,
      message: 'Booking confirmation sent successfully',
      emailSent: true,
    });
  } catch (error) {
    console.error('Booking confirmation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send booking confirmation' }, { status: 500 });
  }
}

// GET: Fetch notification template meta
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({
      templates: {
        booking_confirmation: {
          name: 'Booking Confirmation',
          description: 'Sent when a new appointment is booked',
          supports_html: true,
          supports_sms: false,
        },
      },
      settings: {
        auto_send: true,
        include_services_details: true,
        include_pricing_breakdown: true,
        include_cancellation_policy: true,
      },
    });
  } catch (error) {
    console.error('Notification template fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}
