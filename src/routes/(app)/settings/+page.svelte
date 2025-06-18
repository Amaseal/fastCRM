<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { getFlash } from 'sveltekit-flash-message';
	import { Mail, User, Lock, UserPlus, CheckCircle, Copy, Cloud } from '@lucide/svelte';

	export let data;

	const flash = getFlash(page);
	// Initialize forms
	const {
		form: changeNameForm,
		errors: nameErrors,
		enhance: enhanceName
	} = superForm(data.changeNameForm, {
		id: 'changeName'
	});

	const {
		form: changeEmailForm,
		errors: emailErrors,
		enhance: enhanceEmail
	} = superForm(data.changeEmailForm, {
		id: 'changeEmail'
	});

	const {
		form: changePasswordForm,
		errors: passwordErrors,
		enhance: enhancePassword
	} = superForm(data.changePasswordForm, {
		id: 'changePassword'
	});

	const {
		form: nextcloudCredentialsForm,
		errors: nextcloudErrors,
		enhance: enhanceNextcloud
	} = superForm(data.nextcloudCredentialsForm, {
		id: 'nextcloudCredentials'
	});
	// Handle invite code copy
	async function copyInviteUrl(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			$flash = { type: 'success', message: 'Ielūguma saite nokopēta!' };
		} catch (err) {
			$flash = { type: 'error', message: 'Kļūda kopējot saiti' };
		}
	}

	$: generatedInviteUrl = $page.form?.inviteUrl;
</script>

<svelte:head>
	<title>Iestatījumi</title>
</svelte:head>

<div class="container mx-auto space-y-8 py-8">
	<div>
		<h1 class="text-3xl font-bold">Iestatījumi</h1>
		<p class="text-muted-foreground">Pārvaldiet savu kontu un ģenerējiet ielūguma kodus</p>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<!-- Profile Settings -->
		<div class="space-y-6">
			<!-- Change Name -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<User class="h-5 w-5" />
						Mainīt vārdu
					</CardTitle>
					<CardDescription>Atjauniniet savu lietotājvārdu</CardDescription>
				</CardHeader>
				<CardContent>
					<form method="POST" action="?/changeName" use:enhanceName>
						<div class="space-y-4">
							<div>
								<Label for="name">Vārds</Label>
								<Input
									id="name"
									name="name"
									bind:value={$changeNameForm.name}
									class={$nameErrors.name ? 'border-red-500' : ''}
								/>
								{#if $nameErrors.name}
									<p class="mt-1 text-sm text-red-500">{$nameErrors.name}</p>
								{/if}
							</div>
							<Button type="submit" class="w-full">Saglabāt vārdu</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<!-- Change Email -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Mail class="h-5 w-5" />
						Mainīt e-pastu
					</CardTitle>
					<CardDescription>Atjauniniet savu e-pasta adresi</CardDescription>
				</CardHeader>
				<CardContent>
					<form method="POST" action="?/changeEmail" use:enhanceEmail>
						<div class="space-y-4">
							<div>
								<Label for="email">E-pasts</Label>
								<Input
									id="email"
									name="email"
									type="email"
									bind:value={$changeEmailForm.email}
									class={$emailErrors.email ? 'border-red-500' : ''}
								/>
								{#if $emailErrors.email}
									<p class="mt-1 text-sm text-red-500">{$emailErrors.email}</p>
								{/if}
							</div>
							<div>
								<Label for="password-email">Parole (apstiprinājumam)</Label>
								<Input
									id="password-email"
									name="password"
									type="password"
									bind:value={$changeEmailForm.password}
									class={$emailErrors.password ? 'border-red-500' : ''}
								/>
								{#if $emailErrors.password}
									<p class="mt-1 text-sm text-red-500">{$emailErrors.password}</p>
								{/if}
							</div>
							<Button type="submit" class="w-full">Saglabāt e-pastu</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<!-- Change Password -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Lock class="h-5 w-5" />
						Mainīt paroli
					</CardTitle>
					<CardDescription>Atjauniniet savu paroli</CardDescription>
				</CardHeader>
				<CardContent>
					<form method="POST" action="?/changePassword" use:enhancePassword>
						<div class="space-y-4">
							<div>
								<Label for="currentPassword">Pašreizējā parole</Label>
								<Input
									id="currentPassword"
									name="currentPassword"
									type="password"
									bind:value={$changePasswordForm.currentPassword}
									class={$passwordErrors.currentPassword ? 'border-red-500' : ''}
								/>
								{#if $passwordErrors.currentPassword}
									<p class="mt-1 text-sm text-red-500">{$passwordErrors.currentPassword}</p>
								{/if}
							</div>
							<div>
								<Label for="newPassword">Jaunā parole</Label>
								<Input
									id="newPassword"
									name="newPassword"
									type="password"
									bind:value={$changePasswordForm.newPassword}
									class={$passwordErrors.newPassword ? 'border-red-500' : ''}
								/>
								{#if $passwordErrors.newPassword}
									<p class="mt-1 text-sm text-red-500">{$passwordErrors.newPassword}</p>
								{/if}
							</div>
							<div>
								<Label for="confirmPassword">Apstiprināt jauno paroli</Label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									bind:value={$changePasswordForm.confirmPassword}
									class={$passwordErrors.confirmPassword ? 'border-red-500' : ''}
								/>
								{#if $passwordErrors.confirmPassword}
									<p class="mt-1 text-sm text-red-500">{$passwordErrors.confirmPassword}</p>
								{/if}
							</div>
							<Button type="submit" class="w-full">Mainīt paroli</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<!-- Nextcloud Credentials -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Cloud class="h-5 w-5" />
						Nextcloud pieteikšanās dati
					</CardTitle>
					<CardDescription
						>Ievadiet savus Nextcloud Talk pieteikšanās datus projektu koplietošanai</CardDescription
					>
				</CardHeader>
				<CardContent>
					<form method="POST" action="?/saveNextcloudCredentials" use:enhanceNextcloud>
						<div class="space-y-4">
							<div>
								<Label for="nextcloud_username">Nextcloud lietotājvārds</Label>
								<Input
									id="nextcloud_username"
									name="nextcloud_username"
									bind:value={$nextcloudCredentialsForm.nextcloud_username}
									class={$nextcloudErrors.nextcloud_username ? 'border-red-500' : ''}
									placeholder="jūsu.lietotājvārds"
								/>
								{#if $nextcloudErrors.nextcloud_username}
									<p class="mt-1 text-sm text-red-500">{$nextcloudErrors.nextcloud_username}</p>
								{/if}
							</div>
							<div>
								<Label for="nextcloud_password">Nextcloud aplikācijas parole</Label>
								<Input
									id="nextcloud_password"
									name="nextcloud_password"
									type="password"
									bind:value={$nextcloudCredentialsForm.nextcloud_password}
									class={$nextcloudErrors.nextcloud_password ? 'border-red-500' : ''}
									placeholder="Ievadiet aplikācijas paroli"
								/>
								{#if $nextcloudErrors.nextcloud_password}
									<p class="mt-1 text-sm text-red-500">{$nextcloudErrors.nextcloud_password}</p>
								{/if}
								<p class="text-muted-foreground mt-1 text-xs">
									Izmantojiet aplikācijas paroli, nevis savu galveno Nextcloud paroli
								</p>
							</div>
							<Button type="submit" class="w-full">Saglabāt Nextcloud datus</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>

		<!-- Invite Code Generation -->
		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<UserPlus class="h-5 w-5" />
						Ģenerēt ielūguma kodu
					</CardTitle>
					<CardDescription>Izveidojiet jaunu ielūguma kodu lietotāju reģistrācijai</CardDescription>
				</CardHeader>
				<CardContent>
					<form method="POST" action="?/generateInviteCode" use:enhance>
						<div class="space-y-4">
							<Button type="submit" class="w-full">
								<UserPlus class="mr-2 h-4 w-4" />
								Ģenerēt jaunu kodu
							</Button>
						</div>
					</form>

					{#if generatedInviteUrl}
						<Separator class="my-6" />
						<div class="space-y-4">
							<div class="flex items-center gap-2 text-green-600">
								<CheckCircle class="h-5 w-5" />
								<span class="font-medium">Kods veiksmīgi izveidots!</span>
							</div>

							<div class="space-y-2">
								<Label>Ielūguma saite:</Label>
								<div class="flex gap-2">
									<Input value={generatedInviteUrl} readonly class="font-mono text-sm" />
									<Button
										type="button"
										variant="outline"
										size="icon"
										onclick={() => copyInviteUrl(generatedInviteUrl)}
									>
										<Copy class="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div class="text-muted-foreground text-sm">
								<p>Kods derīgs 24 stundas</p>
								<p>Sūtiet šo saiti cilvēkam, kurš vēlas reģistrēties</p>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- User Info -->
			<Card>
				<CardHeader>
					<CardTitle>Konta informācija</CardTitle>
					<CardDescription>Jūsu pašreizējie konta dati</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<Label>Vārds</Label>
						<p class="text-muted-foreground text-sm">{data.user.name || 'Nav norādīts'}</p>
					</div>
					<div>
						<Label>E-pasts</Label>
						<p class="text-muted-foreground text-sm">{data.user.email}</p>
					</div>
					<div>
						<Label>Lietotāja ID</Label>
						<p class="text-muted-foreground font-mono text-sm">{data.user.id}</p>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
