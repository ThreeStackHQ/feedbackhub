'use client';

import { useState } from 'react';

type RequestStatus = 'open' | 'in-progress' | 'completed';
type RequestCategory = 'feature' | 'bug-fix' | 'improvement';

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  votes: number;
  hasVoted: boolean;
  commentCount: number;
  createdAt: string;
}

// Mock data for initial development
const mockRequests: FeatureRequest[] = [
  {
    id: '1',
    title: 'Dark mode support',
    description: 'Add dark mode theme option to reduce eye strain during night time usage',
    category: 'feature',
    status: 'in-progress',
    votes: 47,
    hasVoted: false,
    commentCount: 12,
    createdAt: '2024-02-10T10:00:00Z',
  },
  {
    id: '2',
    title: 'Fix mobile navigation bug',
    description: 'Navigation menu doesn\'t close after selecting an item on mobile devices',
    category: 'bug-fix',
    status: 'open',
    votes: 23,
    hasVoted: true,
    commentCount: 5,
    createdAt: '2024-02-15T14:30:00Z',
  },
  {
    id: '3',
    title: 'Keyboard shortcuts',
    description: 'Add keyboard shortcuts for common actions to improve productivity',
    category: 'improvement',
    status: 'open',
    votes: 31,
    hasVoted: false,
    commentCount: 8,
    createdAt: '2024-02-12T09:15:00Z',
  },
];

function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getCategoryLabel(category: RequestCategory): string {
  const labels: Record<RequestCategory, string> = {
    feature: 'Feature',
    'bug-fix': 'Bug Fix',
    improvement: 'Improvement',
  };
  return labels[category];
}

function getStatusLabel(status: RequestStatus): string {
  const labels: Record<RequestStatus, string> = {
    open: 'Open',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };
  return labels[status];
}

function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    open: 'bg-gray-500/20 text-gray-300',
    'in-progress': 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300',
  };
  return colors[status];
}

export default function PublicBoardPage({ params: _ }: { params: { slug: string } }) {
  const [requests, setRequests] = useState(mockRequests);
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | RequestCategory>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'newest' | 'oldest'>('votes');
  const [searchQuery, setSearchQuery] = useState('');

  const handleVote = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? { ...req, votes: req.hasVoted ? req.votes - 1 : req.votes + 1, hasVoted: !req.hasVoted }
          : req
      )
    );
  };

  // Filter and sort logic
  const filteredRequests = requests
    .filter((req) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && req.category !== categoryFilter) return false;
      if (searchQuery && !req.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return 0;
    });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="flex">
        {/* Left Sidebar - Filters */}
        <aside className="w-64 border-r border-zinc-800 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Status</h3>
            <div className="space-y-2">
              {(['all', 'open', 'in-progress', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    statusFilter === status
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {status === 'all' ? 'All' : getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Categories</h3>
            <div className="space-y-2">
              {(['all', 'feature', 'bug-fix', 'improvement'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    categoryFilter === category
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {category === 'all' ? 'All' : getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Top Bar */}
          <div className="border-b border-zinc-800 p-6 flex items-center gap-4">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="votes">Most Votes</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
              Submit Request
            </button>
          </div>

          {/* Request Feed */}
          <div className="p-6 space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No requests found.</p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <div className="flex gap-4">
                    {/* Upvote Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(request.id);
                      }}
                      className={`flex flex-col items-center justify-center px-3 py-2 rounded-md border transition-colors ${
                        request.hasVoted
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-medium mt-1">{request.votes}</span>
                    </button>

                    {/* Request Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{request.title}</h3>
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{request.description}</p>

                      <div className="flex items-center gap-3 text-xs">
                        <span
                          className={`px-2 py-1 rounded-full ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                          {getCategoryLabel(request.category)}
                        </span>
                        <span className="text-zinc-500 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                          {request.commentCount}
                        </span>
                        <span className="text-zinc-500">{getRelativeTime(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
