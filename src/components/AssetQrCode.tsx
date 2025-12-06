'use client';

import { QRCodeSVG } from 'qrcode.react';

interface AssetQrCodeProps {
    value: string;
    size?: number;
    className?: string;
}

export function AssetQrCode({ value, size = 128, className }: AssetQrCodeProps) {
    return (
        <div className={`bg-white p-2 inline-block ${className}`}>
            <QRCodeSVG value={value} size={size} level="M" />
        </div>
    );
}
