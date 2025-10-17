"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Props = {
    /** path ที่ relative ต่อ baseURL ของ axios เช่น `/admin/events/1/cover?v=...` */
    src: string;
    alt: string;
    className?: string;
    /** รูป fallback กรณีโหลดไม่สำเร็จ */
    fallback: string;
};

export default function AuthImage({ src, alt, className, fallback }: Props) {
    const [url, setUrl] = useState<string>(fallback);

    useEffect(() => {
        let cancelled = false;
        let objectUrl: string | undefined;

        (async () => {
            try {
                const res = await api.get(src, { responseType: "blob" });
                if (cancelled) return;
                objectUrl = URL.createObjectURL(res.data);
                setUrl(objectUrl);
            } catch {
                if (!cancelled) setUrl(fallback);
            }
        })();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, fallback]);

    return <img src={url} alt={alt} className={className} />;
}
