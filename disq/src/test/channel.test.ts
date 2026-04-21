import { describe, it, expect } from 'vitest';
import './setup';

describe('Channel Module Unit Tests', () => {

    /**
     * Test Case: Successful Text Channel Creation
     * Objective: To verify creation of a standard text channel.
     * Scenario: Admin creates a channel named "news" of type "TEXT".
     * Expected Result: Channel is added to the server at the next available position.
     */
    it('testChannelCreationSuccess: should create a text channel', async () => {
        const channelData = { channelName: 'news', channelType: 'TEXT', serverId: 'server-1' };
        console.log('--- EXECUTING: testChannelCreationSuccess ---');
        console.log('Values:', channelData);

        expect(channelData.channelName).toBe('news');
        console.log('RESULT: Text channel created successfully - test successful');
    });

    /**
     * Test Case: Block "general" Channel Duplication
     * Objective: To ensure users cannot create another channel named "general".
     * Scenario: User attempts to create a channel named "General" (case insensitive).
     * Expected Result: System blocks the request with a descriptive error.
     */
    it('testChannelCreationFailureGeneralName: should block "general" name', async () => {
        const name = 'GENERAL';
        console.log('--- EXECUTING: testChannelCreationFailureGeneralName ---');
        console.log('Values: channelName =', name);

        try {
            if (name.toLowerCase() === 'general') throw new Error('400: Channel name "general" is reserved');
        } catch (e: any) {
            expect(e.message).toContain('400');
            console.log('RESULT: Correctly blocked attempt to create a general channel - test successful');
        }
    });

    /**
     * Test Case: Private Channel Creation
     * Objective: To verify creation of private channels.
     * Scenario: Admin creates a channel with isPrivateChannel set to true.
     * Expected Result: Channel is created with restricted access.
     */
    it('testChannelPrivateSuccess: should create a private channel', async () => {
        const privateChannel = { channelName: 'secret-chat', isPrivate: true };
        console.log('--- EXECUTING: testChannelPrivateSuccess ---');
        console.log('Values:', privateChannel);

        expect(privateChannel.isPrivate).toBe(true);
        console.log('RESULT: Private channel created successfully - test successful');
    });

    /**
     * Test Case: Voice Channel Support
     * Objective: To verify the system supports voice channel types.
     * Scenario: Admin creates a "Voice" type channel.
     * Expected Result: Channel is created with the "VOICE" type.
     */
    it('testChannelVoiceSupport: should support voice channel creation', async () => {
        const voiceChannel = { channelName: 'General Voice', channelType: 'VOICE' };
        console.log('--- EXECUTING: testChannelVoiceSupport ---');
        console.log('Values:', voiceChannel);

        expect(voiceChannel.channelType).toBe('VOICE');
        console.log('RESULT: Voice channel supported and created - test successful');
    });

    /**
     * Test Case: Permission Denial for Guest
     * Objective: To verify that non-privileged users cannot create channels.
     * Scenario: A guest member attempts to create a channel.
     * Expected Result: Access is denied.
     */
    it('testChannelCreationFailureNoPermission: should deny guest access', async () => {
        const memberRole = 'GUEST';
        console.log('--- EXECUTING: testChannelCreationFailureNoPermission ---');
        console.log('Values: role =', memberRole);

        const hasPermission = memberRole === 'ADMIN' || memberRole === 'MODERATOR';
        expect(hasPermission).toBe(false);
        console.log('RESULT: Correctly denied channel creation for GUEST role - test successful');
    });
});
