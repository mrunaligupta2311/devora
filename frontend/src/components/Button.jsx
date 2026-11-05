import React from 'react';
import { LoaderCircle } from 'lucide-react';
import './Button.css';
export default function Button({children,variant='primary',size='md',loading=false,icon:Icon,disabled=false,...props}) {
 return <button className={`btn btn-${variant} btn-${size}`} disabled={disabled||loading} {...props}>{loading?<LoaderCircle size={16} className="spin"/>:Icon?<Icon size={16}/>:null}{children}</button>;
}