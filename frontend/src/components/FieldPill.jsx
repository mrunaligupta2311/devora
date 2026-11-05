import React from 'react';
import './FieldPill.css';
export default function FieldPill({children,active,onClick}) { return <button className={`field-pill ${active?'selected':''}`} aria-pressed={!!active} onClick={onClick}>{children}</button>; }