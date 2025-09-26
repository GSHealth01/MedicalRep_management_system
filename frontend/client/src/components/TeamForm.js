// src/components/TeamForm.jsx
import { useState } from "react";

export default function TeamForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    arrowil: "",
    teamName: "",
    ops: [],
    sms: [],
    pms: [],
    tms: [],
    ses: [],
    jes: [],
    fcs: [],
    mrs: [],
  });

  // Dummy dropdown values (later fetch from backend)
  const ops = ["Ops A", "Ops B"];
  const sms = ["SM A", "SM B"];
  const pms = ["PM A", "PM B"];
  const tms = ["TM A", "TM B"];
  const ses = ["SE A", "SE B"];
  const jes = ["JE A", "JE B"];
  const fcs = ["FC A", "FC B"];
  const mrs = ["MR A", "MR B", "MR C"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMultiSelect = (e, field) => {
    const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setFormData({ ...formData, [field]: values });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(formData);

    // Reset form
    setFormData({
      arrowil: "",
      teamName: "",
      ops: [],
      sms: [],
      pms: [],
      tms: [],
      ses: [],
      jes: [],
      fcs: [],
      mrs: [],
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl bg-white shadow-lg rounded-lg p-6 space-y-4"
    >
      {/* Arrowil */}
      <div>
        <label className="block text-gray-700 mb-1">Arrowil</label>
        <select
          name="arrowil"
          value={formData.arrowil}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Arrowil</option>
          <option value="A">Arrowil A</option>
          <option value="B">Arrowil B</option>
        </select>
      </div>

      {/* Team Name */}
      <div>
        <label className="block text-gray-700 mb-1">Team Name</label>
        <input
          type="text"
          name="teamName"
          value={formData.teamName}
          onChange={handleChange}
          placeholder="Enter team name"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Operations Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Operations Manager</label>
        <select
          multiple
          value={formData.ops}
          onChange={(e) => handleMultiSelect(e, "ops")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ops.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </div>

      {/* Senior Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Senior Manager</label>
        <select
          multiple
          value={formData.sms}
          onChange={(e) => handleMultiSelect(e, "sms")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sms.map((sm) => (
            <option key={sm} value={sm}>
              {sm}
            </option>
          ))}
        </select>
      </div>

      {/* Project Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Project Manager</label>
        <select
          multiple
          value={formData.pms}
          onChange={(e) => handleMultiSelect(e, "pms")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {pms.map((pm) => (
            <option key={pm} value={pm}>
              {pm}
            </option>
          ))}
        </select>
      </div>

      {/* Territory Manager */}
      <div>
        <label className="block text-gray-700 mb-1">Territory Manager</label>
        <select
          multiple
          value={formData.tms}
          onChange={(e) => handleMultiSelect(e, "tms")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tms.map((tm) => (
            <option key={tm} value={tm}>
              {tm}
            </option>
          ))}
        </select>
      </div>

      {/* Senior Executive */}
      <div>
        <label className="block text-gray-700 mb-1">Senior Executive</label>
        <select
          multiple
          value={formData.ses}
          onChange={(e) => handleMultiSelect(e, "ses")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ses.map((se) => (
            <option key={se} value={se}>
              {se}
            </option>
          ))}
        </select>
      </div>

      {/* Junior Executive */}
      <div>
        <label className="block text-gray-700 mb-1">Junior Executive</label>
        <select
          multiple
          value={formData.jes}
          onChange={(e) => handleMultiSelect(e, "jes")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {jes.map((je) => (
            <option key={je} value={je}>
              {je}
            </option>
          ))}
        </select>
      </div>

      {/* Field Coordinators */}
      <div>
        <label className="block text-gray-700 mb-1">Field Coordinators (FC)</label>
        <select
          multiple
          value={formData.fcs}
          onChange={(e) => handleMultiSelect(e, "fcs")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {fcs.map((fc) => (
            <option key={fc} value={fc}>
              {fc}
            </option>
          ))}
        </select>
      </div>

      {/* Medical Reps */}
      <div>
        <label className="block text-gray-700 mb-1">Medical Reps (MR)</label>
        <select
          multiple
          value={formData.mrs}
          onChange={(e) => handleMultiSelect(e, "mrs")}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {mrs.map((mr) => (
            <option key={mr} value={mr}>
              {mr}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
      >
        Add Team
      </button>
    </form>
  );
}
