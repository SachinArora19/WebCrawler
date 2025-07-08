// Simple test to verify app renders without crashing
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Web Crawler')).toBeInTheDocument();
  });

  it('displays the URL submission form', () => {
    render(<App />);
    expect(screen.getByText('Add URL for Analysis')).toBeInTheDocument();
  });

  it('displays statistics cards', () => {
    render(<App />);
    expect(screen.getByText('Total URLs')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });
});
