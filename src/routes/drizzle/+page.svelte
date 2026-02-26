<script lang="ts">
  export let data;
</script>

<h1>Create User</h1>

<form method="POST" action="?/create">
  <input
    name="name"
    placeholder="Name"
    required
  />

  <input
    name="age"
    type="number"
    placeholder="Age"
    required
  />

  <input
    name="email"
    type="email"
    placeholder="Email"
    required
  />

  <button type="submit">Create</button>
</form>

{#if data?.error}
  <p style="color: red">{data.error}</p>
{/if}

<hr />

<h2>Users</h2>

{#if data.users.length === 0}
  <p>No users yet.</p>
{:else}
  <ul>
    {#each data.users as user}
      <li>
        <strong>{user.name}</strong>
        ({user.age}) — {user.email}
      </li>
    {/each}
  </ul>
{/if}