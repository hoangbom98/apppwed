"use client";

import { useState, FormEvent } from "react";
import {
  PieChart,
  Target,
  Briefcase,
  Building2,
  Send,
  CheckCircle2,
  Upload,
} from "lucide-react";

const enquiryTypes = [
  {
    id: "diversified",
    label: "Diversified Investment",
    icon: PieChart,
    description: "Build balanced exposure across multiple sectors through one relationship.",
  },
  {
    id: "sector-specific",
    label: "Sector-Specific Investment",
    icon: Target,
    description: "Concentrate capital in the sector you know and believe in most.",
  },
  {
    id: "direct",
    label: "Direct Investment Opportunity",
    icon: Briefcase,
    description: "Take a direct position in a selected business, asset, or project.",
  },
  {
    id: "institutional",
    label: "Institutional or Family Office Investment",
    icon: Building2,
    description: "Structure larger allocations with tailored governance and reporting.",
  },
];

export default function InvestorForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    company: "",
    investorType: "",
    investmentRange: "",
    investmentPeriod: "",
    riskProfile: "",
    preferredSectors: "",
    objectives: "",
    fileName: "",
    enquiryType: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, fileName: e.target.files[0].name });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await fetch("/api/partner-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-fortress-gold/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-fortress-gold" />
        </div>
        <h3 className="text-2xl font-bold text-fortress-ivory mb-3">
          Thank You, {formData.firstName}
        </h3>
        <p className="text-fortress-silver max-w-md mx-auto">
          Your investor enquiry has been received. Our investment team will review your submission and respond within 2-3 business days — in strict confidence.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Enquiry Type Selection */}
      <div>
        <label className="block text-fortress-ivory font-medium mb-4 text-sm">
          Type of Investor Enquiry *
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          {enquiryTypes.map((type) => (
            <label
              key={type.id}
              className={`flex items-start gap-4 p-4 border cursor-pointer transition-all duration-300 ${
                formData.enquiryType === type.id
                  ? "border-fortress-gold/50 bg-fortress-gold/5"
                  : "border-fortress-gold/10 bg-fortress-deep/50 hover:border-fortress-gold/25"
              }`}
            >
              <input
                type="radio"
                name="enquiryType"
                value={type.id}
                checked={formData.enquiryType === type.id}
                onChange={handleChange}
                required
                className="sr-only"
              />
              <div
                className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${
                  formData.enquiryType === type.id
                    ? "bg-fortress-gold/20"
                    : "bg-white/5"
                }`}
              >
                <type.icon
                  className={`w-5 h-5 ${
                    formData.enquiryType === type.id
                      ? "text-fortress-gold"
                      : "text-fortress-silver"
                  }`}
                />
              </div>
              <div>
                <p
                  className={`font-medium text-sm ${
                    formData.enquiryType === type.id
                      ? "text-fortress-gold"
                      : "text-fortress-ivory"
                  }`}
                >
                  {type.label}
                </p>
                <p className="text-fortress-silver text-xs mt-1">
                  {type.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Personal Info */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-sm"
            placeholder="John"
          />
        </div>
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Last Name *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-sm"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-sm"
            placeholder="john@company.com"
          />
        </div>
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-sm"
            placeholder="+971 50 XXX XXXX"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Country of Residence
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-sm"
            placeholder="United Arab Emirates"
          />
        </div>
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Company / Family Office
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-sm"
            placeholder="Organisation name"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Investor Type
          </label>
          <select
            name="investorType"
            value={formData.investorType}
            onChange={handleChange}
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory focus:outline-none focus:border-fortress-gold/50 transition-colors appearance-none rounded-sm"
          >
            <option value="">Select investor type</option>
            <option value="private">Private Investor</option>
            <option value="hnwi">High-Net-Worth Individual</option>
            <option value="family-office">Family Office</option>
            <option value="corporate">Corporate Investor</option>
            <option value="financial-institution">Financial Institution</option>
            <option value="institutional">Institutional Investor</option>
          </select>
        </div>
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Indicative Investment Range
          </label>
          <select
            name="investmentRange"
            value={formData.investmentRange}
            onChange={handleChange}
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory focus:outline-none focus:border-fortress-gold/50 transition-colors appearance-none rounded-sm"
          >
            <option value="">Select range</option>
            <option value="below-500k">Below AED 500,000</option>
            <option value="500k-1m">AED 500,000–1 million</option>
            <option value="1m-5m">AED 1–5 million</option>
            <option value="5m-10m">AED 5–10 million</option>
            <option value="10m-25m">AED 10–25 million</option>
            <option value="25m+">AED 25 million and above</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Preferred Investment Period
          </label>
          <select
            name="investmentPeriod"
            value={formData.investmentPeriod}
            onChange={handleChange}
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory focus:outline-none focus:border-fortress-gold/50 transition-colors appearance-none rounded-sm"
          >
            <option value="">Select period</option>
            <option value="1-3">1–3 years</option>
            <option value="3-5">3–5 years</option>
            <option value="5-10">5–10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>
        <div>
          <label className="block text-fortress-silver text-sm mb-2">
            Risk Profile
          </label>
          <select
            name="riskProfile"
            value={formData.riskProfile}
            onChange={handleChange}
            className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory focus:outline-none focus:border-fortress-gold/50 transition-colors appearance-none rounded-sm"
          >
            <option value="">Select risk profile</option>
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="growth">Growth-Oriented</option>
            <option value="higher-risk">Higher Risk</option>
          </select>
        </div>
      </div>

      {/* Preferred Sectors */}
      <div>
        <label className="block text-fortress-silver text-sm mb-2">
          Preferred Investment Sectors
        </label>
        <input
          type="text"
          name="preferredSectors"
          value={formData.preferredSectors}
          onChange={handleChange}
          className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-sm"
          placeholder="Real Estate, Private Equity, Hospitality..."
        />
      </div>

      {/* Investment Objectives */}
      <div>
        <label className="block text-fortress-silver text-sm mb-2">
          Brief Investment Objectives *
        </label>
        <textarea
          name="objectives"
          value={formData.objectives}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors resize-none rounded-sm"
          placeholder="Briefly describe your investment objectives, preferred sectors, indicative capital range, expected investment period, and any specific requirements."
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-fortress-silver text-sm mb-2">
          Supporting Documents — Optional
        </label>
        <label className="flex items-center gap-3 px-5 py-3.5 bg-fortress-navy border border-dashed border-fortress-gold/20 text-fortress-silver hover:border-fortress-gold/40 transition-colors cursor-pointer rounded-sm">
          <Upload className="w-5 h-5 text-fortress-gold/60" />
          <span className="text-sm">
            {formData.fileName || "Upload an investor profile, investment mandate, supporting documents, or relevant files (PDF, DOCX)."}
          </span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.pptx,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-sm hover:shadow-2xl hover:shadow-fortress-gold/25 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 rounded-sm"
        >
          <Send className="w-4 h-4" />
          Submit Investor Enquiry
        </button>
        <p className="text-fortress-silver/40 text-xs mt-4">
          Every investor enquiry is handled with strict confidentiality and reviewed on its individual merits. Investment opportunities remain subject to availability, evaluation, suitability, agreed terms, and applicable regulatory requirements.
        </p>
      </div>
    </form>
  );
}
