"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

interface Charge {
  id: number;
  startPct: number;
  endPct: number;
  createdAt: string;
  evCar: {
    id: number;
    name: string;
    userId: number;
    batteryCapacityKwh: number;
    kwhPerBaht: number;
  };
}

interface EVCar {
  id: number;
  name: string;
  batteryCapacityKwh: number;
  kwhPerBaht: number;
}



export default function EVCarCharges() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [evCar, setEvCar] = useState<EVCar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const router = useRouter();
  const params = useParams();
  const evCarId = params.id as string;



  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify");
      if (!response.ok) {
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    }
  }, [router]);

  const fetchCharges = useCallback(async () => {
    try {
      // Build query parameters for date filtering
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      let url = `/api/ev-cars/${evCarId}/charges`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setCharges(data.data);
        setEvCar(data.evCar);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch charging records");
      }
    } catch (error) {
      console.error("Error fetching charging records:", error);
      setError("Network error while fetching charging records");
    } finally {
      setLoading(false);
    }
  }, [evCarId, startDate, endDate]);

  useEffect(() => {
    checkAuth();
    fetchCharges();
  }, [evCarId, checkAuth, fetchCharges]);

  const handleDeleteCharge = async (chargeId: number) => {
    if (!confirm("Are you sure you want to delete this charging record?")) return;

    try {
      const response = await fetch(`/api/charges/${chargeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCharges();
      } else {
        setError("Failed to delete charging record");
      }
    } catch (error) {
      console.error("Error deleting charging record:", error);
      setError("Network error while deleting charging record");
    }
  };

  const calculateKwhAndBaht = (charge: Charge) => {
    const chargeDifference = charge.endPct - charge.startPct;
    const kwh = (Number(charge.evCar.batteryCapacityKwh) / 100) * chargeDifference;
    const baht = kwh * Number(charge.evCar.kwhPerBaht);
    return { kwh, baht };
  };

  const calculateTotals = () => {
    return charges.reduce(
      (totals, charge) => {
        const { kwh, baht } = calculateKwhAndBaht(charge);
        return {
          totalKwh: totals.totalKwh + kwh,
          totalCost: totals.totalCost + baht,
          totalSessions: totals.totalSessions + 1,
        };
      },
      { totalKwh: 0, totalCost: 0, totalSessions: 0 }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⚡</div>
          <p className="text-foreground/60">Loading charging records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
          <p className="text-foreground/60 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Charging History
            </h1>
            <p className="text-sm sm:text-base text-foreground/60 mt-1 sm:mt-2">
              {evCar?.name} • {charges.length} charging sessions
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-3 py-1.5 sm:px-4 sm:py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                       bg-background text-foreground hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]
                       transition-colors text-sm sm:text-base text-center"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push(`/charges?evCarId=${evCarId}`)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                       transition-colors font-medium text-sm sm:text-base text-center"
            >
              Add New Charge
            </button>
          </div>
        </div>

        {/* Date Filters */}
        {charges.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6 mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Filter by Date</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-foreground rounded-lg 
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {charges.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6">
              <div className="flex items-center">
                <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">⚡</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">Total Energy</h3>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{totals.totalKwh.toFixed(1)} kWh</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6">
              <div className="flex items-center">
                <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">💰</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">Total Cost</h3>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">฿{totals.totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">📊</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-lg font-semibold text-foreground truncate">Avg Cost/kWh</h3>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">
                    ฿{totals.totalKwh > 0 ? (totals.totalCost / totals.totalKwh).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charging Records Table */}
        {charges.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-4">⚡</div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              No charging records found
            </h3>
            <p className="text-sm sm:text-base text-foreground/60 mb-4 px-4">
              {startDate || endDate 
                ? "No charging records found for the selected date range. Try adjusting your date filters."
                : `Start tracking charging sessions for ${evCar?.name}!`
              }
            </p>
            {charges.length === 0 && !startDate && !endDate && (
              <button
                onClick={() => router.push(`/charges?evCarId=${evCarId}`)}
                className="px-4 py-2 sm:px-6 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-colors font-medium text-sm sm:text-base"
              >
                Add First Charging Record
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145] overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Battery %
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Energy (kWh)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cost (฿)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rate (฿/kWh)
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {charges.map((charge) => {
                    const { kwh, baht } = calculateKwhAndBaht(charge);
                    return (
                      <tr key={charge.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-lg mr-3">⚡</div>
                            <div className="text-sm font-medium text-foreground">#{charge.id}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {new Date(charge.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-foreground/60">
                            {new Date(charge.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">
                            {charge.startPct}% → {charge.endPct}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">
                            {kwh.toFixed(2)} kWh
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">
                            ฿{baht.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">
                            ฿{(baht / kwh).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteCharge(charge.id)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-black/[.08] dark:divide-white/[.145]">
              {charges.map((charge) => {
                const { kwh, baht } = calculateKwhAndBaht(charge);
                return (
                  <div
                    key={charge.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-lg">⚡</div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            Session #{charge.id}
                          </h3>
                          <p className="text-sm text-foreground/60">
                            {new Date(charge.createdAt).toLocaleDateString()} • {new Date(charge.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCharge(charge.id)}
                        className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">{charge.startPct}% → {charge.endPct}%</div>
                        <div className="text-xs text-foreground/60">Battery</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{kwh.toFixed(2)} kWh</div>
                        <div className="text-xs text-foreground/60">Energy</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-600">฿{baht.toFixed(2)}</div>
                        <div className="text-xs text-foreground/60">Cost</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          ฿{(baht / kwh).toFixed(2)}/kWh
                        </div>
                        <div className="text-xs text-foreground/60">Rate</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
