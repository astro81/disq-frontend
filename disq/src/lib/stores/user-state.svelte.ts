// lib/stores/user-state.svelte.ts
import { getContext, setContext } from 'svelte';

export type User = {
	id: string;
	name: string;
	displayName: string;
	email: string;
	emailVerified: true;

	image: string | null;
	profileBannerImage: string | null;

	createdAt: string;
	updatedAt: string;
};

// create a unique context key
const userStateKey = Symbol('userState');

export class UserState {
	user = $state<User | null>(null);

	add(user: User) {
		this.user = user;
	}

	remove() {
		this.user = null;
	}
}

// provide (set) user state in component hierarchy
export function setUserState() {
	const state = new UserState();
	setContext(userStateKey, state);
	return state;
}

// consume (get) user state from child components
export function getUserState(): UserState {
	const state = getContext<UserState>(userStateKey);
	if (!state) throw new Error('UserState context not found. Did you call setUserState()?');
	return state;
}

// const userState = setUserState();
// simulate login
// userState.add({
// userId: "123",
// email: "dev@example.com",
// displayName: "Shadow Hatake",
// profileImageUrl: null // no image yet
// });

// const userState = getUserState();
// <p>Welcome, {userState.user.displayName}!</p>