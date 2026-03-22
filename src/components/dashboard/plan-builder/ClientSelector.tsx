'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, UserPlus, User } from 'lucide-react';
import type { BuilderClient } from '@/lib/plan-builder/types';

interface ClientSelectorProps {
  selected: BuilderClient | null;
  onSelect: (client: BuilderClient | null) => void;
}

interface ClientSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function ClientSelector({ selected, onSelect }: ClientSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchClients = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/clients?search=${encodeURIComponent(searchQuery)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        const clients: ClientSearchResult[] = (data.clients || data.data || []).map(
          (c: { id: string; fields?: Record<string, unknown>; name?: string; email?: string; phone?: string }) => ({
            id: c.id,
            name: c.fields?.['Client'] as string || c.name || '',
            email: c.fields?.['Email'] as string || c.email || '',
            phone: c.fields?.['Phone'] as string || c.phone || '',
          })
        );
        setResults(clients);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchClients(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchClients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectClient(client: ClientSearchResult) {
    onSelect({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      skinConcerns: [],
      treatmentInterests: [],
    });
    setQuery('');
    setIsOpen(false);
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1D2C] rounded-lg">
          <User className="h-3.5 w-3.5 text-[#C9A96E]" />
          <span className="text-sm font-medium text-white">{selected.name}</span>
          <button
            onClick={() => onSelect(null)}
            className="ml-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search clients..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm text-[#0F1D2C] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] transition-colors"
        />
      </div>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-5 h-5 border-2 border-[#C9A96E] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : results.length > 0 ? (
            <>
              {results.map((client) => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="w-full px-4 py-2.5 text-left hover:bg-[#F8F6F1] transition-colors flex items-center gap-3 border-b border-gray-50 last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0F1D2C]/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-[#0F1D2C]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F1D2C] truncate">{client.name}</p>
                    <p className="text-xs text-gray-400 truncate">{client.email || client.phone}</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2.5 text-left hover:bg-[#F8F6F1] transition-colors flex items-center gap-3 border-t border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-[#C9A96E]/10 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="h-4 w-4 text-[#C9A96E]" />
                </div>
                <span className="text-sm font-medium text-[#C9A96E]">New Client</span>
              </button>
            </>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-400">No clients found</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#C9A96E] hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                New Client
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
