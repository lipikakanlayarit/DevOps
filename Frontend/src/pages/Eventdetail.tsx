// src/pages/Eventdetail.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EventDetails from './Eventdetail';
import { api } from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('@/components/sidebarorg', () => ({
    Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('@/components/inputtxt', () => ({
    Input: ({ value, onChange, placeholder, disabled }: any) => (
        <input
            data-testid="custom-input"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
        />
    ),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('EventDetails Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
        URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderComponent = (eventId?: string) => {
        const path = eventId ? `/eventdetail/${eventId}` : '/eventdetail';
        return render(
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path="/eventdetail/:eventId?" element={<EventDetails />} />
                </Routes>
            </MemoryRouter>
        );
    };

    describe('Create Mode (New Event)', () => {
        it('should render create event form correctly', () => {
            renderComponent();

            expect(screen.getByText('Event Details')).toBeInTheDocument();
            expect(screen.getByText('Add all of your event details.')).toBeInTheDocument();
            expect(screen.getByText('Show Date and Time')).toBeInTheDocument();
            expect(screen.getByText('Location')).toBeInTheDocument();
            expect(screen.getByText('Description')).toBeInTheDocument();
        });

        it('should initialize with default date/time (7 days from now)', () => {
            renderComponent();

            const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
            expect(dateInputs.length).toBeGreaterThan(0);

            const timeInputs = screen.getAllByDisplayValue('19:00');
            expect(timeInputs.length).toBeGreaterThan(0);
        });

        it('should update event name input', () => {
            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            const eventNameInput = inputs[0];

            fireEvent.change(eventNameInput, { target: { value: 'Test Event' } });
            expect(eventNameInput).toHaveValue('Test Event');
        });

        it('should update category selection', () => {
            renderComponent();

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            expect(categorySelect).toHaveValue('1');
        });

        it('should show validation error when event name is empty', async () => {
            renderComponent();

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('กรุณากรอก Event Name');
            });
        });

        it('should show validation error when category is not selected', async () => {
            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'Test Event' } });

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('กรุณาเลือก Category');
            });
        });

        it('should show validation error when location name is empty for venue type', async () => {
            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'Test Event' } });

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            const venueRadio = screen.getByLabelText(/Venue/i);
            fireEvent.click(venueRadio);

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('กรุณากรอกชื่อสถานที่ (Location name)');
            });
        });

        it('should create new event successfully', async () => {
            const mockResponse = { data: { event_id: 123 } };
            vi.mocked(api.post).mockResolvedValue(mockResponse);

            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'New Event' } });

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith(
                    '/events',
                    expect.objectContaining({
                        eventName: 'New Event',
                        categoryId: 1,
                    }),
                    expect.any(Object)
                );
                expect(global.alert).toHaveBeenCalledWith('สร้างอีเวนต์สำเร็จ!');
                expect(mockNavigate).toHaveBeenCalledWith('/ticketdetail/123', { replace: true });
            });
        });
    });

    describe('Edit Mode (Existing Event)', () => {
        const mockEventData = {
            eventName: 'Existing Event',
            description: 'Test description',
            categoryId: 2,
            venueName: 'Main Hall',
            startDateTime: '2025-10-20T19:00:00+07:00',
            endDateTime: '2025-10-20T22:00:00+07:00',
        };

        it('should load existing event data', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockEventData });

            renderComponent('456');

            expect(screen.getByText('กำลังโหลดข้อมูลอีเวนต์...')).toBeInTheDocument();

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledWith('/events/456');
            });

            await waitFor(() => {
                expect(screen.queryByText('กำลังโหลดข้อมูลอีเวนต์...')).not.toBeInTheDocument();
            });
        });

        it('should show link to ticket details in edit mode', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockEventData });

            renderComponent('456');

            await waitFor(() => {
                const link = screen.getByText('ไป Ticket Details ของอีเวนต์นี้');
                expect(link).toBeInTheDocument();
                expect(link).toHaveAttribute('href', '/ticketdetail/456');
            });
        });

        it('should update existing event successfully', async () => {
            vi.mocked(api.get).mockResolvedValue({ data: mockEventData });
            vi.mocked(api.put).mockResolvedValue({ data: { success: true } });

            renderComponent('456');

            await waitFor(() => {
                expect(screen.queryByText('กำลังโหลดข้อมูลอีเวนต์...')).not.toBeInTheDocument();
            });

            const saveButton = screen.getByText('Update & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(api.put).toHaveBeenCalledWith(
                    '/events/456',
                    expect.any(Object)
                );
                expect(global.alert).toHaveBeenCalledWith('อัปเดตอีเวนต์สำเร็จ!');
            });
        });
    });

    describe('Image Upload', () => {
        it('should handle image file selection', () => {
            renderComponent();

            const file = new File(['image'], 'test.png', { type: 'image/png' });
            const fileInput = screen.getByLabelText(/Choose image/i).closest('button')?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

            if (fileInput) {
                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                });

                fireEvent.change(fileInput);

                expect(URL.createObjectURL).toHaveBeenCalledWith(file);
            }
        });

        it('should show error for non-image file', () => {
            renderComponent();

            const file = new File(['content'], 'test.txt', { type: 'text/plain' });
            const fileInput = screen.getByLabelText(/Choose image/i).closest('button')?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

            if (fileInput) {
                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                });

                fireEvent.change(fileInput);

                expect(screen.getByText(/กรุณาเลือกรูปภาพเท่านั้น/i)).toBeInTheDocument();
            }
        });

        it('should show error for file larger than 10MB', () => {
            renderComponent();

            const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.png', { type: 'image/png' });
            Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

            const fileInput = screen.getByLabelText(/Choose image/i).closest('button')?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

            if (fileInput) {
                Object.defineProperty(fileInput, 'files', {
                    value: [largeFile],
                    writable: false,
                });

                fireEvent.change(fileInput);

                expect(screen.getByText(/ไฟล์ใหญ่เกิน 10MB/i)).toBeInTheDocument();
            }
        });

        it('should upload image when creating event', async () => {
            const mockResponse = { data: { event_id: 789 } };
            vi.mocked(api.post).mockResolvedValue(mockResponse);

            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'Event with Image' } });

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            const file = new File(['image'], 'test.png', { type: 'image/png' });
            const fileInput = screen.getByLabelText(/Choose image/i).closest('button')?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

            if (fileInput) {
                Object.defineProperty(fileInput, 'files', {
                    value: [file],
                    writable: false,
                });
                fireEvent.change(fileInput);
            }

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledTimes(2); // event + image
            });
        });

        it('should delete image from server in edit mode', async () => {
            const mockEventData = {
                eventName: 'Event',
                categoryId: 1,
                venueName: 'Hall',
                startDateTime: '2025-10-20T19:00:00+07:00',
                endDateTime: '2025-10-20T22:00:00+07:00',
            };

            vi.mocked(api.get).mockResolvedValue({ data: mockEventData });
            vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

            renderComponent('456');

            await waitFor(() => {
                expect(screen.queryByText('กำลังโหลดข้อมูลอีเวนต์...')).not.toBeInTheDocument();
            });

            const deleteButton = screen.getByText('ลบรูปจากเซิร์ฟเวอร์');
            fireEvent.click(deleteButton);

            await waitFor(() => {
                expect(global.confirm).toHaveBeenCalled();
                expect(api.delete).toHaveBeenCalledWith('/events/456/cover');
            });
        });
    });

    describe('Date and Time Management', () => {
        it('should add new date/time entry', () => {
            renderComponent();

            const addButton = screen.getByText('Add Date and Time');
            fireEvent.click(addButton);

            const dateInputs = screen.getAllByLabelText(/Start Date/i);
            expect(dateInputs.length).toBe(2);
        });

        it('should remove date/time entry', () => {
            renderComponent();

            const addButton = screen.getByText('Add Date and Time');
            fireEvent.click(addButton);

            const removeButtons = screen.getAllByLabelText('Remove date-time block');
            fireEvent.click(removeButtons[0]);

            const dateInputs = screen.getAllByLabelText(/Start Date/i);
            expect(dateInputs.length).toBe(1);
        });

        it('should update start date', () => {
            renderComponent();

            const startDateInput = screen.getByLabelText(/Start Date/i);
            fireEvent.change(startDateInput, { target: { value: '2025-12-25' } });

            expect(startDateInput).toHaveValue('2025-12-25');
        });

        it('should update start time', () => {
            renderComponent();

            const startTimeInput = screen.getByLabelText(/Start Time/i);
            fireEvent.change(startTimeInput, { target: { value: '20:00' } });

            expect(startTimeInput).toHaveValue('20:00');
        });
    });

    describe('Location Type', () => {
        it('should switch to venue location type', () => {
            renderComponent();

            const venueRadio = screen.getByLabelText(/Venue/i);
            fireEvent.click(venueRadio);

            const locationInputs = screen.getAllByTestId('custom-input');
            const locationInput = locationInputs.find(input =>
                input.getAttribute('placeholder')?.includes('Main Hall')
            );

            expect(locationInput).not.toBeDisabled();
        });

        it('should switch to "to be announced" location type', () => {
            renderComponent();

            const announcedRadio = screen.getByLabelText(/To be announced/i);
            fireEvent.click(announcedRadio);

            const locationInputs = screen.getAllByTestId('custom-input');
            const locationInput = locationInputs.find(input =>
                input.getAttribute('value') === 'To be announced'
            );

            expect(locationInput).toBeDisabled();
        });

        it('should save "To be announced" when announced type is selected', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: { event_id: 999 } });

            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'Test Event' } });

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            const announcedRadio = screen.getByLabelText(/To be announced/i);
            fireEvent.click(announcedRadio);

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith(
                    '/events',
                    expect.objectContaining({
                        venueName: 'To be announced',
                    }),
                    expect.any(Object)
                );
            });
        });
    });

    describe('Description', () => {
        it('should update description textarea', () => {
            renderComponent();

            const descriptionTextarea = screen.getByPlaceholderText(/Add more details about your event/i);
            fireEvent.change(descriptionTextarea, { target: { value: 'Event description here' } });

            expect(descriptionTextarea).toHaveValue('Event description here');
        });
    });

    describe('Cancel Button', () => {
        it('should render cancel button with correct link', () => {
            renderComponent();

            const cancelButton = screen.getByText('Cancel');
            expect(cancelButton).toHaveAttribute('href', '/organizationmnge');
        });
    });

    describe('Error Handling', () => {
        it('should handle API error when creating event', async () => {
            const errorMessage = 'Server error';
            vi.mocked(api.post).mockRejectedValue({
                response: { data: { error: errorMessage } },
            });

            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'Test Event' } });

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(errorMessage);
            });
        });

        it('should handle API error when loading event', async () => {
            vi.mocked(api.get).mockRejectedValue(new Error('Load failed'));

            renderComponent('456');

            await waitFor(() => {
                expect(api.get).toHaveBeenCalled();
            });
        });

        it('should handle missing event_id in create response', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: {} });

            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'Test Event' } });

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(
                    expect.stringContaining('ไม่พบ event_id')
                );
            });
        });
    });

    describe('LocalStorage', () => {
        it('should save event data to localStorage after successful creation', async () => {
            vi.mocked(api.post).mockResolvedValue({ data: { event_id: 123 } });

            renderComponent();

            const inputs = screen.getAllByTestId('custom-input');
            fireEvent.change(inputs[0], { target: { value: 'Cached Event' } });

            const categorySelect = screen.getByRole('combobox');
            fireEvent.change(categorySelect, { target: { value: '1' } });

            const saveButton = screen.getByText('Save & Continue');
            fireEvent.click(saveButton);

            await waitFor(() => {
                const cached = localStorage.getItem('event:123');
                expect(cached).toBeTruthy();

                const lastEvent = localStorage.getItem('event:last');
                expect(lastEvent).toBeTruthy();
            });
        });

        it('should cache event data when loading in edit mode', async () => {
            const mockEventData = {
                eventName: 'Cached Event',
                categoryId: 1,
                venueName: 'Hall',
                startDateTime: '2025-10-20T19:00:00+07:00',
                endDateTime: '2025-10-20T22:00:00+07:00',
            };

            vi.mocked(api.get).mockResolvedValue({ data: mockEventData });

            renderComponent('789');

            await waitFor(() => {
                const cached = localStorage.getItem('event:789');
                expect(cached).toBeTruthy();
            });
        });
    });
});