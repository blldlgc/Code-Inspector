import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CodeCoverage from '@/pages/CodeCoverage';
import axios from 'axios';
import { exampleCodes } from '@/constants/exampleCodes';

// Mock axios
jest.mock('axios');

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock PageLayout bileşeni
jest.mock('@/components/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>
}));

// Mock RainbowButton bileşeni
jest.mock('@/components/ui/rainbow-button', () => ({
  RainbowButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} data-testid="rainbow-button">{children}</button>
  )
}));

// Test için örnek coverage verisi
const mockCoverageData = {
  coveragePercentage: 75.5,
  coveredLines: 15,
  totalLines: 20,
  methodCoverage: {
    'testMethod': [8, 10]
  }
};

describe('CodeCoverage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('bileşen doğru şekilde render ediliyor', () => {
    render(<CodeCoverage />);
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
    expect(screen.getByText('Code Input')).toBeInTheDocument();
    expect(screen.getByText('Application Code')).toBeInTheDocument();
    expect(screen.getByText('Test Code')).toBeInTheDocument();
    expect(screen.getByText('Calculate Coverage')).toBeInTheDocument();
  });

  test('örnek kodlar doğru şekilde yükleniyor', () => {
    render(<CodeCoverage />);
    fireEvent.click(screen.getByText('Load Example Codes'));
    
    const appCodeTextarea = screen.getByPlaceholderText('Paste your application code here...') as HTMLTextAreaElement;
    const testCodeTextarea = screen.getByPlaceholderText('Paste your test code here...') as HTMLTextAreaElement;
    
    expect(appCodeTextarea.value).toBe(exampleCodes.coverage.appCode);
    expect(testCodeTextarea.value).toBe(exampleCodes.coverage.testCode);
  });

  test('kod analizi başarılı şekilde çalışıyor', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: mockCoverageData });
    
    render(<CodeCoverage />);
    
    const appCodeTextarea = screen.getByPlaceholderText('Paste your application code here...');
    const testCodeTextarea = screen.getByPlaceholderText('Paste your test code here...');
    
    fireEvent.change(appCodeTextarea, { target: { value: 'test app code' } });
    fireEvent.change(testCodeTextarea, { target: { value: 'test code' } });
    
    fireEvent.click(screen.getByText('Calculate Coverage'));
    
    await waitFor(() => {
      expect(screen.getByText('Coverage Analysis Results')).toBeInTheDocument();
      expect(screen.getByText('Overall Test Coverage')).toBeInTheDocument();
      expect(screen.getByText('75.50%')).toBeInTheDocument();
    });
  });

  test('loading durumu doğru şekilde gösteriliyor', async () => {
    (axios.post as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: mockCoverageData }), 100))
    );
    
    render(<CodeCoverage />);
    
    const appCodeTextarea = screen.getByPlaceholderText('Paste your application code here...');
    const testCodeTextarea = screen.getByPlaceholderText('Paste your test code here...');
    
    fireEvent.change(appCodeTextarea, { target: { value: 'test code' } });
    fireEvent.change(testCodeTextarea, { target: { value: 'test code' } });
    
    fireEvent.click(screen.getByText('Calculate Coverage'));
    
    expect(screen.getByText('Calculating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Calculating...')).not.toBeInTheDocument();
    });
  });

  test('test generator yönlendirmesi çalışıyor', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: mockCoverageData });
    
    render(<CodeCoverage />);
    
    const appCodeTextarea = screen.getByPlaceholderText('Paste your application code here...');
    const testCodeTextarea = screen.getByPlaceholderText('Paste your test code here...');
    
    fireEvent.change(appCodeTextarea, { target: { value: 'test app code' } });
    fireEvent.change(testCodeTextarea, { target: { value: 'test code' } });
    
    fireEvent.click(screen.getByText('Calculate Coverage'));
    
    await waitFor(() => {
      const improveButton = screen.getByTestId('rainbow-button');
      fireEvent.click(improveButton);
      expect(mockNavigate).toHaveBeenCalledWith('/testgenerator', { state: { sourceCode: 'test app code' } });
    });
  });
});
