import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/">
              Go home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/search">
              Find Barbers
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 