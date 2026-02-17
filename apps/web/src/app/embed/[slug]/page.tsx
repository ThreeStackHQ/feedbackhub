'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type RequestStatus = 'open' | 'in-progress' | 'completed';
type RequestCategory = 'feature' | 'bug-fix' | 'improvement';

interface FeatureRequest {
  id: string;
  title: string;
  status: RequestStatus;
  votes: number;
  hasVoted: boolean;
}

// Mock data for top 5 requests
const mockRequests: FeatureRequest[] = [
  {
    id: '1',
    title: 'Dark mode support',
    status: 'in-progress',
    votes: 47,
    hasVoted: false,
  },
  {
    id: '2',
    title: 'Keyboard shortcuts',
    status: 'open',
    votes: 31,
    hasVoted: false,
  },
  {
    id: '3',
    title: 'Fix mobile navigation bug',
    status: 'open',
    votes: 23,
    hasVoted: true,
  },
  {
    id: '4',
    title: 'Export to CSV',
    status: 'completed',
    votes: 19,
    hasVoted: false,
  },
  {
    id: '5',
    title: 'Slack integration',
    status: 'open',
    votes: 15,
    hasVoted: false,
  },
];

function getStatusLabel(status: RequestStatus): string {
  const labels: Record<RequestStatus, string> = {
    open: 'Open',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };
  return labels[status];
}

function getStatusColor(status: RequestStatus, isDark: boolean): string {
  if (isDark) {
    const colors: Record<RequestStatus, string> = {
      open: 'bg-gray-500/20 text-gray-300',
      'in-progress': 'bg-blue-500/20 text-blue-300',
      completed: 'bg-green-500/20 text-green-300',
    };
    return colors[status];
  } else {
    const colors: Record<RequestStatus, string> = {
      open: 'bg-gray-200 text-gray-700',
      'in-progress': 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[status];
  }
}

export default function EmbedWidgetPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState(mockRequests);
  
  // Customizable via query params
  const color = searchParams.get('color') || '#833cf6'; // Default indigo
  const theme = searchParams.get('theme') || 'light'; // 'light' or 'dark'
  const isDark = theme === 'dark';

  const handleVote = (id: string) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? { ...req, votes: req.hasVoted ? req.votes - 1 : req.votes + 1, hasVoted: !req.hasVoted }
          : req
      )
    );
  };

  // PostMessage API for auto-resize
  useEffect(() => {
    const sendHeight = () => {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'feedbackhub-resize', height }, '*');
    };

    // Send height on mount and when content changes
    sendHeight();
    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [requests]);

  const bgClass = isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900';
  const borderClass = isDark ? 'border-zinc-700' : 'border-zinc-200';
  const cardBgClass = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
  const hoverClass = isDark ? 'hover:bg-zinc-750' : 'hover:bg-zinc-100';

  return (
    <div className={`min-h-screen p-4 ${bgClass}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Feature Requests</h2>
        <button
          onClick={() => window.parent.postMessage({ type: 'feedbackhub-close' }, '*')}
          className="text-zinc-400 hover:text-zinc-600 transition-colors"
          aria-label="Close widget"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Request List */}
      <div className="space-y-2 mb-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className={`${cardBgClass} ${borderClass} border rounded-lg p-3 ${hoverClass} transition-colors cursor-pointer`}
          >
            <div className="flex items-start gap-3">
              {/* Upvote Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote(request.id);
                }}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded-md border text-xs font-medium transition-colors ${
                  request.hasVoted
                    ? `text-white border-transparent`
                    : `${isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-600'}`
                }`}
                style={request.hasVoted ? { backgroundColor: color, borderColor: color } : {}}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="mt-0.5">{request.votes}</span>
              </button>

              {/* Request Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium mb-1 line-clamp-2">{request.title}</h3>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                    request.status,
                    isDark
                  )}`}
                >
                  {getStatusLabel(request.status)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: isDark ? '#3f3f46' : '#e4e4e7' }}>
        <a
          href={`/${params.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium transition-colors"
          style={{ color }}
        >
          View all requests →
        </a>
        <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Powered by FeedbackHub
        </span>
      </div>
    </div>
  );
}
