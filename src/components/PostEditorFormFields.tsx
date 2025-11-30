import { useState } from 'react';
import { ExpressionEditor, ExpressionErrorSnippet } from './ExpressionEditor';
import { ModeOption, SampleRateOption, encodeMode, encodeSampleRate } from '../model/expression';
import { ValidationIssue } from '../model/expression-validator';
import type { PostMetadataModel } from '../model/postEditor';
import exp from 'node:constants';
import { EXPRESSION_MAX } from '../constants';

interface PostEditorFormFieldsProps {
  meta: PostMetadataModel;
  onMetaChange: (next: PostMetadataModel) => void;

  expression: string;
  onExpressionChange: (value: string) => void;

  isPlaying: boolean;
  onPlayClick: () => void;

  validationIssue: ValidationIssue | null;
  lastError: string | null;

  saveStatus: 'idle' | 'saving' | 'success';
  saveError: string;

  submitLabel: string;

  showDeleteButton?: boolean;
  onDeleteClick?: () => void;

  showActions: boolean;
}

export function PostEditorFormFields(props: PostEditorFormFieldsProps) {
  const {
    meta,
    onMetaChange,
    expression,
    onExpressionChange,
    isPlaying,
    onPlayClick,
    validationIssue,
    lastError,
    saveStatus,
    saveError,
    submitLabel,
    showDeleteButton,
    onDeleteClick,
    showActions,
  } = props;

  const expressionLength = expression.length;
  const isExpressionTooLong = expressionLength > EXPRESSION_MAX;
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const canSubmit = Boolean(expression.trim()) && !validationIssue && saveStatus !== 'saving';

  const { title, mode, sampleRate, isDraft } = meta;

  const toggleMode = () => {
    if (mode === ModeOption.Int) {
      onMetaChange({ ...meta, mode: ModeOption.Float });
    } else {
      onMetaChange({ ...meta, mode: ModeOption.Int });
    }
  };

  const rotateSampleRate = () => {
    switch (sampleRate) {
      case SampleRateOption._44_1k:
        onMetaChange({ ...meta, sampleRate: SampleRateOption._8k });
        break;
      case SampleRateOption._8k:
        onMetaChange({ ...meta, sampleRate: SampleRateOption._16k });
        break;
      case SampleRateOption._16k:
        onMetaChange({ ...meta, sampleRate: SampleRateOption._44_1k });
        break;
    }
  };

  const handleCopyShareLink = async () => {
    const trimmedExpr = expression.trim();
    if (!trimmedExpr) return;

    if (typeof window === 'undefined') return;

    const trimmedTitle = title.trim();

    const sampleRateValue = encodeSampleRate(sampleRate);
    const modeValue = encodeMode(mode);

    const payload = {
      title: trimmedTitle || undefined,
      expr: trimmedExpr,
      mode: modeValue,
      sr: sampleRateValue,
    };

    let encoded = '';
    try {
      encoded = btoa(JSON.stringify(payload));
    } catch {
      return;
    }

    const origin = window.location.origin;
    const href = `${origin}/create?q=${encodeURIComponent(encoded)}`;

    try {
      await navigator.clipboard.writeText(href);
      setShareLinkCopied(true);
      window.setTimeout(() => setShareLinkCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <>
      <label className="field">
        <input
          type="text"
          maxLength={64}
          value={title}
          onChange={(e) => onMetaChange({ ...meta, title: e.target.value })}
          className="post-title-input"
          placeholder="Name your bytebeat expression"
        />
      </label>

      <div className="chips">
        <button type="button" className="chip" onClick={toggleMode}>
          {mode}
        </button>
        <button type="button" className="chip" onClick={rotateSampleRate}>
          {sampleRate}
        </button>
      </div>

      <div className="expression-input">
        <ExpressionEditor value={expression} onChange={onExpressionChange} />
      </div>
      <div className="field-footer">
        <button
          type="button"
          className="button secondary"
          disabled={!expression.trim() || !!validationIssue}
          onClick={onPlayClick}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <span className={isExpressionTooLong ? 'counter error' : 'counter'}>
          {expressionLength} / {EXPRESSION_MAX}
        </span>
      </div>

      {validationIssue && (
        <div className="expression-preview">
          {validationIssue.message}
          <ExpressionErrorSnippet expression={expression} issue={validationIssue} />
        </div>
      )}
      {lastError ? <p className="error-message">{lastError}</p> : null}

      {showActions && (
        <div className="form-actions">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) =>
                onMetaChange({
                  ...meta,
                  isDraft: e.target.checked,
                })
              }
            />
            <span>Save as draft</span>
          </label>

          <div className="form-actions-buttons">
            {showDeleteButton && onDeleteClick && (
              <button
                type="button"
                className="button danger"
                onClick={onDeleteClick}
                disabled={saveStatus === 'saving'}
              >
                Delete
              </button>
            )}

            <button type="submit" className="button primary" disabled={!canSubmit}>
              {submitLabel}
            </button>
          </div>
        </div>
      )}

      <div className="form-actions-buttons" style={{ marginTop: '8px' }}>
        <button
          type="button"
          className="button secondary"
          disabled={!expression.trim()}
          onClick={handleCopyShareLink}
        >
          {shareLinkCopied ? 'Link copied' : 'Copy share link'}
        </button>
      </div>

      {saveError && <p className="error-message">{saveError}</p>}
      {saveStatus === 'success' && !saveError && (
        <p className="counter">Post {submitLabel.toLowerCase()}.</p>
      )}
    </>
  );
}
