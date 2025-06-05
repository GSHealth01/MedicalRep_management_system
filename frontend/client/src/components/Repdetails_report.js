// src/components/Repdetails_report.js
import React, { useState, useEffect } from 'react';
import './Repdetails_report.css';

import { agenciesByRange } from '../data/agencies';
import { distributors } from '../data/distributors';
import {
  doctorCategories,
  doctorsByCategory
} from '../data/doctors';
import {
  products,
  productDetails
} from '../data/products';
import { API } from '../services/api';

const townsByCategory = {
  'Sub 1': ['a', 'b', 'c', 'd'],
  'Sub 2': ['e', 'f', 'g', 'h']
};

const promotedProducts = ['Promo A', 'Promo B', 'Promo C'];

export default function Repdetails_report() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [date, setDate] = useState('');
  const [range, setRange] = useState('');
  const [agency, setAgency] = useState('');
  const [repName, setRepName] = useState('');
  const [empNo, setEmpNo] = useState('');
  const [distributor, setDistributor] = useState([]); // multi-select
  const [areaCategory, setAreaCategory] = useState('Sub 1');
  const [availableTowns, setAvailableTowns] = useState(townsByCategory['Sub 1']);
  const [town, setTown] = useState(townsByCategory['Sub 1'][0]);
  const [doctorCategory, setDoctorCategory] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [doctor, setDoctor] = useState('');
  const [doctorType, setDoctorType] = useState('');
  const [comment, setComment] = useState('');

  // Promotion-specific
  const [promoOption, setPromoOption] = useState('');
  const [promoProduct, setPromoProduct] = useState('');
  const [promoSKU, setPromoSKU] = useState('');
  const [promoCategory, setPromoCategory] = useState('');
  const [sampleQty, setSampleQty] = useState('');    // <— missing
  const [detailChecked, setDetailChecked] = useState(false); // <— missing

  // Stocking (Step 2) state
  const [currentLine, setCurrentLine] = useState({
    product: '', mg: '', packSize: '', quantity: '', packPrice: '', status: ''
  });
  const [lines, setLines] = useState([]);
  const [orderValue, setOrderValue] = useState(0);

  // Handlers
  const toggleDistributor = d => {
    setDistributor(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const addLine = () => {
    const { product, mg, packSize, quantity, packPrice, status } = currentLine;
    if (!product || !mg || !packSize || !quantity || !packPrice || !status) return;
    setLines(ls => [...ls, currentLine]);
    setCurrentLine({ product: '', mg: '', packSize: '', quantity: '', packPrice: '', status: '' });
  };

  // Effects
  useEffect(() => {
    // populate towns on mount and when areaCategory changes
    const list = townsByCategory[areaCategory] || [];
    setAvailableTowns(list);
    setTown(list[0] || '');
  }, [areaCategory]);

  useEffect(() => {
    // populate doctors when doctorCategory changes
    setAvailableDoctors(doctorsByCategory[doctorCategory] || []);
    setDoctor('');
  }, [doctorCategory]);

  useEffect(() => {
    // compute orderValue
    const total = lines.reduce((sum, l) =>
      sum + Number(l.quantity) * Number(l.packPrice), 0
    );
    setOrderValue(total);
  }, [lines]);

  const handleSubmit = async () => {
    const payload = {
      date, range, agency, repName, empNo, distributor,
      areaCategory, town, doctorCategory, doctor, doctorType,
      products: lines,
      orderValue, comment,
      promo: (doctorType === 'Promotion' || doctorType === 'Both') ? {
        option: promoOption,
        product: promoProduct,
        skus: promoOption === 'Focus' ? promoSKU : undefined,
        category: promoOption === 'Focus' ? promoCategory : undefined
      } : undefined
    };
    await API.post('/reports', payload);
    setStep(3);
  };

  const handleDownload = () => {
    const data = {
      date, range, agency, repName, empNo, distributor,
      areaCategory, town, doctorCategory, doctor, doctorType,
      products: lines,
      orderValue, comment,
      promo: (doctorType === 'Promotion' || doctorType === 'Both') ? {
        option: promoOption,
        product: promoProduct,
        skus: promoOption === 'Focus' ? promoSKU : undefined,
        category: promoOption === 'Focus' ? promoCategory : undefined
      } : undefined
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Repdetails_report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Validation flags
  const step1Valid =
    date && range && agency && repName && empNo &&
    distributor.length > 0 && areaCategory && town &&
    doctorCategory && doctor && doctorType;

  const stockingValid = lines.length > 0;
  const promoValid = promoOption === 'Leave Behind'
    ? !!promoProduct
    : promoOption === 'Focus'
      ? promoProduct && promoSKU && promoCategory
      : false;
  const step2Valid = (doctorType === 'Stocking' && stockingValid)
    || (doctorType === 'Promotion' && promoValid)
    || (doctorType === 'Both' && stockingValid && promoValid);

  return (
    <div className="form-container">
      {/* Step 1 */}
      {step === 1 && (
        <div className="form-step active">
          <h2>Step 1: Rep Details</h2>

          <label>Date<br />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </label>

          <label>Range<br />
            <select value={range} onChange={e => setRange(e.target.value)} required>
              <option value="">– select –</option>
              {Object.keys(agenciesByRange).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label>Agency<br />
            <select value={agency} onChange={e => setAgency(e.target.value)} required>
              <option value="">– select –</option>
              {(agenciesByRange[range] || []).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>

          <label>Rep Name<br />
            <input type="text" value={repName} onChange={e => setRepName(e.target.value)} required />
          </label>

          <label>Emp No<br />
            <input type="text" value={empNo} onChange={e => setEmpNo(e.target.value)} required />
          </label>

          <label>Distributor</label>
          <div className="checkbox-group">
            {distributors.map(d => (
              <label key={d} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={distributor.includes(d)}
                  onChange={() => toggleDistributor(d)}
                />
                {d}
              </label>
            ))}
          </div>

          <div className="field-row">
            <label>Area<br />
              <select value={areaCategory} onChange={e => setAreaCategory(e.target.value)} required>
                <option value="Sub 1">Sub 1</option>
                <option value="Sub 2">Sub 2</option>
              </select>
            </label>

            <label>Town<br />
              <select value={town} onChange={e => setTown(e.target.value)} required>
                {availableTowns.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>

          <label>Doctor Category<br />
            <select value={doctorCategory} onChange={e => setDoctorCategory(e.target.value)} required>
              <option value="">– select –</option>
              {doctorCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>Doctor<br />
            <select value={doctor} onChange={e => setDoctor(e.target.value)} required>
              <option value="">– select –</option>
              {availableDoctors.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <label>Doctor Type<br />
            <select value={doctorType} onChange={e => setDoctorType(e.target.value)} required>
              <option value="">– select –</option>
              <option value="Stocking">Stocking</option>
              <option value="Promotion">Promotion</option>
              <option value="Both">Both</option>
            </select>
          </label>

          <label>Doctor's Comment<br />
            <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} />
          </label>

          <button type="button" onClick={() => setStep(2)} disabled={!step1Valid}>
            Next
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="form-step active">
          <h2>Step 2: {doctorType}</h2>

          {/* Stocking */}
          {(doctorType === 'Stocking' || doctorType === 'Both') && (
            <>
              <fieldset>
                <legend>Add Stocking Product</legend>
                <label>Product<br />
                  <select
                    value={currentLine.product}
                    onChange={e => setCurrentLine(l => ({
                      ...l, product: e.target.value, mg: '', packSize: ''
                    }))}
                  >
                    <option value="">– select –</option>
                    {products.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label>MG<br />
                  <select
                    value={currentLine.mg}
                    onChange={e => setCurrentLine(l => ({ ...l, mg: e.target.value }))}
                  >
                    <option value="">– select –</option>
                    {currentLine.product && productDetails[currentLine.product].mgs.map(mg => (
                      <option key={mg} value={mg}>{mg}</option>
                    ))}
                  </select>
                </label>
                <label>Pack Size<br />
                  <select
                    value={currentLine.packSize}
                    onChange={e => setCurrentLine(l => ({ ...l, packSize: e.target.value }))}
                  >
                    <option value="">– select –</option>
                    {currentLine.product && productDetails[currentLine.product].packSizes.map(ps => (
                      <option key={ps} value={ps}>{ps}</option>
                    ))}
                  </select>
                </label>
                <label>Quantity<br />
                  <input
                    type="number" min="1"
                    value={currentLine.quantity}
                    onChange={e => setCurrentLine(l => ({ ...l, quantity: e.target.value }))}
                  />
                </label>
                <label>Pack Price<br />
                  <input
                    type="number" min="0" step="0.01"
                    value={currentLine.packPrice}
                    onChange={e => setCurrentLine(l => ({ ...l, packPrice: e.target.value }))}
                  />
                </label>
                <label>Order Status<br />
                  <select
                    value={currentLine.status}
                    onChange={e => setCurrentLine(l => ({ ...l, status: e.target.value }))}
                  >
                    <option value="">– select –</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                  </select>
                </label>
                <button type="button" onClick={addLine}>
                  + Add Product
                </button>
              </fieldset>
              {lines.length > 0 && (
                <div className="added-products">
                  <h4>Added Products</h4>
                  {lines.map((l, i) => (
                    <div key={i} className="product-item">
                      <ol>
                        <li><strong>Product:</strong> {l.product}, {l.mg}, {l.packSize}</li>
                        <li><strong>Quantity:</strong> {l.quantity}</li>
                        <li><strong>Pack Price:</strong> {l.packPrice}</li>
                        <li>
                          <strong>Status:</strong>{' '}
                          <span className={l.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}>
                            {l.status}
                          </span>
                        </li>
                      </ol>
                      <div className="line-total">
                        <strong>Total:</strong> {(l.quantity * l.packPrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Promotion */}
          {(doctorType === 'Promotion' || doctorType === 'Both') && (
            <fieldset>
              <legend>Promotion Details</legend>

              <label>Product Promoted<br />
                <select value={promoOption} onChange={e => setPromoOption(e.target.value)} required>
                  <option value="">– select –</option>
                  <option value="Focus">Focus</option>
                  <option value="Leave Behind">Leave Behind</option>
                </select>
              </label>

              {promoOption === 'Focus' && (
                <>
                  <label>Product<br />
                    <select value={promoProduct} onChange={e => setPromoProduct(e.target.value)} required>
                      <option value="">– select –</option>
                      {promotedProducts.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>

                  <label>SKUs<br />
                    <select value={promoSKU} onChange={e => setPromoSKU(e.target.value)} required>
                      <option value="">– select –</option>
                      <option>15mg</option>
                      <option>75 SR</option>
                      <option>100 SR</option>
                      <option>Gel</option>
                    </select>
                  </label>

                  <label>
                    Product Category<br />
                    <select
                      value={promoCategory}
                      onChange={e => setPromoCategory(e.target.value)}
                      required
                    >
                      <option value="">– select –</option>
                      <option value="sample">sample</option>
                      <option value="detail">detailed</option>
                      <option value="both">both</option>
                    </select>
                  </label>

                  {(promoCategory === 'sample' || promoCategory === 'both') && (
                    <label>
                      Sample Quantity<br />
                      <input
                        type="number"
                        min="1"
                        value={sampleQty}
                        onChange={e => setSampleQty(e.target.value)}
                        required
                      />
                    </label>
                  )}

                  {(promoCategory === 'detail' || promoCategory === 'both') && (
                    <div className="detail-provided">
                      <input
                        type="checkbox"
                        id="detailProvided"
                        checked={detailChecked}
                        onChange={e => setDetailChecked(e.target.checked)}
                      />
                      <label htmlFor="detailProvided">Detailed</label>
                    </div>
                  )}
                </>
              )}

              {promoOption === 'Leave Behind' && (
                <label>Product<br />
                  <select value={promoProduct} onChange={e => setPromoProduct(e.target.value)} required>
                    <option value="">– select –</option>
                    {promotedProducts.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              )}
            </fieldset>
          )}

          <button type="button" onClick={() => setStep(1)}>Back</button>
          <button type="button" onClick={handleSubmit} disabled={!step2Valid}>
            Submit
          </button>
        </div>
      )}


      {/* Step 3 */}
      {step === 3 && (
        <div className="form-step active summary">
          <h2>Summary</h2>
          <div className="summary-container">
            <pre>
              {JSON.stringify({
                date, range, agency, repName, empNo, distributor,
                areaCategory, town, doctorCategory, doctor, doctorType,
                products: lines,
                orderValue, comment,
                promo: (doctorType === 'Promotion' || doctorType === 'Both') ? {
                  option: promoOption,
                  product: promoProduct,
                  skus: promoOption === 'Focus' ? promoSKU : undefined,
                  category: promoOption === 'Focus' ? promoCategory : undefined
                } : undefined
              }, null, 2)}
            </pre>
            <button type="button" onClick={handleDownload}>
              Download Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
