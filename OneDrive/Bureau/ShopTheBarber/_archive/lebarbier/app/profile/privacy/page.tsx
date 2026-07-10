import { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import PrivacyControls from '@/components/profile/PrivacyControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Privacy Controls | Le Barbier',
  description: 'Manage your personal data and privacy settings in compliance with GDPR regulations.',
};

/**
 * Privacy Controls Page
 * 
 * Provides a dedicated page for users to manage their privacy settings,
 * including data export and account deletion functionality.
 * 
 * Features:
 * - GDPR-compliant data export
 * - Secure account deletion
 * - Privacy audit logs
 * - Educational privacy information
 */
export default async function PrivacyPage() {
  // Check authentication
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in?redirect=/profile/privacy');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Navigation */}
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Controls</h1>
            <p className="text-muted-foreground">
              Manage your personal data and exercise your privacy rights
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Information Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Your Privacy Rights</CardTitle>
          <CardDescription className="text-blue-700">
            Under GDPR and other privacy regulations, you have the right to:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start space-x-2">
              <span className="font-semibold min-w-0">•</span>
              <span><strong>Access your data:</strong> Request a copy of all personal information we hold about you</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-semibold min-w-0">•</span>
              <span><strong>Data portability:</strong> Receive your data in a structured, machine-readable format</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-semibold min-w-0">•</span>
              <span><strong>Erasure ("Right to be forgotten"):</strong> Request deletion of your personal data</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="font-semibold min-w-0">•</span>
              <span><strong>Transparency:</strong> Understand how your data is processed and stored</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Main Privacy Controls Component */}
      <PrivacyControls />

      {/* Additional Information */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Processing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">What data we collect:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Account information (name, email, phone)</li>
                <li>• Profile data and preferences</li>
                <li>• Booking and appointment history</li>
                <li>• Usage analytics and logs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">How we use your data:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Provide and improve our services</li>
                <li>• Process bookings and payments</li>
                <li>• Send important notifications</li>
                <li>• Ensure platform security</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Security & Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Security measures:</h4>
              <ul className="space-y-1 ml-4">
                <li>• End-to-end encryption in transit</li>
                <li>• Encrypted storage at rest</li>
                <li>• Regular security audits</li>
                <li>• Access controls and monitoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Data retention:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Account data: Until deletion requested</li>
                <li>• Booking history: 7 years (legal requirement)</li>
                <li>• Audit logs: 3 years</li>
                <li>• Analytics: Anonymized after 2 years</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Need Help with Privacy?</CardTitle>
          <CardDescription>
            If you have questions about your privacy rights or need assistance with these controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Contact our Privacy Team:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>📧 Email: privacy@lebarbier.com</li>
                <li>📞 Phone: +1 (555) 123-4567</li>
                <li>📍 Address: 123 Privacy St, Data City, DC 12345</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Response Times:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Data export requests: Within 30 days</li>
                <li>• Account deletion: Within 30 days</li>
                <li>• General inquiries: Within 5 business days</li>
                <li>• Urgent privacy concerns: Within 24 hours</li>
              </ul>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> All privacy requests are logged for compliance purposes. 
              You may also contact your local data protection authority if you have concerns 
              about how we handle your personal data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}