import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useSubmitUrl } from '../hooks/useCrawler';
import { validateUrl } from '../utils';

export function UrlSubmissionForm() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const submitUrl = useSubmitUrl();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      await submitUrl.mutateAsync({ url: url.trim() });
      setUrl('');
    } catch (err) {
      setError('Failed to submit URL. Please try again.');
      console.error('Error submitting URL:', err);
    }
  };

  return (
    <div className="card mb-6">
      <div className="card-header">
        <h2 className="card-title">Add URL for Analysis</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url" className="form-label">
            Website URL
          </label>
          <div className="flex gap-2">
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="form-input"
              style={{ flex: 1 }}
              disabled={submitUrl.isPending}
            />
            <button
              type="submit"
              disabled={submitUrl.isPending}
              className="btn btn-primary"
            >
              {submitUrl.isPending ? (
                <>
                  <div className="spinner" style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add URL
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {submitUrl.isError && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            Failed to submit URL. Please try again.
          </div>
        )}

        {submitUrl.isSuccess && (
          <div className="alert alert-success">
            URL submitted successfully! Analysis will begin shortly.
          </div>
        )}
      </form>
    </div>
  );
}
