/**
 * Tenant Dashboard — Communications / Messaging Center Page
 */

'use client';

import { useState } from 'react';
import { useTenantInbox, useTenantTemplates, useTenantReviews } from '@/hooks/useTenantDashboard';

export default function TenantCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'campaigns' | 'templates' | 'automations' | 'reviews'>('inbox');
  const { data: inbox } = useTenantInbox();
  const { data: templates } = useTenantTemplates();
  const { data: reviews } = useTenantReviews();

  const tabs = [
    { id: 'inbox' as const, label: 'Inbox', badge: inbox?.totalUnread },
    { id: 'campaigns' as const, label: 'Campaigns' },
    { id: 'templates' as const, label: 'Templates' },
    { id: 'automations' as const, label: 'Automations' },
    { id: 'reviews' as const, label: 'Reviews', badge: reviews?.reviews?.filter(r => r.status === 'new').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Communications</h2>
        <button className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          New Message
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Inbox */}
      {activeTab === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Open Conversations</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{inbox?.totalOpen ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Unread Messages</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{inbox?.totalUnread ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Avg Response Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{inbox?.avgResponseTime ?? 0}min</p>
          </div>
        </div>
      )}
      {activeTab === 'inbox' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {inbox?.conversations?.map((conv) => (
              <div key={conv.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                  {conv.clientName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{conv.clientName}</span>
                    <span className="text-xs text-gray-400">{conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{conv.unreadCount}</span>
                )}
              </div>
            ))}
            {(!inbox?.conversations || inbox.conversations.length === 0) && (
              <div className="p-8 text-center text-gray-400">No conversations yet</div>
            )}
          </div>
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.channel === 'sms' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {t.channel.toUpperCase()}
                </span>
                <span className="text-xs text-gray-400 capitalize">{t.category.replace(/_/g, ' ')}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
              <p className="text-xs text-gray-500 mt-2 line-clamp-3">{t.body}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">Variables: {t.variables.length}</span>
                <button className="text-xs text-blue-600 hover:text-blue-800">Use Template</button>
              </div>
            </div>
          ))}
          {(!templates || templates.length === 0) && (
            <div className="col-span-full p-8 text-center text-gray-400 bg-white rounded-xl border border-gray-200">No templates available</div>
          )}
        </div>
      )}

      {/* Automations */}
      {activeTab === 'automations' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Automation Rules</h3>
          <p className="text-sm text-gray-500">Configure automated messages triggered by client actions. Automations run in the background and send messages based on your defined rules.</p>
          <div className="mt-4 space-y-3">
            {['Appointment Confirmation', '24h Reminder', 'Post-Treatment Follow-Up', 'Review Request', 'No-Show Follow-Up', 'New Client Welcome', 'Churn Risk Alert'].map((name, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-900">{name}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {activeTab === 'reviews' && reviews && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reviews.avgRating}/5</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reviews.totalReviews}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reviews.responseRate}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">Trend</p>
              <p className={`text-2xl font-bold mt-1 capitalize ${reviews.recentTrend === 'improving' ? 'text-green-600' : reviews.recentTrend === 'declining' ? 'text-red-600' : 'text-gray-900'}`}>{reviews.recentTrend}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {reviews.reviews.slice(0, 20).map((review) => (
                <div key={review.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{review.clientName}</span>
                      <div className="flex">{[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>&#9733;</span>
                      ))}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${review.status === 'responded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {review.status}
                      </span>
                      <span className="text-xs text-gray-400">{review.platform}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{review.text || 'No text'}</p>
                  {review.suggestedResponse && !review.response && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-medium">Suggested Response:</p>
                      <p className="text-xs text-gray-600 mt-1">{review.suggestedResponse}</p>
                      <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">Use This Response</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Campaign Builder</h3>
          <p className="text-sm text-gray-500 mt-2">Create targeted SMS and email campaigns for your clients</p>
          <button className="mt-4 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">Create Campaign</button>
        </div>
      )}
    </div>
  );
}
