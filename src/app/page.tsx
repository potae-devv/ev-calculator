"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify");
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard");
        }
      } catch (error) {
        // User is not authenticated, stay on landing page
        console.error("Error checking authentication:", error);
        console.log("User not authenticated");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-black/[.08] dark:border-white/[.145]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">EV Calculator</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground transition-colors text-center"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                         transition-colors font-medium text-xs sm:text-sm text-center flex-1 sm:flex-none"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <div className="text-4xl sm:text-5xl lg:text-6xl mb-6 sm:mb-8">⚡🚗</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            EV Calculator
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground/70 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Track your EV cars, record charging sessions, and monitor your electric vehicle usage. 
            Simple tools for EV owners.
          </p>
          
          <div className="flex gap-3 sm:gap-4 justify-center flex-col sm:flex-row max-w-sm sm:max-w-md mx-auto">
            <Link
              href="/login"
              className="px-6 py-2.5 sm:px-8 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors font-medium text-base sm:text-lg"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="px-6 py-2.5 sm:px-8 sm:py-3 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                       bg-background text-foreground hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]
                       transition-colors font-medium text-base sm:text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-20 sm:mt-24 lg:mt-32">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Simple EV Management
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-foreground/70 max-w-2xl mx-auto px-4">
              Essential tools to track your electric vehicles and charging sessions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-6 sm:p-8 text-center sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">🚗</div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">EV Car Management</h3>
              <p className="text-sm sm:text-base text-foreground/70">
                Add and manage your electric vehicles with battery capacity and electricity rates. Keep all your EVs organized in one place.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-6 sm:p-8 text-center">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">⚡</div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">Charging Records</h3>
              <p className="text-sm sm:text-base text-foreground/70">
                Track charging sessions with start/end battery percentages. Automatically calculate energy used and costs.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-6 sm:p-8 text-center sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">Usage Analytics</h3>
              <p className="text-sm sm:text-base text-foreground/70">
                View charging history, total energy consumption, and cost analysis for each of your electric vehicles.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 sm:mt-24 lg:mt-32 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-black/[.08] dark:border-white/[.145] p-6 sm:p-8 lg:p-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
              Ready to track your EV charging?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-foreground/70 mb-6 sm:mb-8 px-4">
              Start recording your charging sessions and monitoring your electric vehicle usage.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-2.5 sm:px-8 sm:py-3 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 transition-colors font-medium text-base sm:text-lg"
            >
              Start Tracking Your EVs
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-black/[.08] dark:border-white/[.145] mt-20 sm:mt-24 lg:mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-foreground/60">
            <p className="text-sm sm:text-base">&copy; 2024 EV Calculator. Built with Next.js and Prisma.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
