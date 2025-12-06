'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

interface AssetQrModalProps {
    assetCode: string;
}

export function AssetQrModal({ assetCode }: AssetQrModalProps) {
    const qrUrl = `http://localhost:3000/assets/${assetCode}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    QR 확인
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>자산 QR 코드</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-4">
                    <div className="p-4 bg-white rounded-lg shadow-sm border">
                        <QRCodeSVG value={qrUrl} size={200} />
                    </div>
                    <p className="text-sm text-muted-foreground text-center break-all">
                        {qrUrl}
                    </p>
                    <p className="text-lg font-bold">{assetCode}</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
