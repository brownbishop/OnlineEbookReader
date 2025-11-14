import { useRef, useState } from 'react';
import { useAppState } from '@/lib/store';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

export default function UploadBook() {
    const navigate = useNavigate();
    const { uploadBook, isLoading, error, setError } = useAppState();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validExtensions = ['.epub', '.epub3'];
            const fileName = file.name.toLowerCase();
            const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

            if (!isValidType) {
                setError('Invalid file format. Please upload an EPUB or EPUB3 file.');
                setSelectedFile(null);
                return;
            }

            // Validate file size (max 100MB)
            const maxSize = 100 * 1024 * 1024;
            if (file.size > maxSize) {
                setError('File is too large. Maximum size is 100MB.');
                setSelectedFile(null);
                return;
            }

            setError(null);
            setSelectedFile(file);
            setUploadProgress(0);
            setUploadSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        try {
            setUploadProgress(50);
            await uploadBook(selectedFile);
            setUploadProgress(100);
            setUploadSuccess(true);
            setSelectedFile(null);

            // Redirect to books immediately (uploadBook already refetches books)
            navigate('/books');
        } catch (err) {
            setUploadProgress(0);
            // Error is already set by uploadBook in the store
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('border-primary', 'bg-primary/5');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-primary', 'bg-primary/5');

        const file = e.dataTransfer.files?.[0];
        if (file) {
            const input = fileInputRef.current;
            if (input) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                input.files = dataTransfer.files;
                handleFileSelect({ target: { files: dataTransfer.files } } as any);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Upload a Book</h1>
                    <p className="text-muted-foreground">
                        Add a new EPUB ebook to your library
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Select an EPUB File</CardTitle>
                        <CardDescription>
                            Drag and drop your EPUB file here or click to browse
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Drag and Drop Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className="relative border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".epub,.epub3"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <div className="space-y-3">
                                <svg
                                    className="mx-auto h-12 w-12 text-muted-foreground"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20m-12-8v12m0 0l-4-4m4 4l4-4"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <div>
                                    <p className="font-semibold text-foreground">
                                        Drag your EPUB file here
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        or click to select from your computer
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Selected File Info */}
                        {selectedFile && (
                            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className="text-destructive hover:underline text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Upload Progress */}
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Uploading...</span>
                                    <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2">
                                    <div
                                        className="bg-primary rounded-full h-2 transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {uploadSuccess && (
                            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                <p className="text-sm font-semibold text-green-900 dark:text-green-200">
                                    ✓ Upload successful! Redirecting to library...
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <p className="text-sm font-semibold text-destructive">
                                    Error: {error}
                                </p>
                            </div>
                        )}

                        {/* File Requirements */}
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                            <p className="font-semibold">Requirements:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                                <li>File format: EPUB or EPUB3</li>
                                <li>Maximum file size: 100 MB</li>
                                <li>The book's cover image will be automatically extracted</li>
                            </ul>
                        </div>
                    </CardContent>

                    <CardFooter className="flex gap-3 justify-between">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/books')}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || isLoading || uploadSuccess}
                            className="min-w-32"
                        >
                            {isLoading ? 'Uploading...' : uploadSuccess ? 'Uploaded!' : 'Upload'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Additional Info */}
                <div className="mt-8 grid md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">What is EPUB?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                EPUB is an open eBook format supported by most ebook readers. It provides reflowable text and embedded media.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Need Help?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Most modern ebooks are already in EPUB format. If you have a PDF or other format, consider using conversion tools.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
