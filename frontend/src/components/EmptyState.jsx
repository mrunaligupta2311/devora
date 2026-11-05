import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button.jsx';
import './EmptyState.css';
export default function EmptyState({title='Nothing here yet',description='Your projects will appear here when you add them.',actionLabel='Explore projects',onAction,icon:Icon=FolderOpen}) { return <div className="empty-state"><div className="empty-icon"><Icon size={25}/></div><h3>{title}</h3><p>{description}</p>{onAction&&<Button onClick={onAction}>{actionLabel}</Button>}</div>; }