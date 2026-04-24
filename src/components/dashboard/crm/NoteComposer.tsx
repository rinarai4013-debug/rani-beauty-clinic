'use client';

import { useState } from 'react';
import { Send, Phone, Mail, MessageSquare, Users, FileText, Pin } from 'lucide-react';
import type { NoteType } from '@/types/crm';
import { NOTE_TYPE_LABELS } from '@/types/crm';

interface NoteComposerProps {
  clientId: string;
  clientName: string;
  onSubmit?: (_data: { type: NoteType; subject: string; content: string; isPinned: boolean }) => void;
}

const NOTE_TYPE_OPTIONS: { type: NoteType; icon: typeof Phone; label: string }[] = [
  { type: 'call', icon: Phone, label: 'Call' },
  { type: 'email', icon: Mail, label: 'Email' },
  { type: 'text', icon: MessageSquare, label: 'Text' },
  { type: 'in_person', icon: Users, label: 'In-Person' },
  { type: 'internal', icon: FileText, label: 'Internal' },
];

export default function NoteComposer({ clientId, clientName, onSubmit }: NoteComposerProps) {
  const [type, setType] = useState<NoteType>('internal');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = () => {
    if (!subject.trim() || !content.trim()) return;
    onSubmit?.({ type, subject, content, isPinned });
    setSubject('');
    setContent('');
    setIsPinned(false);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
      <h4 className="text-xs font-semibold text-rani-navy uppercase tracking-wider mb-3">
        Add Note for {clientName}
      </h4>

      {/* Type selector */}
      <div className="flex gap-1 mb-3">
        {NOTE_TYPE_OPTIONS.map(({ type: t, icon: Icon, label }) => (
          <button
            key={t}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              type === t ? 'bg-rani-navy text-white' : 'bg-gray-100 text-rani-muted hover:bg-gray-200'
            }`}
            onClick={() => setType(t)}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Subject */}
      <input
        type="text"
        placeholder="Subject..."
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-rani-gold"
      />

      {/* Content */}
      <textarea
        placeholder="Add your notes..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-rani-gold resize-none"
      />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded transition-colors ${
            isPinned ? 'bg-amber-100 text-amber-700' : 'text-rani-muted hover:bg-gray-100'
          }`}
          onClick={() => setIsPinned(!isPinned)}
        >
          <Pin className="w-3 h-3" />
          {isPinned ? 'Pinned' : 'Pin'}
        </button>

        <button
          className="flex items-center gap-1 bg-rani-navy text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-rani-navy/90 transition-colors disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!subject.trim() || !content.trim()}
        >
          <Send className="w-3 h-3" />
          Save Note
        </button>
      </div>
    </div>
  );
}
