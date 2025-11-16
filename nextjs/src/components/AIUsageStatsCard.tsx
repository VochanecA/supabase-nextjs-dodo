"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Zap, TrendingUp, Activity } from 'lucide-react';

interface AIStats {
  total_requests: number;
  total_tokens: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  today_requests: number;
  today_tokens: number;
  most_used_model: string;
}

export function AIUsageStatsCard() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { createSPAClient } = await import('@/lib/supabase/client');
      const supabase = createSPAClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/ai/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      console.error('Stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Stats Unavailable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || 'Unable to load AI usage statistics'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Activity className="h-5 w-5" />
          AI Usage Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Requests */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <Zap className="h-3 w-3" />
              <p className="text-xs font-medium">Total Requests</p>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatNumber(stats.total_requests)}
            </p>
          </div>

          {/* Total Tokens */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-3 w-3" />
              <p className="text-xs font-medium">Total Tokens</p>
            </div>
            <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {formatNumber(stats.total_tokens)}
            </p>
          </div>

          {/* Today Requests */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Activity className="h-3 w-3" />
              <p className="text-xs font-medium">Today</p>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {stats.today_requests}
            </p>
          </div>

          {/* Today Tokens */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-3 w-3" />
              <p className="text-xs font-medium">Today Tokens</p>
            </div>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {formatNumber(stats.today_tokens)}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">Most Used Model:</span>
            <span className="font-medium text-blue-900 dark:text-blue-100">
              {stats.most_used_model || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-blue-700 dark:text-blue-300">Prompt Tokens:</span>
            <span className="font-medium text-blue-900 dark:text-blue-100">
              {formatNumber(stats.total_prompt_tokens)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-blue-700 dark:text-blue-300">Completion Tokens:</span>
            <span className="font-medium text-blue-900 dark:text-blue-100">
              {formatNumber(stats.total_completion_tokens)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}