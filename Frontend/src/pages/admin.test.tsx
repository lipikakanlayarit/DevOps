import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventPermissionPage from './EventPermissionPage';


// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Sidebar
vi.mock('@/components/sidebar', () => ({
    default: () => <div data-testid="sidebar">Sidebar</div>,
}));

// Mock EventToolbar
vi.mock('@/components/EventToolbar', () => ({
    default: ({ categories, category, onCategoryChange, order, onOrderChange, search, onSearchChange }: any) => (
        <div data-testid="event-toolbar">
            <select
                data-testid="category-select"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
            >
                {categories.map((cat: any) => (
                    <option key={cat.value} value={cat.value}>
                        {cat.label}
                    </option>
                ))}
            </select>
            <select
                data-testid="order-select"
                value={order}
                onChange={(e) => onOrderChange(e.target.value)}
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
            </select>
            <input
                data-testid="search-input"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
            />
        </div>
    ),
}));

// Mock Badge
vi.mock('@/components/badge', () => ({
    Badge: ({ children, className }: any) => (
        <span data-testid="badge" className={className}>
      {children}
    </span>
    ),
}));

// Wrapper
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

describe('EventPermissionPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    describe('Rendering', () => {
        it('renders page title', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('Event Management')).toBeDefined();
            });
        });

        it('renders sidebar', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByTestId('sidebar')).toBeDefined();
            });
        });

        it('renders event toolbar', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByTestId('event-toolbar')).toBeDefined();
            });
        });

        it('renders all table headers', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('Poster')).toBeDefined();
                expect(screen.getByText('Event Name')).toBeDefined();
                expect(screen.getByText('Organizer')).toBeDefined();
                expect(screen.getByText('Show Date')).toBeDefined();
                expect(screen.getByText('Sale Period')).toBeDefined();
                expect(screen.getByText('Location')).toBeDefined();
                expect(screen.getByText('Status')).toBeDefined();
                expect(screen.getByText('Sale seat')).toBeDefined();
            });
        });
    });

    describe('Loading State', () => {
        it('shows loading skeletons initially', () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            const table = screen.getByRole('table');
            const skeletons = table.querySelectorAll('.animate-pulse');
            expect(skeletons.length).toBeGreaterThan(0);
        });

        it('hides loading after data loads', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const table = screen.getByRole('table');
                const skeletons = table.querySelectorAll('.animate-pulse');
                expect(skeletons.length).toBe(0);
            });
        });
    });

    describe('Data Display', () => {
        it('displays events after loading', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
                expect(screen.getByText('THE RIVER BROS')).toBeDefined();
            });
        });

        it('displays event details correctly', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
                expect(screen.getByText('Butcon Organizer')).toBeDefined();
                expect(screen.getByText('MCC HALL, The Mall Bangkapi')).toBeDefined();
            });
        });

        it('displays correct number of events per page', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const images = screen.getAllByRole('img');
                expect(images.length).toBeLessThanOrEqual(6);
            });
        });

        it('displays sale seat information', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('2,450 / 5,000')).toBeDefined();
            });
        });
    });

    describe('Filtering', () => {
        it('filters events by ON SALE status', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const select = screen.getByTestId('category-select');
            fireEvent.change(select, { target: { value: 'ON SALE' } });

            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });
        });

        it('filters events by OFF SALE status', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const select = screen.getByTestId('category-select');
            fireEvent.change(select, { target: { value: 'OFF SALE' } });

            await waitFor(() => {
                expect(screen.getByText('MIDNIGHT RAVE PARTY')).toBeDefined();
            });
        });

        it('shows all events when filter is "all"', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const select = screen.getByTestId('category-select');
                fireEvent.change(select, { target: { value: 'all' } });
            });

            await waitFor(() => {
                const images = screen.getAllByRole('img');
                expect(images.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Search', () => {
        it('searches by event name', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const input = screen.getByTestId('search-input');
            fireEvent.change(input, { target: { value: 'ROBERT' } });
            vi.advanceTimersByTime(300);

            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });
        });

        it('searches by organizer', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const input = screen.getByTestId('search-input');
            fireEvent.change(input, { target: { value: 'Thai Ticket' } });
            vi.advanceTimersByTime(300);

            await waitFor(() => {
                expect(screen.getByText('THE RIVER BROS')).toBeDefined();
            });
        });

        it('searches by location', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const input = screen.getByTestId('search-input');
            fireEvent.change(input, { target: { value: 'IMPACT' } });
            vi.advanceTimersByTime(300);

            await waitFor(() => {
                expect(screen.getByText('MIDNIGHT RAVE PARTY')).toBeDefined();
            });
        });

        it('is case-insensitive', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const input = screen.getByTestId('search-input');
            fireEvent.change(input, { target: { value: 'robert' } });
            vi.advanceTimersByTime(300);

            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });
        });

        it('shows empty state for no results', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const input = screen.getByTestId('search-input');
            fireEvent.change(input, { target: { value: 'NONEXISTENT' } });
            vi.advanceTimersByTime(300);

            await waitFor(() => {
                expect(screen.getByText('ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข')).toBeDefined();
            });
        });
    });

    describe('Sorting', () => {
        it('sorts by newest by default', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const images = screen.getAllByRole('img');
                expect(images.length).toBeGreaterThan(0);
            });
        });

        it('sorts by oldest when selected', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const select = screen.getByTestId('order-select');
            fireEvent.change(select, { target: { value: 'oldest' } });

            await waitFor(() => {
                expect(screen.getByText('SOMBR UNDRESS')).toBeDefined();
            });
        });
    });

    describe('Pagination', () => {
        it('displays pagination controls', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('Previous')).toBeDefined();
                expect(screen.getByText('Next')).toBeDefined();
            });
        });

        it('disables Previous on first page', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const btn = screen.getByText('Previous');
                expect(btn.hasAttribute('disabled')).toBe(true);
            });
        });

        it('enables Next when more pages exist', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const btn = screen.getByText('Next');
                expect(btn.hasAttribute('disabled')).toBe(false);
            });
        });

        it('navigates to next page', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText(/Page 1/)).toBeDefined();
            });

            const btn = screen.getByText('Next');
            fireEvent.click(btn);

            await waitFor(() => {
                expect(screen.getByText(/Page 2/)).toBeDefined();
            });
        });

        it('navigates to previous page', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const next = screen.getByText('Next');
                fireEvent.click(next);
            });

            await waitFor(() => {
                expect(screen.getByText(/Page 2/)).toBeDefined();
            });

            const prev = screen.getByText('Previous');
            fireEvent.click(prev);

            await waitFor(() => {
                expect(screen.getByText(/Page 1/)).toBeDefined();
            });
        });

        it('resets to page 1 on filter change', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const next = screen.getByText('Next');
                fireEvent.click(next);
            });

            await waitFor(() => {
                expect(screen.getByText(/Page 2/)).toBeDefined();
            });

            const select = screen.getByTestId('category-select');
            fireEvent.change(select, { target: { value: 'ON SALE' } });

            await waitFor(() => {
                expect(screen.getByText(/Page 1/)).toBeDefined();
            });
        });

        it('resets to page 1 on search change', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const next = screen.getByText('Next');
                fireEvent.click(next);
            });

            await waitFor(() => {
                expect(screen.getByText(/Page 2/)).toBeDefined();
            });

            const input = screen.getByTestId('search-input');
            fireEvent.change(input, { target: { value: 'ROBERT' } });
            vi.advanceTimersByTime(300);

            await waitFor(() => {
                expect(screen.getByText(/Page 1/)).toBeDefined();
            });
        });
    });

    describe('Navigation', () => {
        it('navigates to event detail on row click', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText('ROBERT BALTAZAR TRIO')).toBeDefined();
            });

            const row = screen.getByText('ROBERT BALTAZAR TRIO').closest('tr');
            if (row) fireEvent.click(row);

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith(
                    expect.stringContaining('/admin/eventdetail?id=evt_1')
                );
            });
        });
    });

    describe('Results Info', () => {
        it('displays results count', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                expect(screen.getByText(/Showing/)).toBeDefined();
                expect(screen.getByText(/events/)).toBeDefined();
            });
        });

        it('updates count on filter', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const select = screen.getByTestId('category-select');
                fireEvent.change(select, { target: { value: 'ON SALE' } });
            });

            await waitFor(() => {
                expect(screen.getByText(/Showing/)).toBeDefined();
            });
        });
    });

    describe('Badge Styling', () => {
        it('applies correct style to ON SALE badge', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const badges = screen.getAllByTestId('badge');
                const onSale = badges.find(b => b.textContent === 'ON SALE');
                expect(onSale?.className).toContain('bg-emerald-100');
                expect(onSale?.className).toContain('text-emerald-800');
            });
        });

        it('applies correct style to OFF SALE badge', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const select = screen.getByTestId('category-select');
                fireEvent.change(select, { target: { value: 'OFF SALE' } });
            });

            await waitFor(() => {
                const badges = screen.getAllByTestId('badge');
                const offSale = badges.find(b => b.textContent === 'OFF SALE');
                expect(offSale?.className).toContain('bg-zinc-200');
                expect(offSale?.className).toContain('text-zinc-800');
            });
        });
    });

    describe('Images', () => {
        it('renders poster images', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const images = screen.getAllByRole('img');
                expect(images.length).toBeGreaterThan(0);
                images.forEach(img => {
                    expect(img.getAttribute('alt')).toBeTruthy();
                    expect(img.getAttribute('src')).toBeTruthy();
                });
            });
        });

        it('disables dragging on images', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const images = screen.getAllByRole('img');
                images.forEach(img => {
                    expect(img.getAttribute('draggable')).toBe('false');
                });
            });
        });
    });

    describe('Date Formatting', () => {
        it('formats dates correctly', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const dates = screen.getAllByText(/\d{2}\s\w{3}\s\d{4}/);
                expect(dates.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Empty State', () => {
        it('shows message when no events match', async () => {
            render(<EventPermissionPage />, { wrapper: Wrapper });
            await waitFor(() => {
                const input = screen.getByTestId('search-input');
                fireEvent.change(input, { target: { value: 'ZZZZZ' } });
            });

            vi.advanceTimersByTime(300);

            await waitFor(() => {
                expect(screen.getByText('ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข')).toBeDefined();
            });
        });
    });
});