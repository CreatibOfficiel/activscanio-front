'use client';

import { useState } from 'react';
import { Download, FileText, FileJson } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportDataButtons() {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const handleExport = async (
    type: 'achievements' | 'bets' | 'stats',
    format: 'csv' | 'json'
  ) => {
    setIsExporting(`${type}-${format}`);

    try {
      const endpoint =
        type === 'stats'
          ? '/export/stats/json'
          : type === 'achievements'
          ? '/export/achievements/csv'
          : '/export/bets/csv';

      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clerk_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${type}`);
      }

      let filename: string;
      let blob: Blob;

      if (format === 'json') {
        const data = await response.json();
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        filename = `activscanio-${type}-${Date.now()}.json`;
      } else {
        blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        filename = contentDisposition
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `activscanio-${type}-${Date.now()}.csv`;
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${type}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
      <div className="flex items-center gap-3 mb-6">
        <Download className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">Export Data</h2>
      </div>

      <p className="text-neutral-400 mb-6">
        Download your ActivScanIO data in CSV or JSON format
      </p>

      <div className="space-y-3">
        {/* Export Achievements */}
        <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-semibold text-white">Achievements</h3>
              <p className="text-sm text-neutral-400">
                All your unlocked achievements
              </p>
            </div>
          </div>
          <button
            onClick={() => handleExport('achievements', 'csv')}
            disabled={isExporting === 'achievements-csv'}
            className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium transition-colors text-sm"
          >
            {isExporting === 'achievements-csv' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Export Betting History */}
        <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-green-400" />
            <div>
              <h3 className="font-semibold text-white">Betting History</h3>
              <p className="text-sm text-neutral-400">
                Your last 500 bets
              </p>
            </div>
          </div>
          <button
            onClick={() => handleExport('bets', 'csv')}
            disabled={isExporting === 'bets-csv'}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium transition-colors text-sm"
          >
            {isExporting === 'bets-csv' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* Export Complete Stats */}
        <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileJson className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-semibold text-white">Complete Stats</h3>
              <p className="text-sm text-neutral-400">
                Comprehensive data (achievements, bets, rankings, XP history)
              </p>
            </div>
          </div>
          <button
            onClick={() => handleExport('stats', 'json')}
            disabled={isExporting === 'stats-json'}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-700 disabled:text-neutral-500 text-white font-medium transition-colors text-sm"
          >
            {isExporting === 'stats-json' ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-sm text-blue-300">
          <strong>Note:</strong> Your data is exported in industry-standard formats (CSV/JSON) and can be imported into spreadsheet software or other applications.
        </p>
      </div>
    </div>
  );
}
