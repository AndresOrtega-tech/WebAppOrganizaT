import { Loader2, Sparkles } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';

interface AiReformulateButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasText: boolean;
}

export default function AiReformulateButton({ onClick, isLoading, hasText }: AiReformulateButtonProps) {
  if (!isFeatureEnabled('ENABLE_AI_REFORMULATION') || !hasText) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      Reformular con IA
    </button>
  );
}
