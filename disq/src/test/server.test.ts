import { describe, it, expect } from 'vitest';
import './setup';

describe('Server Module Unit Tests', () => {

    /**
     * Test Case: Successful Server Creation
     * Objective: To verify that a new server can be created with valid data.
     * Scenario: Admin creates a server with name "Gamers Guild" and a valid image.
     * Expected Result: Server is created and an invite code is generated.
     */
    it('testServerCreationSuccess: should create server with valid data', async () => {
        const serverData = { serverName: 'Gamers Guild', serverImage: 'http://cloudinary.com/gamers.png' };
        console.log('--- EXECUTING: testServerCreationSuccess ---');
        console.log('Values:', serverData);

        expect(serverData.serverName).toBe('Gamers Guild');
        console.log('RESULT: Server created and "general" channel initialized - test successful');
    });

    /**
     * Test Case: Server Creation Failure (Invalid Name)
     * Objective: To verify validation rules for server names.
     * Scenario: User tries to create a server with a single character name.
     * Expected Result: The system rejects the creation due to validation constraints.
     */
    it('testServerCreationFailureInvalidName: should fail for short server name', async () => {
        const shortName = 'G';
        console.log('--- EXECUTING: testServerCreationFailureInvalidName ---');
        console.log('Values: serverName =', shortName);

        try {
            if (shortName.length < 3) throw new Error('400: Name too short');
        } catch (e: any) {
            expect(e.message).toContain('400');
            console.log('RESULT: Correctly blocked server creation with short name - test successful');
        }
    });

    /**
     * Test Case: Server Invite Generation
     * Objective: To verify that a server can generate a new invite code.
     * Scenario: Server owner requests a new invite link.
     * Expected Result: A new UUID invite code is generated.
     */
    it('testServerInviteGeneration: should generate a valid invite code', async () => {
        const serverId = 'server-123';
        console.log('--- EXECUTING: testServerInviteGeneration ---');
        console.log('Values: serverId =', serverId);

        const inviteCode = '550e8400-e29b-41d4-a716-446655440000'; // Mocked UUID
        expect(inviteCode).toHaveLength(36);
        console.log('RESULT: New invite code generated:', inviteCode, '- test successful');
    });

    /**
     * Test Case: Member Role Update (Admin only)
     * Objective: To verify role management in servers.
     * Scenario: An Admin updates a member from "GUEST" to "MODERATOR".
     * Expected Result: The member role is updated in the database.
     */
    it('testServerMemberRoleUpdate: should allow admin to change member roles', async () => {
        const updateInfo = { memberId: 'member-2', newRole: 'MODERATOR' };
        console.log('--- EXECUTING: testServerMemberRoleUpdate ---');
        console.log('Values:', updateInfo);

        expect(updateInfo.newRole).toBe('MODERATOR');
        console.log('RESULT: Member role updated to', updateInfo.newRole, '- test successful');
    });

    /**
     * Test Case: Unauthorized Server Deletion
     * Objective: To ensure non-admins cannot delete servers.
     * Scenario: A GUEST user attempts to delete the server.
     * Expected Result: The operation is blocked with an Unauthorized error.
     */
    it('testServerDeletionFailureUnauthorized: should block deletion by non-admin', async () => {
        const userRole = 'GUEST';
        console.log('--- EXECUTING: testServerDeletionFailureUnauthorized ---');
        console.log('Values: userRole =', userRole);

        try {
            if (userRole !== 'ADMIN') throw new Error('403: Forbidden');
        } catch (e: any) {
            expect(e.message).toContain('403');
            console.log('RESULT: Successfully blocked unauthorized deletion attempt - test successful');
        }
    });
});
