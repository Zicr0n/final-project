<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
</script>

<Tabs defaultValue="overview" orientation="vertical">
	<Tabs.List>
		<Tabs.Trigger value="profile" class="justify-start">Profile</Tabs.Trigger>
		<Tabs.Trigger value="preferences" class="justify-start">Preferences</Tabs.Trigger>
		<Tabs.Trigger value="security" class="justify-start">Security</Tabs.Trigger>
		<Tabs.Indicator />
	</Tabs.List>
	<Tabs.Content value="profile">
		A concise overview of the project: usage, goals, and recent highlights. Use this area to orient readers with key metrics and links to
		deeper docs.
	</Tabs.Content>
	<Tabs.Content value="preferences">
		List the most important features here with short, pragmatic descriptions so readers can scan for what matters (accessibility, theming,
		integrations).
	</Tabs.Content>
	<Tabs.Content value="security">
		Show recent activity or sample data: new releases, PRs merged, or notable user events. This helps examples feel realistic and
		actionable.
	</Tabs.Content>
</Tabs>