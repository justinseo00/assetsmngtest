'use client';

import { AssetQrCode } from './AssetQrCode';

interface AssetLabelProps {
    assetCode: string;
    ownerName: string;
    qrValue: string;
}

export function AssetLabel({ assetCode, ownerName, qrValue }: AssetLabelProps) {
    return (
        <div className="hidden print:flex flex-col items-center justify-center border-2 border-black p-4 w-[300px] h-[200px] page-break-inside-avoid">
            <h2 className="text-xl font-bold mb-2">자산 관리 라벨</h2>
            <div className="flex items-center gap-4">
                <AssetQrCode value={qrValue} size={100} />
                <div className="text-left">
                    <p className="font-bold text-lg">{assetCode}</p>
                    <p className="text-sm">소유자: {ownerName}</p>
                    <p className="text-xs text-gray-500 mt-1">스캔하여 관리</p>
                </div>
            </div>
        </div>
    );
}
