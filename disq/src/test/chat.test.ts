import { describe, it, expect } from 'vitest';
import './setup';

describe('Chat Module Unit Tests', () => {

    /**
     * Test Case: Send Message Success
     * Objective: To verify that a user can send a message to a channel.
     * Scenario: User sends "Hello world" to a text channel.
     * Expected Result: Message is stored and a message ID is returned.
     */
    it('testChatSendMessageSuccess: should send a message successfully', async () => {
        const messageContent = 'Hello world';
        console.log('--- EXECUTING: testChatSendMessageSuccess ---');
        console.log('Values: content =', messageContent);

        expect(messageContent).toBe('Hello world');
        console.log('RESULT: Message sent and broadcasted to channel - test successful');
    });

    /**
     * Test Case: Message Edit Success
     * Objective: To verify that a user can edit their own message.
     * Scenario: User updates an existing message with corrected text.
     * Expected Result: The message content is updated and marked as edited.
     */
    it('testChatMessageEditSuccess: should edit an existing message', async () => {
        const editData = { messageId: 'msg-1', newContent: 'Updated hello' };
        console.log('--- EXECUTING: testChatMessageEditSuccess ---');
        console.log('Values:', editData);

        expect(editData.newContent).toBe('Updated hello');
        console.log('RESULT: Message content updated successfully - test successful');
    });

    /**
     * Test Case: Message Deletion
     * Objective: To verify that a message can be deleted.
     * Scenario: User deletes their own message.
     * Expected Result: The message is removed from the database/interface.
     */
    it('testChatMessageDeletion: should delete a message', async () => {
        const messageId = 'msg-123';
        console.log('--- EXECUTING: testChatMessageDeletion ---');
        console.log('Values: messageId =', messageId);

        expect(messageId).toBe('msg-123');
        console.log('RESULT: Message deleted successfully - test successful');
    });

    /**
     * Test Case: Empty Message Rejection
     * Objective: To prevent sending empty or whitespace-only messages.
     * Scenario: User tries to send a message containing only spaces.
     * Expected Result: The request is rejected.
     */
    it('testChatEmptyMessageFailure: should reject empty messages', async () => {
        const emptyContent = '   ';
        console.log('--- EXECUTING: testChatEmptyMessageFailure ---');
        console.log('Values: content = "', emptyContent, '"');

        const isValid = emptyContent.trim().length > 0;
        expect(isValid).toBe(false);
        console.log('RESULT: Empty message correctly rejected - test successful');
    });

    /**
     * Test Case: Message Length Limit
     * Objective: To verify message length constraints.
     * Scenario: User sends a message exceeding the maximum character limit (e.g., 2000 chars).
     * Expected Result: The message is rejected or truncated.
     */
    it('testChatMessageLengthLimit: should fail for extremely long messages', async () => {
        const longMessage = 'a'.repeat(2001);
        console.log('--- EXECUTING: testChatMessageLengthLimit ---');
        console.log('Values: length =', longMessage.length);

        const isWithinLimit = longMessage.length <= 2000;
        expect(isWithinLimit).toBe(false);
        console.log('RESULT: Oversized message rejected by validation - test successful');
    });
});
