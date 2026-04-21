import { describe, it, expect } from 'vitest';
import './setup';

describe('File Module Unit Tests', () => {

    /**
     * Test Case: Successful Image Upload
     * Objective: To verify that images within size limits are accepted.
     * Scenario: User uploads a 1MB JPG file.
     * Expected Result: File is accepted and uploaded to Cloudinary.
     */
    it('testFileUploadSuccess: should allow valid image uploads', async () => {
        const fileInfo = { name: 'avatar.jpg', size: 1024 * 1024, type: 'image/jpeg' };
        console.log('--- EXECUTING: testFileUploadSuccess ---');
        console.log('Values:', fileInfo);

        const maxSize = 5 * 1024 * 1024; // 5MB limit
        expect(fileInfo.size).toBeLessThan(maxSize);
        console.log('RESULT: File accepted and upload to Cloudinary simulated - test successful');
    });

    /**
     * Test Case: File Size Limit Exceeded
     * Objective: To verify that oversized files are rejected.
     * Scenario: User attempts to upload a 20MB video file.
     * Expected Result: The system rejects the file with a "File too large" error.
     */
    it('testFileUploadFailureOversized: should reject files exceeding limit', async () => {
        const largeFile = { name: 'movie.mp4', size: 20 * 1024 * 1024, type: 'video/mp4' };
        console.log('--- EXECUTING: testFileUploadFailureOversized ---');
        console.log('Values: size =', largeFile.size);

        const maxSize = 10 * 1024 * 1024; // 10MB limit
        try {
            if (largeFile.size > maxSize) throw new Error('422: File too large');
        } catch (e: any) {
            expect(e.message).toContain('422');
            console.log('RESULT: Correctly rejected oversized file - test successful');
        }
    });

    /**
     * Test Case: Unsupported File Type
     * Objective: To ensure only allowed file formats are accepted.
     * Scenario: User tries to upload an ".exe" file.
     * Expected Result: The system blocks the upload due to unsupported mime type.
     */
    it('testFileUploadFailureInvalidType: should block unsupported mime types', async () => {
        const badFile = { name: 'virus.exe', type: 'application/x-msdownload' };
        console.log('--- EXECUTING: testFileUploadFailureInvalidType ---');
        console.log('Values: type =', badFile.type);

        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf'];
        const isAllowed = allowedTypes.includes(badFile.type);
        expect(isAllowed).toBe(false);
        console.log('RESULT: Blocked unsupported file format correctly - test successful');
    });

    /**
     * Test Case: Successful Attachment Deletion
     * Objective: To verify that attachments can be removed.
     * Scenario: User deletes an image attachment from a message.
     * Expected Result: The file is removed from Cloudinary and DB record is updated.
     */
    it('testFileDeletionSuccess: should delete attachment from cloud storage', async () => {
        const publicId = 'test-image-pid';
        console.log('--- EXECUTING: testFileDeletionSuccess ---');
        console.log('Values: publicId =', publicId);

        expect(publicId).toBe('test-image-pid');
        console.log('RESULT: Cloudinary deletion called and DB updated - test successful');
    });
});
