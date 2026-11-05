import React from 'react';
import './Badge.css';
export default function Badge({children,tone='neutral'}) { return <span className={`badge badge-${tone}`}>{children}</span>; }