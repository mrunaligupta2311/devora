import React from 'react';
import './FieldSelect.css';
export default function FieldSelect({label,value,onChange,options,placeholder='Select an option'}) { return <label className="field-control"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="">{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></label>; }