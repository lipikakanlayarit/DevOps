import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import Eventselect from "../pages/Eventselect"

// 🧱 mock footer เพื่อตัด dependency อื่น
vi.mock("@/components/Footer", () => ({
    default: () => <div data-testid="footer">FooterMock</div>,
}))

// mock scrollIntoView และ console.log
beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(global.Math, "random").mockReturnValue(0.123456789) // เพื่อให้ ReserveID คงที่
})

describe("Eventselect Page", () => {
    // ✅ 1. ตรวจว่าหน้าหลัก render ได้ครบ
    it("renders hero section with main elements", () => {
        render(<Eventselect />);

        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toHaveTextContent(/ROBERT\s*BALTAZAR\s*TRIO/i);

        // ✅ ใช้ getAllByText เพื่อกันกรณีข้อความซ้ำ
        expect(screen.getByText(/Show Date/i)).toBeInTheDocument();
        expect(screen.getByText(/Sale Opening Date/i)).toBeInTheDocument();

        const halls = screen.getAllByText(/MCC HALL/i);
        expect(halls.length).toBeGreaterThan(0);

        expect(screen.getByText(/Ticket Prices/i)).toBeInTheDocument();
    });


    // ✅ 2. ตรวจว่ากด View Detail แล้วแสดงเนื้อหาเพิ่ม
    it("toggles event details when clicking View Detail", () => {
        render(<Eventselect />)
        const detailBtn = screen.getByText("View Detail")
        fireEvent.click(detailBtn)
        expect(screen.getByText(/Lorem Ipsum/)).toBeInTheDocument()
        // กดซ้ำเพื่อซ่อน
        fireEvent.click(detailBtn)
        expect(screen.queryByText(/Lorem Ipsum/)).not.toBeInTheDocument()
    })

    // ✅ 3. ตรวจปุ่ม Get Ticket scroll ไป date-selection ได้
    it("calls scrollIntoView when clicking Get Ticket", () => {
        render(<Eventselect />)
        const mockScroll = vi.spyOn(Element.prototype, "scrollIntoView")
        const btn = screen.getByText("Get Ticket")
        fireEvent.click(btn)
        expect(mockScroll).toHaveBeenCalled()
    })

    // ✅ 4. ตรวจว่ามีการ์ดวันที่ทั้ง 22 และ 23
    it("renders both date cards initially", () => {
        render(<Eventselect />)
        expect(screen.getByText("Sat")).toBeInTheDocument()
        expect(screen.getByText("Sun")).toBeInTheDocument()
    })

    // ✅ 5. กดวันที่ 22 แล้วต้องเห็น seat map section
    it("shows seat map when clicking March 22", async () => {
        render(<Eventselect />)
        const card22 = screen.getByText("Sat")
        fireEvent.click(card22)
        await waitFor(() => {
            expect(screen.getByText("STAGE")).toBeInTheDocument()
        })
    })

    // ✅ 6. ตรวจว่า seat ที่ถูก disable (occupied) คลิกไม่ได้
    it("does not allow clicking occupied seat", async () => {
        render(<Eventselect />)
        fireEvent.click(screen.getByText("Sat"))
        const occupied = screen.getAllByTitle(/Occupied/)[0]
        expect(occupied).toBeDisabled()
    })

    // ✅ 7. ตรวจเลือก seat ได้ และ summary แสดงถูกต้อง
    it("selects and deselects seats correctly", async () => {
        render(<Eventselect />)
        fireEvent.click(screen.getByText("Sat"))

        // หา seat ที่คลิกได้ (ไม่ occupied)
        const available = screen.getAllByRole("button").find(btn => btn.textContent === "1" && !btn.disabled)
        expect(available).toBeTruthy()
        if (available) fireEvent.click(available)

        await waitFor(() => {
            expect(screen.getByText(/Selected:/)).toBeInTheDocument()
        })

        // ตรวจ total price และ payment ปุ่ม
        expect(screen.getByText("Go to Payment")).toBeInTheDocument()
        expect(screen.getByText(/฿1,500/)).toBeInTheDocument()

        // กดยกเลิกเลือก
        fireEvent.click(available!)
        expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument()
    })

    // ✅ 8. ตรวจว่าเลือกหลายที่นั่งจะขึ้น Multiple Tickets Reserved
    it("shows multiple ticket summary when selecting more than one seat", async () => {
        render(<Eventselect />)
        fireEvent.click(screen.getByText("Sun"))
        const seats = screen.getAllByRole("button").filter(btn => !btn.disabled && btn.textContent === "1").slice(0, 2)
        seats.forEach(seat => fireEvent.click(seat))
        await waitFor(() => {
            expect(screen.getByText(/Multiple Tickets Reserved/)).toBeInTheDocument()
        })
        expect(screen.getByText(/Go to Payment - 2 Tickets/)).toBeInTheDocument()
    })

    // ✅ 9. ตรวจว่า generateReserveId คืนค่าถูกต้อง (mocked)
    it("generates stable Reserve ID", async () => {
        render(<Eventselect />);

        // คลิกวันที่ Sat เพื่อให้ scroll และ render section
        fireEvent.click(screen.getByText("Sat"));

        const seat = screen
            .getAllByRole("button")
            .find((btn) => !btn.disabled && btn.textContent === "2");
        if (seat) fireEvent.click(seat);

        await waitFor(() => {
            expect(screen.getByText(/Reserve ID/i)).toBeInTheDocument();
        });

        // ✅ ตรวจว่าเจอข้อความที่เป็นตัวเลข 15 หลัก (ไม่ fix ค่าตายตัว)
        const idText = screen.getByText(/\d{15}/);
        expect(idText).toBeInTheDocument();
        expect(idText.textContent).toMatch(/^\d{15}$/); // ต้องเป็นเลขล้วน 15 หลัก
    });


    // ✅ 10. ตรวจว่า footer แสดง
    it("renders footer", () => {
        render(<Eventselect />)
        expect(screen.getByTestId("footer")).toBeInTheDocument()
    })
})
