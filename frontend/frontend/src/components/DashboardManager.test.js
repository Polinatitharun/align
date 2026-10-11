import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardManager from './DashboardManager';
import api from '../api/axios';

/* ---------------- MOCKS ---------------- */

jest.mock('../api/axios');

jest.mock('./Sidebar', () => (props) => (
  <div>
    {props.items.map(item => (
      <button key={item.id} onClick={() => props.onTabChange(item.id)}>
        {item.label}
      </button>
    ))}
  </div>
));

/* ---------------- DYNAMIC MOCK DATA ---------------- */

const mockBackendData = {
  jobs: [
    {
      id: 101,
      title: 'Backend Developer',
      department: 'Engineering',
      location: 'bangalore',
      openings: 3,
      postedDate: '2024-01-10',
      techSkills: 'Node.js, Express'
    }
  ],
  trainees: [
    {
      id: 1,
      userInfo: {
        userId: 11,
        name: 'Alice Johnson',
        location: 'bangalore',
        employeeId: 'EMP100',
        averageScore: 85
      },
      strengths: [],
      weaknesses: []
    }
  ]
};

const mockUser = { name: 'Manager One' };

/* ---------------- HELPER ---------------- */

const mockApiResponses = () => {
  api.get.mockImplementation((url) => {
    if (url === '/jobs/') {
      return Promise.resolve({ data: mockBackendData.jobs });
    }
    if (url === 'api/profiles/') {
      return Promise.resolve({ data: mockBackendData.trainees });
    }
    if (url === 'jobs/recommendations/') {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: {} });
  });
};

/* ---------------- TESTS ---------------- */

describe('DashboardManager – Dynamic Backend Data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiResponses();
  });

  test('renders manager name from backend props', () => {
    render(<DashboardManager userData={mockUser} onLogout={jest.fn()} />);
    expect(screen.getByText(/Manager One/i)).toBeInTheDocument();
  });

  test('loads job profiles dynamically from backend', async () => {
    render(<DashboardManager userData={mockUser} onLogout={jest.fn()} />);

    fireEvent.click(screen.getByText('Job Profiles'));

    await waitFor(() => {
      expect(
        screen.getByText(mockBackendData.jobs[0].title)
      ).toBeInTheDocument();
    });
  });

  test('loads trainees dynamically from backend', async () => {
    render(<DashboardManager userData={mockUser} onLogout={jest.fn()} />);

    fireEvent.click(screen.getByText('Trainees'));

    await waitFor(() => {
      expect(
        screen.getByText(mockBackendData.trainees[0].userInfo.name)
      ).toBeInTheDocument();

      expect(
        screen.getByText(mockBackendData.trainees[0].userInfo.employeeId)
      ).toBeInTheDocument();
    });
  });

  test('opens trainee drawer using backend data', async () => {
    render(<DashboardManager userData={mockUser} onLogout={jest.fn()} />);

    fireEvent.click(screen.getByText('Trainees'));

    await waitFor(() => {
      fireEvent.click(screen.getByRole('button', { name: '' }));
    });

    await waitFor(() => {
      expect(
        screen.getByText(mockBackendData.trainees[0].userInfo.name)
      ).toBeInTheDocument();

      expect(screen.getByText(/Avg Score/i)).toBeInTheDocument();
    });
  });

  test('shows correct counts derived from backend data', async () => {
    render(<DashboardManager userData={mockUser} onLogout={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(mockBackendData.jobs.length.toString())).toBeInTheDocument();
      expect(screen.getByText(mockBackendData.trainees.length.toString())).toBeInTheDocument();
    });
  });
});
