import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Profile from './Profile';
import { useAuth } from '@/features/auth/AuthContext';
import { profileApi } from '@/lib/api';

// Mock dependencies
vi.mock('@/features/auth/AuthContext');
vi.mock('@/lib/api');
vi.mock('@/components/TicketCard', () => ({
    default: (props: any) => <div data-testid="ticket-card">{props.title}</div>
}));
vi.mock('@/components/EventCard', () => ({
    default: (props: any) => (
        <div data-testid="event-card" onClick={props.onClick}>
            {props.title}
        </div>
    )
}));
vi.mock('@/components/EventToolbar', () => ({
    default: (props: any) => (
        <div data-testid="event-toolbar">
            <input
                data-testid="search-input"
                value={props.search}
                onChange={(e) => props.onSearchChange(e.target.value)}
            />
            <select
                data-testid="category-select"
                value={props.category}
                onChange={(e) => props.onCategoryChange(e.target.value)}
            >
                {props.categories.map((cat: any) => (
                    <option key={cat.value} value={cat.value}>
                        {cat.label}
                    </option>
                ))}
            </select>
            <select
                data-testid="order-select"
                value={props.order}
                onChange={(e) => props.onOrderChange(e.target.value)}
            >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
            </select>
        </div>
    )
}));

const mockUseAuth = vi.mocked(useAuth);
const mockProfileApi = vi.mocked(profileApi);

describe('Profile Component', () => {
    const mockProfile = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        idCard: '1234567890123',
    };

    const mockOrganizerProfile = {
        id: '2',
        username: 'organizer',
        email: 'org@example.com',
        role: 'ORGANIZER',
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '0987654321',
        companyName: 'Event Co',
        taxId: 'TAX123',
        address: '123 Street',
        verificationStatus: 'VERIFIED',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        delete (window as any).location;
        (window as any).location = { href: '' };
        window.alert = vi.fn();
        console.log = vi.fn();
        console.error = vi.fn();
    });

    describe('Authentication Flow', () => {
        // ตรวจสอบว่าเมื่อสถานะ Auth เป็น "loading" จะโชว์ข้อความ "Loading..."
        it('should show loading state when authentication is loading', () => {
            mockUseAuth.mockReturnValue({
                state: { status: 'loading', user: null },
                login: vi.fn(),
                logout: vi.fn(),
            });

            render(<Profile />);
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        // ถ้ายังไม่ได้ล็อกอิน (unauthenticated) → ต้อง redirect ไปหน้า /login
        it('should redirect to login when unauthenticated', () => {
            mockUseAuth.mockReturnValue({
                state: { status: 'unauthenticated', user: null },
                login: vi.fn(),
                logout: vi.fn(),
            });

            render(<Profile />);
            expect(window.location.href).toBe('/login');
        });

        // เมื่อ Authenticated แล้ว ระบบต้องเรียก API getProfile() เพื่อโหลดข้อมูลโปรไฟล์
        it('should fetch profile when authenticated', async () => {
            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });

            mockProfileApi.getProfile.mockResolvedValue({ data: mockProfile });

            render(<Profile />);

            await waitFor(() => {
                expect(mockProfileApi.getProfile).toHaveBeenCalled();
            });
        });
    });

    describe('ProfileCard Component', () => {

        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });
            mockProfileApi.getProfile.mockResolvedValue({ data: mockProfile });
        });

        // ทดสอบว่าข้อมูลโปรไฟล์ของผู้ใช้ (User role) แสดงครบ เช่น Email, ชื่อ, เบอร์โทร, ID Card
        it('should display user profile information', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('test@example.com')).toBeInTheDocument();
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('testuser')).toBeInTheDocument();
                expect(screen.getByText('1234567890')).toBeInTheDocument();
                expect(screen.getByText('1234567890123')).toBeInTheDocument();
            });
        });

        // ทดสอบว่าข้อมูลโปรไฟล์ของ Organizer แสดงครบ เช่น ชื่อบริษัท, สถานะการยืนยัน
        it('should display organizer profile information', async () => {
            mockProfileApi.getProfile.mockResolvedValue({ data: mockOrganizerProfile });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('org@example.com')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
                expect(screen.getByText('Event Co')).toBeInTheDocument();
                expect(screen.getByText('VERIFIED')).toBeInTheDocument();
            });
        });

        // ตรวจสอบว่า avatar แสดงอักษรย่อจากชื่อ (firstName + lastName) เช่น John Doe → JD
        it('should show initials in avatar', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('JD')).toBeInTheDocument();
            });
        });

        // ตรวจสอบว่ากดปุ่ม “Edit Profile” แล้ว Popup แก้ไขโปรไฟล์แสดงขึ้นมาจริง
        it('should open edit popup when edit button is clicked', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            const editButton = screen.getByTitle('Edit Profile');
            fireEvent.click(editButton);

            expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        });
    });

    describe('EditProfilePopup Component', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });
            mockProfileApi.getProfile.mockResolvedValue({ data: mockProfile });
        });

        // ตรวจสอบว่าเมื่อเปิด popup แล้ว input field ถูกกรอกค่าจาก profile ปัจจุบันถูกต้อง
        it('should display edit form with current values', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            const editButton = screen.getByTitle('Edit Profile');
            fireEvent.click(editButton);

            expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1234567890123')).toBeInTheDocument();
        });
        // ตรวจสอบว่าพิมพ์ข้อมูลใหม่ลงในช่อง input แล้วค่าในหน้าจอเปลี่ยนจริง
        it('should update form values when inputs change', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));

            const firstNameInput = screen.getByDisplayValue('John');
            fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

            expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
        });
        // ทดสอบการอัปเดตข้อมูลผู้ใช้ปกติ (USER) แล้วต้องเรียก API updateUser() ถูกต้อง
        it('should successfully update user profile', async () => {
            mockProfileApi.updateUser.mockResolvedValue({ data: { success: true } });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));

            const firstNameInput = screen.getByDisplayValue('John');
            fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockProfileApi.updateUser).toHaveBeenCalledWith({
                    email: 'test@example.com',
                    firstName: 'Jane',
                    lastName: 'Doe',
                    phoneNumber: '1234567890',
                    idCard: '1234567890123',
                });
                expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
            });
        });

        // ทดสอบการอัปเดตข้อมูล Organizer แล้วต้องเรียก API updateOrganizer() ถูกต้อง
        it('should successfully update organizer profile', async () => {
            mockProfileApi.getProfile.mockResolvedValue({ data: mockOrganizerProfile });
            mockProfileApi.updateOrganizer.mockResolvedValue({ data: { success: true } });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('organizer')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));

            const companyInput = screen.getByDisplayValue('Event Co');
            fireEvent.change(companyInput, { target: { value: 'New Event Co' } });

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(mockProfileApi.updateOrganizer).toHaveBeenCalledWith({
                    email: 'org@example.com',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    phoneNumber: '0987654321',
                    companyName: 'New Event Co',
                    taxId: 'TAX123',
                    address: '123 Street',
                });
                expect(window.alert).toHaveBeenCalledWith('Profile updated successfully!');
            });
        });

        // ถ้า API updateUser() ล้มเหลว → ต้องแสดงข้อความ error ("Update failed")
        it('should display error message when update fails', async () => {
            mockProfileApi.updateUser.mockRejectedValue({
                response: { data: { error: 'Update failed' } },
            });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Update failed')).toBeInTheDocument();
            });
        });

        // ถ้า error เป็น generic (ไม่มี response.data.error) → ต้องแสดงข้อความจาก Error เช่น “Network error”
        it('should handle generic error when no error message provided', async () => {
            mockProfileApi.updateUser.mockRejectedValue(new Error('Network error'));

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });

        // เมื่อกดปุ่ม “Cancel” ต้องปิด popup แก้ไขโปรไฟล์
        it('should close popup when cancel button is clicked', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));
            expect(screen.getByText('Edit Profile')).toBeInTheDocument();

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            await waitFor(() => {
                expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();
            });
        });

        // เมื่อมี error แล้วพอพิมพ์ input ใหม่ ต้องเคลียร์ข้อความ error ออก
        it('should clear error when input changes', async () => {
            mockProfileApi.updateUser.mockRejectedValue({
                response: { data: { error: 'Update failed' } },
            });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));
            fireEvent.click(screen.getByText('Save'));

            await waitFor(() => {
                expect(screen.getByText('Update failed')).toBeInTheDocument();
            });

            const firstNameInput = screen.getByDisplayValue('John');
            fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

            expect(screen.queryByText('Update failed')).not.toBeInTheDocument();
        });

        // เมื่อคลิก “Save” แล้วอยู่ในสถานะกำลังบันทึก (saving) → ปุ่ม Save/Cancel ต้อง disabled
        it('should disable buttons while saving', async () => {
            mockProfileApi.updateUser.mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 1000))
            );

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));

            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);

            expect(screen.getByText('Saving...')).toBeInTheDocument();
            expect(saveButton).toBeDisabled();
            expect(screen.getByText('Cancel')).toBeDisabled();
        });
    });

    describe('Ticket Filtering and Display', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });
            mockProfileApi.getProfile.mockResolvedValue({ data: mockProfile });
        });

        // ตรวจสอบว่าหลังโหลดข้อมูลแล้วมีหัวข้อ “My Ticket” และมี EventCard แสดงบนจอ
        it('should display tickets', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('My Ticket')).toBeInTheDocument();
            });

            expect(screen.getByTestId('event-card')).toBeInTheDocument();
        });

        //  ทดสอบว่าพิมพ์ในช่อง search แล้วค่าที่พิมพ์แสดงในช่องจริง (กรองตามชื่อ)
        it('should filter tickets by search query', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByTestId('search-input')).toBeInTheDocument();
            });

            const searchInput = screen.getByTestId('search-input');
            fireEvent.change(searchInput, { target: { value: 'ROBERT' } });

            expect(searchInput).toHaveValue('ROBERT');
        });

        // ทดสอบการเลือกหมวดหมู่ (category) ว่าเปลี่ยนค่าถูกต้อง (เช่น concert/seminar)
        it('should filter tickets by category', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByTestId('category-select')).toBeInTheDocument();
            });

            const categorySelect = screen.getByTestId('category-select');
            fireEvent.change(categorySelect, { target: { value: 'concert' } });

            expect(categorySelect).toHaveValue('concert');
        });
        // ทดสอบว่าการเปลี่ยน order (newest/oldest) ทำงานและค่าถูกอัปเดตใน select
        it('should change sort order', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByTestId('order-select')).toBeInTheDocument();
            });

            const orderSelect = screen.getByTestId('order-select');
            fireEvent.change(orderSelect, { target: { value: 'oldest' } });

            expect(orderSelect).toHaveValue('oldest');
        });

        // ทดสอบว่าเมื่อคลิก EventCard → Popup TicketCard จะเปิดขึ้นมาแสดงรายละเอียดบัตร
        it('should open ticket popup when event card is clicked', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByTestId('event-card')).toBeInTheDocument();
            });

            const eventCard = screen.getByTestId('event-card');
            fireEvent.click(eventCard);

            await waitFor(() => {
                expect(screen.getByTestId('ticket-card')).toBeInTheDocument();
            });
        });

        // ทดสอบว่ากดปุ่มปิด (×) แล้ว Popup TicketCard ต้องหายไป
        it('should close ticket popup when close button is clicked', async () => {
            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByTestId('event-card')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTestId('event-card'));

            await waitFor(() => {
                expect(screen.getByTestId('ticket-card')).toBeInTheDocument();
            });

            const closeButton = screen.getByText('×');
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByTestId('ticket-card')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        // ทดสอบว่าถ้าเรียก API getProfile() แล้ว error → ต้อง console.error(“❌ Error fetching profile:”)
        it('should handle profile fetch error', async () => {
            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });

            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            mockProfileApi.getProfile.mockRejectedValue(new Error('Fetch error'));

            render(<Profile />);

            await waitFor(() => {
                expect(consoleError).toHaveBeenCalledWith(
                    '❌ Error fetching profile:',
                    expect.any(Error)
                );
            });

            consoleError.mockRestore();
        });
        // ทดสอบว่าเมื่อ updateUser() error และไม่มี response.data.error → ต้องแสดงข้อความ “Failed to update profile”
        it('should handle update error without response data', async () => {
            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });
            mockProfileApi.getProfile.mockResolvedValue({ data: mockProfile });
            mockProfileApi.updateUser.mockRejectedValue({});

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByTitle('Edit Profile'));
            fireEvent.click(screen.getByText('Save'));

            await waitFor(() => {
                expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
            });
        });
    });

    describe('Edge Cases', () => {
        // ทดสอบว่าถ้าเรียก API getProfile() แล้ว error → ต้อง console.error(“❌ Error fetching profile:”)
        it('should handle organizer with missing optional fields', async () => {
            const incompleteOrganizer = {
                ...mockOrganizerProfile,
                companyName: undefined,
                verificationStatus: undefined,
            };

            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '2' } },
                login: vi.fn(),
                logout: vi.fn(),
            });

            mockProfileApi.getProfile.mockResolvedValue({ data: incompleteOrganizer });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getAllByText('-').length).toBeGreaterThan(0);
            });
        });

        // ✅ ทดสอบว่าเมื่อ updateUser() error และไม่มี response.data.error → ต้องแสดงข้อความ “Failed to update profile”
        it('should handle user with missing ID card', async () => {
            const userWithoutIdCard = {
                ...mockProfile,
                idCard: undefined,
            };

            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });

            mockProfileApi.getProfile.mockResolvedValue({ data: userWithoutIdCard });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('-')).toBeInTheDocument();
            });
        });

        // ทดสอบว่าหลังจากกด Save แล้ว profile ต้องถูก fetch ใหม่อีกครั้ง (เรียก getProfile() 2 รอบ)
        it('should refetch profile after successful save', async () => {
            mockUseAuth.mockReturnValue({
                state: { status: 'authenticated', user: { id: '1' } },
                login: vi.fn(),
                logout: vi.fn(),
            });
            mockProfileApi.getProfile.mockResolvedValue({ data: mockProfile });
            mockProfileApi.updateUser.mockResolvedValue({ data: { success: true } });

            render(<Profile />);

            await waitFor(() => {
                expect(screen.getByText('testuser')).toBeInTheDocument();
            });

            // First fetch on mount
            expect(mockProfileApi.getProfile).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByTitle('Edit Profile'));
            fireEvent.click(screen.getByText('Save'));

            await waitFor(() => {
                // Second fetch after save
                expect(mockProfileApi.getProfile).toHaveBeenCalledTimes(2);
            });
        });
    });
});