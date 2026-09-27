import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCountUp } from '../hooks/useCountUp';
import { getResourceImage } from '../data/resourceImages';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  MapPin,
  IndianRupee,
  Layers,
  ChevronRight,
  X,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

const CATEGORIES = {
  Furniture: ['Chairs', 'Tables', 'Sofas', 'Stools'],
  Dining: ['Plates', 'Glasses', 'Cutlery', 'Serving trays'],
  'Hospitality Equipment': ['Chafing dishes', 'Buffet counters', 'Food warmers', 'Beverage dispensers'],
  'Event Equipment': ['Tents', 'Lighting', 'Speakers', 'Projectors'],
  Linen: ['Tablecloths', 'Napkins', 'Chair covers', 'Bedsheets'],
};

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [availabilityRecords, setAvailabilityRecords] = useState([]);

  // Form states for New / Edit Resource
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Furniture');
  const [subCategory, setSubCategory] = useState('Chairs');
  const [description, setDescription] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(50);
  const [availableQuantity, setAvailableQuantity] = useState(50);
  const [price, setPrice] = useState(30);
  const [condition, setCondition] = useState('Excellent');
  const [location, setLocation] = useState(user?.business?.city || 'Thane');
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [deliveryCharge, setDeliveryCharge] = useState(400);

  // Availability form state
  const [blockDate, setBlockDate] = useState('');
  const [blockQty, setBlockQty] = useState(10);
  const [blockReason, setBlockReason] = useState('Pre-booked for private event');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [invData, bookData] = await Promise.all([
        api.get('/resources/my-inventory'),
        api.get('/bookings').catch(() => []),
      ]);
      setResources(invData);
      setBookings(bookData);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAddModal = () => {
    setIsEditing(false);
    setEditId(null);
    setName('');
    setCategory('Furniture');
    setSubCategory('Chairs');
    setDescription('');
    setTotalQuantity(50);
    setAvailableQuantity(50);
    setPrice(30);
    setCondition('Excellent');
    setLocation(user?.business?.city || 'Thane');
    setDeliveryAvailable(true);
    setDeliveryCharge(400);
    setShowAddModal(true);
  };

  const openEditModal = (r) => {
    setIsEditing(true);
    setEditId(r.id);
    setName(r.name);
    setCategory(r.category);
    setDescription(r.description || '');
    setTotalQuantity(r.total_quantity);
    setAvailableQuantity(r.available_quantity);
    setPrice(r.price);
    setCondition(r.condition);
    setLocation(r.location);
    setDeliveryAvailable(r.delivery_available);
    setDeliveryCharge(r.delivery_charge);
    setShowAddModal(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: name || `${subCategory} - Premium`,
        category,
        description,
        total_quantity: Number(totalQuantity),
        available_quantity: Number(availableQuantity),
        price: Number(price),
        price_unit: 'per_day',
        minimum_rental_period: 1,
        condition,
        location,
        delivery_available: deliveryAvailable,
        delivery_charge: Number(deliveryCharge),
      };

      if (isEditing) {
        await api.put(`/resources/${editId}`, payload);
      } else {
        await api.post('/resources', payload);
      }

      setShowAddModal(false);
      await fetchInventory();
    } catch (err) {
      alert('Error saving resource: ' + err.message);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to remove this resource from your inventory?')) return;
    try {
      await api.delete(`/resources/${id}`);
      await fetchInventory();
    } catch (err) {
      alert('Error deleting resource: ' + err.message);
    }
  };

  const openAvailabilityManager = async (r) => {
    setSelectedResource(r);
    setShowAvailabilityModal(true);
    try {
      const records = await api.get(`/resources/${r.id}/availability`);
      setAvailabilityRecords(records);
    } catch {
      setAvailabilityRecords([]);
    }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    if (!blockDate) return;
    try {
      await api.post(`/resources/${selectedResource.id}/availability`, {
        date: blockDate,
        blocked_quantity: Number(blockQty),
        is_blocked: false,
        reason: blockReason,
      });
      const records = await api.get(`/resources/${selectedResource.id}/availability`);
      setAvailabilityRecords(records);
      setBlockDate('');
    } catch (err) {
      alert('Error adding calendar block: ' + err.message);
    }
  };

  const totalItems = resources.reduce((acc, r) => acc + r.total_quantity, 0);
  const totalAvailable = resources.reduce((acc, r) => acc + r.available_quantity, 0);
  const activeBookingsCount = bookings.filter((b) =>
    ['CONFIRMED', 'FULFILMENT'].includes(b.status)
  ).length;

  // Animated stat values
  const countCatalog = useCountUp(resources.length, 450);
  const countTotal = useCountUp(totalItems, 500);
  const countAvailable = useCountUp(totalAvailable, 500);
  const countActiveBookings = useCountUp(activeBookingsCount, 500);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-body">
      {/* Top Banner / Metrics (Screen 9 in Reference) */}
      <div className="hospix-card p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E7E5DC] pb-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082D46] font-heading tracking-tight">
                {user?.business?.name || 'Provider Inventory Hub'}
              </h1>
              {user?.business?.is_verified ? (
                <span className="text-xs px-2.5 py-0.5 font-bold rounded-md bg-[#E7F4EA] text-[#2F7D4A] border border-[#CDE6D3] flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PAN Verified Provider</span>
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 font-medium rounded-md bg-[#E8F2F6] text-[#082D46]">
                  Active Provider
                </span>
              )}
            </div>
            <p className="text-xs text-[#596B76] flex items-center space-x-2">
              <span>{user?.business?.city || 'Thane'} Hub</span>
              <span>•</span>
              <span className="text-[#2F7D4A] font-semibold">
                {user?.business?.trust_score || 92}% Reliability Rating
              </span>
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="hospix-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>List New Resource</span>
          </button>
        </div>

        {/* Stats Grid (Matches Screen 9) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-[#FCFAF3] p-4.5 rounded-2xl border border-[#E7E5DC] hospix-stat-card animate-fade-in-up stagger-1">
            <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">Catalog Items</div>
            <div className="text-2xl font-extrabold text-[#082D46] font-heading mt-1">{countCatalog} Types</div>
          </div>
          <div className="bg-[#FCFAF3] p-4.5 rounded-2xl border border-[#E7E5DC] hospix-stat-card animate-fade-in-up stagger-2">
            <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">Total Quantity</div>
            <div className="text-2xl font-extrabold text-[#082D46] font-heading mt-1">{countTotal} Units</div>
          </div>
          <div className="bg-[#FCFAF3] p-4.5 rounded-2xl border border-[#E7E5DC] hospix-stat-card animate-fade-in-up stagger-3">
            <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">Available Now</div>
            <div className="text-2xl font-extrabold text-[#2F7D4A] font-heading mt-1">{countAvailable} Units</div>
          </div>
          <div className="bg-[#FCFAF3] p-4.5 rounded-2xl border border-[#E7E5DC] hospix-stat-card animate-fade-in-up stagger-4">
            <div className="text-[10px] font-bold text-[#596B76] uppercase tracking-wider">Active Bookings</div>
            <div className="text-2xl font-extrabold text-[#082D46] font-heading mt-1">{countActiveBookings} Active</div>
            <div className="text-[11px] text-[#596B76] mt-0.5">{bookings.length} Total Bookings</div>
          </div>
        </div>
      </div>

      {/* Resource Inventory Table with Imagery */}
      <div className="hospix-card overflow-hidden">
        <div className="px-6 py-4.5 border-b border-[#E7E5DC] flex justify-between items-center bg-[#FCFAF3]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#082D46] font-heading">
              Inventory & Resource Catalog ({resources.length})
            </h2>
            <p className="text-xs text-[#596B76]">Live resources indexed for single and multi-provider pooled fulfillment</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center space-x-4 p-3 bg-[#FCFAF3] rounded-xl border border-[#E7E5DC]">
                <div className="w-11 h-11 hospix-skeleton rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 hospix-skeleton" />
                  <div className="h-3 w-32 hospix-skeleton" />
                </div>
                <div className="h-6 w-20 hospix-skeleton" />
              </div>
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-[#8A979D] mx-auto" />
            <p className="text-base font-bold text-[#082D46] font-heading">No resources listed yet</p>
            <p className="text-xs text-[#596B76] max-w-sm mx-auto">
              Add your unused chairs, tables, or catering equipment to earn revenue when nearby businesses need them.
            </p>
            <button
              onClick={openAddModal}
              className="hospix-btn-primary px-5 py-2.5 text-xs rounded-xl shadow-xs inline-flex active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Resource</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFAF3] text-[#596B76] text-[10px] font-bold uppercase tracking-wider border-b border-[#E7E5DC]">
                <tr>
                  <th className="px-6 py-3.5">Resource & Category</th>
                  <th className="px-6 py-3.5">Condition</th>
                  <th className="px-6 py-3.5">Live Stock</th>
                  <th className="px-6 py-3.5">Daily Rate</th>
                  <th className="px-6 py-3.5">Delivery</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5DC]">
                {resources.map((r) => {
                  const percentAvailable = r.total_quantity > 0 ? (r.available_quantity / r.total_quantity) * 100 : 0;
                  const itemImg = getResourceImage(r.name || r.category);

                  return (
                    <tr key={r.id} className="hover:bg-[#FCFAF3]/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#E7E5DC] shrink-0">
                            <img
                              src={itemImg}
                              alt={r.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#082D46] text-sm">{r.name}</div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E8F2F6] text-[#082D46] font-semibold">
                                {r.category}
                              </span>
                              <span className="text-[11px] text-[#8A979D]">• {r.location}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            r.condition === 'Excellent'
                              ? 'bg-[#E7F4EA] text-[#2F7D4A] border border-[#CDE6D3]'
                              : 'bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED]'
                          }`}
                        >
                          {r.condition}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-bold font-heading text-sm ${
                              r.available_quantity === 0
                                ? 'text-rose-600 font-extrabold'
                                : r.available_quantity < r.total_quantity
                                ? 'text-[#8C6A00]'
                                : 'text-[#082D46]'
                            }`}
                          >
                            {r.available_quantity}
                          </span>
                          <span className="text-[#8A979D]">/ {r.total_quantity}</span>
                          {r.available_quantity < r.total_quantity && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[#FFF2C7] text-[#8C6A00]">
                              {r.total_quantity - r.available_quantity} booked
                            </span>
                          )}
                        </div>
                        <div className="w-24 bg-[#E7E5DC] h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentAvailable > 50
                                ? 'bg-[#2F7D4A]'
                                : percentAvailable > 0
                                ? 'bg-[#F4D98A]'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${percentAvailable}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#082D46] text-sm">
                          <span>₹{r.price}</span>
                          <span className="text-[11px] text-[#8A979D] font-normal ml-1">/ day</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {r.delivery_available ? (
                          <div className="text-xs text-[#596B76] flex items-center space-x-1">
                            <Truck className="w-3.5 h-3.5 text-[#082D46]" />
                            <span>₹{r.delivery_charge}</span>
                          </div>
                        ) : (
                          <span className="text-[#8A979D]">Pickup only</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            r.available_quantity > 0
                              ? 'bg-[#E7F4EA] text-[#2F7D4A] border border-[#CDE6D3]'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.available_quantity > 0 ? 'bg-[#2F7D4A]' : 'bg-rose-500'
                            }`}
                          />
                          <span>{r.available_quantity === 0 ? 'Reserved' : r.availability}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => openAvailabilityManager(r)}
                            title="Manage calendar availability"
                            className="hospix-icon-btn p-1.5 text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9] rounded-lg"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(r)}
                            title="Edit resource"
                            className="hospix-icon-btn p-1.5 text-[#596B76] hover:text-[#082D46] hover:bg-[#F7F4E9] rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(r.id)}
                            title="Delete resource"
                            className="hospix-icon-btn p-1.5 text-[#8A979D] hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 hospix-modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E7E5DC] w-full max-w-xl max-h-[90vh] overflow-y-auto hospix-modal-dialog">
            <div className="px-6 py-4.5 border-b border-[#E7E5DC] flex justify-between items-center bg-[#FCFAF3]">
              <h3 className="text-base font-bold text-[#082D46] font-heading">
                {isEditing ? 'Edit Inventory Resource' : 'Add New Resource to Inventory'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="hospix-icon-btn text-[#8A979D] hover:text-[#082D46] p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#082D46] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSubCategory(CATEGORIES[e.target.value][0]);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                  >
                    {Object.keys(CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#082D46] mb-1">Type Preset</label>
                  <select
                    value={subCategory}
                    onChange={(e) => {
                      setSubCategory(e.target.value);
                      if (!name) setName(`${e.target.value} - Standard`);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                  >
                    {CATEGORIES[category]?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082D46] mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Banquet Dining Chairs (Maroon Velvet)"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#082D46] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Stackable, sturdy, suitable for luxury weddings and corporate functions."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#082D46] mb-1">Total Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalQuantity}
                    onChange={(e) => {
                      setTotalQuantity(e.target.value);
                      if (!isEditing) setAvailableQuantity(e.target.value);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#082D46] mb-1">Available Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={totalQuantity}
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#082D46] mb-1">Rate (₹/day)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#082D46] mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#082D46] mb-1">Hub Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46]"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FCFAF3] rounded-2xl border border-[#E7E5DC]">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="delivery_check"
                    checked={deliveryAvailable}
                    onChange={(e) => setDeliveryAvailable(e.target.checked)}
                    className="rounded text-[#082D46] focus:ring-[#082D46] h-4 w-4"
                  />
                  <label htmlFor="delivery_check" className="text-xs font-bold text-[#082D46]">
                    Delivery transit supported by provider
                  </label>
                </div>
                {deliveryAvailable && (
                  <div className="mt-2 pl-6">
                    <label className="block text-[11px] text-[#596B76] mb-1">Delivery Charge (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(e.target.value)}
                      className="w-48 px-3 py-1.5 text-xs bg-white border border-[#D9D8CF] rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E7E5DC] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="hospix-btn-secondary px-4 py-2 text-xs rounded-xl active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hospix-btn-primary px-5 py-2 text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all"
                >
                  {isEditing ? 'Save Changes' : 'List Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability / Block Dates Modal */}
      {showAvailabilityModal && selectedResource && (
        <div className="fixed inset-0 z-50 hospix-modal-backdrop flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E7E5DC] w-full max-w-lg overflow-hidden hospix-modal-dialog">
            <div className="px-6 py-4.5 border-b border-[#E7E5DC] flex justify-between items-center bg-[#FCFAF3]">
              <div>
                <h3 className="text-base font-bold text-[#082D46] font-heading">Resource Availability Calendar</h3>
                <p className="text-xs text-[#596B76]">{selectedResource.name}</p>
              </div>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="hospix-icon-btn text-[#8A979D] hover:text-[#082D46] p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <form onSubmit={handleAddBlock} className="p-4 bg-[#FCFAF3] rounded-2xl border border-[#E7E5DC] space-y-3">
                <div className="text-xs font-bold text-[#082D46] uppercase tracking-wide">
                  Block Date or Pre-Reserve Inventory
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#596B76] mb-1 font-semibold">Target Date</label>
                    <input
                      type="date"
                      required
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#596B76] mb-1 font-semibold">Blocked Quantity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={selectedResource.total_quantity}
                      value={blockQty}
                      onChange={(e) => setBlockQty(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[#596B76] mb-1 font-semibold">Reason / Event Note</label>
                  <input
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="e.g. Reserved for local convention"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="hospix-btn-primary w-full py-2 text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all"
                >
                  Confirm Calendar Block
                </button>
              </form>

              <div>
                <div className="text-xs font-bold text-[#082D46] mb-2">Existing Calendar Exceptions:</div>
                {availabilityRecords.length === 0 ? (
                  <p className="text-xs text-[#8A979D] italic">No blocked dates. Resource is fully available on all dates.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {availabilityRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-2.5 bg-[#FCFAF3] border border-[#E7E5DC] rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#082D46]">{rec.date}</span>
                          <span className="text-[#596B76] ml-2">({rec.reason || 'Blocked'})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#FBEAEA] text-rose-800 font-bold">
                          -{rec.blocked_quantity} units
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
