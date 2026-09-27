import React, { useState } from 'react';
import { api } from '../services/api';
import { getResourceImage } from '../data/resourceImages';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  Truck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  Check
} from 'lucide-react';

const SAMPLE_PROMPTS = [
  'Need 200 chairs and 20 tables for a wedding in Thane tomorrow, budget 15,000',
  'Need 15 chafing dishes and 40 tablecloths for a banquet in Mulund tomorrow, budget 8,000',
  'Need 80 chairs and 10 tables for a corporate seminar in Navi Mumbai tomorrow, budget 10,000',
];

const QUICK_CATEGORIES = [
  { label: 'Chairs', value: 'chairs' },
  { label: 'Tables', value: 'tables' },
  { label: 'Chafing Dishes', value: 'chafing dishes' },
  { label: 'Plates', value: 'plates' },
  { label: 'Lighting', value: 'lighting' },
  { label: 'Tablecloths', value: 'tablecloths' },
];

export const SeekerRequirementCreator = ({ onRequirementCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedData, setParsedData] = useState(null);

  // Form states (editable after parsing or manual creation)
  const [items, setItems] = useState([
    { resource_type: 'chairs', quantity: 200 },
    { resource_type: 'tables', quantity: 20 },
  ]);
  const [city, setCity] = useState('Thane');
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('23:00');
  const [budget, setBudget] = useState(15000);
  const [deliveryRequired, setDeliveryRequired] = useState(true);
  const [eventType, setEventType] = useState('wedding');

  const handleParse = async (textToParse = prompt) => {
    if (!textToParse.trim()) return;
    setParsing(true);
    setParseError('');
    try {
      const res = await api.post('/ai/parse-requirement', { prompt: textToParse });
      setParsedData(res);

      // Hydrate form fields for user review and edit
      if (res.items && Array.isArray(res.items)) {
        setItems(res.items);
      }
      if (res.location?.city) {
        setCity(res.location.city);
      }
      if (res.date) {
        setEventDate(res.date);
      }
      if (res.start_time) setStartTime(res.start_time);
      if (res.end_time) setEndTime(res.end_time);
      if (res.budget) setBudget(res.budget);
      if (res.delivery_required !== undefined) setDeliveryRequired(res.delivery_required);
      if (res.event_type) setEventType(res.event_type);
    } catch (err) {
      setParseError(err.message || 'AI parsing failed. Please verify details manually.');
    } finally {
      setParsing(false);
    }
  };

  const handleAddItem = (type = 'chairs', defaultQty = 50) => {
    setItems([...items, { resource_type: type, quantity: defaultQty }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'quantity' ? Number(value) : value;
    setItems(updated);
  };

  const handleSubmitRequirement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: `Need ${items.map((i) => `${i.quantity} ${i.resource_type}`).join(' & ')} for ${eventType} in ${city}`,
        event_type: eventType,
        location_city: city,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        budget: Number(budget),
        delivery_required: deliveryRequired,
        raw_prompt: prompt,
        items: items.map((i) => ({
          resource_type: i.resource_type.toLowerCase().trim(),
          quantity: Number(i.quantity),
        })),
      };

      const created = await api.post('/requirements', payload);
      setSubmittedSuccess(true);
      setTimeout(() => {
        if (onRequirementCreated) {
          onRequirementCreated(created);
        }
      }, 500);
    } catch (err) {
      alert('Error creating requirement: ' + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-body">
      {/* Header & Stepper */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED]">
              Requirement-First AI Engine
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082D46] mt-2 font-heading tracking-tight">
              Tell Us What You Need
            </h1>
            <p className="text-sm text-[#596B76] mt-1">
              Fill in the details or describe naturally using AI. We’ll coordinate local single & pooled inventory.
            </p>
          </div>
        </div>

        {/* Stepper Bar (Matches Reference Screen 6) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <div className="bg-white p-3 rounded-xl border border-[#082D46] shadow-xs flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-[#082D46] text-white flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div className="text-xs font-bold text-[#082D46]">Requirement Details</div>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-[#E7E5DC] flex items-center space-x-2.5 text-[#596B76]">
            <div className="w-6 h-6 rounded-full bg-[#F7F4E9] text-[#596B76] flex items-center justify-center text-xs font-semibold">
              2
            </div>
            <div className="text-xs font-medium">Location & Timing</div>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-[#E7E5DC] flex items-center space-x-2.5 text-[#596B76]">
            <div className="w-6 h-6 rounded-full bg-[#F7F4E9] text-[#596B76] flex items-center justify-center text-xs font-semibold">
              3
            </div>
            <div className="text-xs font-medium">Budget & Logistics</div>
          </div>
          <div className="bg-white/70 p-3 rounded-xl border border-[#E7E5DC] flex items-center space-x-2.5 text-[#596B76]">
            <div className="w-6 h-6 rounded-full bg-[#F7F4E9] text-[#596B76] flex items-center justify-center text-xs font-semibold">
              4
            </div>
            <div className="text-xs font-medium">Review & Match</div>
          </div>
        </div>
      </div>

      {/* AI Prompt Input Box */}
      <div className="hospix-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#E8F2F6] flex items-center justify-center text-[#082D46]">
              <Sparkles className="w-4.5 h-4.5 text-[#082D46]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#082D46] font-heading">
                Natural Language AI Parser
              </h2>
              <span className="text-[11px] text-[#8A979D]">Powered by Gemini + Smart Deterministic Extraction</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={parsing}
            placeholder="Need 200 banquet chairs and 20 round tables for a wedding reception in Thane West on 25 September. Budget 15,000, delivery preferred."
            className="w-full p-4 text-sm sm:text-base bg-[#FCFAF3] border border-[#D9D8CF] rounded-2xl focus:outline-hidden focus:border-[#082D46] focus:bg-white text-[#092C43] resize-none font-medium leading-relaxed transition-all"
          />
          {parsing && (
            <div className="absolute inset-0 bg-[#FCFAF3]/90 backdrop-blur-2xs rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 animate-fade-in">
              <div className="flex items-center space-x-2 text-[#082D46] font-bold text-sm font-heading">
                <Sparkles className="w-5 h-5 text-[#8C6A00] animate-spin" />
                <span>Understanding your hospitality requirement...</span>
              </div>
              <p className="text-xs text-[#596B76] text-center max-w-sm">
                Extracting equipment categories, quantities, event dates, and budget parameters.
              </p>
              <div className="w-36 h-1 bg-[#E7E5DC] rounded-full overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 bg-[#082D46] w-full animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Sample chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-[#596B76] font-medium">Try Sample:</span>
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrompt(p);
                handleParse(p);
              }}
              className="text-xs px-3 py-1.5 bg-[#F7F4E9] hover:bg-[#082D46] hover:text-white text-[#082D46] rounded-xl border border-[#E7E5DC] font-medium transition-all duration-140 hospix-chip"
            >
              {p.slice(0, 42)}...
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => handleParse()}
            disabled={parsing || !prompt.trim()}
            className="hospix-btn-primary px-6 py-2.5 rounded-xl shadow-xs group"
          >
            <Sparkles className={`w-4 h-4 ${parsing ? 'animate-spin' : ''}`} />
            <span>{parsing ? 'Parsing Requirement...' : 'Parse with AI'}</span>
          </button>
        </div>

        {parseError && (
          <div className="p-3.5 bg-[#FFF2C7] border border-[#F6E29E] rounded-xl text-xs text-[#8C6A00] flex items-center space-x-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#8C6A00]" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* Confirmation & Edit Form */}
      <form onSubmit={handleSubmitRequirement} className="hospix-card p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E7E5DC] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#082D46] font-heading flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#2F7D4A]" />
              <span>Review & Configure Items</span>
            </h2>
            <p className="text-xs text-[#596B76] mt-0.5">
              Confirm quantities and event parameters before searching single or pooled inventory.
            </p>
          </div>
          {parsedData && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E7F4EA] text-[#2F7D4A] border border-[#CDE6D3] animate-fade-in">
              AI Auto-Extracted
            </span>
          )}
        </div>

        {/* Quick Category Chips with Imagery Visual Cues */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#082D46] mb-2">
            Quick Add by Category:
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleAddItem(cat.value, 50)}
                className="px-3 py-1.5 rounded-xl border border-[#E7E5DC] bg-[#FCFAF3] hover:border-[#082D46] hover:bg-white text-xs font-semibold text-[#082D46] flex items-center space-x-2 transition-all duration-140 hospix-chip shadow-2xs group"
              >
                <img
                  src={getResourceImage(cat.value)}
                  alt={cat.label}
                  className="w-4 h-4 rounded-md object-cover transition-transform duration-180 group-hover:scale-110"
                />
                <span>+ {cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Required Items List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#082D46]">
              Required Inventory Items ({items.length})
            </label>
            <button
              type="button"
              onClick={() => handleAddItem('chairs', 50)}
              className="text-xs text-[#082D46] hover:underline font-bold flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const itemImg = getResourceImage(item.resource_type);
              return (
                <div 
                  key={index} 
                  className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-[#FCFAF3] rounded-2xl border border-[#E7E5DC] hover:border-[#D0CBC0] transition-all duration-160 shadow-2xs group"
                >
                  {/* Thumbnail Image with Tactile Zoom */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E7E5DC] shrink-0 bg-white shadow-2xs hospix-img-container">
                    <img
                      src={itemImg}
                      alt={item.resource_type}
                      className="w-full h-full object-cover hospix-resource-img"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] text-[#596B76] uppercase font-bold mb-1">
                      Resource Type
                    </label>
                    <select
                      value={item.resource_type}
                      onChange={(e) => handleItemChange(index, 'resource_type', e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold bg-white border border-[#D9D8CF] rounded-xl capitalize focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 text-[#092C43] transition-colors"
                    >
                      <option value="chairs">Chairs (Banquet / Chiavari / Folding)</option>
                      <option value="tables">Tables (Round Dining / Buffet / Cocktail)</option>
                      <option value="chafing dishes">Chafing Dishes (Buffet Roll-top)</option>
                      <option value="plates">Dinner Plates (Fine Dining Porcelain)</option>
                      <option value="glasses">Glasses & Goblets</option>
                      <option value="cutlery">Cutlery Sets</option>
                      <option value="tablecloths">Tablecloths & Linens</option>
                      <option value="chair covers">Chair Covers & Sashes</option>
                      <option value="lighting">Stage & Banquet LED Lighting</option>
                      <option value="speakers">Audio Speakers / PA</option>
                      <option value="sofas">VIP Lounge Sofas</option>
                      <option value="tents">Shamiana / Event Tents</option>
                    </select>
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] text-[#596B76] uppercase font-bold mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 text-sm font-extrabold text-[#082D46] bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 transition-colors"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="hospix-icon-btn self-end sm:self-center p-2 text-[#8A979D] hover:text-rose-600 hover:bg-rose-50"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Location & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#082D46] mb-1.5 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#596B76]" />
              <span>City / Event Location</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 font-medium text-[#092C43] transition-colors"
            >
              <option value="Thane">Thane</option>
              <option value="Mulund">Mulund</option>
              <option value="Bhiwandi">Bhiwandi</option>
              <option value="Navi Mumbai">Navi Mumbai</option>
              <option value="Mumbai Central">Mumbai Central</option>
              <option value="Andheri">Andheri</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#082D46] mb-1.5 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#596B76]" />
              <span>Event Date</span>
            </label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 font-medium text-[#092C43] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#082D46] mb-1.5 flex items-center space-x-1">
              <IndianRupee className="w-3.5 h-3.5 text-[#596B76]" />
              <span>Total Budget (₹)</span>
            </label>
            <input
              type="number"
              min={100}
              required
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 font-bold text-[#082D46] transition-colors"
            />
          </div>
        </div>

        {/* Times & Event Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#082D46] mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[#596B76]" />
              <span>Start Time</span>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 font-medium text-[#092C43] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#082D46] mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[#596B76]" />
              <span>End Time</span>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 font-medium text-[#092C43] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#082D46] mb-1.5">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D9D8CF] rounded-xl capitalize focus:outline-hidden focus:border-[#082D46] focus:ring-2 focus:ring-[#082D46]/10 font-medium text-[#092C43] transition-colors"
            >
              <option value="wedding">Wedding / Reception</option>
              <option value="banquet">Banquet / Dinner</option>
              <option value="conference">Conference / Seminar</option>
              <option value="party">Private Party / Celebration</option>
            </select>
          </div>
        </div>

        {/* Delivery Toggle */}
        <div className="flex items-center space-x-3 p-4 bg-[#FFF9E6] rounded-2xl border border-[#F4D98A]/60 hover:border-[#D99B26] transition-colors">
          <input
            type="checkbox"
            id="seeker_delivery"
            checked={deliveryRequired}
            onChange={(e) => setDeliveryRequired(e.target.checked)}
            className="rounded h-4.5 w-4.5 text-[#082D46] focus:ring-[#082D46] border-[#D9D8CF] transition-colors cursor-pointer"
          />
          <label htmlFor="seeker_delivery" className="text-xs font-bold text-[#082D46] flex items-center space-x-2 cursor-pointer">
            <Truck className="w-4 h-4 text-[#8C6A00]" />
            <span>Delivery to event venue is required (providers include delivery transit)</span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#E7E5DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[#596B76]">
            Next: Multi-provider pooling engine will scan available inventory and calculate combinations.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className={`px-8 py-3.5 text-sm rounded-xl font-bold shadow-md w-full sm:w-auto group transition-all duration-200 ${
              submittedSuccess
                ? 'bg-[#2F7D4A] text-white'
                : 'hospix-btn-primary'
            }`}
          >
            {submittedSuccess ? (
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Requirement Created! Matching Inventory...</span>
              </span>
            ) : submitting ? (
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Coordinating Inventory...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Find Matches & Pool Resources</span>
                <ArrowRight className="w-4 h-4 hospix-arrow" />
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
