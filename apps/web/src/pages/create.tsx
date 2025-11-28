import { useState, type FormEvent } from 'react';

const TITLE_MAX = 64;
const EXPRESSION_MAX = 1024;

export default function CreatePage() {
  const [title, setTitle] = useState('');
  const [expression, setExpression] = useState('');
  const [isDraft, setIsDraft] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const expressionLength = expression.length;

  const handlePlayClick = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    console.log({ title, expression, isDraft });
  };

  const isExpressionTooLong = expressionLength > EXPRESSION_MAX;

  return (
    <section>
      <h2>Create</h2>
      <form className="create-form" onSubmit={handleSubmit}>
        <label className="field">
          <input
            type="text"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="post-title-input"
            placeholder="Name your bytebeat expression"
          />
        </label>

        <label className="field">
          <textarea
            className="expression-input"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            rows={8}
            maxLength={EXPRESSION_MAX}
            placeholder="Type your bytebeat expression here"
          />
          <div className="field-footer">
            <button
              type="button"
              className="button secondary"
              onClick={handlePlayClick}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            <span className={isExpressionTooLong ? 'counter error' : 'counter'}>
              {expressionLength} / {EXPRESSION_MAX}
            </span>
          </div>
        </label>

        <div className="form-actions">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={isDraft}
              onChange={(e) => setIsDraft(e.target.checked)}
            />
            <span>Save as draft</span>
          </label>

          <button type="submit" className="button primary" disabled={!expression.trim()}>
            Save
          </button>
        </div>
      </form>
    </section>
  );
}
