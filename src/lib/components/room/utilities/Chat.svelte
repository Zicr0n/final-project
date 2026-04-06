<script>
    import { Avatar } from "@skeletonlabs/skeleton-svelte";
</script>
<main class="flex flex-col h-full">
    <ul class="flex-1 p-2">
        <li>
            <Avatar class="size-6">
                <Avatar.Image src="https://i.pinimg.com/736x/ab/a7/ed/aba7edba49adffc5a74b5f6eae36ed35.jpg" alt="avatar" />
                <Avatar.Fallback>NG</Avatar.Fallback>
            </Avatar>
        </li>
    </ul>

    <input type="text" maxlength="400" minlength="1" class="w-full bg-green-500">
</main>