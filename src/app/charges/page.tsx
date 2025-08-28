"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  createdAt: string;
}

function ChargingRecords() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [evCars, setEvCars] = useState<EVCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCharge, setEditingCharge] = useState<Charge | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [formData, setFormData] = useState({
    evCarId: "",
    startPct: "",
    endPct: "",
  });

  

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
      const response = await fetch("/api/charges");
      if (response.ok) {
        const data = await response.json();
        setCharges(data.data);
      } else {
        setError("Failed to fetch charging records");
      }
    } catch (error) {
      console.error("Error fetching charging records:", error);
      setError("Network error while fetching charging records");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEvCars = useCallback(async () => {
    try {
      const response = await fetch("/api/ev-cars");
      if (response.ok) {
        const data = await response.json();
        setEvCars(data.evCars);
      }
    } catch (error) {
      console.error("Error fetching EV cars:", error);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchCharges();
    fetchEvCars();
    
    // Check if evCarId is provided in URL
    const evCarId = searchParams.get('evCarId');
    if (evCarId) {
      setFormData(prev => ({ ...prev, evCarId }));
      setShowAddForm(true);
    }
  }, [searchParams, checkAuth, fetchCharges, fetchEvCars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const submitData = {
        evCarId: parseInt(formData.evCarId),
        startPct: parseInt(formData.startPct),
        endPct: parseInt(formData.endPct),
      };

      const url = editingCharge ? `/api/charges/${editingCharge.id}` : "/api/charges";
      const method = editingCharge ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        // If adding a new charge (not editing), redirect to the EV car's charges history
        if (!editingCharge && formData.evCarId) {
          router.push(`/ev-cars/${formData.evCarId}/charges`);
          return;
        }
        
        // If editing, stay on current page and refresh
        await fetchCharges();
        setShowAddForm(false);
        setEditingCharge(null);
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save charging record");
      }
    } catch (error) {
      console.error("Error saving charging record:", error);
      setError("Network error while saving charging record");
    }
  };

  const handleEdit = (charge: Charge) => {
    setEditingCharge(charge);
    setFormData({
      evCarId: charge.evCar.id.toString(),
      startPct: charge.startPct.toString(),
      endPct: charge.endPct.toString(),
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this charging record?")) return;

    try {
      const response = await fetch(`/api/charges/${id}`, {
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

  const resetForm = () => {
    setFormData({
      evCarId: "",
      startPct: "",
      endPct: "",
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCharge(null);
    resetForm();
    setError("");
    // Clear URL parameter
    router.push('/charges');
  };

  const getSelectedCarName = () => {
    const selectedCar = evCars.find(car => car.id.toString() === formData.evCarId);
    return selectedCar?.name || '';
  };

  const calculateKwhAndBaht = (charge: Charge) => {
    const chargeDifference = charge.endPct - charge.startPct;
    const kwh = (Number(charge.evCar.batteryCapacityKwh) / 100) * chargeDifference;
    const baht = kwh * Number(charge.evCar.kwhPerBaht);
    return { kwh: kwh.toFixed(2), baht: baht.toFixed(2) };
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



  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 lg:mb-8 gap-4 sm:gap-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Charging Records
            </h1>
            <p className="text-sm sm:text-base text-foreground/60 mt-1 sm:mt-2">
              Track your EV charging sessions
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
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors font-medium text-sm sm:text-base text-center"
            >
              Add Charging Record
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                        text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-black/[.08] 
                        dark:border-white/[.145] p-4 sm:p-6 mb-6 lg:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {editingCharge ? "Edit Charging Record" : "Add New Charging Record"}
            </h2>
            {formData.evCarId && !editingCharge && (
              <p className="text-sm sm:text-base text-foreground/60 mb-4">
                Recording charge for: <span className="font-medium text-foreground">{getSelectedCarName()}</span>
              </p>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  EV Car *
                </label>
                <select
                  required
                  value={formData.evCarId}
                  onChange={(e) => setFormData({ ...formData, evCarId: e.target.value })}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="">Select an EV car</option>
                  {evCars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start (%) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.startPct}
                  onChange={(e) => setFormData({ ...formData, startPct: e.target.value })}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground placeholder-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="20"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Battery percentage when charging started
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End (%) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.endPct}
                  onChange={(e) => setFormData({ ...formData, endPct: e.target.value })}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground placeholder-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="80"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Battery percentage when charging finished
                </p>
              </div>

              <div className="md:col-span-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    💡 Auto-Calculation
                  </h4>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    kWh and cost will be automatically calculated based on your EV car&apos;s battery capacity and electricity rate.
                  </p>
                </div>
              </div>

              <div className="md:col-span-3 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors font-medium text-sm sm:text-base"
                >
                  {editingCharge ? "Update Record" : "Add Record"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 sm:px-6 sm:py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]
                           transition-colors font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Charging Records Grid - Only show if no specific car is selected */}
        {!formData.evCarId && !showAddForm && (
          <>
            {charges.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-4">⚡</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No charging records yet</h3>
                <p className="text-sm sm:text-base text-foreground/60 mb-4 px-4">Start tracking your EV charging sessions!</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors font-medium text-sm sm:text-base"
                >
                  Add Your First Charging Record
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145]">
                <div className="divide-y divide-black/[.08] dark:divide-white/[.145]">
                  {charges.map((charge) => (
                    <div
                      key={charge.id}
                      className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-xl sm:text-2xl">⚡</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                                {charge.evCar.name}
                              </h3>
                              <p className="text-xs sm:text-sm text-foreground/60">
                                {new Date(charge.createdAt).toLocaleDateString()} • {new Date(charge.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
                          <div className="flex gap-4 sm:gap-6">
                            <div className="text-center">
                              <div className="text-xs sm:text-sm font-medium text-foreground">{charge.startPct}% → {charge.endPct}%</div>
                              <div className="text-xs text-foreground/60">Battery</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs sm:text-sm font-medium text-foreground">{calculateKwhAndBaht(charge).kwh} kWh</div>
                              <div className="text-xs text-foreground/60">Energy</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs sm:text-sm font-medium text-green-600">฿{calculateKwhAndBaht(charge).baht}</div>
                              <div className="text-xs text-foreground/60">Cost</div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-auto sm:ml-0">
                            <button
                              onClick={() => handleEdit(charge)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(charge.id)}
                              className="p-1.5 text-gray-600 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Message when evCarId is provided but form is not shown */}
        {formData.evCarId && !showAddForm && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-4">⚡</div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Ready to record charge</h3>
            <p className="text-sm sm:text-base text-foreground/60 mb-4 px-4">
              Add a new charging session for <span className="font-medium text-foreground">{getSelectedCarName()}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 sm:px-6 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                         transition-colors font-medium text-sm sm:text-base"
              >
                Record Charge
              </button>
              <button
                onClick={() => router.push(`/ev-cars/${formData.evCarId}/charges`)}
                className="px-4 py-2 sm:px-6 sm:py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 
                         dark:hover:bg-blue-900/20 transition-colors font-medium text-sm sm:text-base"
              >
                View Charge History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ChargingRecordsLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-foreground/60">Loading charging records...</p>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
export default function ChargingRecordsPage() {
  return (
    <Suspense fallback={<ChargingRecordsLoading />}>
      <ChargingRecords />
    </Suspense>
  );
}
