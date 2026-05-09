import { FileInput, MoveHorizontal, MoveVertical, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGraphStore } from '../store/useGraphStore';
import { KPI_COLOR_I18N_KEYS, KPI_COLOR_PALETTE } from '../types';
import { parseSnapshot, type ParsedImport } from '../lib/jsonIO';
import { toast } from '../ui/Toast';
import i18n from '../i18n';

interface Props {
  onClose: () => void;
  onImportChoice: (incoming: ParsedImport) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
] as const;

const PERSPECTIVE_ONBOARD_LS_KEY = 'align-canvas-perspective-onboarding-toast';

export function SettingsPanel({ onClose, onImportChoice }: Props) {
  const { t } = useTranslation();
  const preferences = useGraphStore((s) => s.preferences);
  const setPreferences = useGraphStore((s) => s.setPreferences);
  const perspectives = useGraphStore((s) => s.perspectives);
  const addPerspective = useGraphStore((s) => s.addPerspective);
  const renamePerspective = useGraphStore((s) => s.renamePerspective);
  const removePerspective = useGraphStore((s) => s.removePerspective);
  const setActivePerspectiveId = useGraphStore((s) => s.setActivePerspectiveId);
  const colorNames = useGraphStore((s) => s.colorNames);
  const setColorName = useGraphStore((s) => s.setColorName);
  const [colorNameDrafts, setColorNameDrafts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newPerspectiveName, setNewPerspectiveName] = useState('');
  const [nameDraftByPerspectiveId, setNameDraftByPerspectiveId] = useState<Record<string, string>>(
    {},
  );

  const handleActivePerspectiveChange = (value: string) => {
    const nextId = value === '' ? null : value;
    const prevId = preferences.activePerspectiveId;
    setActivePerspectiveId(nextId);
    if (
      nextId &&
      prevId == null &&
      typeof window !== 'undefined' &&
      !localStorage.getItem(PERSPECTIVE_ONBOARD_LS_KEY)
    ) {
      toast('info', t('settings.perspectiveOnboardingToast'));
      localStorage.setItem(PERSPECTIVE_ONBOARD_LS_KEY, '1');
    }
  };

  const handleTryAddPerspective = () => {
    const created = addPerspective(newPerspectiveName);
    if (!created) return;
    setNewPerspectiveName('');
    toast('success', t('settings.perspectiveAdded', { name: created.name }));
  };

  const handleRemovePerspective = (id: string, displayName: string) => {
    if (!window.confirm(t('settings.confirmRemovePerspective', { name: displayName }))) return;
    removePerspective(id);
    toast('success', t('settings.perspectiveRemoved'));
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseSnapshot(text);
      onImportChoice(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('settings.importFailed');
      toast('error', msg);
    }
  };

  return (
    <aside className="panel flex w-[320px] shrink-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('settings.subtitle')}
          </div>
          <div className="truncate font-semibold text-emerald-50">{t('settings.title')}</div>
        </div>
        <button
          type="button"
          className="btn-ghost !p-1"
          onClick={onClose}
          aria-label={t('settings.closeAriaLabel')}
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <section>
          <div className="label">{t('settings.data')}</div>
          <button
            type="button"
            className="btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileInput size={14} />
            {t('settings.importJson')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChosen}
          />
        </section>

        <section>
          <div className="label">{t('settings.language')}</div>
          <select
            className="input"
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </section>

        <section>
          <div className="label">{t('settings.perspectiveSectionTitle')}</div>
          <p className="mb-2 text-xs leading-relaxed text-emerald-200/85">
            {t('settings.perspectiveSectionIntro')}
          </p>
          <label className="label !mb-1 !text-[10px]">{t('settings.activePerspectiveSelect')}</label>
          <select
            className="input mb-3"
            value={preferences.activePerspectiveId ?? ''}
            onChange={(e) => handleActivePerspectiveChange(e.target.value)}
            disabled={perspectives.length === 0}
          >
            <option value="">{t('settings.neutralPerspective')}</option>
            {perspectives.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {preferences.activePerspectiveId ? (
            <p className="mb-3 rounded-md border border-emerald-800/70 bg-emerald-950/50 px-2 py-1.5 text-[11px] leading-relaxed text-emerald-200/90">
              {t('settings.perspectiveEditingHint')}
            </p>
          ) : perspectives.length === 0 ? (
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t('settings.perspectiveNeutralWhenEmpty')}
            </p>
          ) : (
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t('settings.perspectiveNeutralExplanation')}
            </p>
          )}

          <div className="label !mb-1 !text-[10px]">{t('settings.perspectiveDefinitions')}</div>
          <div className="mb-3 flex gap-2">
            <input
              className="input min-w-0 flex-1 text-sm"
              placeholder={t('settings.newPerspectivePlaceholder')}
              value={newPerspectiveName}
              onChange={(e) => setNewPerspectiveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTryAddPerspective();
                }
              }}
            />
            <button type="button" className="btn shrink-0" onClick={handleTryAddPerspective}>
              <Plus size={14} />
              {t('settings.addPerspective')}
            </button>
          </div>
          {perspectives.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.noPerspectivesYet')}</p>
          ) : (
            <ul className="max-h-[220px] space-y-1.5 overflow-y-auto rounded-md border border-slate-200 p-2 dark:border-slate-800">
              {perspectives.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start gap-2 rounded-md px-1 py-1 hover:bg-emerald-900/35"
                >
                  <input
                    className="input min-w-0 flex-1 !h-9 text-xs"
                    value={nameDraftByPerspectiveId[p.id] ?? p.name}
                    onChange={(e) =>
                      setNameDraftByPerspectiveId((prev) => ({
                        ...prev,
                        [p.id]: e.target.value,
                      }))
                    }
                    onBlur={() => {
                      const raw = nameDraftByPerspectiveId[p.id] ?? p.name;
                      const next = raw.trim();
                      setNameDraftByPerspectiveId((prev) => {
                        const rest = { ...prev };
                        delete rest[p.id];
                        return rest;
                      });
                      if (!next) return;
                      renamePerspective(p.id, next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                  />
                  <button
                    type="button"
                    className="btn-ghost shrink-0 !p-2 text-slate-500 hover:!text-rose-600 dark:text-slate-400"
                    onClick={() => handleRemovePerspective(p.id, nameDraftByPerspectiveId[p.id] ?? p.name)}
                    aria-label={t('settings.removePerspectiveAriaLabel', { name: p.name })}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="label">{t('settings.display')}</div>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-emerald-100">
            <input
              type="checkbox"
              className="mt-1 rounded"
              checked={preferences.showKpiCategoryLabels}
              onChange={(e) =>
                setPreferences({ showKpiCategoryLabels: e.target.checked })
              }
            />
            <span>
              {t('settings.showCategoryLabels')}
            </span>
          </label>
        </section>

        <section>
          <div className="label">{t('settings.layoutDirection')}</div>
          <div className="flex items-center gap-1 rounded-md border border-emerald-800 bg-emerald-950 px-1 py-1">
            <button
              type="button"
              className={[
                'btn-ghost !p-1.5',
                preferences.layoutDirection === 'LR' ? '!bg-emerald-800' : '',
              ].join(' ')}
              title={t('settings.layoutLR')}
              aria-label={t('settings.layoutLR')}
              onClick={() => setPreferences({ layoutDirection: 'LR' })}
            >
              <MoveHorizontal size={14} />
            </button>
            <button
              type="button"
              className={[
                'btn-ghost !p-1.5',
                preferences.layoutDirection === 'TB' ? '!bg-emerald-800' : '',
              ].join(' ')}
              title={t('settings.layoutTB')}
              aria-label={t('settings.layoutTB')}
              onClick={() => setPreferences({ layoutDirection: 'TB' })}
            >
              <MoveVertical size={14} />
            </button>
          </div>
        </section>

        <section>
          <div className="label">{t('settings.spacing')}</div>
          <select
            className="input"
            value={preferences.layoutSpacingPreset}
            onChange={(e) =>
              setPreferences({
                layoutSpacingPreset: e.target.value as 'compact' | 'comfortable' | 'wide',
              })
            }
          >
            <option value="compact">{t('settings.spacingCompact')}</option>
            <option value="comfortable">{t('settings.spacingComfortable')}</option>
            <option value="wide">{t('settings.spacingWide')}</option>
          </select>
        </section>

        <section>
          <div className="label">{t('settings.edgeRouting')}</div>
          <select
            className="input"
            value={preferences.edgeRoutingMode}
            onChange={(e) =>
              setPreferences({
                edgeRoutingMode: e.target.value as 'bezier' | 'smoothstep' | 'step',
              })
            }
          >
            <option value="smoothstep">{t('settings.edgeSmoothstep')}</option>
            <option value="step">{t('settings.edgeStep')}</option>
            <option value="bezier">{t('settings.edgeBezier')}</option>
          </select>
        </section>

        <section>
          <div className="label">{t('settings.categoryNaming')}</div>
          <div className="space-y-2">
            {KPI_COLOR_PALETTE.map((c) => {
              const defaultLabel = t(KPI_COLOR_I18N_KEYS[c] ?? c);
              return (
                <div key={c} className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c }}
                    aria-hidden
                  />
                  <span className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                    {defaultLabel}
                  </span>
                  <input
                    className="input !h-8 text-xs"
                    placeholder={defaultLabel}
                    value={colorNameDrafts[c] ?? colorNames[c] ?? ''}
                    onChange={(e) =>
                      setColorNameDrafts((prev) => ({
                        ...prev,
                        [c]: e.target.value,
                      }))
                    }
                    onBlur={() => {
                      const nextName = (colorNameDrafts[c] ?? colorNames[c] ?? '').trim();
                      setColorName(c, nextName);
                      setColorNameDrafts((prev) => {
                        if (!(c in prev)) return prev;
                        return {
                          ...prev,
                          [c]: nextName,
                        };
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
