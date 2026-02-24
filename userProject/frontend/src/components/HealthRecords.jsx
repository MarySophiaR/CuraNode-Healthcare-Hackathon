import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, Trash2, File, Loader2 } from 'lucide-react';

const HealthRecords = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/health-records');
            setFiles(data);
        } catch (error) {
            console.error('Error fetching records:', error);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            await axios.post('http://localhost:5000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchFiles();
            setSelectedFile(null);
            // Reset file input via form ref or manual clear if needed
        } catch (error) {
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-darkText flex items-center gap-2">
                <FileText className="text-primary" /> My Health Records
            </h2>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-primary mb-8 max-w-lg">
                <form onSubmit={handleUpload} className="space-y-4">
                    <label className="block w-full border-2 border-dashed border-primary rounded-lg p-8 text-center hover:bg-softGray cursor-pointer transition-colors">
                        <input type="file" onChange={handleFileChange} className="hidden" />
                        <Upload className="w-8 h-8 text-darkText mx-auto mb-2" />
                        <span className="text-darkText font-medium">Click to upload documents</span>
                        {selectedFile && <div className="mt-2 text-sm text-primary font-semibold">{selectedFile.name}</div>}
                    </label>
                    <button
                        type="submit"
                        disabled={!selectedFile || uploading}
                        className="w-full bg-primary hover:bg-primary disabled:bg-softGray disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold shadow-md shadow-teal-100 flex items-center justify-center gap-2"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Record'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-primary shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-primary rounded-lg shrink-0">
                                <File className="w-5 h-5 text-primary" />
                            </div>
                            <div className="truncate">
                                <p className="font-medium text-darkText truncate text-sm">{file.name}</p>
                                <p className="text-xs text-darkText">{new Date(file.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary font-medium hover:underline bg-primary px-2 py-1 rounded"
                        >
                            View
                        </a>
                    </div>
                ))}
                {files.length === 0 && (
                    <div className="col-span-full text-center py-12 text-darkText text-sm">No records uploaded yet.</div>
                )}
            </div>
        </div>
    );
};

export default HealthRecords;
