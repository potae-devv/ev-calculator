"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface EVCar {
  id: number;
  name: string;
  batteryCapacityKwh: number;
  kwhPerBaht: number;
  createdAt: string;
}

interface Charge {
  id: number;
  startPct: number;
  endPct: number;
  evCarId: number;
  createdAt: string;
  evCar: {
    id: number;
    name: string;
    batteryCapacityKwh: number;
    kwhPerBaht: number;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [evCars, setEvCars] = useState<EVCar[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

const fetchEVCars = useCallback(async () => {
    try {
      const response = await fetch("/api/ev-cars");
      if (response.ok) {
        const data = await response.json();
        setEvCars(data.evCars.slice(0, 3)); // Show only first 3 cars
      }
    } catch (error) {
      console.error("Failed to fetch EV cars:", error);
    }
  }, []);

  const fetchCharges = useCallback(async () => {
    try {
      const response = await fetch("/api/charges");
      if (response.ok) {
        const data = await response.json();
        setCharges(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch charges:", error);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        await Promise.all([fetchEVCars(), fetchCharges()]);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router, fetchEVCars, fetchCharges]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  



  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const calculateKwhAndBaht = (charge: Charge) => {
    const chargeDifference = charge.endPct - charge.startPct;
    const kwh = (Number(charge.evCar.batteryCapacityKwh) / 100) * chargeDifference;
    const baht = kwh * Number(charge.evCar.kwhPerBaht);
    return { kwh, baht };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-black/[.08] dark:border-white/[.145]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">EV Calculator</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-foreground/60">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-foreground/70 hover:text-foreground 
                         border border-black/[.08] dark:border-white/[.145] rounded-lg 
                         hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] transition-colors w-full sm:w-auto text-center"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-4 sm:p-6 lg:p-8 text-white mb-6 lg:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Welcome to EV Calculator</h2>
          <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
            Manage your electric vehicle collection and calculate costs, range, and efficiency.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6">
            <div className="flex items-center">
              <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">🚗</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">EV Car</h3>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{evCars.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6">
            <div className="flex items-center">
              <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">⚡</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">Total kWh</h3>
                <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">
                  {charges.reduce((sum, charge) => sum + calculateKwhAndBaht(charge).kwh, 0).toFixed(1)} kWh
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">💰</div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">Total Cost</h3>
                <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">
                  ฿{charges.reduce((sum, charge) => sum + calculateKwhAndBaht(charge).baht, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* EV Cars List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">My EV Cars</h3>
            <Link
              href="/ev-cars"
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors font-medium text-xs sm:text-sm w-full sm:w-auto text-center"
            >
              Manage Cars
            </Link>
          </div>

          {evCars.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🚗</div>
              <h4 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No EV cars yet</h4>
              <p className="text-sm sm:text-base text-foreground/60 mb-4 sm:mb-6 px-4">Add your first EV car to get started!</p>
              <Link
                href="/ev-cars"
                className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Add Your First EV Car
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {evCars.map((car) => (
                <div
                  key={car.id}
                  className="bg-gray-50 dark:bg-gray-700 border border-black/[.08] dark:border-white/[.145] 
                           rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-foreground truncate">
                        {car.name}
                      </h4>
                      <span className="text-xs text-foreground/50">
                        EV Car #{car.id}
                      </span>
                    </div>
                    <span className="text-xs text-foreground/50 bg-white dark:bg-gray-600 px-2 py-1 rounded whitespace-nowrap">
                      {new Date(car.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-black/[.08] dark:border-white/[.145]">
                        <span className="text-xs sm:text-sm text-foreground/60">Battery Capacity:</span>
                        <span className="font-semibold text-xs sm:text-sm text-foreground">{car.batteryCapacityKwh} kWh</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 sm:py-2 border-b border-black/[.08] dark:border-white/[.145]">
                        <span className="text-xs sm:text-sm text-foreground/60">kWh per Baht:</span>
                        <span className="font-semibold text-xs sm:text-sm text-foreground">{car.kwhPerBaht} kWh/฿</span>
                      </div>
                    </div>
                    <div className="pt-2 space-y-2">
                      <Link
                        href={`/charges?evCarId=${car.id}`}
                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                                 transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Record Charge
                      </Link>
                      <Link
                        href={`/ev-cars/${car.id}/charges`}
                        className="w-full px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 
                                 dark:hover:bg-blue-900/20 transition-colors font-medium text-xs sm:text-sm flex items-center justify-center gap-2"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        View History
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/ev-cars"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] 
                     dark:border-white/[.145] p-4 sm:p-6 hover:shadow-md transition-shadow group"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🔋</div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 group-hover:text-blue-600 transition-colors">
              Manage Batteries
            </h3>
            <p className="text-xs sm:text-sm text-foreground/60">Add, edit, and view your EV battery configurations</p>
          </Link>

          <Link
            href="/charges"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] 
                     dark:border-white/[.145] p-4 sm:p-6 hover:shadow-md transition-shadow group"
          >
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">⚡</div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1 group-hover:text-blue-600 transition-colors">
              Charging Records
            </h3>
            <p className="text-xs sm:text-sm text-foreground/60">Track your EV charging sessions</p>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] 
                        dark:border-white/[.145] p-4 sm:p-6 opacity-50 cursor-not-allowed">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">💰</div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
              Cost Calculator
            </h3>
            <p className="text-xs sm:text-sm text-foreground/60">Calculate charging costs (Coming Soon)</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] 
                        dark:border-white/[.145] p-4 sm:p-6 opacity-50 cursor-not-allowed">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📍</div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
              Charging Stations
            </h3>
            <p className="text-xs sm:text-sm text-foreground/60">Find nearby charging stations (Coming Soon)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
