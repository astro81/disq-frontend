<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Pencil,
		Trash2,
		ShieldCheck,
		ShieldAlert,
		Calendar,
		Clock,
		AtSign,
		Mail,
		LogOut
	} from '@lucide/svelte';
	import EditProfileDialog from '$lib/components/profile/EditProfileDialog.svelte';

	let { data, form }: PageProps = $props();
	const user = $derived(data.user);

	const joinDate = $derived(
		new Date(user.createdAt).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
	const lastUpdated = $derived(
		new Date(user.updatedAt).toLocaleString('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		})
	);
	const initials = $derived(
		user.displayName
			.split(' ')
			.map((n: string) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	);

	let editOpen = $state(false);

	let confirmDelete = $state(false);

	let showEmailForm = $state(false);
	let showPasswordForm = $state(false);
</script>

<div class="min-h-screen bg-background">
	<!-- Banner -->
	<div class="relative h-40 w-full overflow-hidden bg-muted">
		{#if user.profileBannerImage}
			<img src={user.profileBannerImage} alt="banner" class="h-full w-full object-cover" />
		{/if}
	</div>

	<div class="mx-auto -mt-12 max-w-3xl space-y-4 px-4 pb-16">
		<!-- Header card -->
		<Card>
			<CardContent class="pt-5 pb-5">
				<div class="flex items-end gap-4">
					<Avatar class="h-20 w-20 flex-shrink-0 ring-4 ring-background">
						<AvatarImage src={user.image ?? ''} alt={user.displayName} />
						<AvatarFallback class="text-xl font-semibold">{initials}</AvatarFallback>
					</Avatar>
					<div class="min-w-0 flex-1 pb-1">
						<h1 class="truncate text-xl font-semibold text-foreground">{user.displayName}</h1>
						<p class="mt-0.5 text-sm text-muted-foreground">@{user.name}</p>
					</div>
					<div class="flex-shrink-0 pb-1">
						<Button variant="outline" size="sm" class="gap-1.5" onclick={() => (editOpen = true)}>
							<Pencil class="h-3.5 w-3.5" />
							Edit Profile
						</Button>
					</div>
				</div>

				<Separator class="my-4" />

				<div class="flex flex-wrap gap-2">
					{#if user.emailVerified}
						<Badge variant="secondary" class="gap-1.5">
							<ShieldCheck class="h-3 w-3" />
							Email Verified
						</Badge>
					{:else}
						<Badge variant="outline" class="gap-1.5 text-muted-foreground">
							<ShieldAlert class="h-3 w-3" />
							Email Unverified
						</Badge>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Info grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Identity</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-start gap-3">
						<AtSign class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div>
							<p class="mb-0.5 text-xs text-muted-foreground">Display Name</p>
							<p class="text-sm font-medium">{user.displayName}</p>
						</div>
					</div>
					<Separator />
					<div class="flex items-start gap-3">
						<AtSign class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div>
							<p class="mb-0.5 text-xs text-muted-foreground">Username</p>
							<p class="text-sm font-medium">@{user.name}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">Contact & Activity</CardTitle
					>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-start gap-3">
						<Mail class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<p class="mb-0.5 text-xs text-muted-foreground">Email</p>
							<div class="flex flex-wrap items-center gap-2">
								<p class="truncate text-sm font-medium">{user.email}</p>
								{#if user.emailVerified}
									<Badge variant="secondary" class="px-1.5 py-0 text-[10px]">verified</Badge>
								{:else}
									<Badge variant="outline" class="px-1.5 py-0 text-[10px] text-muted-foreground"
										>unverified</Badge
									>
								{/if}
							</div>
						</div>
					</div>
					<Separator />
					<div class="flex items-start gap-3">
						<Calendar class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div>
							<p class="mb-0.5 text-xs text-muted-foreground">Member Since</p>
							<p class="text-sm font-medium">{joinDate}</p>
						</div>
					</div>
					<Separator />
					<div class="flex items-start gap-3">
						<Clock class="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
						<div>
							<p class="mb-0.5 text-xs text-muted-foreground">Last Updated</p>
							<p class="text-sm font-medium">{lastUpdated}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Email Update Card -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Email Address</CardTitle>
			</CardHeader>
			<CardContent class="space-y-3">
				{#if !showEmailForm}
					<div class="flex items-center justify-between gap-4">
						<p class="text-sm text-muted-foreground">{user.email}</p>
						<Button variant="outline" size="sm" onclick={() => (showEmailForm = true)}
							>Change Email</Button
						>
					</div>
				{:else}
					<form method="POST" action="?/updateEmail" use:enhance class="space-y-3">
						{#if form?.updateEmailError}
							<p class="text-xs text-destructive">{form.updateEmailError}</p>
						{/if}
						{#if form?.updateEmailSuccess}
							<p class="text-xs text-green-600">
								Email updated.
							</p>
						{/if}
						<input
							name="email"
							type="email"
							placeholder="New email address"
							required
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
						<div class="flex justify-end gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onclick={() => (showEmailForm = false)}>Cancel</Button
							>
							<Button type="submit" size="sm">Update Email</Button>
						</div>
					</form>
				{/if}
			</CardContent>
		</Card>

		<!-- Password Update Card -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Password</CardTitle>
			</CardHeader>
			<CardContent>
				{#if !showPasswordForm}
					<div class="flex items-center justify-between gap-4">
						<p class="text-sm text-muted-foreground">Change your account password.</p>
						<Button variant="outline" size="sm" onclick={() => (showPasswordForm = true)}
							>Change Password</Button
						>
					</div>
				{:else}
					<form method="POST" action="?/updatePassword" use:enhance class="space-y-3">
						{#if form?.updatePasswordError}
							<p class="text-xs text-destructive">{form.updatePasswordError}</p>
						{/if}
						{#if form?.updatePasswordSuccess}
							<p class="text-xs text-green-600">
								Password updated. Other sessions have been signed out.
							</p>
						{/if}
						<input
							name="currentPassword"
							type="password"
							placeholder="Current password"
							required
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
						<input
							name="newPassword"
							type="password"
							placeholder="New password (min 8 chars)"
							required
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
						<input
							name="confirmPassword"
							type="password"
							placeholder="Confirm new password"
							required
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
						<div class="flex justify-end gap-2">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onclick={() => (showPasswordForm = false)}>Cancel</Button
							>
							<Button type="submit" size="sm">Update Password</Button>
						</div>
					</form>
				{/if}
			</CardContent>
		</Card>

		<!-- Account -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Account</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-sm font-medium">Sign out</p>
						<p class="mt-0.5 text-xs text-muted-foreground">
							Sign out of your account on this device.
						</p>
					</div>
					<form method="POST" action="?/logout" use:enhance>
						<Button type="submit" variant="outline" size="sm" class="gap-1.5">
							<LogOut class="h-3.5 w-3.5" />
							Logout
						</Button>
					</form>
				</div>
			</CardContent>
		</Card>

		<!-- Danger Zone -->
		<Card class="border-destructive/30">
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-destructive">Danger Zone</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-sm font-medium">Delete your account</p>
						<CardDescription class="mt-0.5">
							Permanently removes your account and all data. This cannot be undone.
						</CardDescription>
					</div>

					{#if !confirmDelete}
						<Button
							variant="destructive"
							size="sm"
							class="flex-shrink-0 gap-1.5"
							onclick={() => (confirmDelete = true)}
						>
							<Trash2 class="h-3.5 w-3.5" />
							Delete
						</Button>
					{:else}
						<div class="flex flex-shrink-0 items-center gap-2">
							<p class="text-xs text-muted-foreground">Are you sure?</p>
							<Button variant="ghost" size="sm" onclick={() => (confirmDelete = false)}>
								Cancel
							</Button>
							<form method="POST" action="?/deleteAccount" use:enhance>
								<Button type="submit" variant="destructive" size="sm" class="gap-1.5">
									<Trash2 class="h-3.5 w-3.5" />
									Confirm
								</Button>
							</form>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>
</div>

<EditProfileDialog bind:open={editOpen} {user} />
