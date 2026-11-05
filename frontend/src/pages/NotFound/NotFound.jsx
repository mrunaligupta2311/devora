import React from 'react';
import {ArrowLeft,Compass} from 'lucide-react';
import Button from '../../components/Button.jsx';
import './NotFound.css';
export default function NotFound({go}){return <div className="not-found-page"><div className="not-found-number">404</div><div className="eyebrow">A LITTLE OFF THE MAP</div><h1>This path doesn't exist.</h1><p>Looks like this route hasn't been built yet. Let's get you back to the good ideas.</p><div><Button onClick={()=>go('/dashboard')} icon={ArrowLeft}>Back to dashboard</Button><Button variant="secondary" onClick={()=>go('/explore')} icon={Compass}>Explore projects</Button></div></div>}