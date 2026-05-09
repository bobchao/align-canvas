import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { computeSearchHits } from '../lib/search';
import { useGraphStore } from '../store/useGraphStore';

export function SearchBar() {
  const { t } = useTranslation();
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const closeSearch = useGraphStore((s) => s.closeSearch);
  const kpis = useGraphStore((s) => s.kpis);
  const relations = useGraphStore((s) => s.relations);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const hits = useMemo(
    () => computeSearchHits(searchQuery, kpis, relations),
    [searchQuery, kpis, relations],
  );

  const trimmed = searchQuery.trim();
  const totalHits = hits.nodeHitCount + hits.edgeNoteHitCount;

  let resultLabel: string;
  if (!trimmed) {
    resultLabel = t('searchBar.empty');
  } else if (totalHits === 0) {
    resultLabel = t('searchBar.noResults');
  } else {
    const parts: string[] = [];
    if (hits.nodeHitCount > 0) parts.push(t('searchBar.nodeCount', { count: hits.nodeHitCount }));
    if (hits.edgeNoteHitCount > 0) parts.push(t('searchBar.edgeCount', { count: hits.edgeNoteHitCount }));
    resultLabel = parts.join(' · ');
  }

  const noResults = trimmed.length > 0 && totalHits === 0;

  return (
    <div
      className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-md border border-emerald-800 bg-emerald-950/95 px-2 py-1.5 shadow-lg backdrop-blur"
      role="search"
    >
      <Search size={14} className="shrink-0 text-emerald-400" aria-hidden />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeSearch();
          }
        }}
        placeholder={t('searchBar.placeholder')}
        aria-label={t('searchBar.ariaLabel')}
        className="w-56 bg-transparent text-sm text-emerald-50 placeholder:text-emerald-600 outline-none"
      />
      <span
        className={[
          'shrink-0 whitespace-nowrap text-[11px]',
          noResults ? 'text-rose-300' : 'text-emerald-300',
        ].join(' ')}
        aria-live="polite"
      >
        {resultLabel}
      </span>
      <button
        type="button"
        onClick={closeSearch}
        className="shrink-0 rounded p-1 text-emerald-300 transition hover:bg-emerald-900 hover:text-emerald-50"
        title={t('searchBar.closeTitle')}
        aria-label={t('searchBar.closeAriaLabel')}
      >
        <X size={14} />
      </button>
    </div>
  );
}
