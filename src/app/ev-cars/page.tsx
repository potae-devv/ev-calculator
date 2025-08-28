"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface EVCar {
  id: number;
  name: string;
  batteryCapacityKwh: number;
  kwhPerBaht: number;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}



export default function EVCarsPage() {
  const [evCars, setEvCars] = useState<EVCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCar, setEditingCar] = useState<EVCar | null>(null);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    batteryCapacityKwh: "",
    kwhPerBaht: "",
  });

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/verify");
      if (response.ok) {
        console.log("Auth check successful");
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
    fetchEVCars();
  }, [checkAuth]);

  const fetchEVCars = async () => {
    try {
      const response = await fetch("/api/ev-cars");
      if (response.ok) {
        const data = await response.json();
        setEvCars(data.evCars);
      } else {
        setError("Failed to fetch EV cars");
      }
    } catch (error) {
      console.error("Error fetching EV cars:", error);
      setError("Network error while fetching EV cars");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const submitData = {
        name: formData.name,
        batteryCapacityKwh: parseFloat(formData.batteryCapacityKwh),
        kwhPerBaht: parseFloat(formData.kwhPerBaht),
      };

      const url = editingCar ? `/api/ev-cars/${editingCar.id}` : "/api/ev-cars";
      const method = editingCar ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchEVCars();
        setShowAddForm(false);
        setEditingCar(null);
        resetForm();
      } else {
        setError(data.error || "Failed to save EV car");
      }
    } catch (error) {
      console.error("Error saving EV car:", error);
      setError("Network error while saving EV car");
    }
  };

  const handleEdit = (car: EVCar) => {
    setEditingCar(car);
    setFormData({
      name: car.name,
      batteryCapacityKwh: car.batteryCapacityKwh.toString(),
      kwhPerBaht: car.kwhPerBaht.toString(),
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this EV car?")) return;

    try {
      const response = await fetch(`/api/ev-cars/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchEVCars();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete EV car");
      }
    } catch (error) {
      console.error("Error deleting EV car:", error);
      setError("Network error while deleting EV car");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      batteryCapacityKwh: "",
      kwhPerBaht: "",
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCar(null);
    resetForm();
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading EV cars...</p>
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
              My EV Cars
            </h1>
            <p className="text-sm sm:text-base text-foreground/60 mt-1 sm:mt-2">
              Manage your electric vehicle collection
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
              Add EV Car
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
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">
              {editingCar ? "Edit EV Car" : "Add New EV Car"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  EV Car Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground placeholder-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="My Tesla Model 3"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Give your EV car a memorable name
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Battery Capacity (kWh) *
                </label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="300"
                  value={formData.batteryCapacityKwh}
                  onChange={(e) => setFormData({ ...formData, batteryCapacityKwh: e.target.value })}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground placeholder-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="75.0"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Total battery capacity of your EV in kilowatt-hours
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  kWh per Baht *
                </label>
                <input
                  type="number"
                  required
                  step="0.0001"
                  min="0"
                  max="100"
                  value={formData.kwhPerBaht}
                  onChange={(e) => setFormData({ ...formData, kwhPerBaht: e.target.value })}
                  className="w-full px-3 py-2 border border-black/[.08] dark:border-white/[.145] rounded-lg 
                           bg-background text-foreground placeholder-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="0.2500"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  How many kWh you get per 1 Thai Baht (electricity rate)
                </p>
              </div>

              <div className="lg:col-span-3 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           transition-colors font-medium text-sm sm:text-base"
                >
                  {editingCar ? "Update EV Car" : "Add EV Car"}
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

        {/* EV Cars Grid */}
        {evCars.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="text-4xl sm:text-6xl mb-4">🚗</div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No EV batteries yet</h3>
            <p className="text-sm sm:text-base text-foreground/60 mb-4 px-4">Add your first EV battery configuration to get started!</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors font-medium text-sm sm:text-base"
            >
              Add Your First Battery
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-black/[.08] dark:border-white/[.145]">
            <div className="divide-y divide-black/[.08] dark:divide-white/[.145]">
              {evCars.map((car) => (
                <div
                  key={car.id}
                  className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-xl sm:text-2xl">🚗</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                            {car.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-foreground/60">
                            EV Car #{car.id} • Added {new Date(car.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
                      <div className="flex gap-4 sm:gap-6">
                        <div className="text-center">
                          <div className="text-xs sm:text-sm font-medium text-foreground">{car.batteryCapacityKwh} kWh</div>
                          <div className="text-xs text-foreground/60">Battery</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs sm:text-sm font-medium text-foreground">{car.kwhPerBaht} kWh/฿</div>
                          <div className="text-xs text-foreground/60">Rate</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-auto sm:ml-0">
                        <button
                          onClick={() => handleEdit(car)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(car.id)}
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
      </div>
    </div>
  );
}
