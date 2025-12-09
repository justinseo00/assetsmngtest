'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { importAssetsFromExcel } from '@/actions/import-actions';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await importAssetsFromExcel(formData);
            setResult(response);
            if (response.success) {
                setFile(null);
                // Reset file input value
                const fileInput = document.getElementById('excel-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }
        } catch (error) {
            setResult({ success: false, error: '업로드 요청 중 오류가 발생했습니다.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-6 w-6" />
                        자산 일괄 등록
                    </CardTitle>
                    <CardDescription>
                        엑셀 파일을 업로드하여 자산과 부서 정보를 일괄 등록합니다.<br />
                        부서 정보는 '소속' 컬럼의 띄어쓰기를 기준으로 자동 계층화됩니다. (예: "본사 경영지원본부 인사팀")
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Input
                                id="excel-upload"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </div>

                        {result && (
                            <Alert variant={result.success ? "default" : "destructive"} className={result.success ? "border-green-500 text-green-700 bg-green-50" : ""}>
                                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertTitle>{result.success ? "성공" : "오류"}</AlertTitle>
                                <AlertDescription>
                                    {result.success ? result.message : result.error}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={!file || isUploading}>
                                {isUploading ? (
                                    <>
                                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                                        업로드 중...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        업로드
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">엑셀 작성 가이드</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>자산번호</strong> (필수): 고유한 자산 식별 번호</li>
                            <li><strong>자산명</strong>: 자산의 이름 (기본값: 무명자산)</li>
                            <li><strong>소속</strong>: 부서 계층 구조 (공백으로 구분)</li>
                            <li>그 외: 소유자사번, 소유자명, 관리자사번, 관리자명, 설명, QR, 상태</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
