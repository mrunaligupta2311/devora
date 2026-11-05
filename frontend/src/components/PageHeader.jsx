import React from 'react';
import './PageHeader.css';
export default function PageHeader({eyebrow,title,description,actions}) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="page-header-actions">{actions}</div>}</div>; }